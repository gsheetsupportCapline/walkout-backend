const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/auth");
const {
  manualSync,
  getSyncHistory,
  getAppointmentStats,
  getOfficeAppointments,
  getAppointmentsList,
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

// Get appointments with filters (for frontend table) - accessible to all authenticated users
router.get("/list", protect, getAppointmentsList);

module.exports = router;
