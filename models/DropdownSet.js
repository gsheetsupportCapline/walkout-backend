const mongoose = require("mongoose");

// Dropdown Option subdocument schema
const dropdownOptionSchema = new mongoose.Schema(
  {
    incrementalId: {
      type: Number,
      required: true,
      // Unique within the parent dropdown set (enforced in controller)
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
    lastOptionId: {
      type: Number,
      default: 0,
      // Counter for generating incremental IDs for options
    },
    options: [dropdownOptionSchema], // Embedded subdocuments
    isActive: {
      type: Boolean,
      default: true,
    },
    usedIn: {
      type: [String],
      default: [],
      // Array to track where this dropdown set is being used/updated
      // Can store element IDs, screen names, module names, or any reference
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
