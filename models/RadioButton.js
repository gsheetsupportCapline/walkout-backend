const mongoose = require("mongoose");

const radioButtonSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    collection: "radio-buttons",
  }
);

// Indexes for faster queries (name index is auto-created by unique: true)
radioButtonSchema.index({ isActive: 1 });
radioButtonSchema.index({ visibility: 1 });

module.exports = mongoose.model("RadioButton", radioButtonSchema);
