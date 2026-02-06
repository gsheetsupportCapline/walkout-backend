const mongoose = require("mongoose");
const { applyStringTimestamps } = require("../utils/stringTimestamps");

const officeSchema = new mongoose.Schema(
  {
    officeName: {
      type: String,
      required: [true, "Please provide office name"],
      trim: true,
    },
    officeCode: {
      type: String,
      required: [true, "Please provide office code"],
      trim: true,
      unique: true,
      uppercase: true,
    },
    regionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Region",
      required: [true, "Please provide region"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    visibility: {
      type: String,
      enum: ["on", "off"],
      default: "on",
    },
  },
  {},
);

applyStringTimestamps(officeSchema);

module.exports = mongoose.model("Office", officeSchema);
