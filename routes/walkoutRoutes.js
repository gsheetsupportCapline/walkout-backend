const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
  submitOfficeSection,
  getAllWalkouts,
  getWalkoutById,
  updateOfficeSection,
  submitLc3Section,
  deleteWalkout,
  serveWalkoutImage,
  serveImageByImageId,
} = require("../controllers/walkoutController");

// ============================================
// WALKOUT ROUTES
// ============================================

// Submit office section with optional image - All authenticated users
router.post(
  "/submit-office",
  protect,
  upload.single("officeWalkoutSnip"),
  submitOfficeSection
);

// Get all walkouts - All authenticated users
router.get("/", protect, getAllWalkouts);

// Serve image by imageId directly - Public access (no auth required)
router.get("/image/:imageId", serveImageByImageId);

// Get walkout by ID - All authenticated users
router.get("/:id", protect, getWalkoutById);

// Serve walkout image (legacy) - Public access (no auth required)
router.get("/:id/image", serveWalkoutImage);

// Update office section with optional image - All authenticated users
router.put(
  "/:id/office",
  protect,
  upload.single("officeWalkoutSnip"),
  updateOfficeSection
);

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
