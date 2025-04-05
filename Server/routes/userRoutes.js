const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const {
  protect,
  adminOnly,
  protectSelfOrAdmin,
} = require("../middleware/authMiddleware");

router.post("/", protect, adminOnly, userController.createUser);
router.get("/", protect, adminOnly, userController.getUsers);
router.get("/:id", protect, protectSelfOrAdmin, userController.getUser);
router.put("/:id", protect, protectSelfOrAdmin, userController.updateUser);
router.delete("/:id", protect, adminOnly, userController.deleteUser);

module.exports = router;
