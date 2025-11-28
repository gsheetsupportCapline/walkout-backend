const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

dotenv.config();

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  username: String,
  password: String,
  role: String,
  isActive: Boolean,
  signedUpOn: Date,
  extraPermissions: Object,
  teamName: Array,
  assignedOffice: Array,
});

const User = mongoose.model("User", userSchema);

const createSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected");

    const existingAdmin = await User.findOne({ role: "superAdmin" });

    if (existingAdmin) {
      console.log("SuperAdmin already exists!");
      console.log("Email:", existingAdmin.email);
      console.log("Username:", existingAdmin.username);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("gsheet@1947", salt);

    const superAdmin = await User.create({
      name: "Gsheet Team",
      email: "gsheet.support@caplineservices.com",
      username: "gsheet",
      password: hashedPassword,
      role: "superAdmin",
      isActive: true,
      signedUpOn: new Date(),
      extraPermissions: {},
      teamName: [],
      assignedOffice: [],
    });
    console.log("SuperAdmin created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
};

createSuperAdmin();
