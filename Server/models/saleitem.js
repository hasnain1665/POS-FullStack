"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class SaleItem extends Model {
    static associate(models) {
      // A SaleItem belongs to a Sale
      SaleItem.belongsTo(models.Sale, { foreignKey: "saleId", as: "sale" });

      // A SaleItem belongs to a Product
      SaleItem.belongsTo(models.Product, {
        foreignKey: "productId",
        as: "product",
      });
    }
  }

  SaleItem.init(
    {
      saleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "sales", key: "id" },
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "products", key: "id" },
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      subtotal: {
        type: DataTypes.DECIMAL,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "SaleItem",
    }
  );

  return SaleItem;
};
