const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  duration: { type: Number, default: 0 },
  thumbnail: { type: String, default: '' },
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'VideoFolder', default: null },
  s3Key: { type: String, required: true },
  status: { type: String, enum: ['Uploading', 'Active', 'Failed'], default: 'Uploading' },
  shareToken: { type: String, default: null, index: true },
  publicUrl: { type: String, default: null },
  isShared: { type: Boolean, default: false },
  is_work_submission: { type: Boolean, default: false },
  uploadBatchId: { type: String, default: null },
  relative_path: { type: String, default: null },
  upload_group_id: { type: mongoose.Schema.Types.ObjectId, ref: 'UploadGroup', default: null }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Indexing for performance
videoSchema.index({ ownerId: 1, folderId: 1 });
videoSchema.index({ ownerId: 1, createdAt: -1 });
videoSchema.index({ folderId: 1, createdAt: -1 });
videoSchema.index({ is_work_submission: 1, ownerId: 1, createdAt: -1 });
videoSchema.index({ status: 1 });
videoSchema.index({ createdAt: -1 });
videoSchema.index({ size: -1 });
videoSchema.index({ upload_group_id: 1 });

module.exports = mongoose.model('Video', videoSchema);
