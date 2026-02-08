const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/auth");
const {
  analyzeWalkout,
  regenerateAnalysis,
  getAnalysisResult,
  manualSyncAnalysisData,
  getSyncStatus,
} = require("../controllers/analysisController");

// Analysis routes - accessible by all authenticated users
router.post("/analyze/:walkoutId", protect, analyzeWalkout);
router.post("/regenerate/:walkoutId", protect, regenerateAnalysis);
router.get("/result/:walkoutId", protect, getAnalysisResult);

// Sync routes - admin/superAdmin only
router.post(
  "/sync",
  protect,
  restrictTo("admin", "superAdmin"),
  manualSyncAnalysisData
);
router.get(
  "/sync-status",
  protect,
  restrictTo("admin", "superAdmin"),
  getSyncStatus
);

module.exports = router;
