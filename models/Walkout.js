const mongoose = require("mongoose");

// Office Historical Note subdocument
const officeHistoricalNoteSchema = new mongoose.Schema(
  {
    note: {
      type: String,
      required: true,
      trim: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    addedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { _id: true }
);

// Office Section Schema
const officeSectionSchema = new mongoose.Schema(
  {
    // Radio button fields (stored as numbers from incremental IDs)
    patientCame: {
      type: Number,
      required: true,
    },
    postOpZeroProduction: {
      type: Number,
      // Conditionally required based on patientCame
    },
    patientType: {
      type: Number,
      // Conditionally required
    },
    hasInsurance: {
      type: Number,
      // Conditionally required
    },
    insuranceType: {
      type: Number,
      // Conditionally required based on hasInsurance
    },
    insurance: {
      type: Number,
      // Conditionally required based on insuranceType
    },
    googleReviewRequest: {
      type: Number,
      // Conditionally required
    },
    ruleEngineRun: {
      type: Number,
      // Conditionally required
    },
    ruleEngineError: {
      type: Number,
      // Conditionally required based on ruleEngineRun
    },
    issuesFixed: {
      type: Number,
      // Conditionally required based on ruleEngineError
    },

    // Dropdown fields (stored as numbers from incremental IDs)
    patientPortionPrimaryMode: {
      type: Number,
      // Optional
    },
    patientPortionSecondaryMode: {
      type: Number,
      // Optional
    },
    reasonLessCollection: {
      type: Number,
      // Conditionally required based on differenceInPatientPortion
    },
    ruleEngineNotRunReason: {
      type: Number,
      // Conditionally required based on ruleEngineRun
    },

    // Number fields (can be negative and decimal)
    expectedPatientPortionOfficeWO: {
      type: Number,
      // Conditionally required, can be 0
    },
    patientPortionCollected: {
      type: Number,
      // Not mandatory, calculated in frontend
    },
    differenceInPatientPortion: {
      type: Number,
      // Not mandatory, calculated in frontend
    },
    amountCollectedPrimaryMode: {
      type: Number,
      // Conditionally required based on patientPortionPrimaryMode
    },
    amountCollectedSecondaryMode: {
      type: Number,
      // Conditionally required based on patientPortionSecondaryMode
    },
    lastFourDigitsCheckForte: {
      type: Number,
      // Conditionally required if mode = 4
    },

    // Text fields
    errorFixRemarks: {
      type: String,
      trim: true,
      // Conditionally required based on ruleEngineError
    },

    // Boolean fields (checkboxes)
    signedGeneralConsent: {
      type: Boolean,
      default: false,
      // Conditionally required
    },
    signedTreatmentConsent: {
      type: Boolean,
      default: false,
    },
    preAuthAvailable: {
      type: Boolean,
      default: false,
    },
    signedTxPlan: {
      type: Boolean,
      default: false,
      // Conditionally required
    },
    perioChart: {
      type: Boolean,
      default: false,
    },
    nvd: {
      type: Boolean,
      default: false,
    },
    xRayPanoAttached: {
      type: Boolean,
      default: false,
      // Conditionally required
    },
    majorServiceForm: {
      type: Boolean,
      default: false,
    },
    routeSheet: {
      type: Boolean,
      default: false,
      // Conditionally required
    },
    prcUpdatedInRouteSheet: {
      type: Boolean,
      default: false,
      // Conditionally required
    },
    narrative: {
      type: Boolean,
      default: false,
    },

    // Historical notes array
    officeHistoricalNotes: [officeHistoricalNoteSchema],

    // Metadata
    officeSubmittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    officeSubmittedAt: {
      type: Date,
    },
    officeLastUpdatedAt: {
      type: Date,
    },
  },
  { _id: false }
);

// LC3 Section Schema (placeholder for now)
const lc3SectionSchema = new mongoose.Schema(
  {
    // Will be implemented later
    placeholder: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

// Audit Section Schema (placeholder for now)
const auditSectionSchema = new mongoose.Schema(
  {
    // Will be implemented later
    placeholder: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

// Main Walkout Schema
const walkoutSchema = new mongoose.Schema(
  {
    // User who created/opened this walkout
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Form Reference ID (from frontend)
    // This ID links the walkout to a specific form entry
    // Set only on first submit, never updated after that
    formRefId: {
      type: String,
      trim: true,
      // Will be set on first office section submit
    },

    // Timestamps
    openTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    submitToLC3: {
      type: Date,
      // Set only on first submit, never updated after that
    },
    lastUpdateOn: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // Sections
    officeSection: {
      type: officeSectionSchema,
      required: true,
    },
    lc3Section: {
      type: lc3SectionSchema,
      default: {},
    },
    auditSection: {
      type: auditSectionSchema,
      default: {},
    },

    // Overall walkout status
    walkoutStatus: {
      type: String,
      enum: [
        "draft",
        "office_submitted",
        "lc3_pending",
        "lc3_submitted",
        "audit_pending",
        "completed",
        "patient_not_came",
      ],
      default: "draft",
    },

    // Soft delete flag
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "walkouts",
  }
);

// Indexes for faster queries
walkoutSchema.index({ userId: 1, createdAt: -1 });
walkoutSchema.index({ walkoutStatus: 1 });
walkoutSchema.index({ isActive: 1 });
walkoutSchema.index({ submitToLC3: -1 });
walkoutSchema.index({ formRefId: 1 }); // For quick lookup by form reference ID

module.exports = mongoose.model("Walkout", walkoutSchema);
