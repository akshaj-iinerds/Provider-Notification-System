const { Op, fn, col, where, Sequelize } = require('sequelize');
const Consultation = require('../models/consultation');
const Provider = require('../models/provider');
const Patient = require('../models/patient');
const { createNotification } = require('../utils/notificationService');
const PatientDocument = require('../models/patientDocument');
const { sendEmailNotification } = require('../utils/emailService');
const s3 = require('../utils/awsConfig');
const sharp = require('sharp');
const logger = require('../utils/logger');

async function bookConsultation(patient_id, date, time, priority) {
  try {
    logger.info(`Booking consultation for patient ${patient_id} on ${date} at ${time}`);

    const patient = await Patient.findByPk(patient_id);
    if (!patient) {
      logger.error(`Patient not found: ID ${patient_id}`);
      throw new Error("Patient not found");
    }

    const allProviders = await Provider.findAll({
      where: {
        verified: true,
        [Op.and]: [where(fn('LOWER', col('specialization')), Op.eq, fn('LOWER', patient.reason_for_consultation))]
      }
    });

    if (allProviders.length === 0) {
      logger.warn(`No verified providers available for specialization: ${patient.reason_for_consultation}`);
      throw new Error("No verified providers available");
    }

    const busyProviderIds = await Consultation.findAll({
      attributes: ['provider_id'],
      where: {
        [Op.or]: [
          Sequelize.where(Sequelize.fn('DATE', Sequelize.col('date')), date),
          { time }
        ]
      }
    }).then((consultations) => consultations.map(c => c.provider_id));

    let assignedProvider = busyProviderIds.length === 0
      ? allProviders[0]
      : allProviders.find(provider => !busyProviderIds.includes(provider.id));

    if (!assignedProvider) {
      logger.error(`All providers are busy for date ${date} and time ${time}`);
      throw new Error("All providers are currently busy");
    }

    const consultation = await Consultation.create({
      patient_id,
      provider_id: assignedProvider.id,
      date,
      time,
      status: 'Scheduled',
      priority
    });

    await createNotification(
      assignedProvider.id,
      'consultation',
      `New consultation on ${date} at ${time} (Priority: ${priority})`
    );

    await sendEmailNotification(
      assignedProvider.email,
      "New Consultation Scheduled",
      `Hello Dr. ${assignedProvider.name},\n\nYou have a new consultation scheduled with ${patient.name} on ${date} at ${time}.\n\nPriority: ${priority.toUpperCase()}`
    );

    logger.info(`Consultation booked successfully for patient ${patient_id}`);
    return consultation;

  } catch (error) {
    logger.error(`Error booking consultation: ${error.message}`);
    throw error;
  }
}

const getAllConsultations = async () => {
    try {
        return await Consultation.findAll();
    } catch (error) {
        throw new Error(`Error fetching consultations: ${error.message}`);
    }
};

const sendRemindersForUpcomingConsultations = async () => {
    try {
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        const formattedTomorrow = tomorrow.toISOString().split('T')[0]; // "YYYY-MM-DD"

        const consultations = await Consultation.findAll();

        // Step 4: Filter consultations by comparing formatted dates
        const upcomingConsultations = consultations.filter(consultation => {
            const consultationDate = new Date(consultation.date);
            const formattedConsultationDate = consultationDate.toISOString().split('T')[0]; // Format DB date to "YYYY-MM-DD"
            
            return formattedConsultationDate === formattedTomorrow; // ✅ Check if it matches tomorrow's date
        });

        if (upcomingConsultations.length === 0) {
            logger.info("No upcoming consultations for tomorrow.");
            return { message: "No upcoming consultations for tomorrow." };
        }

        for (const consultation of upcomingConsultations) {
            const provider = await Provider.findByPk(consultation.provider_id);
            if (provider) {
                await createNotification(
                    provider.id,
                    'consultation',
                    `Reminder: Your upcoming consultation is on ${consultation.date} at ${consultation.time}.`
                );

                await sendEmailNotification(
                    provider.email,
                    `Upcoming Consultation Reminder`,
                    `Hello Dr. ${provider.name},\n\nThis is a reminder that you have a consultation scheduled for tomorrow:\n\nDate: ${consultation.date}\nTime: ${consultation.time}\n\nPlease be prepared.\n\nBest regards,\nYour Consultation Team`
                );
            }
        }

        return { message: "Reminder emails sent successfully." };
    } catch (error) {
        logger.error(`Error sending reminders: ${error.message}`);
        throw new Error(error.message);
    }
};

const rescheduleConsultation = async (id, date, time, priority) => {
    try {
        // Ensure date is stored as YYYY-MM-DD
        const formattedDate = new Date(date).toISOString().split('T')[0];

        const consultation = await Consultation.findByPk(id);
        if (!consultation) {
            return { status: 404, data: { error: "Consultation not found" } };
        }

        // Update consultation details
        consultation.date = formattedDate;
        consultation.time = time;
        consultation.status = 'Rescheduled';
        consultation.priority = priority;
        await consultation.save();

        const provider = await Provider.findByPk(consultation.provider_id);
        const patient = await Patient.findByPk(consultation.patient_id);

        if (provider) {
            // Create notification for provider
            await createNotification(
                provider.id,
                'consultation',
                `Consultation updated to ${formattedDate} at ${time} (Priority: ${priority})`
            );

            // Send email notification to provider
            await sendEmailNotification(
                provider.email,
                `Consultation Rescheduled`,
                `Hello Dr. ${provider.name},\n\nYour consultation is rescheduled with ${patient.name} on ${consultation.date} at ${consultation.time}.\n\nPriority: ${consultation.priority.toUpperCase()}`
            );

            logger.info(`Reschedule notification sent to Dr. ${provider.name}`);
        }

        return { status: 200, data: { message: "Consultation updated successfully", consultation } };
    } catch (error) {
        logger.error(`Error rescheduling consultation: ${error.message}`);
        return { status: 500, data: { error: error.message } };
    }
};

const markConsultationAsMissed = async (consultationId) => {
    try {
        const consultation = await Consultation.findByPk(consultationId);
        if (!consultation) {
            return { status: 404, data: { error: "Consultation not found" } };
        }

        if (consultation.status === "Missed") {
            return { status: 400, data: { error: "Consultation is already marked as missed" } };
        }

        // Update consultation status
        consultation.status = "Missed";
        await consultation.save();

        const provider = await Provider.findByPk(consultation.provider_id);
        if (!provider) {
            return { status: 404, data: { error: "Provider not found" } };
        }

        // Create a notification for the provider
        await createNotification(
            provider.id,
            "consultation",
            `A consultation with Patient ID ${consultation.patient_id} on ${consultation.date} at ${consultation.time} was missed.`,
        );

        // Send email notification to the provider
        await sendEmailNotification(
            provider.email,
            "Missed Consultation Alert",
            `Hello Dr. ${provider.name},\n\nA scheduled consultation with Patient ID ${consultation.patient_id} on ${consultation.date} at ${consultation.time} was marked as missed.\n\nPlease follow up accordingly.\n\nBest regards,\nYour Healthcare Team`
        );

        logger.info(`Missed consultation notification sent to Dr. ${provider.name}`);

        return { status: 200, data: { message: "Consultation marked as missed, provider notified" } };
    } catch (error) {
        logger.error(`Error marking consultation as missed: ${error.message}`);
        return { status: 500, data: { error: error.message } };
    }
};

const uploadPatientDocument = async (file, body) => {
    try {
      const { consultation_id, patient_id, date, document_type } = body;
  
      if (!file) {
        return { status: 400, data: { error: "No document uploaded" } };
      }
  
      // Process the uploaded file using Sharp
      const processedBuffer = await sharp(file.buffer).toBuffer();
      const s3Key = `documents/${Date.now()}-${file.originalname}`;
  
      // Upload the processed document to S3
      const uploadResult = await s3
        .upload({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: s3Key,
          Body: processedBuffer,
          ContentType: file.mimetype,
          ACL: "public-read",
        })
        .promise();
  
      const document_url = uploadResult.Location;
  
      // Fetch provider_id from the Consultation table
      const consultation = await Consultation.findByPk(consultation_id);
      if (!consultation) {
        return { status: 404, data: { error: "Consultation not found" } };
      }
  
      const provider_id = consultation.provider_id;
  
      // Save document details in the database
      const newDocument = await PatientDocument.create({
        consultation_id,
        provider_id,
        patient_id,
        date: new Date(date),
        document_type,
        document_url,
      });
  
      // Notify provider
      const provider = await Provider.findByPk(provider_id);
      if (provider) {
        await createNotification(
          provider_id,
          "consultation",
          `Patient (ID: ${patient_id}) submitted a ${document_type} for consultation ID ${consultation_id} on ${date}.`,
        );
  
        await sendEmailNotification(
          provider.email,
          `New Patient Document Submitted`,
          `Hello Dr. ${provider.name},\n\nA new document has been submitted by a patient.\n\nDetails:\nConsultation ID: ${consultation_id}\nDocument Type: ${document_type}\nSubmission Date: ${date}\n\nView document: ${document_url}\n\nBest regards,\nYour Healthcare Team`
        );
  
        logger.info(`Notification sent to Dr. ${provider.name} for document upload.`);
      }
  
      return { status: 201, data: { message: "Document uploaded successfully", document: newDocument } };
    } catch (error) {
      logger.error(`Error uploading document: ${error.message}`);
      return { status: 500, data: { error: "Internal Server Error" } };
    }
  };

  const updateConsultationStatus = async (consultation_id) => {
    try {
      // Find the consultation
      const consultation = await Consultation.findByPk(consultation_id);
      if (!consultation) {
        return { status: 404, data: { error: "Consultation not found" } };
      }
  
      // Update status
      consultation.status = "Completed";
      await consultation.save();
  
      logger.info(`Consultation ID ${consultation_id} marked as completed.`);
  
      return { status: 200, data: { message: "Consultation marked as completed", consultation } };
    } catch (error) {
      logger.error(`Error updating consultation status: ${error.message}`);
      return { status: 500, data: { error: "Internal Server Error" } };
    }
  };

  const getConsultationSummary = async (provider_id, date) => {
    try {
      // Convert input date to YYYY-MM-DD format before querying the DB
      const newDate = new Date(date);
  
      // Fetch consultations matching the provider and date
      const consultations = await Consultation.findAll({
        where: { provider_id, date: newDate },
      });
  
      if (!consultations.length) {
        return { status: 404, data: { error: "No consultations found for this provider on the given date." } };
      }
  
      // Fetch provider details
      const provider = await Provider.findByPk(provider_id);
      if (!provider) {
        return { status: 404, data: { error: "Provider not found." } };
      }
  
      // Fetch patient names from the Patient model
      const patientNames = await Promise.all(
        consultations.map(async (consult) => {
          const patient = await Patient.findByPk(consult.patient_id);
          return {
            patientName: patient ? patient.name : "Unknown Patient",
            time: consult.time,
            status: consult.status,
          };
        })
      );
  
      // Construct summary message
      let summary = `Consultation Summary for Dr. ${provider.name} on ${date}\n\n`;
      patientNames.forEach((consult, index) => {
        summary += `#${index + 1}\nPatient: ${consult.patientName}\nTime: ${consult.time}\nStatus: ${consult.status}\n\n`;
      });
  
      // Store notification in the database
      await createNotification(
        provider_id,
        "consultation",
        `Your consultation summary for ${date} is available.`,
      );
  
      // Send email notification
      await sendEmailNotification(
        provider.email,
        `Your Consultation Summary for ${date}`,
        `Hello Dr. ${provider.name},\n\nHere is your consultation summary for ${date}:\n\n${summary}\n\nBest regards,\nYour Healthcare Team`
      );
  
      logger.info(`Consultation summary sent to provider ID ${provider_id} for ${date}`);
  
      return { status: 200, data: { message: "Consultation summary sent successfully", summary } };
    } catch (error) {
      logger.error(`Error fetching consultation summary: ${error.message}`);
      return { status: 500, data: { error: "Internal Server Error" } };
    }
  };

  const deleteConsultation = async (id) => {
    try {
      // Find the consultation
      const consultation = await Consultation.findByPk(id);
      if (!consultation) {
        return { status: 404, data: { error: "Consultation not found" } };
      }
  
      // Fetch provider and patient details
      const provider = await Provider.findByPk(consultation.provider_id);
      const patient = await Patient.findByPk(consultation.patient_id);
  
      // Delete the consultation
      await consultation.destroy();
  
      if (provider && patient) {
        // Create a notification for the assigned provider
        await createNotification(
          provider.id,
          "consultation",
          `Consultation with ${patient.name} on ${consultation.date} at ${consultation.time} has been deleted/canceled.`,
        );
  
        // Send email notification to the provider
        await sendEmailNotification(
          provider.email,
          `Consultation Canceled`,
          `Hello Dr. ${provider.name},\n\nYour consultation with ${patient.name} on ${consultation.date} at ${consultation.time} has been canceled.\n\nPlease check your schedule for updates.`
        );
      }
  
      logger.info(`Consultation ID ${id} deleted successfully.`);
      return { status: 200, data: { message: "Consultation deleted successfully" } };
    } catch (error) {
      logger.error(`Error in deleting consultation: ${error.message}`);
      return { status: 500, data: { error: "Internal Server Error" } };
    }
  };

module.exports = {
  bookConsultation,
  getAllConsultations,
  sendRemindersForUpcomingConsultations,
  rescheduleConsultation,
  markConsultationAsMissed,
  uploadPatientDocument,
  updateConsultationStatus,
  getConsultationSummary,
  deleteConsultation
};
