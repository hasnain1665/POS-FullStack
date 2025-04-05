const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/", protect, productController.getProducts);
router.post("/", protect, adminOnly, productController.createProduct);
router.patch("/restock", protect, adminOnly, productController.restockProduct);
router.get("/stockreport", protect, adminOnly, productController.stockReport);
router.get("/salesreport", protect, adminOnly, productController.salesReport);
router.get("/stockhistory", protect, adminOnly, productController.stockHistory);
router.get("/:id", protect, productController.getProduct);
router.put("/:id", protect, adminOnly, productController.updateProduct);
router.delete("/:id", protect, adminOnly, productController.deleteProduct);

module.exports = router;
