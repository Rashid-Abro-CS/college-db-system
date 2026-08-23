const express = require('express');
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  assignTeacher,
  enrollStudent,
  removeStudent,
  uploadMaterial,
  deleteMaterial,
  getCourseStudents,
  getAvailableCourses,
  getTeacherSchedule,
  bulkEnrollStudents,
  getCourseStats
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const router = express.Router();

// Public routes (with authentication)
router.route('/')
  .get(protect, getCourses)
  .post(protect, authorize('Admin'), createCourse);

router.get('/available', protect, authorize('Student'), getAvailableCourses);
router.get('/teacher/schedule', protect, authorize('Teacher'), getTeacherSchedule);

router.route('/:id')
  .get(protect, getCourse)
  .put(protect, authorize('Admin'), updateCourse)
  .delete(protect, authorize('Admin'), deleteCourse);

// Teacher assignment
router.put('/:id/assign-teacher', protect, authorize('Admin'), assignTeacher);

// Student enrollment
router.post('/:id/enroll', protect, authorize('Admin', 'Teacher'), enrollStudent);
router.delete('/:id/remove-student/:studentId', protect, authorize('Admin', 'Teacher'), removeStudent);
router.post('/:id/bulk-enroll', protect, authorize('Admin', 'Teacher'), bulkEnrollStudents);

// Course materials
router.post('/:id/materials', protect, authorize('Admin', 'Teacher'), upload.single('file'), uploadMaterial);
router.delete('/:id/materials/:materialId', protect, authorize('Admin', 'Teacher'), deleteMaterial);

// Course students and statistics
router.get('/:id/students', protect, authorize('Admin', 'Teacher'), getCourseStudents);
router.get('/:id/stats', protect, authorize('Admin', 'Teacher'), getCourseStats);

module.exports = router;