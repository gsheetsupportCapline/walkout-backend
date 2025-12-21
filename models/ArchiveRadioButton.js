const mongoose = require("mongoose");

// Archived Radio Button subdocument schema (same as original but with deletion tracking)
const archivedRadioButtonSchema = new mongoose.Schema(
  {
    incrementalId: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    visibility: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    originalId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      // The original _id before archiving
    },
  },
  {
    timestamps: true,
  }
);

const archiveRadioButtonSchema = new mongoose.Schema(
  {
    originalId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      // The original ButtonSet _id before archiving
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    lastButtonId: {
      type: Number,
      default: 0,
    },
    buttons: [archivedRadioButtonSchema], // Embedded subdocuments with original IDs
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deletedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    deletionReason: {
      type: String,
      default: "Manual deletion",
    },
    // Track whether this is a full set deletion or individual button deletion
    deletionType: {
      type: String,
      enum: ["set", "button"],
      required: true,
      default: "set",
    },
    // For individual button deletions, store the parent set ID
    parentSetId: {
      type: mongoose.Schema.Types.ObjectId,
      // Only populated when deletionType is "button"
    },
    parentSetName: {
      type: String,
      // Store parent set name for reference
    },
    // Store original timestamps for historical reference
    originalCreatedAt: {
      type: Date,
    },
    originalUpdatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: "archive-radio-buttons",
  }
);

// Indexes for faster queries
archiveRadioButtonSchema.index({ originalId: 1 });
archiveRadioButtonSchema.index({ deletedBy: 1 });
archiveRadioButtonSchema.index({ deletedAt: -1 });
archiveRadioButtonSchema.index({ name: 1 });

const ArchiveRadioButton = mongoose.model(
  "ArchiveRadioButton",
  archiveRadioButtonSchema
);

module.exports = ArchiveRadioButton;
