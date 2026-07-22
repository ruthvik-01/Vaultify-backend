const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  folder_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  file_name: { type: String, required: true },
  original_name: { type: String, required: true },
  file_type: { type: String, required: true },
  file_size: { type: Number, required: true },
  s3_key: { type: String, required: true },
<<<<<<< Updated upstream
  is_favorite: { type: Boolean, default: false }
=======
  is_favorite: { type: Boolean, default: false },
  is_work_submission: { type: Boolean, default: false },
  uploadBatchId: { type: String, default: null },
  relative_path: { type: String, default: null }
>>>>>>> Stashed changes
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for query performance optimization
fileSchema.index({ user_id: 1, created_at: -1 });
fileSchema.index({ folder_id: 1, created_at: -1 });
fileSchema.index({ file_type: 1, created_at: -1 });
fileSchema.index({ file_size: -1 });
fileSchema.index({ created_at: -1 });

module.exports = mongoose.model('File', fileSchema);
