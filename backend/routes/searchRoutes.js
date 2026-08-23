const express = require('express');
const { 
  globalSearch, 
  searchStudents, 
  searchCourses,
  advancedSearch
} = require('../controllers/searchController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/', protect, globalSearch);
router.get('/students', protect, searchStudents);
router.get('/courses', protect, searchCourses);
router.post('/advanced', protect, advancedSearch);

module.exports = router;