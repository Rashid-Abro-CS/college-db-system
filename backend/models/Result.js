const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
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
  examType: {
    type: String,
    enum: ['Midterm', 'Final', 'Quiz', 'Assignment', 'Practical'],
    required: true,
  },
  marksObtained: {
    type: Number,
    required: true,
    min: 0,
  },
  totalMarks: {
    type: Number,
    required: true,
  },
  percentage: {
    type: Number,
    default: 0,
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'],
  },
  gradePoints: {
    type: Number,
    min: 0,
    max: 4,
  },
  examDate: {
    type: Date,
    required: true,
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  remarks: String,
}, {
  timestamps: true,
});

// Pre-save middleware to calculate percentage, grade, and grade points
resultSchema.pre('save', function(next) {
  this.percentage = (this.marksObtained / this.totalMarks) * 100;
  
  // Calculate grade and grade points
  if (this.percentage >= 90) {
    this.grade = 'A+';
    this.gradePoints = 4.0;
  } else if (this.percentage >= 80) {
    this.grade = 'A';
    this.gradePoints = 3.7;
  } else if (this.percentage >= 75) {
    this.grade = 'B+';
    this.gradePoints = 3.3;
  } else if (this.percentage >= 70) {
    this.grade = 'B';
    this.gradePoints = 3.0;
  } else if (this.percentage >= 65) {
    this.grade = 'C+';
    this.gradePoints = 2.7;
  } else if (this.percentage >= 60) {
    this.grade = 'C';
    this.gradePoints = 2.3;
  } else if (this.percentage >= 50) {
    this.grade = 'D';
    this.gradePoints = 2.0;
  } else {
    this.grade = 'F';
    this.gradePoints = 0;
  }
  
  next();
});

// Static method to calculate GPA for a student
resultSchema.statics.calculateGPA = async function(studentId) {
  const results = await this.find({ student: studentId }).populate('course');
  
  let totalGradePoints = 0;
  let totalCredits = 0;
  
  results.forEach(result => {
    if (result.course && result.course.credits) {
      totalGradePoints += result.gradePoints * result.course.credits;
      totalCredits += result.course.credits;
    }
  });
  
  return totalCredits === 0 ? 0 : (totalGradePoints / totalCredits);
};

module.exports = mongoose.model('Result', resultSchema);