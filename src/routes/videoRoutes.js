const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const { protect } = require('../middleware/authMiddleware');
const { validateVideoMetadata } = require('../middleware/videoUploadMiddleware');

// ─── PROTECTED ROUTES (Requires JWT authentication) ─────────────────────────

// Video upload APIs
router.post('/upload/initiate', protect, validateVideoMetadata, videoController.initiateUpload);
router.post('/upload/complete', protect, videoController.completeUpload);
router.post('/upload/abort', protect, videoController.abortUpload);

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

module.exports = router;
