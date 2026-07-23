const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Name cannot be empty',
    'string.min': 'Name must be at least 2 characters long'
  }),
  email: Joi.string().trim().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'string.empty': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'string.empty': 'Password is required'
  })
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'string.empty': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required'
  })
});

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  profile_image: Joi.string().trim().uri().allow(null, '').optional(),
  theme_color: Joi.string().trim().max(50).optional(),
  dark_mode: Joi.string().trim().valid('light', 'dark', 'system').optional(),
  sidebar_color: Joi.string().trim().max(50).optional(),
  accent_color: Joi.string().trim().max(50).optional(),
  font_size: Joi.string().trim().valid('small', 'medium', 'large').optional(),
  storage_plan: Joi.string().trim().valid('free', 'pro').optional(),
  university: Joi.string().trim().allow(null, '').optional(),
  organization: Joi.string().trim().allow(null, '').optional()
}).min(1); // Require at least one field to be updated

const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required().messages({
    'string.empty': 'Old password is required'
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.min': 'New password must be at least 6 characters long',
    'string.empty': 'New password is required'
  })
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema
};
