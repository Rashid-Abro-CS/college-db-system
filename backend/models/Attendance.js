const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'Excused'],
    required: true,
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  remarks: String,
}, {
  timestamps: true,
});

// Compound index to ensure unique attendance per student per course per day
attendanceSchema.index({ student: 1, course: 1, date: 1 }, { unique: true });

// Method to calculate attendance percentage
attendanceSchema.statics.getAttendancePercentage = async function(studentId, courseId) {
  const totalClasses = await this.countDocuments({ student: studentId, course: courseId });
  const presentClasses = await this.countDocuments({ 
    student: studentId, 
    course: courseId,
    status: { $in: ['Present', 'Late'] }
  });
  
  return totalClasses === 0 ? 0 : (presentClasses / totalClasses) * 100;
};

module.exports = mongoose.model('Attendance', attendanceSchema);