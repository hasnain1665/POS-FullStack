  // Ensure models are properly imported
  const { Sequelize, DataTypes } = require("sequelize");
  const sequelize = require("../config/database");

  const User = require("./user")(sequelize, DataTypes);
  const Product = require("./product")(sequelize, DataTypes);
  const Sale = require("./sale")(sequelize, DataTypes);
  const SaleItem = require("./saleitem")(sequelize, DataTypes);
  const StockHistory = require("./stockHistory")(sequelize, DataTypes);

  //
  User.hasMany(Sale, { foreignKey: "cashier_id", as: "sales" });
  Sale.belongsTo(User, { foreignKey: "cashier_id", as: "cashier" }); // Change alias

  Sale.hasMany(SaleItem, { foreignKey: "saleId", as: "saleItems" });
  SaleItem.belongsTo(Sale, { foreignKey: "saleId", as: "sale" });

  Product.hasMany(SaleItem, { foreignKey: "productId", as: "saleItems" });
  SaleItem.belongsTo(Product, { foreignKey: "productId", as: "product" });

  Product.hasMany(StockHistory, { foreignKey: "productId", as: "stockHistory" });
  StockHistory.belongsTo(Product, {
    foreignKey: "productId",
    as: "productStock",
  }); // Change alias

  module.exports = { sequelize, User, Product, Sale, SaleItem, StockHistory };
