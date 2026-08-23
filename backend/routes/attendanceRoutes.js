const express = require('express');
const { 
  markAttendance, 
  getStudentAttendance, 
  getCourseAttendance,
  getAttendanceByDate,
  updateAttendance,
  deleteAttendance,
  getAttendanceSummary
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.route('/')
  .post(protect, authorize('Admin', 'Teacher'), markAttendance)
  .get(protect, getAttendanceSummary);

router.get('/student/:studentId', protect, getStudentAttendance);
router.get('/course/:courseId', protect, authorize('Admin', 'Teacher'), getCourseAttendance);
router.get('/date/:date', protect, authorize('Admin', 'Teacher'), getAttendanceByDate);

router.route('/:id')
  .put(protect, authorize('Admin', 'Teacher'), updateAttendance)
  .delete(protect, authorize('Admin'), deleteAttendance);

module.exports = router;