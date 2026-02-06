const mongoose = require("mongoose");
const { applyStringTimestamps } = require("../utils/stringTimestamps");

const regionSchema = new mongoose.Schema(
  {
    regionName: {
      type: String,
      required: [true, "Please provide region name"],
      trim: true,
      unique: true,
    },
    regionCode: {
      type: String,
      required: [true, "Please provide region code"],
      trim: true,
      unique: true,
      uppercase: true,
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

applyStringTimestamps(regionSchema);

module.exports = mongoose.model("Region", regionSchema);
