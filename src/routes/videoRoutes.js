const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const videoUploadController = require('../controllers/videoUploadController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const {
  initiateUploadSchema,
  completeUploadSchema,
  abortUploadSchema
} = require('../middleware/uploadValidation');

// ─── PROTECTED ROUTES (Requires JWT authentication) ─────────────────────────

// Direct AWS S3 Multipart Upload Endpoints
router.post('/initiate-upload', protect, validate(initiateUploadSchema), videoUploadController.initiateUpload);
router.post('/complete-upload', protect, validate(completeUploadSchema), videoUploadController.completeUpload);
router.post('/abort-upload', protect, validate(abortUploadSchema), videoUploadController.abortUpload);

// Permanent Share link generation
router.get('/:id/share', protect, videoUploadController.getShareLink);

// Legacy/Backward Compatible upload routes (now pointing to the new S3 direct flow)
router.post('/upload/initiate', protect, validate(initiateUploadSchema), videoUploadController.initiateUpload);
router.post('/upload/complete', protect, validate(completeUploadSchema), videoUploadController.completeUpload);
router.post('/upload/abort', protect, validate(abortUploadSchema), videoUploadController.abortUpload);

// Local development fallback PUT endpoint (Public, acts like S3 PUT)
router.put('/upload/local-part', videoController.uploadLocalPart);

// Video folders CRUD
router.post('/folders', protect, videoController.createFolder);
router.get('/folders', protect, videoController.listFolders);
router.put('/folders/:id', protect, videoController.renameFolder);
router.delete('/folders/:id', protect, videoController.deleteFolder);
router.post('/folders/:id/move', protect, videoController.moveFolder);

// Video file CRUD
router.get('/', protect, videoController.getVideos);
router.put('/:id/rename', protect, videoController.renameVideo);
router.post('/:id/move', protect, videoController.moveVideo);
router.delete('/:id', protect, videoController.deleteVideo);

// Share generation
router.post('/share', protect, videoController.createShare);
router.post('/:videoId/share', protect, videoUploadController.createPermanentPublicShare);

module.exports = router;
