const express = require('express');
const router = express.Router();

const {
  createUploadGroup,
  getUploadGroups,
  getUploadGroup,
  renameUploadGroup,
  deleteUploadGroup,
  shareUploadGroup
} = require('../controllers/uploadGroupController');

const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const {
  createUploadGroupSchema,
  updateUploadGroupSchema,
  shareUploadGroupSchema
} = require('../validations/uploadGroupValidation');

// All upload group endpoints require JWT authentication
router.use(protect);

router.post('/', validate(createUploadGroupSchema), createUploadGroup);
router.get('/', getUploadGroups);
router.get('/:id', getUploadGroup);
router.put('/:id', validate(updateUploadGroupSchema), renameUploadGroup);
router.delete('/:id', deleteUploadGroup);
router.post('/:id/share', validate(shareUploadGroupSchema), shareUploadGroup);

module.exports = router;
