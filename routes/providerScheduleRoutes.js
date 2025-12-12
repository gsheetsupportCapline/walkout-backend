const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/auth");
const {
  manualSync,
  getProviderScheduleList,
  getProviderScheduleStats,
  getByOfficeAndDOS,
} = require("../controllers/providerScheduleController");

// Manual sync and stats require admin or superAdmin access
router.post("/sync", protect, restrictTo("admin", "superAdmin"), manualSync);
router.get(
  "/stats",
  protect,
  restrictTo("admin", "superAdmin"),
  getProviderScheduleStats
);

// Get provider schedule list - accessible to all authenticated users
router.get("/list", protect, getProviderScheduleList);

// Get provider schedule by office name and DOS - accessible to all authenticated users
router.post("/get-by-office-dos", protect, getByOfficeAndDOS);

module.exports = router;
