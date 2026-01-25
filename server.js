const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/database");
const { initAppointmentCron } = require("./cron/appointmentCron");
const { initProviderScheduleCron } = require("./cron/providerScheduleCron");

dotenv.config();

connectDB();

const app = express();

// CORS configuration - credentials enabled for cross-origin cookie support
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true, // Allow cookies to be sent with requests
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(cookieParser()); // Parse cookies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ message: "Welcome to Walkout Backend API" });
});

app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/regions", require("./routes/regionRoutes"));
app.use("/api/offices", require("./routes/officeRoutes"));
app.use("/api/teams", require("./routes/teamRoutes"));
app.use("/api/appointments", require("./routes/appointmentRoutes"));
app.use("/api/provider-schedule", require("./routes/providerScheduleRoutes"));
app.use("/api/radio-buttons", require("./routes/radioButtonRoutes"));
app.use("/api/dropdowns", require("./routes/dropdownRoutes"));
app.use("/api/walkouts", require("./routes/walkoutRoutes"));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);

  // Initialize appointment sync cron job
  initAppointmentCron();

  // Initialize provider schedule sync cron job
  initProviderScheduleCron();
});
