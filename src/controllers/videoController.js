const VideoFolder = require('../models/VideoFolder');
const Video = require('../models/Video');
const VideoShare = require('../models/VideoShare');
const UploadGroup = require('../models/UploadGroup');
const videoService = require('../services/videoService');
const videoUploadService = require('../services/videoUploadService');
const shareService = require('../services/shareService');
const s3Service = require('../services/s3Service');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/errors');
const logger = require('../config/logger');
const fs = require('fs');
const path = require('path');

// ─── VIDEO UPLOAD CONTROLLERS ────────────────────────────────────────────────
const initiateUpload = async (req, res, next) => {
  try {
    const { filename, mimeType, size, folderId, uploadBatchId, upload_group_id } = req.body;
    const ownerId = req.user.id;
    const hostUrl = `${req.protocol}://${req.get('host')}`;

    const result = await videoUploadService.initiateVideoUpload(
      ownerId,
      filename,
      mimeType,
      size,
      folderId,
      hostUrl,
      upload_group_id || null
    );

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const uploadLocalPart = async (req, res, next) => {
  try {
    const { uploadId, partNumber } = req.query;
    if (!uploadId || !partNumber) {
      throw new BadRequestError('Missing uploadId or partNumber parameters.');
    }

    const uploadDir = path.join(__dirname, '../../local_storage/parts');
    fs.mkdirSync(uploadDir, { recursive: true });

    const partPath = path.join(uploadDir, `${uploadId}_${partNumber}.part`);
    const writeStream = fs.createWriteStream(partPath);

    req.pipe(writeStream);

    req.on('end', () => {
      res.setHeader('ETag', `mock_etag_${partNumber}`);
      res.status(200).json({
        status: 'success',
        message: `Part ${partNumber} uploaded successfully.`
      });
    });

    writeStream.on('error', (err) => {
      next(err);
    });
  } catch (error) {
    next(error);
  }
};

const completeUpload = async (req, res, next) => {
  try {
    const { videoId, uploadId, parts } = req.body;
    const ownerId = req.user.id;

    if (!videoId || !uploadId || !Array.isArray(parts)) {
      throw new BadRequestError('Missing complete upload parameters: videoId, uploadId, and parts array are required.');
    }

    const video = await videoUploadService.completeVideoUpload(
      ownerId,
      videoId,
      uploadId,
      parts
    );

    res.status(200).json({
      status: 'success',
      data: { video }
    });
  } catch (error) {
    next(error);
  }
};

const abortUpload = async (req, res, next) => {
  try {
    const { videoId, uploadId } = req.body;
    const ownerId = req.user.id;

    if (!videoId || !uploadId) {
      throw new BadRequestError('Missing abort parameters: videoId and uploadId are required.');
    }

    await videoUploadService.abortVideoUpload(ownerId, videoId, uploadId);

    res.status(200).json({
      status: 'success',
      message: 'Video upload aborted and S3 parts cleaned up.'
    });
  } catch (error) {
    next(error);
  }
};

// ─── VIDEO FOLDER CONTROLLERS ──────────────────────────────────────────────
const createFolder = async (req, res, next) => {
  try {
    const { name, parentFolder, uploadBatchId, upload_group_id } = req.body;
    const ownerId = req.user.id;

    if (!name) {
      throw new BadRequestError('Folder name is required.');
    }

    let parentPath = '';
    if (parentFolder) {
      const parent = await VideoFolder.findOne({ _id: parentFolder, ownerId });
      if (!parent) {
        throw new NotFoundError('Parent folder not found.');
      }
      parentPath = parent.path;
    }

    const path = parentPath ? `${parentPath}/${name}` : `/${name}`;

    const folder = await VideoFolder.create({
      ownerId,
      name,
      parentFolder: parentFolder || null,
      path,
      uploadBatchId: uploadBatchId || null,
      upload_group_id: upload_group_id || null
    });

    // Mark the UploadGroup as containing folders
    if (upload_group_id) {
      await UploadGroup.findByIdAndUpdate(upload_group_id, { has_folders: true });
    }

    res.status(201).json({
      status: 'success',
      data: { folder }
    });
  } catch (error) {
    next(error);
  }
};

const renameFolder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const ownerId = req.user.id;

    if (!name) {
      throw new BadRequestError('Folder name is required.');
    }

    const folder = await VideoFolder.findOne({ _id: id, ownerId });
    if (!folder) {
      throw new NotFoundError('Folder not found.');
    }

    const oldPath = folder.path;
    folder.name = name;
    
    // Update path
    const parts = oldPath.split('/');
    parts[parts.length - 1] = name;
    const newPath = parts.join('/');
    folder.path = newPath;
    await folder.save();

    // Update child paths recursively
    const allFolders = await VideoFolder.find({ ownerId });
    const updateChildPaths = async (parentId, parentPath) => {
      const children = allFolders.filter(f => f.parentFolder && f.parentFolder.toString() === parentId.toString());
      for (const child of children) {
        child.path = `${parentPath}/${child.name}`;
        await child.save();
        await updateChildPaths(child._id, child.path);
      }
    };
    await updateChildPaths(folder._id, folder.path);

    res.status(200).json({
      status: 'success',
      data: { folder }
    });
  } catch (error) {
    next(error);
  }
};

const deleteFolder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.id;

    const folder = await VideoFolder.findOne({ _id: id, ownerId });
    if (!folder) {
      throw new NotFoundError('Folder not found.');
    }

    // Recursively gather all subfolder IDs
    const allFolders = await VideoFolder.find({ ownerId });
    const getDescendants = (parentId) => {
      const children = allFolders.filter(f => f.parentFolder && f.parentFolder.toString() === parentId.toString());
      let ids = [parentId];
      for (const child of children) {
        ids = [...ids, ...getDescendants(child._id)];
      }
      return ids;
    };
    const folderIdsToDelete = getDescendants(folder._id);

    // Get and delete all videos in these folders
    const videos = await Video.find({ ownerId, folderId: { $in: folderIdsToDelete } });
    for (const video of videos) {
      await videoService.deleteVideo(ownerId, video._id);
    }

    // Delete folders from DB
    await VideoFolder.deleteMany({ _id: { $in: folderIdsToDelete } });

    res.status(200).json({
      status: 'success',
      message: 'Folder and all contents deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

const moveFolder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { targetParentId } = req.body;
    const ownerId = req.user.id;

    const folder = await VideoFolder.findOne({ _id: id, ownerId });
    if (!folder) {
      throw new NotFoundError('Folder not found.');
    }

    if (targetParentId) {
      if (id.toString() === targetParentId.toString()) {
        throw new BadRequestError('Cannot move folder into itself.');
      }
      
      const allFolders = await VideoFolder.find({ ownerId });
      const isDescendant = (parent, child) => {
        if (!child) return false;
        if (parent.toString() === child.toString()) return true;
        const childFolder = allFolders.find(f => f._id.toString() === child.toString());
        return isDescendant(parent, childFolder?.parentFolder);
      };
      if (isDescendant(id, targetParentId)) {
        throw new BadRequestError('Cannot move folder into one of its subfolders.');
      }
    }

    let targetPath = '';
    if (targetParentId) {
      const targetParent = await VideoFolder.findOne({ _id: targetParentId, ownerId });
      if (!targetParent) {
        throw new NotFoundError('Target parent folder not found.');
      }
      targetPath = targetParent.path;
    }

    folder.parentFolder = targetParentId || null;
    folder.path = targetPath ? `${targetPath}/${folder.name}` : `/${folder.name}`;
    await folder.save();

    // Update child paths recursively
    const allFolders = await VideoFolder.find({ ownerId });
    const updateChildPaths = async (parentId, parentPath) => {
      const children = allFolders.filter(f => f.parentFolder && f.parentFolder.toString() === parentId.toString());
      for (const child of children) {
        child.path = `${parentPath}/${child.name}`;
        await child.save();
        await updateChildPaths(child._id, child.path);
      }
    };
    await updateChildPaths(folder._id, folder.path);

    res.status(200).json({
      status: 'success',
      data: { folder }
    });
  } catch (error) {
    next(error);
  }
};

const listFolders = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const folders = await VideoFolder.find({ ownerId });
    res.status(200).json({
      status: 'success',
      data: { folders }
    });
  } catch (error) {
    next(error);
  }
};

// ─── VIDEO CRUD CONTROLLERS ─────────────────────────────────────────────────
const getVideos = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { folderId } = req.query;

    const query = { ownerId };
    if (folderId !== undefined) {
      query.folderId = folderId || null;
    }

    const videos = await Video.find(query);
    res.status(200).json({
      status: 'success',
      data: { videos }
    });
  } catch (error) {
    next(error);
  }
};

const renameVideo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const ownerId = req.user.id;

    if (!name) {
      throw new BadRequestError('Video name is required.');
    }

    const video = await videoService.renameVideo(ownerId, id, name);
    res.status(200).json({
      status: 'success',
      data: { video }
    });
  } catch (error) {
    next(error);
  }
};

const moveVideo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { folderId } = req.body;
    const ownerId = req.user.id;

    const video = await videoService.moveVideo(ownerId, id, folderId);
    res.status(200).json({
      status: 'success',
      data: { video }
    });
  } catch (error) {
    next(error);
  }
};

const deleteVideo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.id;

    await videoService.deleteVideo(ownerId, id);

    res.status(200).json({
      status: 'success',
      message: 'Video deleted successfully from storage and database.'
    });
  } catch (error) {
    next(error);
  }
};

// ─── SHARING & STREAMING CONTROLLERS ────────────────────────────────────────
const createShare = async (req, res, next) => {
  try {
    const { videoId, folderId, expiresAt } = req.body;
    const ownerId = req.user.id;

    const share = await shareService.createShare(ownerId, { videoId, folderId, expiresAt });
    const shareLink = `${req.protocol}://${req.get('host')}/share/${share.token}`;

    res.status(201).json({
      status: 'success',
      data: {
        id: share._id,
        token: share.token,
        share_link: shareLink,
        expiresAt: share.expiresAt
      }
    });
  } catch (error) {
    next(error);
  }
};

const getSharedItem = async (req, res, next) => {
  try {
    const { token } = req.params;
    const share = await shareService.getSharedItem(token);

    if (share.videoId) {
      res.status(200).json({
        status: 'success',
        data: {
          type: 'video',
          file_name: share.videoId.filename,
          file_size: share.videoId.size,
          file_type: share.videoId.mimeType,
          download_url: `${req.protocol}://${req.get('host')}/share/${token}/download`
        }
      });
    } else if (share.folderId) {
      const subfolders = await VideoFolder.find({ parentFolder: share.folderId });
      const videos = await Video.find({ folderId: share.folderId, status: 'Active' });

      res.status(200).json({
        status: 'success',
        data: {
          type: 'folder',
          file_name: share.folderId.name,
          folders: subfolders,
          files: videos
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

const streamSharedVideo = async (req, res, next) => {
  try {
    const { token } = req.params;
    const share = await shareService.getSharedItem(token);

    if (!share.videoId) {
      throw new BadRequestError('Shared link does not point to a video file.');
    }

    const video = share.videoId;
    const rangeHeader = req.headers.range;

    const {
      stream,
      start,
      end,
      totalLength,
      chunkSize,
      mimeType,
      isPartial
    } = await shareService.getVideoStream(video.s3Key, rangeHeader);

    if (isPartial) {
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${totalLength}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': mimeType
      });
    } else {
      res.writeHead(200, {
        'Content-Length': totalLength,
        'Content-Type': mimeType
      });
    }

    stream.pipe(res);
  } catch (error) {
    if (error.status === 416) {
      res.writeHead(416, { 'Content-Range': `bytes */${error.message}` });
      return res.end();
    }
    next(error);
  }
};

const downloadSharedVideo = async (req, res, next) => {
  try {
    const { token } = req.params;
    const share = await shareService.getSharedItem(token);

    if (!share.videoId) {
      throw new BadRequestError('Shared link does not point to a video file.');
    }

    const video = share.videoId;
    if (video.s3Key.startsWith('local://')) {
      const videoId = video.s3Key.replace('local://', '');
      const filePath = path.join(__dirname, '../../local_storage/videos', `${videoId}.mp4`);
      if (!fs.existsSync(filePath)) {
        throw new NotFoundError('Local video file not found.');
      }
      return res.download(filePath, video.originalName);
    }

    const presignedUrl = await s3Service.getPreSignedDownloadUrl(
      video.s3Key,
      video.originalName,
      3600
    );

    res.redirect(presignedUrl);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initiateUpload,
  uploadLocalPart,
  completeUpload,
  abortUpload,
  createFolder,
  renameFolder,
  deleteFolder,
  moveFolder,
  listFolders,
  getVideos,
  renameVideo,
  moveVideo,
  deleteVideo,
  createShare,
  getSharedItem,
  streamSharedVideo,
  downloadSharedVideo
};
