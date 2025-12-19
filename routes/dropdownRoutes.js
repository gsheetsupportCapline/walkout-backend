const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/auth");
const {
  createDropdownSet,
  getAllDropdownSets,
  getDropdownSetById,
  updateDropdownSet,
  deleteDropdownSet,
  addOptionsToSet,
  removeOptionsFromSet,
} = require("../controllers/dropdownSetController");
const {
  createDropdownOption,
  getAllDropdownOptions,
  getDropdownOptionById,
  updateDropdownOption,
  deleteDropdownOption,
  bulkCreateDropdownOptions,
  bulkUpdateDropdownOptions,
  bulkDeleteDropdownOptions,
} = require("../controllers/dropdownOptionController");

// ============================================
// DROPDOWN SET ROUTES
// ============================================

// Create dropdown set - Admin/SuperAdmin only
router.post(
  "/dropdown-sets",
  protect,
  restrictTo("admin", "superAdmin"),
  createDropdownSet
);

// Get all dropdown sets - All authenticated users
router.get("/dropdown-sets", protect, getAllDropdownSets);

// Get dropdown set by ID - All authenticated users
router.get("/dropdown-sets/:id", protect, getDropdownSetById);

// Update dropdown set - Admin/SuperAdmin only
router.put(
  "/dropdown-sets/:id",
  protect,
  restrictTo("admin", "superAdmin"),
  updateDropdownSet
);

// Delete dropdown set - Admin/SuperAdmin only
router.delete(
  "/dropdown-sets/:id",
  protect,
  restrictTo("admin", "superAdmin"),
  deleteDropdownSet
);

// Add options to dropdown set - Admin/SuperAdmin only
router.post(
  "/dropdown-sets/:id/options",
  protect,
  restrictTo("admin", "superAdmin"),
  addOptionsToSet
);

// Remove options from dropdown set - Admin/SuperAdmin only
router.delete(
  "/dropdown-sets/:id/options",
  protect,
  restrictTo("admin", "superAdmin"),
  removeOptionsFromSet
);

// ============================================
// DROPDOWN OPTION ROUTES
// ============================================

// Bulk operations - Must be before single ID routes
router.post(
  "/bulk",
  protect,
  restrictTo("admin", "superAdmin"),
  bulkCreateDropdownOptions
);

router.put(
  "/bulk",
  protect,
  restrictTo("admin", "superAdmin"),
  bulkUpdateDropdownOptions
);

router.delete(
  "/bulk",
  protect,
  restrictTo("admin", "superAdmin"),
  bulkDeleteDropdownOptions
);

// Create dropdown option - Admin/SuperAdmin only
router.post(
  "/",
  protect,
  restrictTo("admin", "superAdmin"),
  createDropdownOption
);

// Get all dropdown options - All authenticated users
router.get("/", protect, getAllDropdownOptions);

// Get dropdown option by ID - All authenticated users
router.get("/:id", protect, getDropdownOptionById);

// Update dropdown option - Admin/SuperAdmin only
router.put(
  "/:id",
  protect,
  restrictTo("admin", "superAdmin"),
  updateDropdownOption
);

// Delete dropdown option - Admin/SuperAdmin only
router.delete(
  "/:id",
  protect,
  restrictTo("admin", "superAdmin"),
  deleteDropdownOption
);

module.exports = router;
