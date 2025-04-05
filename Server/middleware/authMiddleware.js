const jwt = require("jsonwebtoken");
const { User } = require("../models");
require("dotenv").config();

// Protect Route (Requires Auth)
exports.protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1]; // Extract token
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findByPk(decoded.id, {
      attributes: { exclude: ["password"] }, // Attach user data (excluding password)
    });

    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: "Not authorized, invalid token" });
  }
};

// Restrict to Admin Only
exports.adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied, admin only" });
  }
  next();
};

// Restrict to Admin or Self (For Viewing/Updating Own Profile)
exports.protectSelfOrAdmin = (req, res, next) => {
  if (req.user.role === "admin" || req.user.id == req.params.id) {
    return next();
  }
  return res.status(403).json({ message: "Access denied" });
};
