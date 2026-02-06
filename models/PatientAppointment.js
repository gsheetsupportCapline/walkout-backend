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
    required: false,
  },
  "insurance-name": {
    type: String,
    required: false,
  },
  "insurance-type": {
    type: String,
    required: false,
  },
  "office-name": {
    type: String,
    required: true,
  },
  "updated-on": {
    type: String,
    required: true,
  },
  mode: {
    type: String,
    enum: ["manual", "ES-Query"],
    default: "ES-Query",
  },
  isWalkIn: {
    type: Boolean,
    default: false,
    index: true,
  },
  createdOn: {
    type: String,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  updatedBy: {
    type: String,
  },
  isWalkoutSubmittedToLC3: {
    type: String,
    enum: ["Yes", "No"],
    default: "No",
  },
});

// Compound index to ensure unique appointments per office
patientAppointmentSchema.index(
  {
    "patient-id": 1,
    "office-name": 1,
    dos: 1,
  },
  { unique: true },
);

module.exports = mongoose.model(
  "PatientAppointment",
  patientAppointmentSchema,
  "pt-appt",
);
