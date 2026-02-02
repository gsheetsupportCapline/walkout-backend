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
  createWalkInAppointment,
  updateWalkInAppointment,
  deleteWalkInAppointment,
} = require("../controllers/appointmentController");

// Manual sync, history, and stats require admin or superAdmin access
router.post("/sync", protect, restrictTo("admin", "superAdmin"), manualSync);
router.get(
  "/sync-history",
  protect,
  restrictTo("admin", "superAdmin"),
  getSyncHistory,
);
router.get(
  "/stats",
  protect,
  restrictTo("admin", "superAdmin"),
  getAppointmentStats,
);

// Get office appointments - accessible to all authenticated users
router.get("/office/:officeName", protect, getOfficeAppointments);

// Get appointments with filters (office name + date range) - accessible to all authenticated users
router.get("/list", protect, getAppointmentsList);

// Get all appointments for a specific patient in an office - accessible to all authenticated users
router.get("/by-patient", protect, getAppointmentsByPatient);

// Walk-in/Unscheduled appointment routes
// Create - accessible to admin, superAdmin, and user
router.post(
  "/walk-in",
  protect,
  restrictTo("admin", "superAdmin", "user"),
  createWalkInAppointment,
);
// Update - accessible to superAdmin only
router.put(
  "/walk-in/:id",
  protect,
  restrictTo("superAdmin"),
  updateWalkInAppointment,
);
// Delete - accessible to superAdmin only
router.delete(
  "/walk-in/:id",
  protect,
  restrictTo("superAdmin"),
  deleteWalkInAppointment,
);

module.exports = router;
