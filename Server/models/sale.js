"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Sale extends Model {
    static associate(models) {
      // A Sale belongs to one User (Cashier)
      Sale.belongsTo(models.User, { foreignKey: "cashier_id", as: "cashier" });

      // A Sale has many SaleItems
      Sale.hasMany(models.SaleItem, { foreignKey: "saleId", as: "saleItems" });
    }
  }

  Sale.init(
    {
      totalAmount: {
        type: DataTypes.DECIMAL,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      cashier_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users", // Match the actual table name in the database
          key: "id",
        },
      },
    },
    {
      sequelize,
      modelName: "Sale",
    }
  );

  return Sale;
};
