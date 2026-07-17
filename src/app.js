const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const { NotFoundError } = require('./utils/errors');

const authRoutes = require('./routes/authRoutes');
const folderRoutes = require('./routes/folderRoutes');
const fileRoutes = require('./routes/fileRoutes');
const shareRoutes = require('./routes/shareRoutes');
const videoRoutes = require('./routes/videoRoutes');
const videoController = require('./controllers/videoController');
const VideoShare = require('./models/VideoShare');

const app = express();

app.use(helmet());

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  })
);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    message: 'Backend Running'
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'UP',
    message: 'Backend Running'
  });
});

app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/videos', videoRoutes);

// Fallback logic for /api/share/:token to support standard documents and videos transparently
const handleVideoShareFallback = async (req, res, next) => {
  const { token } = req.params;
  try {
    const isVideoShare = await VideoShare.findOne({ token, isActive: true });
    if (isVideoShare) {
      if (req.path.endsWith('/download')) {
        return videoController.downloadSharedVideo(req, res, next);
      }
      return videoController.getSharedItem(req, res, next);
    }
  } catch (err) {
    // Ignore and proceed to standard handler
  }
  next();
};

app.get('/api/share/:token/download', handleVideoShareFallback);
app.get('/api/share/:token', handleVideoShareFallback);

app.use('/api/share', shareRoutes);

// Public Video Share Routes at root (Unauthenticated, no JWT)
app.get('/share/:token/download', videoController.downloadSharedVideo);
app.get('/share/:token/stream', videoController.streamSharedVideo);
app.get('/share/:token', videoController.getSharedItem);

// Short URL redirect for public video links (e.g. /v/abc12345)
const { getPublicVideo } = require('./controllers/fileController');
app.get('/v/:code', getPublicVideo);

app.all('*', (req, res, next) => {
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server.`));
});

app.use(errorHandler);

module.exports = app;
