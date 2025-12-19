const mongoose = require("mongoose");

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
    buttons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RadioButton",
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
    collection: "button-sets",
  }
);

// Indexes for faster queries (name index is auto-created by unique: true)
buttonSetSchema.index({ isActive: 1 });

module.exports = mongoose.model("ButtonSet", buttonSetSchema);
