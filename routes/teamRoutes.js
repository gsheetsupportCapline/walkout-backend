const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/auth");
const {
  createTeam,
  getAllTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
} = require("../controllers/teamController");

router
  .route("/")
  .get(protect, getAllTeams)
  .post(protect, restrictTo("superAdmin", "admin"), createTeam);

router
  .route("/:id")
  .get(protect, getTeamById)
  .put(protect, restrictTo("superAdmin", "admin"), updateTeam)
  .delete(protect, restrictTo("superAdmin", "admin"), deleteTeam);

module.exports = router;
