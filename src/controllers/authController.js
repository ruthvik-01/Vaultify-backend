const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logActivity } = require('../services/activityService');
const { BadRequestError, UnauthorizedError, ConflictError, NotFoundError } = require('../utils/errors');
const firebaseAuthService = require('../services/firebaseAuthService');

/**
 * Generate a JWT token signed with JWT_SECRET
 */
const generateToken = (userId, email) => {
  return jwt.sign(
    { id: userId, email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Serialize user object for API responses (excludes sensitive fields)
 */
const serializeUser = (user) => ({
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
  university: user.organization || user.university || '',
  organization: user.organization || user.university || '',
  created_at: user.created_at
});

/**
 * Get current authenticated user profile
 */
const getProfile = async (req, res, next) => {
  try {
    const userDoc = await User.findById(req.user.id);
    const serialized = serializeUser(userDoc || req.user);
    res.status(200).json({
      success: true,
      status: 'success',
      user: serialized,
      data: {
        user: serialized
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update authenticated user profile (including settings)
 */
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const allowedFields = [
      'name', 'profile_image',
      'theme_color', 'dark_mode', 'sidebar_color',
      'accent_color', 'font_size', 'storage_plan',
      'university', 'organization'
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    if (updateData.organization !== undefined && updateData.university === undefined) {
      updateData.university = updateData.organization;
    } else if (updateData.university !== undefined && updateData.organization === undefined) {
      updateData.organization = updateData.university;
    }

    if (Object.keys(updateData).length === 0) {
      return next(new BadRequestError('No profile properties provided for modification.'));
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
    const serialized = serializeUser(updatedUser);

    res.status(200).json({
      success: true,
      status: 'success',
      message: 'Organization updated successfully.',
      user: serialized,
      data: {
        user: serialized
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Register a new user
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return next(new ConflictError('An account with this email address already exists.'));
    }

    // Hash the password securely
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Insert user record into DB
    const user = await User.create({
      name,
      email,
      password_hash: passwordHash,
      verification_token: verificationToken
    });

    const token = generateToken(user.id, email);

    // Log the user's initial login (auto-login upon successful registration)
    await logActivity(user.id, 'Login', { method: 'registration' }, req.ip);

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: serializeUser(user)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log in an existing user
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Fetch user details
    const user = await User.findOne({ email });
    if (!user) {
      return next(new UnauthorizedError('Invalid email or password.'));
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return next(new UnauthorizedError('Invalid email or password.'));
    }

    const token = generateToken(user.id, user.email);

    // Log action to activity ledger
    await logActivity(user.id, 'Login', { method: 'credentials' }, req.ip);

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: serializeUser(user)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Google OAuth login / registration
 */
const googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return next(new BadRequestError('Firebase ID Token is required.'));
    }

    let decodedToken;
    try {
      decodedToken = await firebaseAuthService.verifyFirebaseIdToken(idToken);
    } catch (error) {
      return next(new UnauthorizedError(error.message || 'Firebase ID Token verification failed.'));
    }

    const { uid: googleId, email, name, picture: profile_image } = decodedToken;

    if (!email) {
      return next(new BadRequestError('Email is required for Google login.'));
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // Update Google ID and profile image if not already set
      if (googleId && !user.google_id) {
        user.google_id = googleId;
      }
      if (profile_image && !user.profile_image) {
        user.profile_image = profile_image;
      }
      await user.save();
    } else {
      // Create a new user account with a random password (Google users don't need one)
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(randomPassword, salt);

      user = await User.create({
        name: name || email.split('@')[0],
        email,
        password_hash: passwordHash,
        google_id: googleId || null,
        profile_image: profile_image || null,
        is_verified: true // Google accounts are pre-verified
      });
    }

    const token = generateToken(user.id, user.email);

    await logActivity(user.id, 'Login', { method: 'google' }, req.ip);

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: serializeUser(user)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify email address using token
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      return next(new BadRequestError('Verification token is required.'));
    }

    const user = await User.findOne({ verification_token: token });
    if (!user) {
      return next(new BadRequestError('Invalid or expired verification token.'));
    }

    user.is_verified = true;
    user.verification_token = null;
    await user.save();

    await logActivity(user.id, 'Email Verified', {}, req.ip);

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset (forgot password)
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new BadRequestError('Email address is required.'));
    }

    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration attacks
    if (!user) {
      return res.status(200).json({
        status: 'success',
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.reset_token = resetToken;
    user.reset_token_expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // In production, send email with reset link. For now, log the token.
    const logger = require('../config/logger');
    logger.info(`[Password Reset] Token for ${email}: ${resetToken}`);

    await logActivity(user.id, 'Password Reset Requested', {}, req.ip);

    res.status(200).json({
      status: 'success',
      message: 'If an account with that email exists, a password reset link has been sent.',
      // Include token in development mode for testing
      ...(process.env.NODE_ENV === 'development' && { reset_token: resetToken })
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password using token
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return next(new BadRequestError('Reset token and new password are required.'));
    }

    if (password.length < 6) {
      return next(new BadRequestError('Password must be at least 6 characters long.'));
    }

    const user = await User.findOne({
      reset_token: token,
      reset_token_expires: { $gt: new Date() }
    });

    if (!user) {
      return next(new BadRequestError('Invalid or expired reset token.'));
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(password, salt);
    user.reset_token = null;
    user.reset_token_expires = null;
    await user.save();

    await logActivity(user.id, 'Password Reset Completed', {}, req.ip);

    res.status(200).json({
      status: 'success',
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log out user (State-clear and audit)
 */
const logout = async (req, res, next) => {
  try {
    // Audit logs of logout event (if request is authenticated)
    if (req.user) {
      await logActivity(req.user.id, 'Logout', {}, req.ip);
    }

    res.status(200).json({
      status: 'success',
      message: 'Successfully logged out on server side.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Securely rotate / update password
 */
const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Fetch password hash from database
    const user = await User.findById(userId);
    if (!user) {
      return next(new NotFoundError('User record not found.'));
    }

    const hash = user.password_hash;

    // Verify existing password matches
    const isMatch = await bcrypt.compare(oldPassword, hash);
    if (!isMatch) {
      return next(new BadRequestError('Existing password provided is incorrect.'));
    }

    // Ensure new password is different from old password
    if (oldPassword === newPassword) {
      return next(new BadRequestError('New password must be different from the current password.'));
    }

    // Encrypt the new password
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    // Update in DB
    user.password_hash = newHash;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password rotated successfully.'
    });
  } catch (error) {
    next(error);
  }
};

const getUserActivities = async (req, res, next) => {
  try {
    const ActivityLog = require('../models/ActivityLog');
    const userId = req.user.id;
    const userIdStr = userId.toString();
    let userObjId = null;
    try {
      userObjId = new mongoose.Types.ObjectId(userIdStr);
    } catch (_) {}

    const logs = await ActivityLog.find({
      $or: [
        { user_id: userObjId || userId },
        { userId: userIdStr },
        { user_id: userIdStr }
      ]
    })
      .sort({ created_at: -1, timestamp: -1 })
      .limit(50);

    const formattedLogs = logs.map(act => {
      let details = {};
      try {
        if (act.details) {
          details = typeof act.details === 'string' ? JSON.parse(act.details) : act.details;
        }
      } catch (e) {
        details = { raw: act.details };
      }
      const resourceName = act.itemName || act.resourceName || details.resourceName || details.fileName || details.folderName || details.title || details.newName || details.name || '';
      const resourceType = act.itemType || act.resourceType || details.resourceType || (act.action.includes('FOLDER') ? 'Folder' : 'File');
      const folderName = act.folderName || details.folderName || '';

      return {
        id: act._id.toString(),
        userId: act.user_id ? act.user_id.toString() : userId,
        action: act.action,
        category: act.category || details.category || 'General',
        itemName: resourceName || 'Item',
        itemType: resourceType || 'File',
        resourceName,
        resourceType,
        folderName,
        fileName: resourceName,
        description: act.description || details.description || `${act.action} ${resourceName}`.trim(),
        timestamp: act.created_at || act.timestamp || new Date(),
        metadata: act.metadata || details
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        activities: formattedLogs
      }
    });
  } catch (error) {
    next(error);
  }
};

const logCustomActivity = async (req, res, next) => {
  try {
    const { action, fileName, details = {} } = req.body;
    const userId = req.user.id;
    await logActivity(userId, action, { fileName, ...details }, req.ip);
    res.status(201).json({
      status: 'success'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  googleLogin,
  verifyEmail,
  forgotPassword,
  resetPassword,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  getUserActivities,
  logCustomActivity
};
