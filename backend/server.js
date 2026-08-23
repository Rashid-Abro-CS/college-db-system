const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { protect, authorize } = require('./middleware/auth');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// ============ SCHEMAS (Define only once) ============

// User Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Teacher', 'Student'], default: 'Student' }
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model('User', UserSchema);

// Student Schema
const StudentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  studentId: { type: String, unique: true },
  enrollmentNumber: { type: String, unique: true },
  department: String,
  semester: Number,
  batch: String,
  courses: [{ course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }, enrolledDate: Date }],
  cgpa: { type: Number, default: 0 }
});

const Student = mongoose.model('Student', StudentSchema);

// Course Schema
const CourseSchema = new mongoose.Schema({
  courseCode: { type: String, unique: true },
  courseName: String,
  credits: Number,
  department: String,
  semester: Number,
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  enrolledStudents: [{ student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' }, enrollmentDate: Date }]
});

const Course = mongoose.model('Course', CourseSchema);

// Attendance Schema
const AttendanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  date: Date,
  status: { type: String, enum: ['Present', 'Absent', 'Late'] },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const Attendance = mongoose.model('Attendance', AttendanceSchema);

// Result Schema
const ResultSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  examType: { type: String, enum: ['Midterm', 'Final', 'Quiz', 'Assignment'] },
  marksObtained: Number,
  totalMarks: Number,
  percentage: Number,
  grade: String,
  examDate: Date
});

const Result = mongoose.model('Result', ResultSchema);

// ============ AUTH ROUTES ============

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    const user = await User.create({ name, email, password, role: role || 'Student' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user._id, name, email, role: user.role } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all users (Admin only)
app.get('/api/users', protect, authorize('Admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ STUDENT ROUTES ============

// Get all students (Admin, Teacher)
app.get('/api/students', protect, authorize('Admin', 'Teacher'), async (req, res) => {
  try {
    const students = await Student.find().populate('user', 'name email');
    res.json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get my student profile (Student only)
app.get('/api/students/me', protect, authorize('Student'), async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id }).populate('user', 'name email');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create student (Admin only)
app.post('/api/students', protect, authorize('Admin'), async (req, res) => {
  try {
    const { name, email, password, studentId, enrollmentNumber, department, semester, batch } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    
    const user = await User.create({ name, email, password: password || 'Student@123', role: 'Student' });
    const student = await Student.create({ user: user._id, studentId, enrollmentNumber, department, semester, batch });
    
    res.status(201).json({ success: true, data: student, message: 'Student created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete student (Admin only)
app.delete('/api/students/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    await User.findByIdAndDelete(student.user);
    await student.deleteOne();
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ COURSE ROUTES ============

// Get all courses (Role based)
app.get('/api/courses', protect, async (req, res) => {
  try {
    let courses;
    if (req.user.role === 'Student') {
      const student = await Student.findOne({ user: req.user._id });
      const enrolledIds = student?.courses?.map(c => c.course) || [];
      courses = await Course.find({ _id: { $in: enrolledIds } });
    } else {
      courses = await Course.find();
    }
    res.json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create course (Admin only)
app.post('/api/courses', protect, authorize('Admin'), async (req, res) => {
  try {
    const { courseCode, courseName, credits, department, semester } = req.body;
    const course = await Course.create({ courseCode, courseName, credits, department, semester });
    res.status(201).json({ success: true, data: course, message: 'Course created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete course (Admin only)
app.delete('/api/courses/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ ATTENDANCE ROUTES ============

// Mark attendance (Admin, Teacher)
app.post('/api/attendance', protect, authorize('Admin', 'Teacher'), async (req, res) => {
  try {
    const { studentId, courseId, status, date } = req.body;
    const attendance = await Attendance.create({
      student: studentId,
      course: courseId,
      date: new Date(date),
      status,
      markedBy: req.user._id
    });
    res.json({ success: true, data: attendance, message: 'Attendance marked successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ RESULT ROUTES ============

// Add result (Admin, Teacher)
app.post('/api/results', protect, authorize('Admin', 'Teacher'), async (req, res) => {
  try {
    const { student, course, examType, marksObtained, totalMarks, examDate } = req.body;
    const percentage = (marksObtained / totalMarks) * 100;
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 60) grade = 'C';
    else if (percentage >= 50) grade = 'D';
    
    const result = await Result.create({
      student, course, examType, marksObtained, totalMarks,
      percentage, grade, examDate: new Date(examDate)
    });
    res.json({ success: true, data: result, message: 'Result added successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});