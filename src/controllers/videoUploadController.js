const videoMultipartService = require('../services/videoMultipartService');
const shareVideoService = require('../services/shareVideoService');
const logger = require('../config/logger');

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
    const result = await shareVideoService.resolveShareToken(token);

    // If request asks for redirect/download directly (e.g. via redirect query or path)
    if (req.query.redirect === 'true' || req.path.endsWith('/download')) {
      return res.redirect(result.downloadUrl);
    }

    res.status(200).json({
      status: 'success',
      data: {
        file_name: result.filename,
        file_size: result.size,
        file_type: result.mimeType,
        download_url: result.downloadUrl
      }
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
  resolvePublicShare
};
