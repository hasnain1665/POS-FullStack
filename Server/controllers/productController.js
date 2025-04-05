const { Sale, SaleItem, Product, StockHistory } = require("../models");
const { body, validationResult } = require("express-validator");
const { Op, Sequelize } = require("sequelize");
const { format } = require("date-fns");

exports.createProduct = [
  body("name").notEmpty().withMessage("Name is required"),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("stock").isInt({ min: 1 }).withMessage("Stock must be at least 1"),
  body("category").notEmpty().withMessage("Category is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    try {
      const product = await Product.create(req.body);
      res.status(201).json(product);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
];

exports.getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      minStock,
      maxStock,
      page = 1,
      limit = 10,
    } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (search) whereClause.name = { [Op.like]: `%${search}%` };
    if (category) whereClause.category = category;
    if (minPrice || maxPrice)
      whereClause.price = {
        [Op.between]: [minPrice || 0, maxPrice || Number.MAX_VALUE],
      };
    if (minStock || maxStock)
      whereClause.stock = {
        [Op.between]: [minStock || 0, maxStock || Number.MAX_VALUE],
      };

    const { count, rows } = await Product.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
    });

    res.json({
      totalProducts: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      products: rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    await product.update(req.body);
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    await product.destroy();
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.stockReport = async (req, res) => {
  try {
    const lowStockThreshold = 5;

    const totalProducts = await Product.count();

    if (totalProducts === 0) {
      return res
        .status(404)
        .json({ message: "No products found in the database" });
    }

    const lowStockProducts = await Product.findAll({
      where: { stock: { [Op.lte]: lowStockThreshold } },
      attributes: ["id", "name", "stock"],
    });

    const outOfStockProducts = await Product.findAll({
      where: { stock: 0 },
      attributes: ["id", "name"],
    });

    const recentlyRestocked = await Product.findAll({
      where: {
        updatedAt: { [Op.gte]: new Date(new Date() - 7 * 24 * 60 * 60 * 1000) },
      },
      attributes: ["id", "name", "stock", "updatedAt"],
    });

    const allProducts = await Product.findAll({
      attributes: ["price", "stock"],
    });

    const totalInventoryValue = allProducts.reduce((total, product) => {
      return total + product.price * product.stock;
    }, 0);
    res.json({
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      recentlyRestocked,
      totalInventoryValue,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.restockProduct = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId || !quantity || quantity <= 0) {
      return res
        .status(400)
        .json({ message: "Invalid product ID or quantity" });
    }
    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const previousStock = product.stock;
    await product.update({ stock: previousStock + quantity });

    await StockHistory.create({
      productId,
      action: "restock",
      quantity,
      previousStock,
      newStock: previousStock + quantity,
    });

    res.status(200).json({ message: "Stock updated successfully", product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.stockHistory = async (req, res) => {
  try {
    const history = await StockHistory.findAll({
      include: {
        model: Product,
        as: "productStock",
        attributes: ["name"],
      },
      order: [["createdAt", "DESC"]],
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.salesReport = async (req, res) => {
  try {
    const { period = "daily", startDate, endDate } = req.query;

    // Calculate date ranges
    let dateCondition = {};
    const now = new Date();

    if (period === "daily") {
      dateCondition = {
        date: {
          [Op.between]: [
            new Date(now.setHours(0, 0, 0, 0)),
            new Date(now.setHours(23, 59, 59, 999))
          ]
        }
      };
    } else if (period === "weekly") {
      const start = new Date(now.setDate(now.getDate() - now.getDay()));
      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      dateCondition = {
        date: {
          [Op.between]: [
            new Date(start.setHours(0, 0, 0, 0)),
            new Date(end.setHours(23, 59, 59, 999))
          ]
        }
      };
    } else if (period === "monthly") {
      dateCondition = {
        date: {
          [Op.between]: [
            new Date(now.getFullYear(), now.getMonth(), 1),
            new Date(now.getFullYear(), now.getMonth() + 1, 0)
          ]
        }
      };
    } else if (startDate && endDate) {
      dateCondition = {
        date: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      };
    }

    // Get sales data
    const sales = await Sale.findAll({
      where: dateCondition,
      include: [
        {
          model: SaleItem,
          as: "saleItems",
          include: [
            {
              model: Product,
              as: "product"
            }
          ]
        }
      ]
    });

    // Calculate report data
    const report = {
      totalSales: sales.length,
      totalRevenue: sales.reduce(
        (sum, sale) => sum + (Number(sale.totalAmount) || 0),
        0
      ),
      totalItemsSold: sales.reduce(
        (sum, sale) => sum + (sale.saleItems?.reduce(
          (itemSum, item) => itemSum + (item.quantity || 0), 0) || 0),
        0
      ),
      discountsApplied: sales.reduce(
        (sum, sale) => sum + (Number(sale.discount) || 0),
        0
      ),
      salesByProduct: {},
      salesByDay: {},
      startDate: dateCondition.date ? dateCondition.date[Op.between][0] : null,
      endDate: dateCondition.date ? dateCondition.date[Op.between][1] : null,
      sales: sales // Include raw sales data for frontend
    };

    // Additional analytics
    sales.forEach((sale) => {
      const day = format(sale.date, "yyyy-MM-dd");

      // Track sales by day - ensure numeric addition
      report.salesByDay[day] = (Number(report.salesByDay[day]) || 0) + (Number(sale.totalAmount) || 0);

      // Track sales by product
      sale.saleItems?.forEach((item) => {
        const productName = item.product?.name || `Product ${item.productId}`;
        report.salesByProduct[productName] = (report.salesByProduct[productName] || 0) + (item.quantity || 0);
      });
    });

    // CSV Export endpoint
    if (req.query.format === "csv") {
      let csv = "Date,Total Sales,Total Revenue,Items Sold,Discounts\n";

      Object.entries(report.salesByDay).forEach(([date, amount]) => {
        const daySales = sales.filter(
          (s) => format(s.date, "yyyy-MM-dd") === date
        );
        const dayItems = daySales.reduce(
          (sum, sale) => sum + (sale.saleItems?.reduce(
            (s, i) => s + (i.quantity || 0), 0) || 0),
          0
        );
        const dayDiscounts = daySales.reduce(
          (sum, sale) => sum + (Number(sale.discount) || 0),
          0
        );

        csv += `${date},${daySales.length},${amount},${dayItems},${dayDiscounts}\n`;
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=sales-report-${new Date().toISOString()}.csv`
      );
      return res.send(csv);
    }

    res.json(report);
  } catch (error) {
    console.error("Sales report error:", error);
    res.status(500).json({ error: error.message });
  }
};