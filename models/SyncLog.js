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
        type: String,
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
        type: String,
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
