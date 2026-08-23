const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentId: {
    type: String,
    required: true,
    unique: true
  },
  enrollmentNumber: {
    type: String,
    required: true,
    unique: true
  },
  department: {
    type: String,
    required: true,
    enum: ['CSE', 'ECE', 'ME', 'CE', 'EE', 'CS', 'IT']
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  batch: {
    type: String,
    required: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  cgpa: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Student', studentSchema);