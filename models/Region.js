const mongoose = require("mongoose");

const regionSchema = new mongoose.Schema(
  {
    regionName: {
      type: String,
      required: [true, "Please provide region name"],
      trim: true,
      unique: true,
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
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Region", regionSchema);
