const Video = require('../models/Video');
const UploadGroup = require('../models/UploadGroup');
const s3Service = require('./s3Service');
const { NotFoundError } = require('../utils/errors');
const mongoose = require('mongoose');
const { checkIsWorkFolder } = require('./videoService');
const fs = require('fs');
const path = require('path');

const isS3Configured = () => {
  return !!(
    process.env.AWS_S3_BUCKET_NAME ||
    (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
  );
};

const initiateVideoUpload = async (ownerId, filename, mimeType, size, folderId = null, hostUrl = '', upload_group_id = null) => {
  const objectId = new mongoose.Types.ObjectId();

  if (isS3Configured()) {
    const category = 'Videos';
    const cleanName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const s3Key = `users/${ownerId}/${category}/${objectId}-${cleanName}`;

    const uploadId = await s3Service.initiateMultipartUpload(s3Key, mimeType);
    const isWork = await checkIsWorkFolder(folderId);

    const video = await Video.create({
      _id: objectId,
      ownerId,
      filename,
      originalName: filename,
      mimeType,
      size,
      s3Key,
      folderId: folderId || null,
      status: 'Uploading',
      upload_group_id: upload_group_id || null,
      is_work_submission: isWork
    });

    const partSize = s3Service.PART_SIZE || 100 * 1024 * 1024;
    const totalParts = Math.ceil(size / partSize);
    const partUrls = await s3Service.generateUploadPartUrls(s3Key, uploadId, totalParts);

    return {
      uploadId,
      videoId: video._id,
      s3Key,
      partUrls,
      chunkSize: partSize
    };
  } else {
    // Local development fallback
    const uploadId = `local_up_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const s3Key = `local://${objectId}`;

    const isWork = await checkIsWorkFolder(folderId);

    const video = await Video.create({
      _id: objectId,
      ownerId,
      filename,
      originalName: filename,
      mimeType,
      size,
      s3Key,
      folderId: folderId || null,
      status: 'Uploading',
      upload_group_id: upload_group_id || null,
      is_work_submission: isWork
    });

    const partSize = 100 * 1024 * 1024; // 100 MB
    const totalParts = Math.ceil(size / partSize);
    const partUrls = [];

    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
      partUrls.push({
        partNumber,
        url: `${hostUrl}/api/videos/upload/local-part?uploadId=${uploadId}&partNumber=${partNumber}`
      });
    }

    return {
      uploadId,
      videoId: video._id,
      s3Key,
      partUrls
    };
  }
};

const completeVideoUpload = async (ownerId, videoId, uploadId, parts) => {
  const video = await Video.findOne({ _id: videoId, ownerId });
  if (!video) {
    throw new NotFoundError('Video upload context not found.');
  }

  if (video.s3Key.startsWith('local://')) {
    // Local development fallback concatenation
    const uploadDir = path.join(__dirname, '../../local_storage/parts');
    const finalDir = path.join(__dirname, '../../local_storage/videos');
    fs.mkdirSync(finalDir, { recursive: true });

    const finalPath = path.join(finalDir, `${videoId}.mp4`);
    const finalWriteStream = fs.createWriteStream(finalPath);

    // Read and merge chunks
    for (const part of parts.sort((a, b) => a.partNumber - b.partNumber)) {
      const partPath = path.join(uploadDir, `${uploadId}_${part.partNumber}.part`);
      if (fs.existsSync(partPath)) {
        const chunkBuffer = fs.readFileSync(partPath);
        finalWriteStream.write(chunkBuffer);
        fs.unlinkSync(partPath); // delete part
      }
    }
    finalWriteStream.end();

    video.status = 'Active';
    await video.save();

    // Increment UploadGroup counters if group is specified
    if (video.upload_group_id) {
      await UploadGroup.findByIdAndUpdate(video.upload_group_id, {
        $inc: { file_count: 1, total_size: video.size }
      });
    }

    return video;
  } else {
    // S3 path
    await s3Service.completeMultipartUpload(video.s3Key, uploadId, parts);
    video.status = 'Active';
    await video.save();

    // Increment UploadGroup counters if group is specified
    if (video.upload_group_id) {
      await UploadGroup.findByIdAndUpdate(video.upload_group_id, {
        $inc: { file_count: 1, total_size: video.size }
      });
    }

    return video;
  }
};

const abortVideoUpload = async (ownerId, videoId, uploadId) => {
  const video = await Video.findOne({ _id: videoId, ownerId });
  if (!video) {
    throw new NotFoundError('Video upload context not found.');
  }

  if (video.s3Key.startsWith('local://')) {
    const uploadDir = path.join(__dirname, '../../local_storage/parts');
    // Delete chunks
    try {
      const files = fs.readdirSync(uploadDir);
      for (const file of files) {
        if (file.startsWith(`${uploadId}_`)) {
          fs.unlinkSync(path.join(uploadDir, file));
        }
      }
    } catch (e) {
      // Ignore
    }
    await Video.deleteOne({ _id: videoId });
  } else {
    await s3Service.abortMultipartUpload(video.s3Key, uploadId);
    await Video.deleteOne({ _id: videoId });
  }
};

module.exports = {
  isS3Configured,
  initiateVideoUpload,
  completeVideoUpload,
  abortVideoUpload
};
