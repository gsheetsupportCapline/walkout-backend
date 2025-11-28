const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    teamName: {
      type: String,
      required: [true, "Please provide team name"],
      trim: true,
      unique: true,
    },
    teamPermissions: {
      type: Object,
      default: {},
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

module.exports = mongoose.model("Team", teamSchema);
