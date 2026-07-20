const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  action: { type: String, required: true },
  details: { type: String },
  ip_address: { type: String },
  created_at: { type: Date, default: Date.now }
});

// Indexes for query performance optimization
activityLogSchema.index({ user_id: 1, created_at: -1 });
activityLogSchema.index({ created_at: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
