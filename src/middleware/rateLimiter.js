const rateLimit = require('express-rate-limit');

// General rate limiter: max 100000 requests per 15 minutes per IP (handles large corporate NATs for 10000+ members)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});

// Strict rate limiter for auth endpoints: max 5000 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
  }
});

module.exports = {
  apiLimiter,
  authLimiter
};
