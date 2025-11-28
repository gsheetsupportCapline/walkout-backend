const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/auth");
const {
  createRegion,
  getAllRegions,
  getRegionById,
  updateRegion,
  deleteRegion,
} = require("../controllers/regionController");

router
  .route("/")
  .get(protect, getAllRegions)
  .post(protect, restrictTo("superAdmin", "admin"), createRegion);

router
  .route("/:id")
  .get(protect, getRegionById)
  .put(protect, restrictTo("superAdmin", "admin"), updateRegion)
  .delete(protect, restrictTo("superAdmin", "admin"), deleteRegion);

module.exports = router;
