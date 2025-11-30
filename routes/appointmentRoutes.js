const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/auth");
const {
  manualSync,
  getSyncHistory,
  getAppointmentStats,
  getOfficeAppointments,
} = require("../controllers/appointmentController");

// All routes require admin or superAdmin access
router.use(protect);
router.use(restrictTo("admin", "superAdmin"));

// Manual sync trigger
router.post("/sync", manualSync);

// Get sync history
router.get("/sync-history", getSyncHistory);

// Get appointment statistics
router.get("/stats", getAppointmentStats);

// Get appointments for specific office
router.get("/office/:officeName", getOfficeAppointments);

module.exports = router;
