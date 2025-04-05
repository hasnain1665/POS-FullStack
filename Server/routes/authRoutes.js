const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.get("/reset-password/:token", (req, res) => {
  res.send(`
      <form action="/auth/reset-password/${req.params.token}" method="POST">
        <input type="password" name="newPassword" placeholder="Enter new password" required />
        <button type="submit">Reset Password</button>
      </form>
    `);
});
router.post("/reset-password/:token", authController.resetPassword);
router.get("/me", protect, authController.getMe);

module.exports = router;
