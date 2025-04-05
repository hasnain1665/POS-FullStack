require("dotenv").config();
module.exports = {
  development: {
    username: "root",
    password: process.env.DB_PASSWORD,
    database: "POS-Database",
    host: "127.0.0.1",
    dialect: "mysql",
  },
  test: {
    username: "root",
    password: "Hasnain@16",
    database: "database_test",
    host: "127.0.0.1",
    dialect: "mysql",
  },
  production: {
    username: "root",
    password: "Hasnain@16",
    database: "database_production",
    host: "127.0.0.1",
    dialect: "mysql",
  },
};
