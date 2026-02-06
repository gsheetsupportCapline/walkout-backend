const mongoose = require("mongoose");
const { toCSTDateString } = require("../utils/timezone");
const { applyStringTimestamps } = require("../utils/stringTimestamps");

/**
 * Individual Extraction Attempt Schema
 * Nested schema for each extraction attempt
 */
const extractionAttemptSchema = new mongoose.Schema(
  {
    // Image Details for this attempt
    imageId: {
      type: String,
      trim: true,
    },
    fileName: {
      type: String,
      trim: true,
    },
    imageUploadedAt: {
      type: String,
    },

    // Extraction Mode
    extractionMode: {
      type: String,
      enum: ["automatic", "manual"],
      required: true,
      default: "automatic",
    },

    // Process Timing
    requestStartedAt: {
      type: String,
      required: true,
      default: () => toCSTDateString(),
    },
    requestCompletedAt: {
      type: String,
    },
    processDuration: {
      type: Number, // Duration in milliseconds
    },

    // Status Tracking
    status: {
      type: String,
      enum: ["pending", "processing", "success", "failed"],
      default: "pending",
      required: true,
    },

    // Extracted Data
    extractedData: {
      type: String,
      trim: true,
    },

    // Error Details (if failed)
    errorMessage: {
      type: String,
      trim: true,
    },
    errorStack: {
      type: String,
      trim: true,
    },

    // User who triggered the extraction
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Metadata
    isRegeneration: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: true, // Keep _id for each attempt
  },
);

applyStringTimestamps(extractionAttemptSchema);

/**
 * Image Extraction Log Schema
 * ONE document per formRefId with separate arrays for office and LC3 extractions
 */
const imageExtractionLogSchema = new mongoose.Schema(
  {
    // Appointment Reference (UNIQUE - one document per formRefId)
    formRefId: {
      type: String,
      required: true,
      trim: true,
      unique: true, // ONE document per formRefId
      index: true,
    },

    // Appointment Details
    appointmentInfo: {
      patientId: {
        type: String,
        required: true,
        trim: true,
      },
      dateOfService: {
        type: String,
        required: true,
      },
      officeName: {
        type: String,
        required: true,
        trim: true,
      },
    },

    // Office Section Extractions (array of attempts)
    officeSection: {
      extractions: [extractionAttemptSchema],
    },

    // LC3 Section Extractions (array of attempts)
    lc3Section: {
      extractions: [extractionAttemptSchema],
    },
  },
  {
    collection: "image_extraction_logs",
  },
);

applyStringTimestamps(imageExtractionLogSchema);

// Indexes for efficient querying
imageExtractionLogSchema.index({ formRefId: 1 });
imageExtractionLogSchema.index({ "appointmentInfo.patientId": 1 });
imageExtractionLogSchema.index({ "appointmentInfo.dateOfService": -1 });
imageExtractionLogSchema.index({ "appointmentInfo.officeName": 1 });
imageExtractionLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("ImageExtractionLog", imageExtractionLogSchema);
