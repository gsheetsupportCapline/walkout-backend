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

// CORS configuration - Allow requests from frontend URLs
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((url) => url.trim())
  : ["http://localhost:3000"];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        allowedOrigins.includes("*")
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // Keep enabled for localhost cookie support
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Authorization"], // Allow frontend to read Authorization header
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
app.use("/api/provider-note-ai", require("./routes/providerNoteAiRoutes"));
app.use("/api/ai", require("./routes/providerNoteAiRoutes")); // Backward compatibility
app.use(
  "/api/office-walkout-ai",
  require("./routes/officeWalkoutImageAiRoutes"),
);
app.use("/api/lc3-walkout-ai", require("./routes/lc3WalkoutImageAiRoutes"));
app.use("/api/extraction-logs", require("./routes/imageExtractionLogRoutes"));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

const PORT = process.env.PORT || 5010;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);

  // Initialize appointment sync cron job
  initAppointmentCron();

  // Initialize provider schedule sync cron job
  initProviderScheduleCron();
});
