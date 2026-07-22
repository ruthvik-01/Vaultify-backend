const crypto = require('crypto');
const mongoose = require('mongoose');
const s3Service = require('./s3Service');
const Video = require('../models/Video');
const UploadGroup = require('../models/UploadGroup');
const logger = require('../config/logger');
const { BadRequestError } = require('../utils/errors');

const DEFAULT_CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB default

const initiateVideoUpload = async (userId, { filename, mimeType, size, folderId }) => {
  try {
    const videoId = new mongoose.Types.ObjectId().toString();
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    // Sanitize filename to be URL safe
    const cleanName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const s3Key = `videos/${userId}/${year}/${month}/${videoId}-${cleanName}`;

    // Determine chunk size (default 10 MB)
    const chunkSize = DEFAULT_CHUNK_SIZE;
    const totalParts = Math.ceil(size / chunkSize);

    logger.info(`Upload Started: Initiating S3 multipart upload for User ${userId}, File: ${filename}, Size: ${size} bytes`);
    
    // Initiate S3 multipart upload
    const uploadId = await s3Service.initiateMultipartUpload(s3Key, mimeType);

    // Generate upload URLs for each part
    const partUrls = await s3Service.generateUploadPartUrls(s3Key, uploadId, totalParts);

    return {
      uploadId,
      videoId,
      objectKey: s3Key,
      chunkSize,
      urls: partUrls.map(p => ({
        partNumber: p.partNumber,
        url: p.url
      }))
    };
  } catch (error) {
    logger.error(`Upload Failed: Initiation error for user ${userId}. Error: ${error.message}`);
    throw new BadRequestError(`Failed to initiate S3 multipart upload: ${error.message}`);
  }
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

const completeVideoUpload = async (userId, { videoId, uploadId, objectKey, parts, folderId, filename, mimeType, size, uploadBatchId, relative_path, upload_group_id }) => {
  try {
    if (!objectKey) {
      throw new BadRequestError('S3 object key is missing before completing multipart upload.');
    }
    logger.info(`Completing S3 multipart upload: Video ${videoId}, S3 Key ${objectKey}`);

    // Complete direct S3 upload
    await s3Service.completeMultipartUpload(objectKey, uploadId, parts);

    const bucketName = process.env.AWS_S3_BUCKET_NAME || 'gd-miniproject';

    const isWork = await checkIsWorkFolder(folderId);

    // Store metadata in MongoDB only after successful S3 completion
    const video = await Video.create({
      _id: videoId,
      ownerId: userId,
      filename: filename || objectKey.split('/').pop(),
      originalName: filename || objectKey.split('/').pop(),
      mimeType: mimeType || 'video/mp4',
      size: size || 0,
      folderId: folderId || null,
      s3Key: objectKey,
      bucket: bucketName,
      status: 'Active',
      is_work_submission: isWork,
      uploadBatchId: uploadBatchId || null,
      relative_path: relative_path || null,
      upload_group_id: upload_group_id || null
    });

    // Update UploadGroup stats if provided
    if (upload_group_id) {
      await UploadGroup.findByIdAndUpdate(
        upload_group_id,
        { $inc: { file_count: 1, total_size: size || 0 } },
        { new: false }
      ).catch(err => logger.warn(`UploadGroup stat update failed for ${upload_group_id}: ${err.message}`));
    }

    logger.info(`Upload Completed: Video metadata saved successfully in DB for video ID ${video._id}`);
    return video;
  } catch (error) {
    logger.error(`Upload Failed: Completion error for Video ${videoId}. Error: ${error.message}`);
    throw new BadRequestError(`Failed to complete S3 multipart upload: ${error.message}`);
  }
};

const abortVideoUpload = async (userId, { uploadId, objectKey }) => {
  try {
    if (!objectKey) {
      throw new BadRequestError('S3 object key is missing before aborting multipart upload.');
    }
    logger.info(`Upload Aborted: Aborting S3 multipart upload session ${uploadId} for S3 key ${objectKey}`);
    
    // Clean S3 multipart upload session
    await s3Service.abortMultipartUpload(objectKey, uploadId);
    
    return { success: true, message: 'Upload session cleaned up successfully.' };
  } catch (error) {
    logger.error(`Abort Failure: Failed to abort S3 upload ${uploadId}. Error: ${error.message}`);
    throw new BadRequestError(`Failed to abort S3 multipart upload: ${error.message}`);
  }
};

module.exports = {
  initiateVideoUpload,
  completeVideoUpload,
  abortVideoUpload
};
