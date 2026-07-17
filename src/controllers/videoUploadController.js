const videoMultipartService = require('../services/videoMultipartService');
const shareVideoService = require('../services/shareVideoService');
const s3Service = require('../services/s3Service');
const Video = require('../models/Video');
const logger = require('../config/logger');
const { NotFoundError } = require('../utils/errors');

const initiateUpload = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await videoMultipartService.initiateVideoUpload(userId, req.body);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const completeUpload = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { videoId, uploadId, parts, folderId, filename, mimeType, size } = req.body;
    
    const result = await videoMultipartService.completeVideoUpload(userId, {
      videoId,
      uploadId,
      objectKey: req.body.objectKey || req.body.s3Key, // support both names from frontend
      parts,
      folderId,
      filename,
      mimeType,
      size
    });

    res.status(200).json({
      status: 'success',
      data: {
        video: result
      }
    });
  } catch (error) {
    next(error);
  }
};

const abortUpload = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { videoId, uploadId, objectKey } = req.body;

    const result = await videoMultipartService.abortVideoUpload(userId, {
      uploadId,
      objectKey: objectKey || req.body.s3Key
    });

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getShareLink = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const hostUrl = `${req.protocol}://${req.get('host')}`;

    const result = await shareVideoService.createVideoShare(userId, id, hostUrl);

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const resolvePublicShare = async (req, res, next) => {
  try {
    const { token } = req.params;

    // Check if the token belongs to a permanent public video share first
    const video = await Video.findOne({ shareToken: token, isShared: true }).populate('ownerId', 'name');

    if (video) {
      // If request asks for redirect/download directly (e.g. via redirect query or path)
      if (req.query.redirect === 'true' || req.path.endsWith('/download')) {
        return res.redirect(video.publicUrl);
      }

      return res.status(200).json({
        status: 'success',
        data: {
          file_name: video.filename,
          file_size: video.size,
          file_type: video.mimeType,
          download_url: video.publicUrl,
          createdAt: video.createdAt,
          ownerName: video.ownerId?.name || 'Owner'
        }
      });
    }

    // Fall back to legacy VideoShare token
    const result = await shareVideoService.resolveShareToken(token);

    if (req.query.redirect === 'true' || req.path.endsWith('/download')) {
      return res.redirect(result.downloadUrl);
    }

    res.status(200).json({
      status: 'success',
      data: {
        file_name: result.filename,
        file_size: result.size,
        file_type: result.mimeType,
        download_url: result.downloadUrl,
        createdAt: result.createdAt,
        ownerName: result.ownerName || 'Owner'
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── PLAYBACK & DOWNLOAD CONTROLLERS (AUTHENTICATED) ────────────────────────
const downloadVideo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const video = await Video.findOne({ _id: id, ownerId: userId });
    if (!video) {
      throw new NotFoundError('Video not found.');
    }

    const presignedUrl = await s3Service.getPreSignedDownloadUrl(
      video.s3Key,
      video.originalName,
      3600
    );

    res.status(200).json({
      status: 'success',
      data: {
        downloadUrl: presignedUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

const previewVideo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const video = await Video.findOne({ _id: id, ownerId: userId });
    if (!video) {
      throw new NotFoundError('Video not found.');
    }

    const presignedUrl = await s3Service.getPreSignedDownloadUrl(
      video.s3Key,
      video.originalName,
      3600
    );

    res.status(200).json({
      status: 'success',
      data: {
        downloadUrl: presignedUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── PERMANENT PUBLIC SHARING CONTROLLERS (NO PRESIGNED URLS) ─────────────────
const createPermanentPublicShare = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const userId = req.user.id;
    const hostUrl = `${req.protocol}://${req.get('host')}`;

    const result = await shareVideoService.createPermanentPublicShare(userId, videoId, hostUrl);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const redirectPermanentPublicShare = async (req, res, next) => {
  try {
    const { token } = req.params;

    // If the browser requests the HTML layout page directly, bypass backend S3 redirect 
    // to let the frontend SPA page load and execute.
    const accept = req.headers.accept || '';
    if (accept.includes('text/html')) {
      return next();
    }
    
    // Check if the token belongs to a permanent public video share
    const video = await Video.findOne({ shareToken: token, isShared: true });
    
    if (video) {
      return res.redirect(302, video.publicUrl);
    }

    // Check if the token belongs to a legacy VideoShare session
    const VideoShare = require('../models/VideoShare');
    const share = await VideoShare.findOne({ token, isActive: true }).populate('videoId');
    
    if (share && share.videoId) {
      const presignedUrl = await s3Service.getPreSignedDownloadUrl(
        share.videoId.s3Key,
        share.videoId.originalName,
        3600
      );
      return res.redirect(302, presignedUrl);
    }

    // Return HTTP 404 for invalid tokens
    res.status(404).json({
      status: 'fail',
      message: 'Shared link not found.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initiateUpload,
  completeUpload,
  abortUpload,
  getShareLink,
  resolvePublicShare,
  downloadVideo,
  previewVideo,
  createPermanentPublicShare,
  redirectPermanentPublicShare
};
