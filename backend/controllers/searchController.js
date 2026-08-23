const Student = require('../models/Student');
const Course = require('../models/Course');
const User = require('../models/User');

// @desc    Global search across collections
// @route   GET /api/search?q=query&type=students|courses|all
exports.globalSearch = async (req, res, next) => {
  try {
    const { q, type = 'all' } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a search query',
      });
    }

    const results = {};

    // Search students using regex
    if (type === 'all