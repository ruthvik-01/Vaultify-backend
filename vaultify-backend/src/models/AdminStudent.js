const mongoose = require('mongoose');

const adminStudentSchema = new mongoose.Schema({
  studentName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  team: { type: String, required: true, trim: true },
  active: { type: Boolean, default: true }
}, {
  timestamps: true,
  collection: 'admin_students'
});

// Indexes for performance optimization
adminStudentSchema.index({ team: 1 });
adminStudentSchema.index({ createdAt: -1 });
adminStudentSchema.index({ active: 1, team: 1 });
adminStudentSchema.index({ active: 1, email: 1 });
adminStudentSchema.index({ active: 1, studentName: 1 });
adminStudentSchema.index({ active: 1, createdAt: -1 });

module.exports = mongoose.model('AdminStudent', adminStudentSchema);
