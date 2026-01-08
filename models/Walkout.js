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

// ====================================
// LC3 SECTION SCHEMAS
// ====================================

// Failed Rule Schema for Rule Engine
const lc3FailedRuleSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      trim: true,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

// Historical Note Schema for LC3 Section
const lc3HistoricalNoteSchema = new mongoose.Schema(
  {
    note: {
      type: String,
      trim: true,
      required: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

// LC3 Section Schema
const lc3SectionSchema = new mongoose.Schema(
  {
    // A. RULE ENGINE CHECK
    ruleEngine: {
      fieldsetStatus: {
        type: Number, // Radio button incrementalId (completed/pending)
      },
      didLc3RunRules: {
        type: Number, // incrementalId from radio buttons (Yes/No)
      },
      ruleEngineUniqueId: {
        type: String,
        trim: true, // Shows when "Yes" selected - Text input
      },
      reasonForNotRun: {
        type: Number, // Shows when "No" selected - incrementalId from dropdown
      },
      failedRules: [lc3FailedRuleSchema], // Fetched from API
      // Dynamic fields will be handled as flexible schema
    },

    // B. DOCUMENT CHECK
    documentCheck: {
      lc3DocumentCheckStatus: {
        type: Number, // Radio button incrementalId (completed/pending)
      },
      signedTreatmentPlanAvailable: {
        type: Number, // incrementalId from dropdown
      },
      prcAvailable: {
        type: Number, // incrementalId from dropdown
      },
      signedConsentGeneralAvailable: {
        type: Number, // incrementalId from dropdown
      },
      nvdAvailable: {
        type: Number, // incrementalId from dropdown
      },
      narrativeAvailable: {
        type: Number, // incrementalId from dropdown
      },
      signedConsentTxAvailable: {
        type: Number, // incrementalId from dropdown
      },
      preAuthAvailable: {
        type: Number, // incrementalId from dropdown
      },
      routeSheetAvailable: {
        type: Number, // incrementalId from dropdown
      },
      orthoQuestionnaireAvailable: {
        type: Number, // incrementalId from radio buttons (Yes/No/NA)
      },
    },

    // C. ATTACHMENTS CHECK
    attachmentsCheck: {
      lc3AttachmentsCheckStatus: {
        type: Number, // Radio button incrementalId (completed/pending)
      },
      pano: {
        type: Number, // incrementalId from dropdown
      },
      fmx: {
        type: Number, // incrementalId from dropdown
      },
      bitewing: {
        type: Number, // incrementalId from dropdown
      },
      pa: {
        type: Number, // incrementalId from dropdown
      },
      perioChart: {
        type: Number, // incrementalId from dropdown
      },
    },

    // D. PATIENT PORTION CHECK
    patientPortionCheck: {
      lc3PatientPortionStatus: {
        type: Number, // Radio button incrementalId (completed/pending)
      },
      // Patient Portion Calculations and Collection by Office
      expectedPPOffice: {
        type: Number, // Expected PP per Office (amount field)
      },
      ppCollectedOffice: {
        type: Number, // PP Collected by Office per Eaglesoft
      },
      ppDifferenceOffice: {
        type: Number, // Difference (auto-calculated or manual)
      },
      signedNVDForDifference: {
        type: Number, // incrementalId from radio buttons (Yes/No)
      },
      // Patient Portion Calculations by LC3
      expectedPPLC3: {
        type: Number, // Expected PP per LC3 (amount field)
      },
      ppDifferenceLC3: {
        type: Number, // Difference in Expected PP [LC3 vs. Office]
      },
      // Verification of Patient Portion Payment - Primary Mode
      ppPrimaryMode: {
        type: Number, // incrementalId from dropdown (Pat. Portion Primary Mode)
      },
      amountPrimaryMode: {
        type: Number, // Amount Collected Using Primary Mode
      },
      paymentVerifiedFromPrimary: {
        type: Number, // incrementalId from dropdown (Payment verified from)
      },
      // Verification of Patient Portion Payment - Secondary Mode
      ppSecondaryMode: {
        type: Number, // incrementalId from dropdown (Pat. Portion Secondary Mode)
      },
      amountSecondaryMode: {
        type: Number, // Amount Collected Using Secondary Mode
      },
      paymentVerifiedFromSecondary: {
        type: Number, // incrementalId from dropdown (Payment verified from)
      },
      // Bottom Questions
      verifyCheckMatchesES: {
        type: Number, // incrementalId from radio buttons (Yes/No)
      },
      forteCheckAvailable: {
        type: Number, // incrementalId from radio buttons (Yes/No)
      },
    },

    // E. PRODUCTION DETAILS AND WALKOUT SUBMISSION/HOLD
    productionDetails: {
      lc3ProductionStatus: {
        type: Number, // Radio button incrementalId (completed/pending)
      },
      // Production Calculations per Office Walkout
      totalProductionOffice: {
        type: Number, // Total Production (Office) - Amount field
      },
      estInsuranceOffice: {
        type: Number, // Est. Insurance (Office) - Amount field
      },
      expectedPPOfficeProduction: {
        type: Number, // Expected PP (Office) - Amount field
      },
      // Production Calculations per LC3 Walkout
      totalProductionLC3: {
        type: Number, // Total Production (LC3) - Amount field
      },
      estInsuranceLC3: {
        type: Number, // Est. Insurance (LC3) - Amount field
      },
      expectedPPLC3Production: {
        type: Number, // Expected PP (LC3) - Amount field
      },
      // Difference between LC3 and Office Production [LC3 - Office]
      totalProductionDifference: {
        type: Number, // Total Production Difference - Amount field
      },
      estInsuranceDifference: {
        type: Number, // Est Insurance Difference - Amount field
      },
      expectedPPDifference: {
        type: Number, // Expected PP Difference - Amount field
      },
      // Reason Fields for Differences
      reasonTotalProductionDiff: {
        type: Number, // incrementalId from dropdown
      },
      reasonEstInsuranceDiff: {
        type: Number, // incrementalId from dropdown
      },
      // Explanation Fields for Differences
      explanationTotalProductionDiff: {
        type: String,
        trim: true, // Explanation text field
      },
      explanationEstInsuranceDiff: {
        type: String,
        trim: true, // Explanation text field
      },
      // Walkout Questions
      informedOfficeManager: {
        type: Number, // incrementalId from radio buttons (Yes/No/Pending)
      },
      googleReviewSent: {
        type: Number, // incrementalId from radio buttons (Yes/No/Pending)
      },
      containsCrownDentureImplant: {
        type: Number, // incrementalId from radio buttons (Yes/No/Pending)
      },
      crownPaidOn: {
        type: Number, // incrementalId from radio buttons (Seat/Prep/NA etc.)
      },
      deliveredAsPerNotes: {
        type: Number, // incrementalId from radio buttons (Yes/No/Pending)
      },
      walkoutOnHold: {
        type: Number, // incrementalId from radio buttons (Yes/No/Pending)
      },
      onHoldReasons: {
        type: [Number], // Array of incrementalIds from multi-select dropdown
        default: [],
      },
      otherReasonNotes: {
        type: String,
        trim: true, // Other Reason/Notes - Text field
      },
      // Final Question
      completingWithDeficiency: {
        type: Number, // incrementalId from radio buttons (Yes/No/Pending)
      },
    },

    // F. PROVIDER NOTES
    providerNotes: {
      lc3ProviderNotesStatus: {
        type: Number, // Radio button incrementalId (completed/pending)
      },
      doctorNoteCompleted: {
        type: Number, // incrementalId from radio buttons (Yes/No/Pending)
      },
      notesUpdatedOnDOS: {
        type: Number, // incrementalId from radio buttons (Yes/No/Pending)
      },
      noteIncludesFourElements: {
        type: Number, // incrementalId from radio buttons (Yes/No/Pending)
      },
      // 4 Required Elements Checkboxes
      noteElement1: {
        type: Boolean,
        default: false,
      },
      noteElement2: {
        type: Boolean,
        default: false,
      },
      noteElement3: {
        type: Boolean,
        default: false,
      },
      noteElement4: {
        type: Boolean,
        default: false,
      },
      // Provider and Hygienist Notes Textareas
      providerNotes: {
        type: String,
        trim: true, // Text area - Provider's notes
      },
      hygienistNotes: {
        type: String,
        trim: true, // Text area - Hygienist's notes
      },
    },

    // G. REMARKS
    lc3Remarks: {
      type: String,
      trim: true, // Text area - Long text field for any additional remarks
    },

    // Historical Notes Array
    lc3HistoricalNotes: [String], // Array of historical notes

    // On-Hold Notes Array (with user tracking)
    onHoldNotes: [lc3HistoricalNoteSchema],

    // Submission Metadata
    lc3SubmittedAt: {
      type: Date,
    },
    lc3SubmittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lc3LastUpdatedAt: {
      type: Date,
    },
    lc3LastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
