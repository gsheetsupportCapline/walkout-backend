const mongoose = require("mongoose");

/**
 * Image Extraction Log Schema
 * Tracks all AI-based walkout image extraction processes
 * for both Office and LC3 sections
 */
const imageExtractionLogSchema = new mongoose.Schema(
  {
    // Appointment Reference
    formRefId: {
      type: String,
      required: true,
      trim: true,
      index: true, // For quick lookup with walkout collection
    },

    // Appointment Details
    patientId: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfService: {
      type: Date,
      required: true,
    },
    officeName: {
      type: String,
      required: true,
      trim: true,
    },

    // Image Details
    imageId: {
      type: String,
      trim: true,
    },
    fileName: {
      type: String,
      trim: true,
    },
    imageUploadedAt: {
      type: Date,
    },

    // Extraction Process Details
    extractorType: {
      type: String,
      enum: ["office", "lc3"],
      required: true,
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
      type: Date,
      required: true,
      default: Date.now,
    },
    requestCompletedAt: {
      type: Date,
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

    // AI Prompt Details (for debugging)
    promptUsed: {
      type: String,
      trim: true,
    },

    // Metadata
    retryCount: {
      type: Number,
      default: 0,
    },
    isRegeneration: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "image_extraction_logs",
  },
);

// Compound indexes for efficient querying
imageExtractionLogSchema.index({ formRefId: 1, extractorType: 1 });
imageExtractionLogSchema.index({ status: 1, createdAt: -1 });
imageExtractionLogSchema.index({ patientId: 1, dateOfService: -1 });
imageExtractionLogSchema.index({ officeName: 1, createdAt: -1 });
imageExtractionLogSchema.index({ extractionMode: 1, createdAt: -1 });

// Method to mark extraction as started
imageExtractionLogSchema.methods.markAsProcessing = function () {
  this.status = "processing";
  return this.save();
};

// Method to mark extraction as completed
imageExtractionLogSchema.methods.markAsCompleted = function (extractedData) {
  this.status = "success";
  this.extractedData = extractedData;
  this.requestCompletedAt = new Date();
  this.processDuration = this.requestCompletedAt - this.requestStartedAt;
  return this.save();
};

// Method to mark extraction as failed
imageExtractionLogSchema.methods.markAsFailed = function (error) {
  this.status = "failed";
  this.errorMessage = error.message;
  this.errorStack = error.stack;
  this.requestCompletedAt = new Date();
  this.processDuration = this.requestCompletedAt - this.requestStartedAt;
  return this.save();
};

module.exports = mongoose.model("ImageExtractionLog", imageExtractionLogSchema);
