const Joi = require('joi');

const initiateUploadSchema = Joi.object({
  filename: Joi.string().trim().required().messages({
    'string.empty': 'Filename is required'
  }),
  mimeType: Joi.string().trim().required().messages({
    'string.empty': 'MIME type is required'
  }),
  size: Joi.number().required().min(1).max(26843545600).messages({
    'number.base': 'Size must be a number',
    'number.max': 'File size exceeds the 25 GB limit.'
  }),
  folderId: Joi.string().trim().allow(null, '').optional()
});

const completeUploadSchema = Joi.object({
  videoId: Joi.string().trim().required().messages({
    'string.empty': 'VideoId is required'
  }),
  uploadId: Joi.string().trim().required().messages({
    'string.empty': 'UploadId is required'
  }),
  parts: Joi.array().items(
    Joi.object({
      partNumber: Joi.number().integer().min(1).required(),
      etag: Joi.string().trim().required()
    })
  ).min(1).required().messages({
    'array.min': 'At least one part is required to complete the upload.'
  }),
  folderId: Joi.string().trim().allow(null, '').optional(),
  objectKey: Joi.string().trim().optional(),
  s3Key: Joi.string().trim().optional(),
  filename: Joi.string().trim().optional(),
  mimeType: Joi.string().trim().optional(),
  size: Joi.number().optional()
});

const abortUploadSchema = Joi.object({
  videoId: Joi.string().trim().required().messages({
    'string.empty': 'VideoId is required'
  }),
  uploadId: Joi.string().trim().required().messages({
    'string.empty': 'UploadId is required'
  }),
  objectKey: Joi.string().trim().optional(),
  s3Key: Joi.string().trim().optional()
});

module.exports = {
  initiateUploadSchema,
  completeUploadSchema,
  abortUploadSchema
};
