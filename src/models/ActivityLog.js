const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  userId: { type: String, default: null },
  action: { type: String, required: true },
  category: { type: String, default: 'General' },
  itemName: { type: String, default: '' },
  itemType: { type: String, default: 'Item' },
  resourceName: { type: String, default: '' },
  resourceType: { type: String, default: 'File' },
  folderName: { type: String, default: '' },
  description: { type: String, default: '' },
  details: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  ip_address: { type: String },
  created_at: { type: Date, default: Date.now },
  timestamp: { type: Date, default: Date.now }
});

// Indexes for query performance optimization
activityLogSchema.index({ user_id: 1, created_at: -1 });
activityLogSchema.index({ created_at: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
