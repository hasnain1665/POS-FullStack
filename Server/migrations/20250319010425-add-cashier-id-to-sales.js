"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Sales", "cashier_id", {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Sales", "cashier_id");
  },
};
