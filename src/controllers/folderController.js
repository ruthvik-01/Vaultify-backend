const Folder = require('../models/Folder');
const File = require('../models/File');
const UploadGroup = require('../models/UploadGroup');
const logger = require('../config/logger');
const { logActivity } = require('../services/activityService');
const { deleteFile } = require('../services/s3Service');
const { BadRequestError, ForbiddenError, NotFoundError } = require('../utils/errors');

/**
 * Create a new folder
 */
const createFolder = async (req, res, next) => {
  try {
    const { folder_name, parent_folder_id, uploadBatchId, upload_group_id } = req.body;
    const userId = req.user.id;

    // Check parent folder ownership if parent_folder_id is provided
    if (parent_folder_id) {
      const parent = await Folder.findById(parent_folder_id);
      if (!parent) {
        return next(new NotFoundError('Parent folder not found.'));
      }
      if (parent.user_id.toString() !== userId.toString()) {
        return next(new ForbiddenError('Access Denied: You do not own the parent folder.'));
      }
    }

    const folder = await Folder.create({
      user_id: userId,
      folder_name,
      parent_folder_id: parent_folder_id || null,
      uploadBatchId: uploadBatchId || null,
      upload_group_id: upload_group_id || null
    });

    // Mark the UploadGroup as containing folders
    if (upload_group_id) {
      await UploadGroup.findByIdAndUpdate(upload_group_id, { has_folders: true });
    }

    await logActivity(userId, 'CREATE_FOLDER', 'Folder', `Created folder "${folder_name}"`, { folderId: folder.id, folderName: folder_name }, req.ip);

    res.status(201).json({
      status: 'success',
      data: {
        folder: {
          id: folder.id,
          user_id: userId,
          folder_name,
          parent_folder_id: folder.parent_folder_id
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve folders for the authenticated user
 * Supports optional parent_folder_id filtering
 */
const getFolders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { parent_folder_id } = req.query;

    const query = {
      user_id: userId,
      is_deleted: { $ne: true },
      isDeleted: { $ne: true },
      inTrash: { $ne: true }
    };

    if (parent_folder_id !== undefined) {
      if (parent_folder_id === 'null' || parent_folder_id === '') {
        query.parent_folder_id = null;
      } else {
        query.parent_folder_id = parent_folder_id;
      }
    }

    let folders = await Folder.find(query);
    
    // Map _id to id for API compatibility
    folders = folders.map(f => {
      const folderObj = f.toObject();
      folderObj.id = folderObj._id.toString();
      delete folderObj._id;
      delete folderObj.__v;
      return folderObj;
    });

    res.status(200).json({
      status: 'success',
      results: folders.length,
      data: {
        folders
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Rename an existing folder
 */
const updateFolder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { folder_name } = req.body;
    const userId = req.user.id;

    // Ownership check
    const folder = await Folder.findById(id);
    if (!folder) {
      return next(new NotFoundError('Folder not found.'));
    }
    if (folder.user_id.toString() !== userId.toString()) {
      return next(new ForbiddenError('Access Denied: You do not own this folder.'));
    }

    const oldName = folder.folder_name;
    folder.folder_name = folder_name;
    await folder.save();

    await logActivity(userId, 'RENAME_FOLDER', 'Folder', `Renamed folder to "${folder_name}"`, { folderId: folder.id, oldName, folderName: folder_name }, req.ip);

    res.status(200).json({
      status: 'success',
      data: {
        folder: {
          id: folder.id,
          folder_name
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all descendant folder IDs recursively
 */
const getDescendantFolderIds = async (folderId, userId) => {
  let ids = [folderId.toString()];
  let currentParentIds = [folderId.toString()];
  
  while (currentParentIds.length > 0) {
    const children = await Folder.find({ parent_folder_id: { $in: currentParentIds }, user_id: userId });
    currentParentIds = children.map(c => c.id);
    ids = ids.concat(currentParentIds);
  }
  return ids;
};

/**
 * Delete a folder recursively.
 * Uses getDescendantFolderIds to gather all sub-files and purge them from S3, then deletes database records.
 */
const deleteFolder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify folder exists and matches user
    const folder = await Folder.findById(id);
    if (!folder) {
      return next(new NotFoundError('Folder not found.'));
    }
    if (folder.user_id.toString() !== userId.toString()) {
      return next(new ForbiddenError('Access Denied: You do not own this folder.'));
    }

    // Retrieve all folder IDs in hierarchy
    const folderIds = await getDescendantFolderIds(id, userId);

    if (req.query.permanent === 'true') {
      const files = await File.find({ folder_id: { $in: folderIds } });
      const s3DeletePromises = files.map((file) =>
        deleteFile(file.s3_key).catch((err) => {
          logger.error(`Deferred S3 purge failure for key: ${file.s3_key}. Error: ${err.message}`);
        })
      );
      await Promise.all(s3DeletePromises);

      await File.deleteMany({ folder_id: { $in: folderIds } });

      const Video = require('../models/Video');
      const videoService = require('../services/videoService');
      const videosInFolders = await Video.find({ folderId: { $in: folderIds } });
      for (const video of videosInFolders) {
        try {
          await videoService.deleteVideo(video.ownerId, video._id);
        } catch (videoErr) {
          logger.error(`Failed to delete video ${video._id} during folder delete: ${videoErr.message}`);
        }
      }

      await Folder.deleteMany({ _id: { $in: folderIds } });
      await logActivity(userId, 'DELETE_FOLDER', 'Folder', `Permanently deleted folder "${folder.folder_name}"`, { folderId: id, folderName: folder.folder_name, itemType: 'Folder' }, req.ip);

      return res.status(200).json({
        status: 'success',
        message: 'Folder and all subcontents permanently deleted.'
      });
    }

    // Soft delete: Mark all subfolders and subfiles as deleted without deleting MongoDB docs or S3 objects
    const now = new Date();
    await File.updateMany(
      { folder_id: { $in: folderIds } },
      { $set: { is_deleted: true, isDeleted: true, inTrash: true, deleted_at: now, deletedAt: now } }
    );
    await Folder.updateMany(
      { _id: { $in: folderIds } },
      { $set: { is_deleted: true, isDeleted: true, inTrash: true, deleted_at: now, deletedAt: now } }
    );

    await logActivity(userId, 'DELETE_FOLDER', 'Folder', `Moved folder "${folder.folder_name}" to Trash Bin`, { folderId: id, folderName: folder.folder_name, itemType: 'Folder' }, req.ip);

    res.status(200).json({
      status: 'success',
      message: 'Folder and contents moved to Trash Bin.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Restore a soft-deleted folder recursively
 */
const restoreFolder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const folder = await Folder.findById(id);
    if (!folder) {
      return next(new NotFoundError('Folder not found.'));
    }
    if (folder.user_id.toString() !== userId.toString()) {
      return next(new ForbiddenError('Access Denied: You do not own this folder.'));
    }

    const folderIds = await getDescendantFolderIds(id, userId);

    await File.updateMany(
      { folder_id: { $in: folderIds } },
      { $set: { is_deleted: false, isDeleted: false, inTrash: false, deleted_at: null, deletedAt: null } }
    );
    await Folder.updateMany(
      { _id: { $in: folderIds } },
      { $set: { is_deleted: false, isDeleted: false, inTrash: false, deleted_at: null, deletedAt: null } }
    );

    await logActivity(userId, 'RESTORE_FOLDER', 'Folder', `Restored folder "${folder.folder_name}"`, { folderId: id, folderName: folder.folder_name, itemType: 'Folder' }, req.ip);

    res.status(200).json({
      status: 'success',
      message: 'Folder and contents restored successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get or create the user's Work folder.
 * Uses upsert to atomically create if not exists.
 */
const getOrCreateWorkFolder = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Try to find existing Work folder
    let workFolder = await Folder.findOne({ user_id: userId, folder_type: 'work' });

    if (!workFolder) {
      // Create the Work folder at root level
      workFolder = await Folder.create({
        user_id: userId,
        folder_name: 'Work',
        parent_folder_id: null,
        folder_type: 'work'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        folder: {
          id: workFolder.id,
          user_id: userId,
          folder_name: workFolder.folder_name,
          parent_folder_id: workFolder.parent_folder_id,
          folder_type: workFolder.folder_type,
          created_at: workFolder.created_at
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFolder,
  getFolders,
  updateFolder,
  deleteFolder,
  restoreFolder,
  getOrCreateWorkFolder
};
