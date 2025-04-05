const { Sale, User, SaleItem, Product } = require("../models");
const { body, validationResult } = require("express-validator");
const { Op } = require("sequelize");
const sequelize = require("../config/database");

// Create Sale (POS-style)
exports.createSale = [
  body("items")
    .isArray({ min: 1 })
    .withMessage("At least one item is required"),
  body("items.*.productId").isInt({ min: 1 }).withMessage("Invalid product ID"),
  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const transaction = await sequelize.transaction();
    try {
      let totalAmount = 0;
      const items = req.body.items;

      // 1. Verify products and check stock
      const productIds = items.map((item) => item.productId);
      const products = await Product.findAll({
        where: { id: productIds },
        transaction,
      });

      if (products.length !== productIds.length) {
        await transaction.rollback();
        return res
          .status(400)
          .json({ message: "One or more products not found" });
      }

      // Check stock availability
      for (const item of items) {
        const product = products.find((p) => p.id === item.productId);
        if (product.stock < item.quantity) {
          await transaction.rollback();
          return res.status(400).json({
            message: `Insufficient stock for product ${product.name}`,
            productId: product.id,
            availableStock: product.stock,
          });
        }
      }

      // 2. Update product stocks
      for (const item of items) {
        await Product.decrement("stock", {
          by: item.quantity,
          where: { id: item.productId },
          transaction,
        });
      }

      // 3. Create the sale
      const sale = await Sale.create(
        {
          totalAmount: items.reduce((sum, item) => {
            const product = products.find((p) => p.id === item.productId);
            return sum + product.price * item.quantity;
          }, 0),
          date: new Date(),
          cashier_id: req.user.id,
        },
        { transaction }
      );

      // 4. Create sale items
      await SaleItem.bulkCreate(
        items.map((item) => ({
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: products.find((p) => p.id === item.productId).price,
          subtotal:
            products.find((p) => p.id === item.productId).price * item.quantity,
        })),
        { transaction }
      );

      await transaction.commit();

      // Return sale with populated items
      const saleWithItems = await Sale.findByPk(sale.id, {
        include: [
          {
            model: SaleItem,
            as: "saleItems",
            include: {
              model: Product,
              as: "product",
              attributes: ["id", "name", "price", "stock"], // Include stock in response
            },
          },
          {
            model: User,
            as: "cashier",
            attributes: ["id", "name"],
          },
        ],
      });

      res.status(201).json(saleWithItems);
    } catch (error) {
      await transaction.rollback();
      res.status(500).json({ error: error.message });
    }
  },
];

// Get All Sales (with enhanced filtering)
exports.getSales = async (req, res) => {
  try {
    const {
      saleId, // Capture saleId from query params
      startDate,
      endDate,
      minAmount,
      maxAmount,
      cashierId,
      page = 1,
      limit = 10,
    } = req.query;

    if (saleId) {
      // If searching by Sale ID, fetch it using findByPk()
      const sale = await Sale.findByPk(saleId, {
        include: [
          {
            model: User,
            as: "cashier",
            attributes: ["id", "name", "email"],
          },
          {
            model: SaleItem,
            as: "saleItems",
            include: {
              model: Product,
              as: "product",
              attributes: ["id", "name", "price"],
            },
          },
        ],
      });

      if (!sale) return res.status(404).json({ message: "Sale not found" });
      return res
        .status(200)
        .json({ sales: [sale], totalPages: 1, totalSales: 1 });
    }

    // Normal filtering logic (if saleId is not provided)
    const whereClause = {};
    if (startDate) whereClause.date = { [Op.gte]: new Date(startDate) };
    if (endDate)
      whereClause.date = { ...whereClause.date, [Op.lte]: new Date(endDate) };
    if (minAmount) whereClause.totalAmount = { [Op.gte]: minAmount };
    if (maxAmount)
      whereClause.totalAmount = {
        ...whereClause.totalAmount,
        [Op.lte]: maxAmount,
      };
    if (cashierId) whereClause.cashier_id = cashierId;

    const { count, rows } = await Sale.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "cashier",
          attributes: ["id", "name", "email"],
        },
        {
          model: SaleItem,
          as: "saleItems",
          include: {
            model: Product,
            as: "product",
            attributes: ["id", "name", "price"],
          },
        },
      ],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    res
      .status(200)
      .json({
        sales: rows,
        totalPages: Math.ceil(count / limit),
        totalSales: count,
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Single Sale with full details
exports.getSale = async (req, res) => {
  try {
    const sale = await Sale.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "cashier",
          attributes: ["id", "name", "email"],
        },
        {
          model: SaleItem,
          as: "saleItems",
          include: {
            model: Product,
            as: "product",
            attributes: ["id", "name", "price"],
          },
        },
      ],
    });

    if (!sale) return res.status(404).json({ message: "Sale not found" });
    res.status(200).json(sale);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Sale (Return/Refund)
exports.deleteSale = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const sale = await Sale.findByPk(req.params.id, {
      include: [
        {
          model: SaleItem,
          as: "saleItems",
          include: {
            model: Product,
            as: "product",
          },
        },
      ],
      transaction,
    });

    if (!sale) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Sale not found",
        restoredItems: [], // Always include restoredItems
      });
    }

    const restoredItems = sale.saleItems.map((item) => ({
      productId: item.productId,
      productName: item.product?.name || "Unknown Product",
      quantity: item.quantity,
      price: item.unitPrice,
    }));

    // Restore stock for each product
    for (const item of sale.saleItems) {
      await Product.increment("stock", {
        by: item.quantity,
        where: { id: item.productId },
        transaction,
      });
    }

    // Delete sale items
    await SaleItem.destroy({
      where: { saleId: sale.id },
      transaction,
    });

    // Delete the sale
    await sale.destroy({ transaction });

    await transaction.commit();

    res.status(200).json({
      message: "Sale refunded successfully",
      refundAmount: sale.totalAmount,
      restoredItems, // Always included
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      error: error.message,
      message: "Failed to process refund",
      restoredItems: [], // Even in error cases
    });
  }
};

// Get Sales by Cashier
exports.getSalesByCashier = async (req, res) => {
  try {
    const { cashierId } = req.params;
    const { startDate, endDate, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { cashier_id: cashierId };

    if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const { count, rows } = await Sale.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["date", "DESC"]],
      include: [
        {
          model: SaleItem,
          as: "saleItems",
          include: {
            model: Product,
            as: "product",
            attributes: ["id", "name", "price"],
          },
        },
      ],
    });

    // Verify cashier exists
    const cashier = await User.findByPk(cashierId, {
      attributes: ["id", "name", "email"],
    });

    if (!cashier) {
      return res.status(404).json({ message: "Cashier not found" });
    }

    res.json({
      cashier,
      totalSales: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      sales: rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
