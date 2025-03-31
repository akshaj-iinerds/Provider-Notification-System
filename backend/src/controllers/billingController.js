const billingService = require("../services/billingService");
const logger = require("../utils/logger");

// Create Billing
exports.createBilling = async (req, res) => {
    try {
        const billing = await billingService.createBilling(req.body);
        res.status(201).json({ message: "Billing record created successfully", billing });
    } catch (error) {
        logger.error(`Billing creation failed: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

// Get All Billing
exports.getAllBilling = async (req, res) => {
    try {
        const billingRecords = await billingService.getAllBilling();
        res.json(billingRecords);
    } catch (error) {
        logger.error(`Fetching all billing records failed: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

// Get Billing By Provider

exports.getBillingByProvider = async (req, res) => {
    try {
        const { provider_id } = req.params;
        const billingRecords = await billingService.getBillingByProvider(provider_id);
        res.json(billingRecords);
    } catch (error) {
        logger.error(`Fetching billing records for provider failed: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

// ✅ Update Billing
exports.updateBilling = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedBilling = await billingService.updateBilling(id, req.body.duration_minutes, req.body.billing_amount, req.body.date_range);
        res.json({ message: "Billing record updated successfully", updatedBilling });
    } catch (error) {
        logger.error(`Updating billing record failed: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

//Delete Billing
exports.deleteBilling = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await billingService.deleteBilling(id);
        res.json(result);
    } catch (error) {
        logger.error(`Deleting billing record failed: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};
