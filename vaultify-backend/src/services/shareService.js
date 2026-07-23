const crypto = require('crypto');
const VideoShare = require('../models/VideoShare');
const Video = require('../models/Video');
const VideoFolder = require('../models/VideoFolder');
const { GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3Client');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../utils/errors');
const fs = require('fs');
const path = require('path');

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'gd-miniproject';

const createShare = async (ownerId, { videoId, folderId, expiresAt = null }) => {
  if (!videoId && !folderId) {
    throw new BadRequestError('Must provide either videoId or folderId to generate a share link.');
  }

  if (videoId) {
    const video = await Video.findOne({ _id: videoId, ownerId });
    if (!video) throw new NotFoundError('Video not found or access denied.');
  } else if (folderId) {
    const folder = await VideoFolder.findOne({ _id: folderId, ownerId });
    if (!folder) throw new NotFoundError('Folder not found or access denied.');
  }

  const token = crypto.randomBytes(24).toString('hex');

  const share = await VideoShare.create({
    token,
    videoId: videoId || null,
    folderId: folderId || null,
    ownerId,
    expiresAt,
    isActive: true
  });

  return share;
};

const getSharedItem = async (token) => {
  const share = await VideoShare.findOne({ token, isActive: true })
    .populate('videoId')
    .populate('folderId');

  if (!share) {
    throw new NotFoundError('Shared link not found, disabled, or expired.');
  }

  if (share.expiresAt && new Date() > share.expiresAt) {
    share.isActive = false;
    await share.save();
    throw new ForbiddenError('This shared link has expired.');
  }

  return share;
};

const getVideoStream = async (s3Key, rangeHeader) => {
  if (s3Key.startsWith('local://')) {
    const videoId = s3Key.replace('local://', '');
    const filePath = path.join(__dirname, '../../local_storage/videos', `${videoId}.mp4`);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundError('Local video file not found.');
    }

    const stat = fs.statSync(filePath);
    const totalLength = stat.size;
    const mimeType = 'video/mp4';

    let start = 0;
    let end = totalLength - 1;
    let isPartial = false;

    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const partialStart = parts[0];
      const partialEnd = parts[1];

      start = parseInt(partialStart, 10);
      end = partialEnd ? parseInt(partialEnd, 10) : totalLength - 1;

      if (isNaN(start)) start = 0;
      if (isNaN(end)) end = totalLength - 1;
      
      if (start >= totalLength) {
        const error = new Error('Range Not Satisfiable');
        error.status = 416;
        throw error;
      }
      if (end >= totalLength) {
        end = totalLength - 1;
      }
      isPartial = true;
    }

    const chunkSize = (end - start) + 1;
    const stream = fs.createReadStream(filePath, { start, end });

    return {
      stream,
      start,
      end,
      totalLength,
      chunkSize,
      mimeType,
      isPartial
    };
  } else {
    // S3 Mode
    const headCommand = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key
    });
    const headResponse = await s3Client.send(headCommand);
    const totalLength = headResponse.ContentLength;
    const mimeType = headResponse.ContentType || 'video/mp4';

    let start = 0;
    let end = totalLength - 1;
    let isPartial = false;

    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const partialStart = parts[0];
      const partialEnd = parts[1];

      start = parseInt(partialStart, 10);
      end = partialEnd ? parseInt(partialEnd, 10) : totalLength - 1;

      if (isNaN(start)) start = 0;
      if (isNaN(end)) end = totalLength - 1;
      
      if (start >= totalLength) {
        const error = new Error('Range Not Satisfiable');
        error.status = 416;
        throw error;
      }
      if (end >= totalLength) {
        end = totalLength - 1;
      }
      isPartial = true;
    }

    const chunkSize = (end - start) + 1;

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Range: `bytes=${start}-${end}`
    });

    const response = await s3Client.send(command);

    return {
      stream: response.Body,
      start,
      end,
      totalLength,
      chunkSize,
      mimeType,
      isPartial
    };
  }
};

module.exports = {
  createShare,
  getSharedItem,
  getVideoStream
};
