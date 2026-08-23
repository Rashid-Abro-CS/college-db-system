const Course = require('../models/Course');
const User = require('../models/User');
const Student = require('../models/Student');
const Notification = require('../models/Notification');

// @desc    Get all courses
// @route   GET /api/courses
exports.getCourses = async (req, res, next) => {
  try {
    let query = {};
    
    // If user is teacher, show only their courses
    if (req.user.role === 'Teacher') {
      query.teacher = req.user.id;
    }
    
    // If user is student, show enrolled courses
    if (req.user.role === 'Student') {
      const student = await Student.findOne({ user: req.user.id });
      if (student) {
        const enrolledCourseIds = student.courses.map(c => c.course);
        query._id = { $in: enrolledCourseIds };
      }
    }
    
    const courses = await Course.find(query)
      .populate('teacher', 'name email')
      .populate('enrolledStudents.student', 'studentId enrollmentNumber')
      .populate('enrolledStudents.student user', 'name');
    
    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
exports.getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacher', 'name email phone')
      .populate('enrolledStudents.student', 'studentId enrollmentNumber semester')
      .populate('enrolledStudents.student user', 'name email')
      .populate('materials.uploadedBy', 'name');
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: course
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new course
// @route   POST /api/courses
exports.createCourse = async (req, res, next) => {
  try {
    // Check if course code already exists
    const existingCourse = await Course.findOne({ courseCode: req.body.courseCode });
    if (existingCourse) {
      return res.status(400).json({
        success: false,
        message: 'Course code already exists'
      });
    }
    
    const course = await Course.create(req.body);
    
    // Create notification for teachers
    if (course.teacher) {
      const teacher = await User.findById(course.teacher);
      if (teacher) {
        await Notification.create({
          title: 'New Course Assigned',
          message: `You have been assigned as teacher for ${course.courseName} (${course.courseCode})`,
          type: 'Update',
          targetUsers: [teacher._id],
          createdBy: req.user.id
        });
      }
    }
    
    res.status(201).json({
      success: true,
      data: course
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
exports.updateCourse = async (req, res, next) => {
  try {
    let course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: course
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Notify enrolled students about course deletion
    for (const enrollment of course.enrolledStudents) {
      await Notification.create({
        title: 'Course Cancelled',
        message: `The course ${course.courseName} (${course.courseCode}) has been cancelled. Please contact academic advisor.`,
        type: 'Alert',
        targetUsers: [enrollment.student],
        createdBy: req.user.id
      });
    }
    
    await course.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Assign teacher to course
// @route   PUT /api/courses/:id/assign-teacher
exports.assignTeacher = async (req, res, next) => {
  try {
    const { teacherId } = req.body;
    
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'Teacher') {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }
    
    course.teacher = teacherId;
    await course.save();
    
    // Notify teacher
    await Notification.create({
      title: 'Course Assignment',
      message: `You have been assigned as teacher for ${course.courseName} (${course.courseCode})`,
      type: 'Update',
      targetUsers: [teacherId],
      createdBy: req.user.id
    });
    
    res.status(200).json({
      success: true,
      data: course
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Enroll student in course
// @route   POST /api/courses/:id/enroll
exports.enrollStudent = async (req, res, next) => {
  try {
    const { studentId } = req.body;
    
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Check if already enrolled
    const alreadyEnrolled = course.enrolledStudents.some(
      e => e.student.toString() === studentId
    );
    
    if (alreadyEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'Student already enrolled in this course'
      });
    }
    
    course.enrolledStudents.push({ student: studentId });
    await course.save();
    
    // Also add to student's course list
    student.courses.push({ course: course._id });
    await student.save();
    
    // Notify student
    await Notification.create({
      title: 'Course Enrollment',
      message: `You have been enrolled in ${course.courseName} (${course.courseCode})`,
      type: 'Update',
      targetUsers: [student.user],
      createdBy: req.user.id
    });
    
    res.status(200).json({
      success: true,
      data: course
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Remove student from course
// @route   DELETE /api/courses/:id/remove-student/:studentId
exports.removeStudent = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    const student = await Student.findById(req.params.studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Remove from course
    course.enrolledStudents = course.enrolledStudents.filter(
      e => e.student.toString() !== req.params.studentId
    );
    await course.save();
    
    // Remove from student's course list
    student.courses = student.courses.filter(
      c => c.course.toString() !== req.params.id
    );
    await student.save();
    
    // Notify student
    await Notification.create({
      title: 'Course Withdrawal',
      message: `You have been withdrawn from ${course.courseName} (${course.courseCode})`,
      type: 'Alert',
      targetUsers: [student.user],
      createdBy: req.user.id
    });
    
    res.status(200).json({
      success: true,
      data: course
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Upload course material
// @route   POST /api/courses/:id/materials
exports.uploadMaterial = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    const material = {
      title,
      description,
      fileUrl: req.file ? `/uploads/${req.file.filename}` : null,
      uploadedBy: req.user.id,
      uploadedAt: new Date()
    };
    
    course.materials.push(material);
    await course.save();
    
    // Notify all enrolled students about new material
    for (const enrollment of course.enrolledStudents) {
      await Notification.create({
        title: 'New Course Material',
        message: `New material "${title}" has been uploaded for ${course.courseName}`,
        type: 'Announcement',
        targetUsers: [enrollment.student],
        createdBy: req.user.id
      });
    }
    
    res.status(201).json({
      success: true,
      data: material
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete course material
// @route   DELETE /api/courses/:id/materials/:materialId
exports.deleteMaterial = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    course.materials = course.materials.filter(
      m => m._id.toString() !== req.params.materialId
    );
    await course.save();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get course enrolled students with attendance
// @route   GET /api/courses/:id/students
exports.getCourseStudents = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('enrolledStudents.student', 'studentId enrollmentNumber semester')
      .populate('enrolledStudents.student user', 'name email');
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Get attendance for each student
    const Attendance = require('../models/Attendance');
    const studentsWithAttendance = await Promise.all(
      course.enrolledStudents.map(async (enrollment) => {
        const attendancePercentage = await Attendance.getAttendancePercentage(
          enrollment.student._id,
          course._id
        );
        
        return {
          student: enrollment.student,
          enrollmentDate: enrollment.enrollmentDate,
          attendancePercentage: attendancePercentage.toFixed(2)
        };
      })
    );
    
    res.status(200).json({
      success: true,
      data: studentsWithAttendance
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get available courses for enrollment
// @route   GET /api/courses/available
exports.getAvailableCourses = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }
    
    // Get already enrolled course IDs
    const enrolledCourseIds = student.courses.map(c => c.course);
    
    // Get courses not yet enrolled, matching student's department and semester
    const availableCourses = await Course.find({
      _id: { $nin: enrolledCourseIds },
      department: student.department,
      semester: student.semester,
      isActive: true
    }).populate('teacher', 'name email');
    
    res.status(200).json({
      success: true,
      count: availableCourses.length,
      data: availableCourses
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get course schedule for teacher
// @route   GET /api/courses/teacher/schedule
exports.getTeacherSchedule = async (req, res, next) => {
  try {
    const courses = await Course.find({ 
      teacher: req.user.id,
      isActive: true 
    }).select('courseCode courseName schedule');
    
    const schedule = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: []
    };
    
    courses.forEach(course => {
      if (course.schedule && course.schedule.day) {
        schedule[course.schedule.day].push({
          courseCode: course.courseCode,
          courseName: course.courseName,
          startTime: course.schedule.startTime,
          endTime: course.schedule.endTime,
          room: course.schedule.room
        });
      }
    });
    
    res.status(200).json({
      success: true,
      data: schedule
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Bulk enroll students
// @route   POST /api/courses/:id/bulk-enroll
exports.bulkEnrollStudents = async (req, res, next) => {
  try {
    const { studentIds } = req.body;
    
    if (!studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of student IDs'
      });
    }
    
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    const results = {
      successful: [],
      failed: []
    };
    
    for (const studentId of studentIds) {
      try {
        const student = await Student.findById(studentId);
        if (!student) {
          results.failed.push({ studentId, reason: 'Student not found' });
          continue;
        }
        
        // Check if already enrolled
        const alreadyEnrolled = course.enrolledStudents.some(
          e => e.student.toString() === studentId
        );
        
        if (alreadyEnrolled) {
          results.failed.push({ studentId, reason: 'Already enrolled' });
          continue;
        }
        
        course.enrolledStudents.push({ student: studentId });
        student.courses.push({ course: course._id });
        await student.save();
        
        results.successful.push({ studentId, name: student.user?.name });
        
        // Notify student
        await Notification.create({
          title: 'Course Enrollment',
          message: `You have been enrolled in ${course.courseName} (${course.courseCode})`,
          type: 'Update',
          targetUsers: [student.user],
          createdBy: req.user.id
        });
      } catch (err) {
        results.failed.push({ studentId, reason: err.message });
      }
    }
    
    await course.save();
    
    res.status(200).json({
      success: true,
      data: results
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get course statistics
// @route   GET /api/courses/:id/stats
exports.getCourseStats = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    const Attendance = require('../models/Attendance');
    const Result = require('../models/Result');
    
    // Get attendance statistics
    let totalPresent = 0;
    let totalClasses = 0;
    
    for (const enrollment of course.enrolledStudents) {
      const attendanceCount = await Attendance.countDocuments({ 
        course: course._id,
        student: enrollment.student
      });
      const presentCount = await Attendance.countDocuments({ 
        course: course._id,
        student: enrollment.student,
        status: { $in: ['Present', 'Late'] }
      });
      totalClasses += attendanceCount;
      totalPresent += presentCount;
    }
    
    // Get result statistics
    const results = await Result.find({ course: course._id });
    const avgMarks = results.reduce((sum, r) => sum + r.percentage, 0) / (results.length || 1);
    
    const gradeDistribution = {
      'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'D': 0, 'F': 0
    };
    
    results.forEach(result => {
      if (gradeDistribution[result.grade] !== undefined) {
        gradeDistribution[result.grade]++;
      }
    });
    
    res.status(200).json({
      success: true,
      data: {
        totalEnrolled: course.enrolledStudents.length,
        totalMaterials: course.materials.length,
        averageAttendance: totalClasses === 0 ? 0 : ((totalPresent / totalClasses) * 100).toFixed(2),
        averageMarks: avgMarks.toFixed(2),
        gradeDistribution,
        passRate: ((results.filter(r => r.grade !== 'F').length / (results.length || 1)) * 100).toFixed(2)
      }
    });
  } catch (err) {
    next(err);
  }
};