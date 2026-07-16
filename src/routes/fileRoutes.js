const express = require('express');
const router = express.Router();

const {
  uploadFile,
  getFiles,
  getFile,
  updateFile,
  deleteFile,
  moveFile,
  favoriteFile,
  downloadFile,
  generateVideoLink,
  initiateUpload,
  completeUpload,
  abortUpload
} = require('../controllers/fileController');

const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/fileValidation');
const validate = require('../middleware/validate');
const {
  uploadFileSchema,
  updateFileSchema,
  moveFileSchema,
  favoriteFileSchema,
  initiateUploadSchema,
  completeUploadSchema,
  abortUploadSchema
} = require('../validations/fileValidation');

// All file management endpoints require JWT authentication
router.use(protect);

// File management paths
router.post('/upload', upload.single('file'), validate(uploadFileSchema), uploadFile);
router.get('/', getFiles);
router.post('/move', validate(moveFileSchema), moveFile);
router.post('/favorite', validate(favoriteFileSchema), favoriteFile);
router.get('/download/:id', downloadFile);
router.get('/:id', getFile);
router.put('/:id', validate(updateFileSchema), updateFile);
router.delete('/:id', deleteFile);
router.post('/video-link/:id', generateVideoLink);

// Presigned multipart upload (up to 15 GB, client uploads directly to S3)
router.post('/initiate-upload', validate(initiateUploadSchema), initiateUpload);
router.post('/complete-upload', validate(completeUploadSchema), completeUpload);
router.post('/abort-upload', validate(abortUploadSchema), abortUpload);

module.exports = router;
