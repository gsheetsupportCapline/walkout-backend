const mongoose = require("mongoose");

const patientAppointmentSchema = new mongoose.Schema({
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
});

// Compound index to ensure unique appointments per office
patientAppointmentSchema.index(
  {
    "patient-id": 1,
    "office-name": 1,
    dos: 1,
  },
  { unique: true }
);

module.exports = mongoose.model(
  "PatientAppointment",
  patientAppointmentSchema,
  "pt-appt"
);
