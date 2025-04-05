"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      // Define associations
      Product.hasMany(models.SaleItem, {
        foreignKey: "productId",
        as: "saleItems",
      });
      Product.hasMany(models.StockHistory, {
        foreignKey: "productId",
        as: "stockHistory",
      });
    }
  }

  Product.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Product name cannot be empty",
          },
        },
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: {
            msg: "Price must be a decimal number",
          },
          min: {
            args: [0],
            msg: "Price cannot be negative",
          },
        },
      },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          isInt: {
            msg: "Stock must be an integer",
          },
          min: {
            args: [0],
            msg: "Stock cannot be negative",
          },
        },
      },
      category: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Product",
      hooks: {
        beforeUpdate: (product, options) => {
          if (product.changed("stock") && product.stock < 0) {
            throw new Error("Stock cannot be negative");
          }
        },
      },
    }
  );

  // Instance method to safely decrease stock
  Product.prototype.decreaseStock = async function (quantity, options) {
    if (this.stock < quantity) {
      throw new Error(
        `Insufficient stock. Available: ${this.stock}, Requested: ${quantity}`
      );
    }
    return this.update({ stock: this.stock - quantity }, options);
  };

  // Instance method to safely increase stock
  Product.prototype.increaseStock = async function (quantity, options) {
    return this.update({ stock: this.stock + quantity }, options);
  };

  return Product;
};
