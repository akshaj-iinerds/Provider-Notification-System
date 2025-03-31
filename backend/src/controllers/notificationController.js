const notificationService = require("../services/notificationService");
const logger = require("../utils/logger");

// ✅ Send Failure Notification
exports.failureNotification = async (req, res) => {
    try {
        const { message } = req.body;
        const result = await notificationService.sendFailureNotification(message);
        res.status(201).json(result);
    } catch (error) {
        logger.error(`Sending failure notification failed: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

// ✅ Get All Notifications
exports.getAllNotifications = async (req, res) => {
    try {
        const notifications = await notificationService.getAllNotifications();
        res.json(notifications);
    } catch (error) {
        logger.error(`Fetching notifications failed: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

// ✅ Get Notification By ID
exports.getNotificationById = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await notificationService.getNotificationById(id);
        res.json(notification);
    } catch (error) {
        logger.error(`Fetching notification ID ${req.params.id} failed: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

// ✅ Mark Notification as Read
exports.markNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await notificationService.markNotificationAsRead(id);
        res.json(result);
    } catch (error) {
        logger.error(`Marking notification ID ${req.params.id} as read failed: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

// ✅ Delete Notification
exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await notificationService.deleteNotification(id);
        res.json(result);
    } catch (error) {
        logger.error(`Deleting notification ID ${req.params.id} failed: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};
