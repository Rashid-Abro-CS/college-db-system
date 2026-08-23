const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  studentId: {
    type: String,
    required: [true, 'Please add student ID'],
    unique: true,
  },
  enrollmentNumber: {
    type: String,
    required: true,
    unique: true,
  },
  department: {
    type: String,
    required: true,
    enum: ['CSE', 'ECE', 'ME', 'CE', 'EE'],
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8,
  },
  batch: {
    type: String,
    required: true,
  },
  fatherName: String,
  motherName: String,
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
  },
  enrollmentDate: {
    type: Date,
    default: Date.now,
  },
  courses: [{
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    enrolledDate: {
      type: Date,
      default: Date.now,
    },
  }],
  cgpa: {
    type: Number,
    default: 0,
  },
  totalCredits: {
    type: Number,
    default: 0,
  },
});

// Create text index for search
studentSchema.index({ studentId: 'text', enrollmentNumber: 'text' });

module.exports = mongoose.model('Student', studentSchema);