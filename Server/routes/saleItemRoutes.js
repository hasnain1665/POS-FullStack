const express = require("express");
const router = express.Router();
const saleItemController = require("../controllers/saleItemController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Routes
router.post("/", protect, saleItemController.createSaleItem);
router.get("/sale/:saleId", protect, saleItemController.getSaleItems);
router.delete("/:id", protect, adminOnly, saleItemController.deleteSaleItem);

module.exports = router;
