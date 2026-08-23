const Result = require('../models/Result');
const Student = require('../models/Student');

// @desc    Add result
// @route   POST /api/results
exports.addResult = async (req, res, next) => {
  try {
    const result = await Result.create({
      ...req.body,
      recordedBy: req.user.id,
    });

    // Update student's CGPA
    const gpa = await Result.calculateGPA(req.body.student);
    await Student.findByIdAndUpdate(req.body.student, { cgpa: gpa });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get student results
// @route   GET /api/results/student/:studentId
exports.getStudentResults = async (req, res, next) => {
  try {
    const results = await Result.find({ student: req.params.studentId })
      .populate('course', 'courseCode courseName credits');

    const gpa = await Result.calculateGPA(req.params.student);

    res.status(200).json({
      success: true,
      data: results,
      cgpa: gpa.toFixed(2),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get course results
// @route   GET /api/results/course/:courseId
exports.getCourseResults = async (req, res, next) => {
  try {
    const results = await Result.find({ course: req.params.courseId })
      .populate('student', 'studentId enrollmentNumber')
      .populate('student user', 'name');

    const average = results.reduce((sum, r) => sum + r.percentage, 0) / results.length;

    res.status(200).json({
      success: true,
      data: results,
      average: average.toFixed(2),
    });
  } catch (err) {
    next(err);
  }
};