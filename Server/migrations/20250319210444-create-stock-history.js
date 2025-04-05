"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("StockHistories", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      productId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Products", // This should match your product table name
          key: "id",
        },
        onDelete: "CASCADE",
      },
      action: {
        type: Sequelize.ENUM("restock", "sale"),
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      previousStock: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      newStock: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("StockHistories");
  },
};
