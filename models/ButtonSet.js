const mongoose = require("mongoose");

// Radio Button subdocument schema
const radioButtonSchema = new mongoose.Schema(
  {
    incrementalId: {
      type: Number,
      required: true,
      // Unique within the parent button set (enforced in controller)
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
  },
  {
    timestamps: true,
  }
);

const buttonSetSchema = new mongoose.Schema(
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
    lastButtonId: {
      type: Number,
      default: 0,
      // Counter for generating incremental IDs for buttons
    },
    buttons: [radioButtonSchema], // Embedded subdocuments
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
    collection: "button-sets",
  }
);

// Indexes for faster queries (name index is auto-created by unique: true)
buttonSetSchema.index({ isActive: 1 });

module.exports = mongoose.model("ButtonSet", buttonSetSchema);
