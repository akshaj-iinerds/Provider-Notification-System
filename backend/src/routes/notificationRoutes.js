const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// ✅ Send a notification
router.post('/failure-notification', notificationController.failureNotification);

// ✅ Get all notifications
router.get('/', notificationController.getAllNotifications);

// ✅ Get a specific notification by ID
router.get('/:id', notificationController.getNotificationById);

// ✅ Mark a notification as read
router.put('/:id/mark-read', notificationController.markNotificationAsRead);

// ✅ Delete a notification
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;