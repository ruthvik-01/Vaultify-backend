const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  folder_name: { type: String, required: true },
  parent_folder_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  folder_type: { type: String, enum: ['normal', 'work'], default: 'normal' },
  uploadBatchId: { type: String, default: null },
  upload_group_id: { type: mongoose.Schema.Types.ObjectId, ref: 'UploadGroup', default: null },
  is_deleted: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  inTrash: { type: Boolean, default: false },
  deleted_at: { type: Date, default: null },
  deletedAt: { type: Date, default: null }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for folder query performance
folderSchema.index({ user_id: 1, created_at: -1 });
folderSchema.index({ parent_folder_id: 1 });
folderSchema.index({ user_id: 1, folder_type: 1 });

module.exports = mongoose.model('Folder', folderSchema);
