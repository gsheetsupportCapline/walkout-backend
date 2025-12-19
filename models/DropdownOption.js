const mongoose = require("mongoose");

const dropdownOptionSchema = new mongoose.Schema(
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
    collection: "dropdown-options",
  }
);

// Indexes for faster queries (name index is auto-created by unique: true)
dropdownOptionSchema.index({ isActive: 1 });
dropdownOptionSchema.index({ visibility: 1 });

module.exports = mongoose.model("DropdownOption", dropdownOptionSchema);
