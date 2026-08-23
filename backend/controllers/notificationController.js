const Notification = require('../models/Notification');
const User = require('../models/User');
const Student = require('../models/Student');

// @desc    Create a new notification
// @route   POST /api/notifications
exports.createNotification = async (req, res, next) => {
  try {
    const { title, message, type, targetRoles, targetUsers, expiresAt } = req.body;
    
    const notification = await Notification.create({
      title,
      message,
      type: type || 'Announcement',
      targetRoles: targetRoles || [],
      targetUsers: targetUsers || [],
      expiresAt: expiresAt || null,
      createdBy: req.user.id
    });
    
    // Populate createdBy user details
    await notification.populate('createdBy', 'name email');
    
    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all notifications for current user
// @route   GET /api/notifications
exports.getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, isRead } = req.query;
    
    const query = {
      $or: [
        { targetRoles: { $in: [req.user.role] } },
        { targetUsers: req.user.id },
        { targetRoles: { $size: 0 }, targetUsers: { $size: 0 } } // Public notifications
      ]
    };
    
    // Filter by type
    if (type) {
      query.type = type;
    }
    
    // Filter by read status
    if (isRead === 'true') {
      query['readBy.user'] = req.user.id;
    } else if (isRead === 'false') {
      query['readBy.user'] = { $ne: req.user.id };
    }
    
    // Filter out expired notifications
    query.$or.push({
      expiresAt: { $gt: new Date() }
    });
    query.$or.push({
      expiresAt: { $exists: false }
    });
    
    const notifications = await Notification.find(query)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email')
      .populate('readBy.user', 'name');
    
    const total = await Notification.countDocuments(query);
    
    // Mark unread count
    const unreadCount = await Notification.countDocuments({
      $or: [
        { targetRoles: { $in: [req.user.role] } },
        { targetUsers: req.user.id },
        { targetRoles: { $size: 0 }, targetUsers: { $size: 0 } }
      ],
      'readBy.user': { $ne: req.user.id },
      $or: [
        { expiresAt: { $gt: new Date() } },
        { expiresAt: { $exists: false } }
      ]
    });
    
    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single notification
// @route   GET /api/notifications/:id
exports.getNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('readBy.user', 'name email');
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    // Check if user has access to this notification
    const hasAccess = 
      notification.targetRoles.includes(req.user.role) ||
      notification.targetUsers.includes(req.user.id) ||
      (notification.targetRoles.length === 0 && notification.targetUsers.length === 0);
    
    if (!hasAccess && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this notification'
      });
    }
    
    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    // Check if already marked as read
    const alreadyRead = notification.readBy.some(
      r => r.user.toString() === req.user.id
    );
    
    if (!alreadyRead) {
      notification.readBy.push({
        user: req.user.id,
        readAt: new Date()
      });
      await notification.save();
    }
    
    res.status(200).json({
      success: true,
      data: notification,
      message: 'Notification marked as read'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark multiple notifications as read
// @route   PUT /api/notifications/mark-multiple-read
exports.markMultipleAsRead = async (req, res, next) => {
  try {
    const { notificationIds } = req.body;
    
    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of notification IDs'
      });
    }
    
    const notifications = await Notification.find({
      _id: { $in: notificationIds }
    });
    
    let updatedCount = 0;
    
    for (const notification of notifications) {
      const alreadyRead = notification.readBy.some(
        r => r.user.toString() === req.user.id
      );
      
      if (!alreadyRead) {
        notification.readBy.push({
          user: req.user.id,
          readAt: new Date()
        });
        await notification.save();
        updatedCount++;
      }
    }
    
    res.status(200).json({
      success: true,
      message: `${updatedCount} notifications marked as read`,
      updatedCount
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
exports.markAllAsRead = async (req, res, next) => {
  try {
    const query = {
      $or: [
        { targetRoles: { $in: [req.user.role] } },
        { targetUsers: req.user.id },
        { targetRoles: { $size: 0 }, targetUsers: { $size: 0 } }
      ],
      'readBy.user': { $ne: req.user.id }
    };
    
    const notifications = await Notification.find(query);
    
    let updatedCount = 0;
    
    for (const notification of notifications) {
      notification.readBy.push({
        user: req.user.id,
        readAt: new Date()
      });
      await notification.save();
      updatedCount++;
    }
    
    res.status(200).json({
      success: true,
      message: `All ${updatedCount} notifications marked as read`,
      updatedCount
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    // Only admin or the creator can delete
    if (notification.createdBy.toString() !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this notification'
      });
    }
    
    await notification.remove();
    
    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Send notification to specific users
// @route   POST /api/notifications/send-to-users
exports.sendToUsers = async (req, res, next) => {
  try {
    const { title, message, type, userIds, expiresAt } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of user IDs'
      });
    }
    
    const notification = await Notification.create({
      title,
      message,
      type: type || 'Announcement',
      targetUsers: userIds,
      expiresAt: expiresAt || null,
      createdBy: req.user.id
    });
    
    res.status(201).json({
      success: true,
      data: notification,
      message: `Notification sent to ${userIds.length} users`
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Send notification to all students
// @route   POST /api/notifications/send-to-students
exports.sendToAllStudents = async (req, res, next) => {
  try {
    const { title, message, type, department, semester, expiresAt } = req.body;
    
    // Find all students matching criteria
    let query = {};
    if (department) query.department = department;
    if (semester) query.semester = semester;
    
    const students = await Student.find(query).populate('user', '_id');
    const userIds = students.map(s => s.user._id);
    
    if (userIds.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No students found matching the criteria'
      });
    }
    
    const notification = await Notification.create({
      title,
      message,
      type: type || 'Announcement',
      targetUsers: userIds,
      expiresAt: expiresAt || null,
      createdBy: req.user.id
    });
    
    res.status(201).json({
      success: true,
      data: notification,
      message: `Notification sent to ${userIds.length} students`
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Send notification to all teachers
// @route   POST /api/notifications/send-to-teachers
exports.sendToAllTeachers = async (req, res, next) => {
  try {
    const { title, message, type, expiresAt } = req.body;
    
    const teachers = await User.find({ role: 'Teacher' });
    const userIds = teachers.map(t => t._id);
    
    if (userIds.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No teachers found'
      });
    }
    
    const notification = await Notification.create({
      title,
      message,
      type: type || 'Announcement',
      targetUsers: userIds,
      expiresAt: expiresAt || null,
      createdBy: req.user.id
    });
    
    res.status(201).json({
      success: true,
      data: notification,
      message: `Notification sent to ${userIds.length} teachers`
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get notification statistics
// @route   GET /api/notifications/stats
exports.getNotificationStats = async (req, res, next) => {
  try {
    const totalNotifications = await Notification.countDocuments();
    const unreadCount = await Notification.countDocuments({
      'readBy.user': { $ne: req.user.id }
    });
    
    const typeStats = await Notification.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const recentNotifications = await Notification.find()
      .sort('-createdAt')
      .limit(10)
      .populate('createdBy', 'name');
    
    res.status(200).json({
      success: true,
      data: {
        totalNotifications,
        unreadForUser: unreadCount,
        byType: typeStats,
        recent: recentNotifications
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get unread notifications count
// @route   GET /api/notifications/unread/count
exports.getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await Notification.countDocuments({
      $or: [
        { targetRoles: { $in: [req.user.role] } },
        { targetUsers: req.user.id },
        { targetRoles: { $size: 0 }, targetUsers: { $size: 0 } }
      ],
      'readBy.user': { $ne: req.user.id },
      $or: [
        { expiresAt: { $gt: new Date() } },
        { expiresAt: { $exists: false } }
      ]
    });
    
    res.status(200).json({
      success: true,
      unreadCount
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update notification
// @route   PUT /api/notifications/:id
exports.updateNotification = async (req, res, next) => {
  try {
    const { title, message, type, targetRoles, targetUsers, expiresAt } = req.body;
    
    let notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    // Only admin or creator can update
    if (notification.createdBy.toString() !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this notification'
      });
    }
    
    notification = await Notification.findByIdAndUpdate(
      req.params.id,
      {
        title: title || notification.title,
        message: message || notification.message,
        type: type || notification.type,
        targetRoles: targetRoles || notification.targetRoles,
        targetUsers: targetUsers || notification.targetUsers,
        expiresAt: expiresAt !== undefined ? expiresAt : notification.expiresAt
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');
    
    res.status(200).json({
      success: true,
      data: notification,
      message: 'Notification updated successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete old notifications (Admin only)
// @route   DELETE /api/notifications/delete-old
exports.deleteOldNotifications = async (req, res, next) => {
  try {
    const { daysOld = 30 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate },
      expiresAt: { $lt: new Date() }
    });
    
    res.status(200).json({
      success: true,
      message: `${result.deletedCount} old notifications deleted`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    next(err);
  }
};