const mongoose = require("mongoose");

const providerScheduleSchema = new mongoose.Schema(
  {
    dos: {
      type: String,
      required: true,
    },
    "office-name": {
      type: String,
      required: true,
    },
    "provider-code": {
      type: String,
      required: false,
      default: "",
    },
    "provider-hygienist": {
      type: String, // Doc - 1, Doc - 2, Hyg - 1, etc.
      required: false,
      default: "",
    },
    "provider-code-with-type": {
      type: String,
      required: false,
      default: "",
    },
    "provider-full-name": {
      type: String,
      required: false,
      default: "",
    },
    "provider-type": {
      type: String,
      required: false,
      default: "",
    },
    "updated-on": {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "provider-schedule",
  }
);

// Compound index for office-name + dos (for querying and updates)
providerScheduleSchema.index({ "office-name": 1, dos: 1 });

// Index on provider-code for faster lookups (not unique since it's optional)
providerScheduleSchema.index({ "provider-code": 1 });

// Index on provider-full-name for faster lookups
providerScheduleSchema.index({ "provider-full-name": 1 });

module.exports = mongoose.model("ProviderSchedule", providerScheduleSchema);
