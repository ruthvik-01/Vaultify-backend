const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  profile_image: { type: String, default: null },
  is_verified: { type: Boolean, default: false },
  storage_plan: { type: String, enum: ['free', 'pro'], default: 'free' },
  theme_color: { type: String, default: 'grid' },
  dark_mode: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
  sidebar_color: { type: String, default: 'expanded' },
  accent_color: { type: String, default: 'green' },
  font_size: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
  google_id: { type: String, default: null },
  verification_token: { type: String, default: null },
  reset_token: { type: String, default: null },
  reset_token_expires: { type: Date, default: null }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Index for sorting/filtering users
userSchema.index({ created_at: -1 });

module.exports = mongoose.model('User', userSchema);
