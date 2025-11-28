const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/auth");
const {
  createOffice,
  getAllOffices,
  getOfficeById,
  updateOffice,
  deleteOffice,
} = require("../controllers/officeController");

router
  .route("/")
  .get(protect, getAllOffices)
  .post(protect, restrictTo("superAdmin", "admin"), createOffice);

router
  .route("/:id")
  .get(protect, getOfficeById)
  .put(protect, restrictTo("superAdmin", "admin"), updateOffice)
  .delete(protect, restrictTo("superAdmin", "admin"), deleteOffice);

module.exports = router;
