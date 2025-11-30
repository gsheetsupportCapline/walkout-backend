const mongoose = require("mongoose");

const patientAppointmentArchiveSchema = new mongoose.Schema({
  "patient-id": {
    type: String,
    required: true,
  },
  "patient-name": {
    type: String,
    required: true,
  },
  dos: {
    type: String,
    required: true,
  },
  "chair-name": {
    type: String,
    required: true,
  },
  "insurance-name": {
    type: String,
    required: true,
  },
  "insurance-type": {
    type: String,
    required: true,
  },
  "office-name": {
    type: String,
    required: true,
  },
  "updated-on": {
    type: Date,
    required: true,
  },
  "moved-on": {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model(
  "PatientAppointmentArchive",
  patientAppointmentArchiveSchema,
  "pt-appt-archive"
);
