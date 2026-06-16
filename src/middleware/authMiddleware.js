const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { UnauthorizedError } = require('../utils/errors');

/**
 * Middleware to protect routes and verify user identity via JWT.
 */
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new UnauthorizedError('Authentication token missing. Access denied.'));
    }

    // Decode and verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return next(new UnauthorizedError('Invalid or expired authentication token. Please log in again.'));
    }

    // Verify user still exists in the database
    const user = await User.findById(decoded.id).select('-password_hash -verification_token -reset_token -reset_token_expires -__v');
    if (!user) {
      return next(new UnauthorizedError('The user account associated with this token no longer exists.'));
    }

    // Attach user context to request
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      profile_image: user.profile_image,
      is_verified: user.is_verified,
      storage_plan: user.storage_plan,
      theme_color: user.theme_color,
      dark_mode: user.dark_mode,
      sidebar_color: user.sidebar_color,
      accent_color: user.accent_color,
      font_size: user.font_size,
      created_at: user.created_at
    };
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  protect
};
