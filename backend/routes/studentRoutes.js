const express = require('express');
const { 
  getStudents, 
  getStudent, 
  createStudent, 
  updateStudent, 
  deleteStudent, 
  enrollCourse 
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.route('/')
  .get(protect, getStudents)
  .post(protect, authorize('Admin'), createStudent);

router.route('/:id')
  .get(protect, getStudent)
  .put(protect, authorize('Admin'), updateStudent)
  .delete(protect, authorize('Admin'), deleteStudent);

router.post('/:id/enroll', protect, authorize('Admin', 'Teacher'), enrollCourse);

module.exports = router;