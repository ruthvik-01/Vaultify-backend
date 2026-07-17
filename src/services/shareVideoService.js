const crypto = require('crypto');
const Video = require('../models/Video');
const VideoShare = require('../models/VideoShare');
const s3Service = require('./s3Service');
const logger = require('../config/logger');
const { NotFoundError, ForbiddenError } = require('../utils/errors');

const createVideoShare = async (userId, videoId, hostUrl) => {
  // Validate ownership
  const video = await Video.findOne({ _id: videoId, ownerId: userId });
  if (!video) {
    throw new NotFoundError('Video not found or access denied.');
  }

  // Check if a permanent share token already exists for this video and owner
  let share = await VideoShare.findOne({ videoId, ownerId: userId, expiresAt: null, isActive: true });
  
  if (!share) {
    // Generate a secure URL-safe token (e.g. 12 bytes = 16 characters base64url)
    const token = crypto.randomBytes(12).toString('base64url');
    share = await VideoShare.create({
      token,
      videoId,
      ownerId: userId,
      isActive: true,
      expiresAt: null // Never expires
    });
    logger.info(`Share Link Created: Permanent share link generated for video ${videoId} by user ${userId}`);
  }

  const cleanHost = hostUrl.replace(/\/$/, ''); // strip trailing slash
  const shareLink = `${cleanHost}/share/${share.token}`;

  return {
    shareToken: share.token,
    shareUrl: shareLink
  };
};

const resolveShareToken = async (token) => {
  const share = await VideoShare.findOne({ token, isActive: true }).populate('videoId');

  if (!share || !share.videoId) {
    throw new NotFoundError('Shared video link not found, disabled, or expired.');
  }

  // Validate expiration if any
  if (share.expiresAt && new Date() > share.expiresAt) {
    share.isActive = false;
    await share.save();
    throw new ForbiddenError('This shared link has expired.');
  }

  const video = share.videoId;

  // Generate a temporary GetObject Presigned URL valid for 1 hour (3600 seconds)
  const tempPresignedUrl = await s3Service.getPreSignedDownloadUrl(
    video.s3Key,
    video.originalName,
    3600
  );

  return {
    filename: video.filename,
    originalName: video.originalName,
    mimeType: video.mimeType,
    size: video.size,
    downloadUrl: tempPresignedUrl
  };
};

module.exports = {
  createVideoShare,
  resolveShareToken
};
