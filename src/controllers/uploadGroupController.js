const crypto = require('crypto');
const UploadGroup = require('../models/UploadGroup');
const File = require('../models/File');
const Folder = require('../models/Folder');
const SharedLink = require('../models/SharedLink');
const { deleteFile: deleteS3File, getPreSignedDownloadUrl } = require('../services/s3Service');
const { logActivity } = require('../services/activityService');
const { BadRequestError, ForbiddenError, NotFoundError } = require('../utils/errors');

/**
 * Find an UploadGroup by ID and verify ownership.
 */
const findOwnedGroup = async (groupId, userId) => {
  const group = await UploadGroup.findById(groupId);
  if (!group) {
    throw new NotFoundError('Upload group not found.');
  }
  if (group.user_id.toString() !== userId.toString()) {
    throw new ForbiddenError('Access denied: you do not own this upload group.');
  }
  return group;
};

/**
 * Create a new upload group. Called before files are uploaded.
 * POST /api/upload-groups
 */
const createUploadGroup = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { title } = req.body;

    const group = await UploadGroup.create({
      user_id: userId,
      title
    });

    await logActivity(userId, 'Create Upload Group', { groupId: group.id, title }, req.ip);

    res.status(201).json({
      status: 'success',
      data: {
        group: {
          id: group.id,
          user_id: userId,
          title: group.title,
          file_count: group.file_count,
          total_size: group.total_size,
          has_folders: group.has_folders,
          created_at: group.created_at,
          updated_at: group.updated_at
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all upload groups for the authenticated user.
 * GET /api/upload-groups
 */
const getUploadGroups = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const groups = await UploadGroup.find({ user_id: userId }).sort({ created_at: -1 });

    const serialized = groups.map(g => ({
      id: g.id,
      user_id: g.user_id.toString(),
      title: g.title,
      file_count: g.file_count,
      total_size: g.total_size,
      has_folders: g.has_folders,
      created_at: g.created_at,
      updated_at: g.updated_at
    }));

    res.status(200).json({
      status: 'success',
      results: serialized.length,
      data: {
        groups: serialized
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single upload group with its member files.
 * GET /api/upload-groups/:id
 */
const getUploadGroup = async (req, res, next) => {
  try {
    const group = await findOwnedGroup(req.params.id, req.user.id);

    const files = await File.find({ upload_group_id: group.id }).sort({ created_at: -1 });
    const folders = await Folder.find({ upload_group_id: group.id }).sort({ created_at: -1 });

    res.status(200).json({
      status: 'success',
      data: {
        group: {
          id: group.id,
          user_id: group.user_id.toString(),
          title: group.title,
          file_count: group.file_count,
          total_size: group.total_size,
          has_folders: group.has_folders,
          created_at: group.created_at,
          updated_at: group.updated_at
        },
        files: files.map(f => ({
          id: f.id,
          file_name: f.file_name,
          original_name: f.original_name,
          file_type: f.file_type,
          file_size: f.file_size,
          s3_key: f.s3_key,
          folder_id: f.folder_id ? f.folder_id.toString() : null,
          created_at: f.created_at
        })),
        folders: folders.map(f => ({
          id: f.id,
          folder_name: f.folder_name,
          parent_folder_id: f.parent_folder_id ? f.parent_folder_id.toString() : null,
          created_at: f.created_at
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Rename an upload group.
 * PUT /api/upload-groups/:id
 */
const renameUploadGroup = async (req, res, next) => {
  try {
    const group = await findOwnedGroup(req.params.id, req.user.id);
    const oldTitle = group.title;

    group.title = req.body.title;
    await group.save();

    await logActivity(req.user.id, 'Rename Upload Group', { groupId: group.id, oldTitle, newTitle: group.title }, req.ip);

    res.status(200).json({
      status: 'success',
      data: {
        group: {
          id: group.id,
          title: group.title,
          updated_at: group.updated_at
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an upload group and all its files from S3 + DB.
 * DELETE /api/upload-groups/:id
 */
const deleteUploadGroup = async (req, res, next) => {
  try {
    const group = await findOwnedGroup(req.params.id, req.user.id);

    // Find all files in the group
    const files = await File.find({ upload_group_id: group.id });

    // Delete all files from S3 concurrently
    const s3Promises = files.map(f =>
      deleteS3File(f.s3_key).catch(err => {
        console.error(`S3 delete failed for key: ${f.s3_key}. Error: ${err.message}`);
      })
    );
    await Promise.all(s3Promises);

    // Delete shared links for files in this group
    const fileIds = files.map(f => f._id);
    await SharedLink.deleteMany({
      $or: [
        { file_id: { $in: fileIds } },
        { upload_group_id: group._id }
      ]
    });

    // Delete all files in the group from DB
    await File.deleteMany({ upload_group_id: group.id });

    // Delete all folders in the group from DB
    const groupFolders = await Folder.find({ upload_group_id: group.id });
    if (groupFolders.length > 0) {
      const folderIds = groupFolders.map(f => f._id);
      // Also delete any files inside those folders that may not have the group id
      const folderFiles = await File.find({ folder_id: { $in: folderIds } });
      const folderS3Promises = folderFiles.map(f =>
        deleteS3File(f.s3_key).catch(err => {
          console.error(`S3 delete failed for key: ${f.s3_key}. Error: ${err.message}`);
        })
      );
      await Promise.all(folderS3Promises);
      await File.deleteMany({ folder_id: { $in: folderIds } });
      await Folder.deleteMany({ _id: { $in: folderIds } });
    }

    // Delete the group itself
    await UploadGroup.findByIdAndDelete(group.id);

    await logActivity(req.user.id, 'Delete Upload Group', { groupId: group.id, title: group.title }, req.ip);

    res.status(200).json({
      status: 'success',
      message: 'Upload group and all its contents deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Share an entire upload group.
 * POST /api/upload-groups/:id/share
 */
const shareUploadGroup = async (req, res, next) => {
  try {
    const group = await findOwnedGroup(req.params.id, req.user.id);
    const { permission, expiry_hours } = req.body;

    const token = crypto.randomBytes(32).toString('hex');
    const expiryDate = expiry_hours ? new Date(Date.now() + expiry_hours * 60 * 60 * 1000) : null;

    const sharedLink = await SharedLink.create({
      upload_group_id: group._id,
      token,
      permission: permission || 'read',
      expiry_date: expiryDate
    });

    await logActivity(
      req.user.id,
      'Share Upload Group',
      { groupId: group.id, title: group.title, shareId: sharedLink.id, expiryHours: expiry_hours || null },
      req.ip
    );

    res.status(201).json({
      status: 'success',
      data: {
        id: sharedLink.id,
        upload_group_id: group.id,
        token: sharedLink.token,
        permission: sharedLink.permission,
        expiry_date: sharedLink.expiry_date,
        share_link: `${req.protocol}://${req.get('host')}/api/share/${sharedLink.token}`
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUploadGroup,
  getUploadGroups,
  getUploadGroup,
  renameUploadGroup,
  deleteUploadGroup,
  shareUploadGroup
};
