const express = require("express");
const router = express.Router();
const {
  getExtractionLogs,
  getExtractionLogById,
  getLogsByForm,
  getStats,
  getFailures,
  retryFailedExtraction,
  deleteExtractionLog,
  getDashboardSummary,
} = require("../controllers/imageExtractionLogController");
const { protect, restrictTo } = require("../middleware/auth");

// All routes require authentication
router.use(protect);

// Dashboard summary (Admin & SuperAdmin)
router.get(
  "/dashboard/summary",
  restrictTo("admin", "superAdmin"),
  getDashboardSummary,
);

// Statistics (Admin & SuperAdmin)
router.get("/stats", restrictTo("admin", "superAdmin"), getStats);

// Recent failures (Admin & SuperAdmin)
router.get("/failures", restrictTo("admin", "superAdmin"), getFailures);

// Get logs by formRefId (accessible to all authenticated users)
router.get("/form/:formRefId", getLogsByForm);

// Retry failed extraction (Admin & SuperAdmin)
router.post(
  "/:id/retry",
  restrictTo("admin", "superAdmin"),
  retryFailedExtraction,
);

// Get all logs with filters (Admin & SuperAdmin)
router.get("/", restrictTo("admin", "superAdmin"), getExtractionLogs);

// Get single log by ID (Admin & SuperAdmin)
router.get("/:id", restrictTo("admin", "superAdmin"), getExtractionLogById);

// Delete log (SuperAdmin only)
router.delete("/:id", restrictTo("superAdmin"), deleteExtractionLog);

module.exports = router;
