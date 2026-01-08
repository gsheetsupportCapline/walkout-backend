const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/auth");
const {
  submitOfficeSection,
  getAllWalkouts,
  getWalkoutById,
  updateOfficeSection,
  submitLc3Section,
  deleteWalkout,
} = require("../controllers/walkoutController");

// ============================================
// WALKOUT ROUTES
// ============================================

// Submit office section - All authenticated users
router.post("/submit-office", protect, submitOfficeSection);

// Get all walkouts - All authenticated users
router.get("/", protect, getAllWalkouts);

// Get walkout by ID - All authenticated users
router.get("/:id", protect, getWalkoutById);

// Update office section - All authenticated users
router.put("/:id/office", protect, updateOfficeSection);

// Submit/Update LC3 section - All authenticated users
router.put("/:id/lc3", protect, submitLc3Section);

// Delete walkout - Admin/SuperAdmin only
router.delete(
  "/:id",
  protect,
  restrictTo("admin", "superAdmin"),
  deleteWalkout
);

module.exports = router;
