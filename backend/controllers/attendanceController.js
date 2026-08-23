const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Course = require('../models/Course');

// @desc    Mark attendance
// @route   POST /api/attendance
exports.markAttendance = async (req, res, next) => {
  try {
    const { studentId, courseId, date, status, remarks } = req.body;

    const attendance = await Attendance.create({
      student: studentId,
      course: courseId,
      date,
      status,
      remarks,
      markedBy: req.user.id,
    });

    // Create notification for low attendance
    const percentage = await Attendance.getAttendancePercentage(studentId, courseId);
    
    if (percentage < 75) {
      const Notification = require('../models/Notification');
      await Notification.create({
        title: 'Low Attendance Warning',
        message: `Your attendance in course is below 75% (Current: ${percentage.toFixed(2)}%)`,
        type: 'Alert',
        targetUsers: [studentId],
        createdBy: req.user.id,
      });
    }

    res.status(201).json({
      success: true,
      data: attendance,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get attendance for a student
// @route   GET /api/attendance/student/:studentId
exports.getStudentAttendance = async (req, res, next) => {
  try {
    const attendance = await Attendance.find({ student: req.params.studentId })
      .populate('course', 'courseCode courseName');

    // Calculate overall percentage
    const total = attendance.length;
    const present = attendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
    const percentage = total === 0 ? 0 : (present / total) * 100;

    res.status(200).json({
      success: true,
      data: attendance,
      summary: {
        totalClasses: total,
        present: present,
        absent: total - present,
        percentage: percentage.toFixed(2),
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get attendance for a course
// @route   GET /api/attendance/course/:courseId
exports.getCourseAttendance = async (req, res, next) => {
  try {
    const attendance = await Attendance.find({ course: req.params.courseId })
      .populate('student', 'studentId enrollmentNumber')
      .populate('student user', 'name');

    // Aggregate by student
    const studentAttendance = {};
    attendance.forEach(record => {
      const studentId = record.student._id.toString();
      if (!studentAttendance[studentId]) {
        studentAttendance[studentId] = {
          student: record.student,
          total: 0,
          present: 0,
        };
      }
      studentAttendance[studentId].total++;
      if (record.status === 'Present' || record.status === 'Late') {
        studentAttendance[studentId].present++;
      }
    });

    const summary = Object.values(studentAttendance).map(s => ({
      ...s,
      percentage: ((s.present / s.total) * 100).toFixed(2),
    }));

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (err) {
    next(err);
  }
};