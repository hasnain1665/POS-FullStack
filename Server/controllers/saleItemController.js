const { Sale, SaleItem, Product, StockHistory } = require("../models");
const { body, validationResult } = require("express-validator");
const { Op } = require("sequelize");

exports.createSaleItem = [
  body("saleId")
    .isInt({ min: 1 })
    .withMessage("Sale ID must be a valid number"),
  body("productId")
    .isInt({ min: 1 })
    .withMessage("Product ID must be a valid number"),
  body("quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
  body("subtotal")
    .isFloat({ min: 0 })
    .withMessage("Subtotal must be a positive number"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const { saleId, productId, quantity, subtotal } = req.body;
      const product = await Product.findByPk(productId);
      if (!product)
        return res.status(404).json({ message: "Product not found" });
      if (product.stock < quantity) {
        return res
          .status(400)
          .json({ message: `Insufficient stock. Only ${product.stock} left.` });
      }
      await product.update({ stock: product.stock - quantity });

      await StockHistory.create({
        productId,
        action: "sale",
        quantity,
        previousStock,
        newStock: previousStock - quantity,
      });

      const saleItem = await SaleItem.create({
        saleId,
        productId,
        quantity,
        subtotal,
      });
      res.status(201).json(saleItem);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
];

exports.getSaleItems = async (req, res) => {
  try {
    const { saleId, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (saleId) whereClause.saleId = saleId;
    if (search) whereClause.productName = { [Op.like]: `%${search}%` };

    const { count, rows } = await SaleItem.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
    });

    res.json({
      totalSaleItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      saleItems: rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteSaleItem = async (req, res) => {
  try {
    const saleItem = await SaleItem.findByPk(req.params.id);
    if (!saleItem)
      return res.status(404).json({ message: "Sale item not found" });

    const product = await Product.findByPk(saleItem.productId);
    if (product) {
      await product.update({ stock: product.stock + saleItem.quantity });
    }
    await saleItem.destroy();
    await Sale.destroy({ where: { id: req.params.id } });
    res.status(200).json({ message: "Sale item deleted, stock restored" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createSaleItem = async (req, res) => {
  try {
    const { saleId, productId, quantity } = req.body;
    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (product.stock < quantity) {
      return res
        .status(400)
        .json({ message: `Insufficient stock. Only ${product.stock} left.` });
    }

    const previousStock = product.stock;
    await product.update({ stock: previousStock - quantity });

    await StockHistory.create({
      productId,
      action: "sale",
      quantity,
      previousStock,
      newStock: previousStock - quantity,
    });

    const saleItem = await SaleItem.create({ saleId, productId, quantity });
    res.status(201).json(saleItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
