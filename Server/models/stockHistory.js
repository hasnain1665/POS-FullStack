"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class StockHistory extends Model {
    static associate(models) {
      // A StockHistory entry belongs to a Product
      StockHistory.belongsTo(models.Product, {
        foreignKey: "productId",
        as: "product",
      });
    }
  }

  StockHistory.init(
    {
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "products", key: "id" },
      },
      action: {
        type: DataTypes.ENUM("restock", "sale"),
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      previousStock: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      newStock: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "StockHistory",
    }
  );

  return StockHistory;
};
