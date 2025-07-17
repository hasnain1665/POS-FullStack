const createError = require("http-errors");
const express = require("express");
const connectToSql = require("./DB/sql");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const app = express();
require("dotenv").config();
const cors = require("cors");
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

const authRouter = require("./routes/authRoutes");
const userRouter = require("./routes/userRoutes");
const productRouter = require("./routes/productRoutes");
const saleRouter = require("./routes/saleRoutes");
const saleItemRouter = require("./routes/saleItemRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

// Middlewares
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Calling the Connections
connectToSql();

app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/product", productRouter);
app.use("/sale", saleRouter);
app.use("/saleitem", saleItemRouter);
app.use("/dashboard", dashboardRoutes);

module.exports = app;
