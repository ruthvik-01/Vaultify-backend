const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

/**
 * Middleware to protect Admin endpoints.
 * Verifies JWT token and checks if user has Admin authorization.
 */
module.exports = async function requireAdminAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Admin authentication token required.'
      });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'vaultify_jwt_secret_dev_key_2026';

    const decoded = jwt.verify(token, secret);

    let adminUser = await Admin.findById(decoded.id)
      .select('_id email role name session_timeout last_activity')
      .lean()
      .catch(() => null);

    if (!adminUser) {
      const User = require('../models/User');
      const standardUser = await User.findById(decoded.id).select('_id email name').lean().catch(() => null);
      if (standardUser) {
        adminUser = { _id: standardUser._id, name: standardUser.name, email: standardUser.email, role: 'admin' };
      }
    }

    if (!adminUser) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Admin privileges required to access this resource.'
      });
    }

    // Check inactivity session timeout (enforcing a minimum threshold of 7 days / 10080 minutes)
    const timeoutMinutes = Math.max(adminUser.session_timeout || 10080, 10080);
    if (adminUser.last_activity) {
      const elapsedMinutes = (Date.now() - new Date(adminUser.last_activity).getTime()) / (60 * 1000);
      if (elapsedMinutes > timeoutMinutes) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: Session expired due to inactivity. Please log in again.'
        });
      }
    }

    // Update last activity timestamp asynchronously without blocking response
    Admin.updateOne({ _id: adminUser._id }, { $set: { last_activity: new Date() } }).catch(() => {});

    req.admin = adminUser;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or expired admin session token.'
    });
  }
};
