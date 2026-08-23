const express = require('express');
const { 
  addResult, 
  getStudentResults, 
  getCourseResults,
  updateResult,
  deleteResult,
  getTranscript,
  getClassRankings
} = require('../controllers/resultController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.route('/')
  .post(protect, authorize('Admin', 'Teacher'), addResult);

router.get('/student/:studentId', protect, getStudentResults);
router.get('/course/:courseId', protect, authorize('Admin', 'Teacher'), getCourseResults);
router.get('/transcript/:studentId', protect, getTranscript);
router.get('/rankings/:courseId', protect, authorize('Admin', 'Teacher'), getClassRankings);

router.route('/:id')
  .put(protect, authorize('Admin', 'Teacher'), updateResult)
  .delete(protect, authorize('Admin'), deleteResult);

module.exports = router;