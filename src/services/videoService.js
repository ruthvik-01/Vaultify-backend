const Video = require('../models/Video');
const { deleteFile } = require('./s3Service');
const { NotFoundError, UnauthorizedError } = require('../utils/errors');

const listVideos = async (ownerId, folderId = null) => {
  return Video.find({ ownerId, folderId });
};

const renameVideo = async (ownerId, videoId, newName) => {
  const video = await Video.findOne({ _id: videoId, ownerId });
  if (!video) {
    throw new NotFoundError('Video not found or access denied.');
  }
  video.filename = newName;
  await video.save();
  return video;
};

const moveVideo = async (ownerId, videoId, targetFolderId) => {
  const video = await Video.findOne({ _id: videoId, ownerId });
  if (!video) {
    throw new NotFoundError('Video not found or access denied.');
  }
  video.folderId = targetFolderId || null;
  await video.save();
  return video;
};

const deleteVideo = async (ownerId, videoId) => {
  const video = await Video.findOne({ _id: videoId, ownerId });
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
  await Video.deleteOne({ _id: videoId });
  return video;
};

module.exports = {
  listVideos,
  renameVideo,
  moveVideo,
  deleteVideo
};
