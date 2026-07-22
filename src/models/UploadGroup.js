const mongoose = require('mongoose');

const uploadGroupSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true, maxlength: 255 },
  file_count: { type: Number, default: 0 },
  total_size: { type: Number, default: 0 },
  has_folders: { type: Boolean, default: false }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for query performance
uploadGroupSchema.index({ user_id: 1, created_at: -1 });

module.exports = mongoose.model('UploadGroup', uploadGroupSchema);
