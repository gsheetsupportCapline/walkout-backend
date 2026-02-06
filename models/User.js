const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { toCSTDateString } = require("../utils/timezone");
const { applyStringTimestamps } = require("../utils/stringTimestamps");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide email"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    username: {
      type: String,
      required: [true, "Please provide username"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Please provide password"],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["superAdmin", "admin", "user", "office"],
      default: "user",
    },
    extraPermissions: {
      type: Object,
      default: {},
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    signedUpOn: {
      type: String,
      default: () => toCSTDateString(),
    },
    approvedOn: {
      type: String,
      default: null,
    },
    teamName: [
      {
        teamId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Team",
        },
      },
    ],
    assignedOffice: [
      {
        officeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Office",
        },
      },
    ],
  },
  {},
);

applyStringTimestamps(userSchema);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
