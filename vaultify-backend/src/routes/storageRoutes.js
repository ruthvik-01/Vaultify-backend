const express = require('express');
const router = express.Router();
const { getStorageSummary } = require('../controllers/storageController');
const { protect } = require('../middleware/authMiddleware');

router.get('/summary', protect, getStorageSummary);

module.exports = router;
