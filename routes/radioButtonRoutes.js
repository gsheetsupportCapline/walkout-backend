const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/auth");
const {
  createButtonSet,
  getAllButtonSets,
  getButtonSetById,
  updateButtonSet,
  deleteButtonSet,
  addButtonsToSet,
  removeButtonsFromSet,
} = require("../controllers/buttonSetController");
const {
  createRadioButton,
  getAllRadioButtons,
  getRadioButtonById,
  updateRadioButton,
  deleteRadioButton,
  bulkCreateRadioButtons,
  bulkUpdateRadioButtons,
  bulkDeleteRadioButtons,
} = require("../controllers/radioButtonController");

// ============================================
// BUTTON SET ROUTES
// ============================================

// Create button set - Admin/SuperAdmin only
router.post(
  "/button-sets",
  protect,
  restrictTo("admin", "superAdmin"),
  createButtonSet
);

// Get all button sets - All authenticated users
router.get("/button-sets", protect, getAllButtonSets);

// Get button set by ID - All authenticated users
router.get("/button-sets/:id", protect, getButtonSetById);

// Update button set - Admin/SuperAdmin only
router.put(
  "/button-sets/:id",
  protect,
  restrictTo("admin", "superAdmin"),
  updateButtonSet
);

// Delete button set - Admin/SuperAdmin only
router.delete(
  "/button-sets/:id",
  protect,
  restrictTo("admin", "superAdmin"),
  deleteButtonSet
);

// Add buttons to button set - Admin/SuperAdmin only
router.post(
  "/button-sets/:id/buttons",
  protect,
  restrictTo("admin", "superAdmin"),
  addButtonsToSet
);

// Remove buttons from button set - Admin/SuperAdmin only
router.delete(
  "/button-sets/:id/buttons",
  protect,
  restrictTo("admin", "superAdmin"),
  removeButtonsFromSet
);

// ============================================
// RADIO BUTTON ROUTES
// ============================================

// Bulk operations - Must be before single ID routes
router.post(
  "/bulk",
  protect,
  restrictTo("admin", "superAdmin"),
  bulkCreateRadioButtons
);

router.put(
  "/bulk",
  protect,
  restrictTo("admin", "superAdmin"),
  bulkUpdateRadioButtons
);

router.delete(
  "/bulk",
  protect,
  restrictTo("admin", "superAdmin"),
  bulkDeleteRadioButtons
);

// Create radio button - Admin/SuperAdmin only
router.post("/", protect, restrictTo("admin", "superAdmin"), createRadioButton);

// Get all radio buttons - All authenticated users
router.get("/", protect, getAllRadioButtons);

// Get radio button by ID - All authenticated users
router.get("/:id", protect, getRadioButtonById);

// Update radio button - Admin/SuperAdmin only
router.put(
  "/:id",
  protect,
  restrictTo("admin", "superAdmin"),
  updateRadioButton
);

// Delete radio button - Admin/SuperAdmin only
router.delete(
  "/:id",
  protect,
  restrictTo("admin", "superAdmin"),
  deleteRadioButton
);

module.exports = router;
