const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/auth");
const {
  createButtonSet,
  getAllButtonSets,
  getButtonSetById,
  updateButtonSet,
  deleteButtonSet,
  createButton,
  getButtonsBySetId,
  getButtonById,
  updateButton,
  deleteButton,
  bulkCreateButtons,
  bulkUpdateButtons,
  bulkDeleteButtons,
  getArchivedButtonSets,
  getArchivedButtonSetById,
  restoreButtonSet,
  permanentlyDeleteArchivedSet,
  addUsedInReferences,
  removeUsedInReferences,
  replaceUsedInReferences,
} = require("../controllers/buttonSetController");

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

// Get all button sets - Public (no authentication required)
router.get("/button-sets", getAllButtonSets);

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

// ============================================
// RADIO BUTTON ROUTES (Embedded in Button Sets)
// ============================================

// Create radio button in a button set - Admin/SuperAdmin only
router.post(
  "/button-sets/:buttonSetId/buttons",
  protect,
  restrictTo("admin", "superAdmin"),
  createButton
);

// Get all buttons in a button set - All authenticated users
router.get("/button-sets/:buttonSetId/buttons", protect, getButtonsBySetId);

// Get button by ID in a button set - All authenticated users
router.get(
  "/button-sets/:buttonSetId/buttons/:buttonId",
  protect,
  getButtonById
);

// Update button in a button set - Admin/SuperAdmin only
router.put(
  "/button-sets/:buttonSetId/buttons/:buttonId",
  protect,
  restrictTo("admin", "superAdmin"),
  updateButton
);

// Delete button from a button set - Admin/SuperAdmin only
router.delete(
  "/button-sets/:buttonSetId/buttons/:buttonId",
  protect,
  restrictTo("admin", "superAdmin"),
  deleteButton
);

// ============================================
// BULK OPERATIONS
// ============================================

// Bulk create buttons in a button set - Admin/SuperAdmin only
router.post(
  "/button-sets/:buttonSetId/buttons/bulk",
  protect,
  restrictTo("admin", "superAdmin"),
  bulkCreateButtons
);

// Bulk update buttons in a button set - Admin/SuperAdmin only
router.put(
  "/button-sets/:buttonSetId/buttons/bulk",
  protect,
  restrictTo("admin", "superAdmin"),
  bulkUpdateButtons
);

// Bulk delete buttons from a button set - Admin/SuperAdmin only
router.delete(
  "/button-sets/:buttonSetId/buttons/bulk",
  protect,
  restrictTo("admin", "superAdmin"),
  bulkDeleteButtons
);

// ============================================
// ARCHIVE OPERATIONS - SuperAdmin Only
// ============================================

// Get all archived button sets - SuperAdmin only
router.get(
  "/archives/button-sets",
  protect,
  restrictTo("superAdmin"),
  getArchivedButtonSets
);

// Get archived button set by ID - SuperAdmin only
router.get(
  "/archives/button-sets/:id",
  protect,
  restrictTo("superAdmin"),
  getArchivedButtonSetById
);

// Restore archived button set - SuperAdmin only
router.post(
  "/archives/button-sets/:archiveId/restore",
  protect,
  restrictTo("superAdmin"),
  restoreButtonSet
);

// Permanently delete archived button set - SuperAdmin only
router.delete(
  "/archives/button-sets/:archiveId/permanent",
  protect,
  restrictTo("superAdmin"),
  permanentlyDeleteArchivedSet
);

// ============================================
// USED IN OPERATIONS - Admin/SuperAdmin
// ============================================

// Add references to usedIn array - Admin/SuperAdmin only
router.patch(
  "/button-sets/:id/used-in/add",
  protect,
  restrictTo("admin", "superAdmin"),
  addUsedInReferences
);

// Remove references from usedIn array - Admin/SuperAdmin only
router.patch(
  "/button-sets/:id/used-in/remove",
  protect,
  restrictTo("admin", "superAdmin"),
  removeUsedInReferences
);

// Replace entire usedIn array - Admin/SuperAdmin only
router.put(
  "/button-sets/:id/used-in",
  protect,
  restrictTo("admin", "superAdmin"),
  replaceUsedInReferences
);

module.exports = router;
