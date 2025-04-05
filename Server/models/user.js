const bcrypt = require("bcryptjs");

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM("admin", "cashier"),
        allowNull: false,
        defaultValue: "cashier",
      },
    },
    {
      hooks: {
        beforeCreate: async (user) => {
          user.password = await bcrypt.hash(user.password, 10);
        },
        beforeUpdate: async (user) => {
          if (user.changed("password")) {
            user.password = await bcrypt.hash(user.password, 10);
          }
        },
      },
    }
  );

  // Define associations
  User.associate = (models) => {
    User.hasMany(models.Sale, { foreignKey: "cashier_id", as: "sales" });
  };

  // Password comparison method
  User.prototype.comparePassword = function (password) {
    console.log("User", password);
    console.log("Saved", this.password);
    console.log("Check", bcrypt.compare(password, this.password));
    return bcrypt.compare(password, this.password);
  };

  return User;
};
