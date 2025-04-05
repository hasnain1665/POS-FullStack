const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { Sale, Product, User } = require("../models");

router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const totalSales = await Sale.sum("totalAmount"); // Sum of all sales
    const totalProducts = await Product.count(); // Count of all products
    const totalUsers = await User.count(); // Count of all users

    res.json({ totalSales, totalProducts, totalUsers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching dashboard data" });
  }
});

module.exports = router;
