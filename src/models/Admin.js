const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'superadmin'], default: 'admin' },
  last_login: { type: Date, default: null },
  session_timeout: { type: Number, default: 30 },
  email_alerts: { type: Boolean, default: true },
  daily_digest: { type: Boolean, default: true },
  audit_retention: { type: Number, default: 90 },
  audit_log_level: { type: String, default: 'All' },
  last_activity: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'admins'
});

module.exports = mongoose.model('Admin', adminSchema);
