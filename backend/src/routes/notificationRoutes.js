const express = require("express");
const router = express.Router();
const Notification = require("../models/notification");
const Provider = require("../models/provider");
const { sendEmailNotification } = require('../utils/emailService');

// Get all notifications
router.get("/", async (req, res) => {
  try {
    const notifications = await Notification.findAll({ order: [["createdAt", "DESC"]] });
    res.json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get a single notification by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByPk(id);

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ notification });
  } catch (error) {
    console.error("Error fetching notification by ID:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete a notification
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Notification.destroy({ where: { id } });

    if (!deleted) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Mark a notification as read
router.put("/:id/mark-as-read", async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByPk(id);

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    notification.status = "read";
    await notification.save();

    res.json({ message: "Notification marked as read", notification });
  } catch (error) {
    console.error("Error updating notification status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Send system downtime notification to all providers
router.post("/system-downtime", async (req, res) => {
    try {
      const { message } = req.body;
  
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }
  
      // Fetch all providers
      const providers = await Provider.findAll();
  
      if (!providers.length) {
        return res.status(404).json({ error: "No providers found" });
      }
  
      // Create notifications and send emails
      const notifications = [];
      for (const provider of providers) {
        const notification = await Notification.create({
          provider_id: provider.id,
          type: "system",
          message: `System Downtime Alert: ${message})`,
        });
  
        notifications.push(notification);
  
        // Send email to provider
        await sendEmailNotification(
          provider.email,
          `System Downtime Alert`,
          `Dear ${provider.name},\n\n${message}\n\nBest regards,\nSupport Team`
        );
      }
  
      res.status(200).json({
        message: "System downtime notifications sent successfully to all providers",
        notifications,
      });
    } catch (error) {
      console.error("Error sending system downtime notification:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  

module.exports = router;
