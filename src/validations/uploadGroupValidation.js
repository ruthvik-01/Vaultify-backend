const Joi = require('joi');

const objectId = Joi.string().trim().length(24).hex();

const createUploadGroupSchema = Joi.object({
  title: Joi.string().trim().min(1).max(255).required().messages({
    'string.empty': 'Upload title is required.',
    'string.min': 'Upload title must contain at least 1 character.',
    'string.max': 'Upload title cannot exceed 255 characters.'
  })
});

const updateUploadGroupSchema = Joi.object({
  title: Joi.string().trim().min(1).max(255).required().messages({
    'string.empty': 'Upload title is required.',
    'string.min': 'Upload title must contain at least 1 character.',
    'string.max': 'Upload title cannot exceed 255 characters.'
  })
});

const shareUploadGroupSchema = Joi.object({
  permission: Joi.string().valid('read', 'download').default('read'),
  expiry_hours: Joi.number().integer().min(1).max(720).default(24)
});

module.exports = {
  createUploadGroupSchema,
  updateUploadGroupSchema,
  shareUploadGroupSchema
};
