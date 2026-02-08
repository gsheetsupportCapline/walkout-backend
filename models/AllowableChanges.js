const mongoose = require("mongoose");

const allowableChangesSchema = new mongoose.Schema(
  {
    originalService: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    alternativeService: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    lastSyncedAt: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for faster lookups
allowableChangesSchema.index({ originalService: 1, alternativeService: 1 });

const AllowableChanges = mongoose.model(
  "AllowableChanges",
  allowableChangesSchema,
);

module.exports = AllowableChanges;
