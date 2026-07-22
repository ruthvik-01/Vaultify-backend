const {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  PutObjectAclCommand
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3Client = require('../config/s3Client');
const logger = require('../config/logger');

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'gd-miniproject';

const PART_SIZE = 100 * 1024 * 1024; // 100 MB per part
const MAX_FILE_SIZE = 15 * 1024 * 1024 * 1024; // 15 GB

const uploadFile = async (fileBuffer, key, mimeType) => {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType
  });

  await s3Client.send(command);
  logger.info(`Uploaded object to S3. Key: ${key}`);
  return { key, bucket: BUCKET_NAME };
};

const deleteFile = async (key) => {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key
  });

  await s3Client.send(command);
  logger.info(`Deleted object from S3. Key: ${key}`);
};

const getPreSignedDownloadUrl = async (key, originalName, expiresInSeconds = 900, disposition = 'attachment', mimeType = null) => {
  const contentDisposition = disposition === 'inline'
    ? 'inline'
    : `attachment; filename="${encodeURIComponent(originalName)}"`;

  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    ResponseContentDisposition: contentDisposition
  };

  if (mimeType) {
    params.ResponseContentType = mimeType;
  }

  const command = new GetObjectCommand(params);

  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
};

const checkBucketAccess = async () => {
  const command = new HeadBucketCommand({ Bucket: BUCKET_NAME });
  await s3Client.send(command);
  logger.info(`Verified S3 bucket access for ${BUCKET_NAME}.`);
};

// ── Multipart upload helpers (for files up to 15 GB) ────────────────────

/**
 * Start a new S3 multipart upload. Returns the UploadId.
 */
const initiateMultipartUpload = async (key, mimeType) => {
  const command = new CreateMultipartUploadCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: mimeType
  });

  const response = await s3Client.send(command);
  logger.info(`Initiated multipart upload for key: ${key}, UploadId: ${response.UploadId}`);
  return response.UploadId;
};

/**
 * Generate presigned URLs for each part so the client can PUT directly to S3.
 * @param {string} key       S3 object key
 * @param {string} uploadId  Multipart upload ID
 * @param {number} totalParts Number of parts
 * @returns {Promise<Array<{partNumber: number, url: string}>>}
 */
const generateUploadPartUrls = async (key, uploadId, totalParts) => {
  const urls = [];

  for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
    const command = new UploadPartCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber
    });

    // Each presigned URL is valid for 7 days (604800s – the AWS maximum)
    const url = await getSignedUrl(s3Client, command, { expiresIn: 604800 });
    urls.push({ partNumber, url });
  }

  return urls;
};

/**
 * Complete a multipart upload after all parts have been uploaded.
 * @param {string} key      S3 object key
 * @param {string} uploadId Multipart upload ID
 * @param {Array<{partNumber: number, etag: string}>} parts
 */
const completeMultipartUpload = async (key, uploadId, parts) => {
  const command = new CompleteMultipartUploadCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: parts
        .sort((a, b) => a.partNumber - b.partNumber)
        .map((p) => ({ PartNumber: p.partNumber, ETag: p.etag }))
    }
  });

  await s3Client.send(command);
  logger.info(`Completed multipart upload for key: ${key}`);
};

/**
 * Abort a multipart upload and clean up any uploaded parts.
 */
const abortMultipartUpload = async (key, uploadId) => {
  const command = new AbortMultipartUploadCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    UploadId: uploadId
  });

  await s3Client.send(command);
  logger.info(`Aborted multipart upload for key: ${key}, UploadId: ${uploadId}`);
};

/**
 * Set public-read ACL on a specific S3 object so it can be accessed via its permanent URL.
 */
const makeObjectPublic = async (key) => {
  const command = new PutObjectAclCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ACL: 'public-read'
  });

  await s3Client.send(command);
  logger.info(`Set public-read ACL on S3 object: ${key}`);
};

/**
 * Get the permanent, non-expiring S3 object URL.
 */
const getObjectUrl = (key) => {
  const region = process.env.AWS_REGION || 'eu-north-1';
  return `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${encodeURI(key)}`;
};

module.exports = {
  uploadFile,
  deleteFile,
  getPreSignedDownloadUrl,
  checkBucketAccess,
  initiateMultipartUpload,
  generateUploadPartUrls,
  completeMultipartUpload,
  abortMultipartUpload,
  makeObjectPublic,
  getObjectUrl,
  PART_SIZE,
  MAX_FILE_SIZE
};
