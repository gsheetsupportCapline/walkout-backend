const mongoose = require("mongoose");

const codeCompatibilitySchema = new mongoose.Schema(
  {
    serviceCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    compatibleCodes: {
      type: [String],
      default: [],
    },
    lastSyncedAt: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster lookups
codeCompatibilitySchema.index({ serviceCode: 1 });

const CodeCompatibility = mongoose.model(
  "CodeCompatibility",
  codeCompatibilitySchema,
);

module.exports = CodeCompatibility;
