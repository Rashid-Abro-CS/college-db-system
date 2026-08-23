const User = require('../models/User');
const Student = require('../models/Student');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, studentId, enrollmentNumber, department, semester } = req.body;

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    // If role is student, create student profile
    if (role === 'Student') {
      await Student.create({
        user: user._id,
        studentId,
        enrollmentNumber,
        department,
        semester,
        batch: new Date().getFullYear().toString(),
      });
    }

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password',
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    let studentProfile = null;
    if (user.role === 'Student') {
      studentProfile = await Student.findOne({ user: user._id });
    }

    res.status(200).json({
      success: true,
      data: { user, studentProfile },
    });
  } catch (err) {
    next(err);
  }
};