const Notification = require('../models/notification'); // Adjust path if needed

/**
 * Creates a new notification.
 * @param {string} providerId - ID of the assigned provider.
 * @param {string} type - Type of notification (e.g., 'consultation').
 * @param {string} message - Notification message.
 */
const createNotification = async (providerId, type, message) => {
    try {
        await Notification.create({
            provider_id: providerId,
            type,
            message
        });
        console.log(`✅ Notification created for provider ${providerId}`);
    } catch (error) {
        console.error(`❌ Error creating notification: ${error.message}`);
    }
};

module.exports = { createNotification };
