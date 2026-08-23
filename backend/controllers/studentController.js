const User = require('../models/User');
const Student = require('../models/Student');

// @desc    Get all students
exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find().populate('user', 'name email');
    res.json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single student
exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('user', 'name email');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create student
exports.createStudent = async (req, res) => {
  try {
    const { name, email, password, studentId, enrollmentNumber, department, semester, batch, phone, address } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    
    // Check if student ID already exists
    const existingStudent = await Student.findOne({ studentId });
    if (existingStudent) {
      return res.status(400).json({ success: false, message: 'Student ID already exists' });
    }
    
    // Create user
    const user = await User.create({
      name,
      email,
      password: password || 'Student@123',
      role: 'Student',
      phone,
      address
    });
    
    // Create student profile
    const student = await Student.create({
      user: user._id,
      studentId,
      enrollmentNumber,
      department,
      semester: parseInt(semester),
      batch: batch || new Date().getFullYear().toString(),
      enrollmentDate: new Date()
    });
    
    res.status(201).json({ 
      success: true, 
      data: student,
      message: 'Student created successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update student
exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    const { name, email, department, semester, phone, address } = req.body;
    
    // Update user info
    await User.findByIdAndUpdate(student.user, { name, email, phone, address });
    
    // Update student info
    student.department = department || student.department;
    student.semester = semester || student.semester;
    await student.save();
    
    res.json({ success: true, data: student, message: 'Student updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete student
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    // Delete user
    await User.findByIdAndDelete(student.user);
    
    // Delete student
    await student.deleteOne();
    
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};