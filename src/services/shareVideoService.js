const crypto = require('crypto');
const mongoose = require('mongoose');
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
  const share = await VideoShare.findOne({ token, isActive: true })
    .populate({
      path: 'videoId',
      populate: { path: 'ownerId', select: 'name' }
    });

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
    downloadUrl: tempPresignedUrl,
    createdAt: video.createdAt,
    ownerName: video.ownerId?.name || 'Owner'
  };
};

// ─── PERMANENT PUBLIC SHARING ─────────────────────────────────────────────────
const createPermanentPublicShare = async (userId, videoId, hostUrl) => {
  // Validate ownership
  let video = await Video.findOne({ _id: videoId, ownerId: userId }).catch(() => null);
  
  if (!video) {
    const raw = await Video.collection.findOne({ _id: videoId, ownerId: new mongoose.Types.ObjectId(userId) });
    if (!raw) {
      throw new NotFoundError('Video not found or access denied.');
    }
    
    // If already shared, return the existing permanent share URL
    if (raw.isShared && raw.shareToken) {
      const cleanHost = hostUrl.replace(/\/$/, '');
      return {
        shareUrl: `${cleanHost}/share/${raw.shareToken}`
      };
    }

    const shareToken = crypto.randomBytes(6).toString('base64url');
    await Video.collection.updateOne(
      { _id: videoId },
      { $set: { shareToken, isShared: true } }
    );

    logger.info(`Share Link Created: Permanent share link generated for legacy video ${videoId} by user ${userId}`);

    const cleanHost = hostUrl.replace(/\/$/, '');
    return {
      shareUrl: `${cleanHost}/share/${shareToken}`
    };
  }

  // If already shared, return the existing permanent share URL
  if (video.isShared && video.shareToken) {
    const cleanHost = hostUrl.replace(/\/$/, '');
    return {
      shareUrl: `${cleanHost}/share/${video.shareToken}`
    };
  }

  // Generate an 8-character secure token
  const shareToken = crypto.randomBytes(6).toString('base64url');

  // Store the mapping back on the Video model (no public ACL needed)
  video.shareToken = shareToken;
  video.isShared = true;
  await video.save();

  logger.info(`Share Link Created: Permanent share link generated for video ${videoId} by user ${userId}`);

  const cleanHost = hostUrl.replace(/\/$/, '');
  return {
    shareUrl: `${cleanHost}/share/${shareToken}`
  };
};

const resolvePermanentPublicShare = async (token) => {
  const video = await Video.findOne({ shareToken: token, isShared: true });
  if (!video) {
    throw new NotFoundError('Shared video not found or sharing has been disabled.');
  }
  return video.publicUrl;
};

module.exports = {
  createVideoShare,
  resolveShareToken,
  createPermanentPublicShare,
  resolvePermanentPublicShare
};
