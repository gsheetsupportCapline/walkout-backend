const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/auth");
const {
  manualSync,
  getSyncHistory,
  getAppointmentStats,
  getOfficeAppointments,
  getAppointmentsList,
  getAppointmentsByPatient,
} = require("../controllers/appointmentController");

// Manual sync, history, and stats require admin or superAdmin access
router.post("/sync", protect, restrictTo("admin", "superAdmin"), manualSync);
router.get(
  "/sync-history",
  protect,
  restrictTo("admin", "superAdmin"),
  getSyncHistory
);
router.get(
  "/stats",
  protect,
  restrictTo("admin", "superAdmin"),
  getAppointmentStats
);

// Get office appointments - accessible to all authenticated users
router.get("/office/:officeName", protect, getOfficeAppointments);

// Get appointments with filters (office name + date range) - accessible to all authenticated users
router.get("/list", protect, getAppointmentsList);

// Get all appointments for a specific patient in an office - accessible to all authenticated users
router.get("/by-patient", protect, getAppointmentsByPatient);

module.exports = router;
