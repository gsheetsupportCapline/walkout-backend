const mongoose = require("mongoose");

// Archived Dropdown Option subdocument schema (same as original but with deletion tracking)
const archivedDropdownOptionSchema = new mongoose.Schema(
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

const archiveDropdownSchema = new mongoose.Schema(
  {
    originalId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      // The original DropdownSet _id before archiving
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
    lastOptionId: {
      type: Number,
      default: 0,
    },
    options: [archivedDropdownOptionSchema], // Embedded subdocuments with original IDs
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
    // Track whether this is a full set deletion or individual option deletion
    deletionType: {
      type: String,
      enum: ["set", "option"],
      required: true,
      default: "set",
    },
    // For individual option deletions, store the parent set ID
    parentSetId: {
      type: mongoose.Schema.Types.ObjectId,
      // Only populated when deletionType is "option"
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
    collection: "archive-dropdowns",
  }
);

// Indexes for faster queries
archiveDropdownSchema.index({ originalId: 1 });
archiveDropdownSchema.index({ deletedBy: 1 });
archiveDropdownSchema.index({ deletedAt: -1 });
archiveDropdownSchema.index({ name: 1 });

const ArchiveDropdown = mongoose.model(
  "ArchiveDropdown",
  archiveDropdownSchema
);

module.exports = ArchiveDropdown;
