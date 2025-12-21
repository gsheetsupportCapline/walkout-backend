const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/auth");
const {
  createDropdownSet,
  getAllDropdownSets,
  getDropdownSetById,
  updateDropdownSet,
  deleteDropdownSet,
  createOption,
  getOptionsBySetId,
  getOptionById,
  updateOption,
  deleteOption,
  bulkCreateOptions,
  bulkUpdateOptions,
  bulkDeleteOptions,
  getArchivedDropdownSets,
  getArchivedDropdownSetById,
  restoreDropdownSet,
  permanentlyDeleteArchivedSet,
} = require("../controllers/dropdownSetController");

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

// ============================================
// DROPDOWN OPTION ROUTES (Embedded in Dropdown Sets)
// ============================================

// Create dropdown option in a dropdown set - Admin/SuperAdmin only
router.post(
  "/dropdown-sets/:dropdownSetId/options",
  protect,
  restrictTo("admin", "superAdmin"),
  createOption
);

// Get all options in a dropdown set - All authenticated users
router.get("/dropdown-sets/:dropdownSetId/options", protect, getOptionsBySetId);

// Get option by ID in a dropdown set - All authenticated users
router.get(
  "/dropdown-sets/:dropdownSetId/options/:optionId",
  protect,
  getOptionById
);

// Update option in a dropdown set - Admin/SuperAdmin only
router.put(
  "/dropdown-sets/:dropdownSetId/options/:optionId",
  protect,
  restrictTo("admin", "superAdmin"),
  updateOption
);

// Delete option from a dropdown set - Admin/SuperAdmin only
router.delete(
  "/dropdown-sets/:dropdownSetId/options/:optionId",
  protect,
  restrictTo("admin", "superAdmin"),
  deleteOption
);

// ============================================
// BULK OPERATIONS
// ============================================

// Bulk create options in a dropdown set - Admin/SuperAdmin only
router.post(
  "/dropdown-sets/:dropdownSetId/options/bulk",
  protect,
  restrictTo("admin", "superAdmin"),
  bulkCreateOptions
);

// Bulk update options in a dropdown set - Admin/SuperAdmin only
router.put(
  "/dropdown-sets/:dropdownSetId/options/bulk",
  protect,
  restrictTo("admin", "superAdmin"),
  bulkUpdateOptions
);

// Bulk delete options from a dropdown set - Admin/SuperAdmin only
router.delete(
  "/dropdown-sets/:dropdownSetId/options/bulk",
  protect,
  restrictTo("admin", "superAdmin"),
  bulkDeleteOptions
);

// ============================================
// ARCHIVE OPERATIONS - SuperAdmin Only
// ============================================

// Get all archived dropdown sets - SuperAdmin only
router.get(
  "/archives/dropdown-sets",
  protect,
  restrictTo("superAdmin"),
  getArchivedDropdownSets
);

// Get archived dropdown set by ID - SuperAdmin only
router.get(
  "/archives/dropdown-sets/:id",
  protect,
  restrictTo("superAdmin"),
  getArchivedDropdownSetById
);

// Restore archived dropdown set - SuperAdmin only
router.post(
  "/archives/dropdown-sets/:archiveId/restore",
  protect,
  restrictTo("superAdmin"),
  restoreDropdownSet
);

// Permanently delete archived dropdown set - SuperAdmin only
router.delete(
  "/archives/dropdown-sets/:archiveId/permanent",
  protect,
  restrictTo("superAdmin"),
  permanentlyDeleteArchivedSet
);

module.exports = router;
