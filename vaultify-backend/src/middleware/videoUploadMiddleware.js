const VideoFolder = require('../models/VideoFolder');
const { BadRequestError, NotFoundError } = require('../utils/errors');

const validateVideoMetadata = async (req, res, next) => {
  try {
    const { filename, mimeType, size, folderId } = req.body;

    if (!filename || !mimeType || typeof size !== 'number' || size <= 0) {
      return next(new BadRequestError('Missing or invalid metadata: filename, mimeType, and size are required.'));
    }

    // Supported video mimeTypes/extensions whitelist
    const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'm4v', 'mpeg', '3gp', 'ogv'];
    const ext = filename.split('.').pop().toLowerCase();
    const isVideo = mimeType.startsWith('video/') || videoExts.includes(ext);

    if (!isVideo) {
      return next(new BadRequestError(`Unsupported file format (.${ext}). Only video files are allowed.`));
    }

    // Validate size (max 25 GB)
    const MAX_VIDEO_SIZE = 25 * 1024 * 1024 * 1024; // 25 GB
    if (size > MAX_VIDEO_SIZE) {
      return next(new BadRequestError(`File is too large (${(size / 1024 / 1024 / 1024).toFixed(1)} GB). Maximum allowed is 25 GB.`));
    }

    // Validate folder ownership if provided
    if (folderId) {
      const folder = await VideoFolder.findOne({ _id: folderId, ownerId: req.user.id });
      if (!folder) {
        return next(new NotFoundError('Target folder not found or does not belong to you.'));
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateVideoMetadata
};
