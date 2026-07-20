const mongoose = require('mongoose');

const videoFolderSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  parentFolder: { type: mongoose.Schema.Types.ObjectId, ref: 'VideoFolder', default: null },
  path: { type: String, required: true },
  uploadBatchId: { type: String, default: null }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Indexing for performance
videoFolderSchema.index({ ownerId: 1, parentFolder: 1 });

module.exports = mongoose.model('VideoFolder', videoFolderSchema);
