const { Provider, Notification } = require("../models");
const {sendEmailNotification} = require("../utils/emailService");

const checkLicenseExpiry = async () => {
  try {
    const today = new Date().toISOString().split("T")[0];

    // Fetch all providers
    const providers = await Provider.findAll();

    // Filter providers with expired licenses
    const expiredProviders = providers.filter(provider => {
      const expiryDate = provider.licenseExpiryDate.toISOString().split("T")[0];
      return expiryDate < today;
    });

    if (expiredProviders.length === 0) {
      return { message: "No providers with expired licenses found." };
    }

    // Prepare bulk notifications
    const notifications = expiredProviders.map(provider => ({
      provider_id: provider.id,
      type: "license_expiry",
      message: `Your medical license (License No: ${provider.licenseNumber}) expired on ${provider.licenseExpiryDate.toISOString().split("T")[0]}. Please renew it immediately.`,
    }));

    // Bulk insert notifications
    await Notification.bulkCreate(notifications);

    // Prepare email sending tasks
    const emailPromises = expiredProviders.map(provider => {
      const formattedDate = provider.licenseExpiryDate.toISOString().split("T")[0];
      const emailSubject = "Urgent: Your Medical License Has Expired";
      const emailBody = `Hello Dr. ${provider.name},\n\nOur records indicate that your medical license (License No: ${provider.licenseNumber}) expired on ${formattedDate}.\n\nPlease renew your license immediately to continue providing medical services.\n\nBest regards,\nHealthcare Team`;

      return sendEmailNotification(provider.email, emailSubject, emailBody);
    });

    // Execute all emails in parallel
    await Promise.all(emailPromises);

    return {
      message: "License expiry check completed.",
      expired_providers: expiredProviders.map(provider => ({
        provider_id: provider.id,
        provider_name: provider.name,
        email: provider.email,
        license_expiry_date: provider.licenseExpiryDate.toISOString().split("T")[0],
      })),
    };
  } catch (error) {
    console.error("Error checking license expiry:", error);
    throw new Error("Internal Server Error");
  }
};

module.exports = { checkLicenseExpiry };
