const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['Announcement', 'Reminder', 'Alert', 'Update'],
    default: 'Announcement',
  },
  targetRoles: [{
    type: String,
    enum: ['Admin', 'Teacher', 'Student'],
  }],
  targetUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  }],
  expiresAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Index for better query performance
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ targetRoles: 1 });
notificationSchema.index({ 'readBy.user': 1 });

module.exports = mongoose.model('Notification', notificationSchema);