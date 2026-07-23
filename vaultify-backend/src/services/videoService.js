const mongoose = require('mongoose');
const Video = require('../models/Video');
const { deleteFile } = require('./s3Service');
const { NotFoundError, UnauthorizedError } = require('../utils/errors');

const listVideos = async (ownerId, folderId = null) => {
  return Video.find({ ownerId, folderId });
};

const renameVideo = async (ownerId, videoId, newName) => {
  let video = await Video.findOne({ _id: videoId, ownerId }).catch(() => null);
  if (!video) {
    const raw = await Video.collection.findOne({ _id: videoId, ownerId: new mongoose.Types.ObjectId(ownerId) });
    if (!raw) {
      throw new NotFoundError('Video not found or access denied.');
    }
    await Video.collection.updateOne(
      { _id: videoId },
      { $set: { filename: newName } }
    );
    return raw;
  }
  video.filename = newName;
  await video.save();
  return video;
};

const Folder = require('../models/Folder');
const VideoFolder = require('../models/VideoFolder');

const checkIsWorkFolder = async (folderId) => {
  if (!folderId) return false;
  let currentId = folderId;
  let depth = 0;
  while (currentId && depth < 20) {
    const folder = await Folder.findById(currentId).select('folder_type parent_folder_id').lean().catch(() => null);
    if (folder) {
      if (folder.folder_type === 'work') return true;
      currentId = folder.parent_folder_id;
      depth++;
      continue;
    }
    const vFolder = await VideoFolder.findById(currentId).select('parentFolder').lean().catch(() => null);
    if (vFolder) {
      currentId = vFolder.parentFolder;
      depth++;
      continue;
    }
    break;
  }
  return false;
};

const moveVideo = async (ownerId, videoId, targetFolderId) => {
  const isWork = await checkIsWorkFolder(targetFolderId);
  let video = await Video.findOne({ _id: videoId, ownerId }).catch(() => null);
  if (!video) {
    const raw = await Video.collection.findOne({ _id: videoId, ownerId: new mongoose.Types.ObjectId(ownerId) });
    if (!raw) {
      throw new NotFoundError('Video not found or access denied.');
    }
    await Video.collection.updateOne(
      { _id: videoId },
      { $set: { folderId: targetFolderId ? new mongoose.Types.ObjectId(targetFolderId) : null, is_work_submission: isWork } }
    );
    return raw;
  }
  video.folderId = targetFolderId || null;
  video.is_work_submission = isWork;
  await video.save();
  return video;
};

const deleteVideo = async (ownerId, videoId) => {
  let video = await Video.findOne({ _id: videoId, ownerId }).catch(() => null);
  if (!video) {
    video = await Video.collection.findOne({ _id: videoId, ownerId: new mongoose.Types.ObjectId(ownerId) });
  }
  if (!video) {
    throw new NotFoundError('Video not found or access denied.');
  }

  // Delete from S3
  try {
    await deleteFile(video.s3Key);
  } catch (err) {
    // Log error but proceed to delete database record
    console.error(`S3 Deletion failed for key ${video.s3Key}:`, err.message);
  }

  // Delete from DB
  await Video.deleteOne({ _id: videoId }).catch(() => null);
  await Video.collection.deleteOne({ _id: videoId });
  return video;
};

module.exports = {
  listVideos,
  renameVideo,
  moveVideo,
  deleteVideo
};
