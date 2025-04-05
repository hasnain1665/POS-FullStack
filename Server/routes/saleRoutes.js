const express = require("express");
const router = express.Router();
const saleController = require("../controllers/saleController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.post("/", protect, saleController.createSale);
router.get("/", protect, saleController.getSales);
router.get("/cashier/:cashierId", protect, saleController.getSalesByCashier);
router.get("/:id", protect, saleController.getSale);
router.delete("/:id", protect, saleController.deleteSale);

module.exports = router;
