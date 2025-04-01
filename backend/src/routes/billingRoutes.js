const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');

// ✅ Create a new billing record
router.post('/', billingController.createBilling);

// ✅ Get all billing records
router.get('/', billingController.getAllBilling);

// ✅ Get billing records by provider ID
router.get('/:provider_id', billingController.getBillingByProvider);

// ✅ Update a billing record
router.put('/:id', billingController.updateBilling);

// ✅ Delete a billing record
router.delete('/:id', billingController.deleteBilling);

module.exports = router;