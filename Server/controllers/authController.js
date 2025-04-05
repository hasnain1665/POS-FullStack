const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { User } = require("../models");
const { sendResetPasswordEmail } = require("../utils/emailService");
const { body, validationResult } = require("express-validator");
require("dotenv").config();

console.log("JWT Secret at Token Creation:", process.env.JWT_SECRET);
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// Register User
exports.register = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role")
    .isIn(["admin", "cashier"])
    .withMessage("Role must be admin or cashier"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const existingUser = await User.findOne({
        where: { email: req.body.email },
      });
      if (existingUser)
        return res.status(400).json({ message: "Email already in use" });

      const user = await User.create(req.body);
      const token = generateToken(user);

      res.status(201).json({ user, token });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
];

// Login User
exports.login = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const user = await User.findOne({ where: { email: req.body.email } });
      // if (!user || !(await user.comparePassword(req.body.password))) {
      //   return res.status(401).json({ message: "Invalid credentials" });
      // }
      if (!user) {
        console.log("User not found:", req.body.email);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      console.log("Stored Hashed Password:", user.password);
    const passwordMatch = await user.comparePassword(req.body.password);
    console.log("Password Match Result:", passwordMatch);

    if (!passwordMatch) {
      console.log("Password incorrect for user:", req.body.email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

      const token = generateToken(user);
      console.log("Generated Token:", token);
      res.json({ user, token });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
];

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) return res.status(404).json({ message: "User not found" });

    const resetToken = jwt.sign(
      { id: user.id },
      process.env.RESET_PASSWORD_SECRET,
      { expiresIn: process.env.RESET_PASSWORD_EXPIRY }
    );

    await sendResetPasswordEmail(email, resetToken);
    res.json({ message: "Password reset link sent to your email" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const { token } = req.params; // Get token from URL params
    console.log("Received Token:", token); // Log the received token
    console.log("Received newPassword:", newPassword); // Log the new password

    if (!newPassword) {
      return res.status(400).json({ error: "New password is required" });
    }

    const decoded = jwt.verify(token, process.env.RESET_PASSWORD_SECRET);
    console.log("Decoded Token:", decoded); // Log decoded token

    const user = await User.findByPk(decoded.id);
    if (!user)
      return res
        .status(404)
        .json({ message: "Invalid token or user not found" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Error resetting password:", error);
    if (error.name === "TokenExpiredError") {
      return res.status(400).json({ message: "Reset token has expired" });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    // req.user is populated by the `protect` middleware
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] }, // Exclude password from response
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
