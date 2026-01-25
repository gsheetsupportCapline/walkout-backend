const mongoose = require("mongoose");

const syncExecutionSchema = new mongoose.Schema({
  executedAt: {
    type: Date,
    required: true,
  },
  successfulOffices: {
    count: {
      type: Number,
      default: 0,
    },
    offices: [
      {
        officeName: String,
        newCount: Number,
        updatedCount: Number,
        archivedCount: Number,
        newAppointments: [
          {
            "patient-id": String,
            "patient-name": String,
            dos: String,
            "chair-name": String,
            "insurance-name": String,
            "insurance-type": String,
          },
        ],
        updatedAppointments: [
          {
            "patient-id": String,
            "patient-name": String,
            dos: String,
            "chair-name": String, // From existing record (not updated)
            "insurance-name": String, // From existing record (not updated)
            "insurance-type": String, // From existing record (not updated)
            before: {
              "patient-name": String, // Only patient-name tracked for changes
            },
            after: {
              "patient-name": String, // Only patient-name tracked for changes
            },
          },
        ],
        archivedAppointments: [
          {
            "patient-id": String,
            "patient-name": String,
            dos: String,
            "chair-name": String,
            "insurance-name": String,
            "insurance-type": String,
          },
        ],
      },
    ],
  },
  failedOffices: {
    count: {
      type: Number,
      default: 0,
    },
    offices: [
      {
        officeName: String,
        reason: String,
      },
    ],
  },
  totalProcessed: {
    type: Number,
    default: 0,
  },
  manualTrigger: {
    type: Boolean,
    default: false,
  },
  triggeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const syncLogSchema = new mongoose.Schema({
  date: {
    type: String, // Format: YYYY-MM-DD in CST
    required: true,
    unique: true,
  },
  executions: [syncExecutionSchema],
  totalExecutions: {
    type: Number,
    default: 0,
  },
  lastSyncAt: {
    type: Date,
  },
});

module.exports = mongoose.model("SyncLog", syncLogSchema, "sync-logs");
