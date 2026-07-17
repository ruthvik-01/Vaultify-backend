const Joi = require('joi');

const objectId = Joi.string().trim().length(24).hex();

const uploadFileSchema = Joi.object({
  folder_id: objectId.allow(null, '').optional() // Multer fields are strings
});

const updateFileSchema = Joi.object({
  file_name: Joi.string().trim().min(1).max(255).required().messages({
    'string.empty': 'File name is required.',
    'string.max': 'File name cannot exceed 255 characters.'
  })
});

const moveFileSchema = Joi.object({
  file_id: objectId.required().messages({
    'string.empty': 'File ID is required.'
  }),
  folder_id: objectId.allow(null, '').required()
});

const favoriteFileSchema = Joi.object({
  file_id: objectId.required().messages({
    'string.empty': 'File ID is required.'
  }),
  is_favorite: Joi.boolean().required()
});

const createShareSchema = Joi.object({
  file_id: objectId.optional(),
  folder_id: objectId.optional(),
  permission: Joi.string().valid('read', 'download').default('read'),
  expiry_hours: Joi.number().integer().min(1).max(720).default(24) // 1 hour to 30 days
}).xor('file_id', 'folder_id');

// ── Presigned multipart upload schemas ──────────────────────────────────

const initiateUploadSchema = Joi.object({
  file_name: Joi.string().trim().min(1).max(500).required().messages({
    'string.empty': 'File name is required.'
  }),
  file_type: Joi.string().trim().required().messages({
    'string.empty': 'File MIME type is required.'
  }),
  file_size: Joi.number().integer().min(1).required().messages({
    'number.base': 'File size is required.',
    'number.min': 'File size must be at least 1 byte.'
  }),
  folder_id: objectId.allow(null, '').optional()
});

const completeUploadSchema = Joi.object({
  upload_id: Joi.string().trim().required().messages({
    'string.empty': 'upload_id is required.'
  }),
  s3_key: Joi.string().trim().required().messages({
    'string.empty': 's3_key is required.'
  }),
  parts: Joi.array().items(
    Joi.object({
      partNumber: Joi.number().integer().min(1).required(),
      etag: Joi.string().trim().required()
    })
  ).min(1).required().messages({
    'array.min': 'At least one part is required.'
  }),
  file_name: Joi.string().trim().required(),
  file_type: Joi.string().trim().required(),
  file_size: Joi.number().integer().min(1).required(),
  folder_id: objectId.allow(null, '').optional()
});

const abortUploadSchema = Joi.object({
  upload_id: Joi.string().trim().required().messages({
    'string.empty': 'upload_id is required.'
  }),
  s3_key: Joi.string().trim().required().messages({
    'string.empty': 's3_key is required.'
  })
});

module.exports = {
  uploadFileSchema,
  updateFileSchema,
  moveFileSchema,
  favoriteFileSchema,
  createShareSchema,
  initiateUploadSchema,
  completeUploadSchema,
  abortUploadSchema
};
