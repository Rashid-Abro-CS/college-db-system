const mongoose = require('mongoose');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const Result = require('../models/Result');

// @desc    Get dashboard analytics
// @route   GET /api/analytics/dashboard
exports.getDashboardAnalytics = async (req, res, next) => {
  try {
    // Aggregation pipeline for various metrics
    const [
      studentStats,
      courseStats,
      attendanceStats,
      performanceStats,
      departmentDistribution,
    ] = await Promise.all([
      // Student statistics
      Student.aggregate([
        {
          $group: {
            _id: '$department',
            count: { $sum: 1 },
            avgSemester: { $avg: '$semester' },
          },
        },
      ]),
      
      // Course statistics
      Course.aggregate([
        {
          $group: {
            _id: '$department',
            totalCourses: { $sum: 1 },
            avgCredits: { $avg: '$credits' },
          },
        },
      ]),
      
      // Attendance overview
      Attendance.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      
      // Performance metrics
      Result.aggregate([
        {
          $group: {
            _id: '$grade',
            count: { $sum: 1 },
            avgMarks: { $avg: '$marksObtained' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      
      // Department wise student distribution
      Student.aggregate([
        {
          $group: {
            _id: { department: '$department', semester: '$semester' },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: '$_id.department',
            semesters: {
              $push: {
                semester: '$_id.semester',
                count: '$count',
              },
            },
            total: { $sum: '$count' },
          },
        },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        studentStats,
        courseStats,
        attendanceStats,
        performanceStats,
        departmentDistribution,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get student performance trends
// @route   GET /api/analytics/performance-trends
exports.getPerformanceTrends = async (req, res, next) => {
  try {
    const trends = await Result.aggregate([
      {
        $group: {
          _id: {
            student: '$student',
            semester: { $floor: { $divide: [{ $month: '$examDate' }, 6] } },
          },
          avgPercentage: { $avg: '$percentage' },
          totalCourses: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.semester',
          students: {
            $push: {
              studentId: '$_id.student',
              avgPercentage: '$avgPercentage',
            },
          },
          overallAvg: { $avg: '$avgPercentage' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: trends,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get top performing students
// @route   GET /api/analytics/top-students
exports.getTopStudents = async (req, res, next) => {
  try {
    const topStudents = await Student.aggregate([
      {
        $lookup: {
          from: 'results',
          localField: '_id',
          foreignField: 'student',
          as: 'results',
        },
      },
      {
        $addFields: {
          averageMarks: { $avg: '$results.percentage' },
          totalCreditsEarned: {
            $sum: {
              $map: {
                input: '$results',
                as: 'result',
                in: {
                  $cond: [
                    { $eq: ['$$result.grade', 'F'] },
                    0,
                    '$$result.course.credits',
                  ],
                },
              },
            },
          },
        },
      },
      {
        $match: {
          averageMarks: { $exists: true, $ne: null },
        },
      },
      {
        $sort: { averageMarks: -1 },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      {
        $project: {
          studentId: 1,
          enrollmentNumber: 1,
          department: 1,
          semester: 1,
          averageMarks: 1,
          cgpa: 1,
          'userDetails.name': 1,
          'userDetails.email': 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: topStudents,
    });
  } catch (err) {
    next(err);
  }
};