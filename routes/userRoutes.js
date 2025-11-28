const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/auth");
const {
  signup,
  login,
  getAllUsers,
  getUserById,
  activateUser,
  deactivateUser,
  changeUserRole,
  updateExtraPermissions,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

router.post("/signup", signup);
router.post("/login", login);

router.route("/").get(protect, restrictTo("superAdmin", "admin"), getAllUsers);

router
  .route("/:id")
  .get(protect, getUserById)
  .put(protect, restrictTo("superAdmin", "admin"), updateUser)
  .delete(protect, restrictTo("superAdmin", "admin"), deleteUser);

router
  .route("/:id/activate")
  .put(protect, restrictTo("superAdmin", "admin"), activateUser);

router
  .route("/:id/deactivate")
  .put(protect, restrictTo("superAdmin", "admin"), deactivateUser);

router
  .route("/:id/change-role")
  .put(protect, restrictTo("superAdmin"), changeUserRole);

router
  .route("/:id/extra-permissions")
  .put(protect, restrictTo("superAdmin"), updateExtraPermissions);

module.exports = router;
