const express = require('express');
const { 
  getDashboardAnalytics, 
  getTopStudents,
  getPerformanceTrends,
  getAttendanceAnalytics,
  getDepartmentStats,
  getTeacherPerformance,
  exportAnalyticsReport
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.get('/dashboard', protect, authorize('Admin'), getDashboardAnalytics);
router.get('/top-students', protect, authorize('Admin'), getTopStudents);
router.get('/performance-trends', protect, authorize('Admin'), getPerformanceTrends);
router.get('/attendance', protect, authorize('Admin'), getAttendanceAnalytics);
router.get('/department-stats', protect, authorize('Admin'), getDepartmentStats);
router.get('/teacher-performance', protect, authorize('Admin'), getTeacherPerformance);
router.get('/export', protect, authorize('Admin'), exportAnalyticsReport);

module.exports = router;s