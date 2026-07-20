const express = require('express');
const router = express.Router();
const multer = require('multer');
const adminController = require('../controllers/adminController');
const requireAdminAuth = require('../middleware/adminAuthMiddleware');

// Multer memory storage configuration for Excel file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB max Excel file size
  fileFilter: (req, file, cb) => {
    const originalName = file.originalname.toLowerCase();
    if (originalName.endsWith('.xlsx') || originalName.endsWith('.xls') || file.mimetype.includes('excel') || file.mimetype.includes('spreadsheetml')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .xlsx and .xls Excel files are allowed.'));
    }
  }
});

// 0. Public Admin Login Endpoint (Unauthenticated)
router.post('/login', adminController.adminLogin);

// 🔒 Protect all remaining Admin routes with Admin Authentication Middleware
router.use(requireAdminAuth);

// Settings and Administration Endpoints
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);
router.post('/settings/change-password', adminController.changePassword);
router.post('/settings/monitored-emails', adminController.addMonitoredStudent);
router.delete('/settings/monitored-emails/:id', adminController.deleteMonitoredStudent);
router.get('/settings/export', adminController.exportData);

// 1. Excel Import API
router.post('/import-students', upload.single('file'), adminController.importStudents);

// 2. Dashboard Statistics
router.get('/dashboard', adminController.getDashboardStats);
router.get('/stats', adminController.getDashboardStats);

// 3. Monitored Students List & Profile
router.get('/students', adminController.getStudents);
router.get('/student/:id', adminController.getStudentById);

// 4. Teams Overview & Team Drill-down
router.get('/teams', adminController.getTeams);
router.get('/team/:teamName', adminController.getTeamByName);
router.delete('/teams/:teamName/uploads', adminController.deleteTeamUploads);

// 5. Uploads Monitoring
router.get('/uploads', adminController.getUploads);
router.delete('/uploads/:id', adminController.deleteUpload);
router.get('/uploads/:id/preview', adminController.getUploadPreviewUrl);

// 6. Activity Feed
router.get('/activity', adminController.getActivityFeed);

// 7. Analytics Data
router.get('/analytics', adminController.getAnalytics);

module.exports = router;
