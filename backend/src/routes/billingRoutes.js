const express = require("express");
const router = express.Router();
const { Provider, Notification, Billing } = require("../models");
const { sendEmailNotification } = require('../utils/emailService');

 router.post('/', async (req, res) => {
    try {
        const { provider_id, consultation_id, duration_minutes, billing_amount, date_range } = req.body;

        const provider = await Provider.findByPk(provider_id);
        if (!provider) {
            return res.status(404).json({ error: 'Provider not found' });
        }

        const billing = await Billing.create({ provider_id, consultation_id, duration_minutes, billing_amount, date_range });

        const notification = await Notification.create({
            provider_id,
            type: 'billing',
            message: `Billing summary for ${date_range} has been generated. Total: $${billing_amount}.`,
            status: 'unread'
        });

        const subject = 'Billing Summary Notification';
        const message = `Hello ${provider.name},\n\nYour billing summary for ${date_range} has been generated.\n\nTotal Amount: $${billing_amount}\nDuration: ${duration_minutes} minutes\n\nThank you!`;

        await sendEmailNotification(provider.email, subject, message);

        res.status(201).json({ 
            message: 'Billing record created, notification sent via email.', 
            billing, 
            notification
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


//get all billing
router.get('/', async (req, res) => {
    try {
        const billingRecords = await Billing.findAll();
        res.json(billingRecords);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//get billing by provider id
router.get('/:provider_id', async (req, res) => {
    try {
        const { provider_id } = req.params;
        const billingRecords = await Billing.findAll({ where: { provider_id } });

        res.json(billingRecords);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//update billing by id
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { duration_minutes, billing_amount, date_range } = req.body;

        const billing = await Billing.findByPk(id);
        if (!billing) {
            return res.status(404).json({ error: 'Billing record not found' });
        }

        await billing.update({ duration_minutes, billing_amount, date_range });

        const provider = await Provider.findByPk(billing.provider_id);
        if (!provider) {
            return res.status(404).json({ error: 'Provider not found' });
        }

        const subject = 'Billing Record Updated';
        const message = `Hello ${provider.name},\n\nYour billing record for ${date_range} has been updated.\nNew Amount: $${billing_amount}\nUpdated Duration: ${duration_minutes} minutes.\n\nThank you.`;

        await sendEmailNotification(provider.email, subject, message);

        res.json({ message: 'Billing record updated and notification sent.', billing });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//delete billing by id
router.delete('/:id',async (req, res) => {
    try {
        const { id } = req.params;

        const billing = await Billing.findByPk(id);
        if (!billing) {
            return res.status(404).json({ error: 'Billing record not found' });
        }

        const provider = await Provider.findByPk(billing.provider_id);
        if (!provider) {
            return res.status(404).json({ error: 'Provider not found' });
        }

        await Notification.destroy({ where: { provider_id: billing.provider_id, type: 'billing' } });

        const subject = 'Billing Record Deleted';
        const message = `Hello ${provider.name},\n\nYour billing record for ${billing.date_range} has been deleted.\nIf this was a mistake, please contact support.\n\nThank you.`;

        await sendEmailNotification(provider.email, subject, message);

        await billing.destroy();

        res.json({ message: 'Billing record deleted and email notification sent.' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;