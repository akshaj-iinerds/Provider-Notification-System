const express = require('express');
const router = express.Router();
const { booknewConsultation, getConsultations, sendConsultationReminders, updateConsultation, markMissedConsultation, markConsultationCompleted, fetchConsultationSummary, cancelConsultation } = require('../controllers/consultationController');

//book new consultation notification
router.post('/', booknewConsultation);

//get all consultations
router.get("/", getConsultations);

//upcoming consultation notification
router.get('/reminder', sendConsultationReminders);

// Reschedule consultation notification
router.put('/:id', updateConsultation);

// Mark a consultation as missed notification
router.put("/missed/:consultationId", markMissedConsultation);

// Update Consultation Status to Completed
router.put("/:consultation_id/status", markConsultationCompleted);

// Get consultation summary for a provider on a given date
router.get("/consultation-summary/:provider_id/:date", fetchConsultationSummary);

// Delete or cancel a consultation notification
router.delete("/:id", cancelConsultation);

module.exports = router;
