const mongoose = require('mongoose');

const videoShareSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true, index: true },
  videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', default: null },
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'VideoFolder', default: null },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date, default: null }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

module.exports = mongoose.model('VideoShare', videoShareSchema);
