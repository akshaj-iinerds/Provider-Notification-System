const logger = require('../utils/logger');
const { getAllConsultations, bookConsultation,sendRemindersForUpcomingConsultations, rescheduleConsultation, markConsultationAsMissed, updateConsultationStatus, getConsultationSummary, deleteConsultation } = require("../services/consultationService");

const booknewConsultation = async (req, res) => {
  try {
    const { patient_id, date, time, priority } = req.body;
    logger.info(`Received request to book consultation for patient ID ${patient_id}`);

    const consultation = await bookConsultation(patient_id, date, time, priority);
    res.status(201).json({ message: "Consultation booked successfully", consultation });

  } catch (error) {
    logger.error(`Error in booking consultation: ${error.message}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getConsultations = async (req, res) => {
    try {
        const consultations = await getAllConsultations();
        res.status(200).json(consultations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const sendConsultationReminders = async (req, res) => {
    try {
        logger.info("Received request to send consultation reminders.");

        const response = await sendRemindersForUpcomingConsultations();
        res.status(200).json(response);
        
    } catch (error) {
        logger.error(`Error in sending consultation reminders: ${error.message}`);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const updateConsultation = async (req, res) => {
    try {
        const { id } = req.params;
        const { date, time, priority } = req.body;

        logger.info(`Received request to reschedule consultation ID: ${id}`);

        const response = await rescheduleConsultation(id, date, time, priority);
        res.status(response.status).json(response.data);
    } catch (error) {
        logger.error(`Error in updateConsultation: ${error.message}`);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const markMissedConsultation = async (req, res) => {
    try {
        const { consultationId } = req.params;

        logger.info(`Received request to mark consultation ${consultationId} as missed`);

        const response = await markConsultationAsMissed(consultationId);
        res.status(response.status).json(response.data);
    } catch (error) {
        logger.error(`Error in markMissedConsultation: ${error.message}`);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// const uploadDocument = async (req, res) => {
//     try {
//       logger.info(`Received document upload request for consultation ${req.body.consultation_id}`);
      
//       const response = await uploadPatientDocument(req.file, req.body);
//       res.status(response.status).json(response.data);
//     } catch (error) {
//       logger.error(`Error in uploadDocument: ${error.message}`);
//       res.status(500).json({ error: "Internal Server Error" });
//     }
//   };

  const markConsultationCompleted = async (req, res) => {
    try {
      const { consultation_id } = req.params;
      logger.info(`Received request to update consultation ID ${consultation_id} to completed.`);
  
      const response = await updateConsultationStatus(consultation_id);
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error(`Error in markConsultationCompleted: ${error.message}`);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  const fetchConsultationSummary = async (req, res) => {
    try {
      const { provider_id, date } = req.params;
      logger.info(`Fetching consultation summary for provider ID ${provider_id} on ${date}`);
  
      const response = await getConsultationSummary(provider_id, date);
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error(`Error in fetchConsultationSummary: ${error.message}`);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  const cancelConsultation = async (req, res) => {
    try {
      const { id } = req.params;
      logger.info(`Request received to delete consultation ID ${id}`);
  
      const response = await deleteConsultation(id);
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error(`Error in cancelConsultation: ${error.message}`);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

module.exports = {
  booknewConsultation,
  getConsultations,
  sendConsultationReminders,
  updateConsultation,
  markMissedConsultation,
  // uploadDocument,
  markConsultationCompleted,
  fetchConsultationSummary,
  cancelConsultation
};
