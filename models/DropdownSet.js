const mongoose = require("mongoose");

const dropdownSetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    options: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DropdownOption",
      },
    ],
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
    collection: "dropdown-sets",
  }
);

// Indexes for faster queries (name index is auto-created by unique: true)
dropdownSetSchema.index({ isActive: 1 });

module.exports = mongoose.model("DropdownSet", dropdownSetSchema);
