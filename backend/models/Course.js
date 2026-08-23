const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    required: [true, 'Please add course code'],
    unique: true,
  },
  courseName: {
    type: String,
    required: [true, 'Please add course name'],
  },
  credits: {
    type: Number,
    required: true,
    min: 1,
    max: 4,
  },
  department: {
    type: String,
    required: true,
  },
  semester: {
    type: Number,
    required: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  enrolledStudents: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
  }],
  schedule: {
    day: String,
    startTime: String,
    endTime: String,
    room: String,
  },
  materials: [{
    title: String,
    description: String,
    fileUrl: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
});

// Create text index for search
courseSchema.index({ courseCode: 'text', courseName: 'text' });

module.exports = mongoose.model('Course', courseSchema);