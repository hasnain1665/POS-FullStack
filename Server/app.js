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
    origin: "http://localhost:3000", // ✅ Allow frontend URL
    credentials: true, // ✅ Allow cookies & authentication headers
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

// // catch 404 and forward to error handler
// app.use(function (req, res, next) {
//   next(createError(404));
// });

// // error handler
// app.use(function (err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get("env") === "development" ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render("error");
// });

const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log(`App ${process.pid} running on port ${port}...`);
});

module.exports = app;
