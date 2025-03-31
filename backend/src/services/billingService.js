const Billing = require("../models/billing");
const Notification = require("../models/notification");
const Provider = require("../models/provider");
const { sendEmailNotification } = require("./emailService");
const logger = require("../utils/logger");

// ✅ Create Billing
exports.createBilling = async ({ provider_id, consultation_id, duration_minutes, billing_amount, date_range }) => {
    try {
        logger.info(`Creating billing record for provider ID: ${provider_id}`);

        const provider = await Provider.findByPk(provider_id);
        if (!provider) throw new Error("Provider not found");

        const billing = await Billing.create({ provider_id, consultation_id, duration_minutes, billing_amount, date_range });

        await Notification.create({
            provider_id,
            type: "billing",
            message: `Billing summary for ${date_range} generated. Total: $${billing_amount}.`,
            status: "unread",
        });

        const subject = "Billing Summary Notification";
        const message = `Hello ${provider.name},\n\nYour billing summary for ${date_range} has been generated.\nTotal Amount: $${billing_amount}\nDuration: ${duration_minutes} minutes\n\nThank you!`;
        await sendEmailNotification(provider.email, subject, message);

        return billing;
    } catch (error) {
        logger.error(`Error in createBilling: ${error.message}`);
        throw error;
    }
};

// ✅ Get All Billing Records
exports.getAllBilling = async () => {
    try {
        const billingRecords = await Billing.findAll();
        logger.info(`Fetched ${billingRecords.length} billing records.`);
        return billingRecords;
    } catch (error) {
        logger.error(`Error fetching billing records: ${error.message}`);
        throw error;
    }
};

// ✅ Get Billing By Provider
exports.getBillingByProvider = async (provider_id) => {
    try {
        const billingRecords = await Billing.findAll({ where: { provider_id } });
        logger.info(`Fetched ${billingRecords.length} billing records for provider ID: ${provider_id}`);
        return billingRecords;
    } catch (error) {
        logger.error(`Error fetching billing records for provider: ${error.message}`);
        throw error;
    }
};

// ✅ Update Billing (Includes Email Notification)
exports.updateBilling = async (id, duration_minutes, billing_amount, date_range) => {
    try {
        const billing = await Billing.findByPk(id);
        if (!billing) throw new Error("Billing record not found");

        await billing.update({ duration_minutes, billing_amount, date_range });

        logger.info(`Billing record updated: ${billing.id}`);

        const provider = await Provider.findByPk(billing.provider_id);
        if (provider) {
            const subject = "Billing Record Updated";
            const message = `Hello ${provider.name},\n\nYour billing record for ${date_range} has been updated.\nNew Amount: $${billing_amount}\nUpdated Duration: ${duration_minutes} minutes.\n\nThank you!`;
            await sendEmailNotification(provider.email, subject, message);
        }

        return billing;
    } catch (error) {
        logger.error(`Error in updateBilling: ${error.message}`);
        throw error;
    }
};

// ✅ Delete Billing (Includes Email Notification)
exports.deleteBilling = async (id) => {
    try {
        const billing = await Billing.findByPk(id);
        if (!billing) throw new Error("Billing record not found");

        const provider = await Provider.findByPk(billing.provider_id);

        // ✅ Send Email Notification Before Deleting
        if (provider) {
            const subject = "Billing Record Deleted";
            const message = `Hello ${provider.name},\n\nYour billing record for ${billing.date_range} has been deleted.\nIf this was a mistake, please contact support.\n\nThank you!`;
            await sendEmailNotification(provider.email, subject, message);
        }

        await Notification.destroy({ where: { provider_id: billing.provider_id, type: "billing" } });
        await billing.destroy();

        logger.info(`Billing record deleted: ${id}`);
        return { message: "Billing record deleted successfully" };
    } catch (error) {
        logger.error(`Error in deleteBilling: ${error.message}`);
        throw error;
    }
};
