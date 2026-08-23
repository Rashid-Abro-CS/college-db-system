const express = require('express');
const { 
  createNotification, 
  getNotifications, 
  getNotification,
  markAsRead,
  markMultipleAsRead,
  markAllAsRead,
  deleteNotification,
  sendToUsers,
  sendToAllStudents,
  sendToAllTeachers,
  getNotificationStats,
  getUnreadCount,
  updateNotification,
  deleteOldNotifications
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

// Statistics and counts
router.get('/stats', protect, authorize('Admin'), getNotificationStats);
router.get('/unread/count', protect, getUnreadCount);

// Bulk operations
router.put('/mark-multiple-read', protect, markMultipleAsRead);
router.put('/mark-all-read', protect, markAllAsRead);
router.delete('/delete-old', protect, authorize('Admin'), deleteOldNotifications);

// Send notifications
router.post('/send-to-users', protect, authorize('Admin', 'Teacher'), sendToUsers);
router.post('/send-to-students', protect, authorize('Admin', 'Teacher'), sendToAllStudents);
router.post('/send-to-teachers', protect, authorize('Admin'), sendToAllTeachers);

// Main CRUD routes
router.route('/')
  .get(protect, getNotifications)
  .post(protect, authorize('Admin', 'Teacher'), createNotification);

router.route('/:id')
  .get(protect, getNotification)
  .put(protect, authorize('Admin'), updateNotification)
  .delete(protect, deleteNotification);

// Mark as read
router.put('/:id/read', protect, markAsRead);

module.exports = router;