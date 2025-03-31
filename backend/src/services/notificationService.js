const { Notification, Provider } = require("../models");
const { sendEmailNotification } = require("./emailService");
const logger = require("../utils/logger");

// ✅ Send Failure Notification to Verified Providers
exports.failureNotification = async (message) => {
    try {
        const providers = await Provider.findAll({ where: { verified: true } });

        if (!providers.length) throw new Error("No verified providers found");

        const notifications = await Promise.all(
            providers.map(provider =>
                Notification.create({
                    provider_id: provider.id,
                    type: "system",
                    message,
                    status: "unread",
                })
            )
        );

        for (const provider of providers) {
            const subject = "System Downtime Notification";
            const emailMessage = `Hello ${provider.firstName} ${provider.lastName},\n\n${message}\n\nThank you.`;
            await sendEmailNotification(provider.email, subject, emailMessage);
        }

        logger.info(`System downtime notification sent to ${providers.length} verified providers.`);
        return { message: "System downtime notification sent successfully", notifications };
    } catch (error) {
        logger.error(`Error sending system notification: ${error.message}`);
        throw error;
    }
};

// ✅ Get All Notifications
exports.getAllNotifications = async () => {
    try {
        const notifications = await Notification.findAll();
        logger.info(`Fetched ${notifications.length} notifications.`);
        return notifications;
    } catch (error) {
        logger.error(`Error fetching notifications: ${error.message}`);
        throw error;
    }
};

// ✅ Get Notification By ID
exports.getNotificationById = async (id) => {
    try {
        const notification = await Notification.findByPk(id);
        if (!notification) throw new Error("Notification not found");

        logger.info(`Fetched notification ID: ${id}`);
        return notification;
    } catch (error) {
        logger.error(`Error fetching notification ID ${id}: ${error.message}`);
        throw error;
    }
};

// ✅ Mark Notification as Read
exports.markNotificationAsRead = async (id) => {
    try {
        const notification = await Notification.findByPk(id);
        if (!notification) throw new Error("Notification not found");

        await notification.update({ status: "read" });
        logger.info(`Notification ID ${id} marked as read.`);
        return { message: "Notification marked as read" };
    } catch (error) {
        logger.error(`Error marking notification ID ${id} as read: ${error.message}`);
        throw error;
    }
};

// ✅ Delete Notification
exports.deleteNotification = async (id) => {
    try {
        const notification = await Notification.findByPk(id);
        if (!notification) throw new Error("Notification not found");

        const provider = await Provider.findByPk(notification.provider_id);
        if (!provider) throw new Error("Provider not found");

        const subject = `Notification Removed: ${notification.type}`;
        const message = `Hello ${provider.firstName} ${provider.lastName},\n\nYour notification regarding "${notification.message}" has been removed from the system.`;

        await notification.destroy();
        await sendEmailNotification(provider.email, subject, message);

        logger.info(`Notification ID ${id} deleted and provider notified.`);
        return { message: "Notification deleted successfully" };
    } catch (error) {
        logger.error(`Error deleting notification ID ${id}: ${error.message}`);
        throw error;
    }
};
