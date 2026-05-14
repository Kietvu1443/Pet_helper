require("dotenv").config();
var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");

// Middleware
var { setUserLocals } = require("./middleware/authMiddleware");

// Swagger
var { swaggerUi, swaggerSpec } = require("./config/swagger");


// Routes
var indexRouter = require("./routes/index");
var authRouter = require("./routes/auth");
var authApiV1Router = require("./routes/api/v1/auth");
var petRouter = require("./routes/pet");
var petApiV1Router = require("./routes/api/v1/pets");
var petSnapApiV1Router = require("./routes/api/v1/petSnap");
var favoritesApiV1Router = require("./routes/api/v1/favorites");
var adoptionRequestApiV1Router = require("./routes/api/v1/adoptionRequests");
var adoptionRequestRouter = require("./routes/adoptionRequest");
var reportRouter = require("./routes/report");
var reportApiV1Router = require("./routes/api/v1/reports");
var adminApiV1Router = require("./routes/api/v1/admin");
var newsApiV1Router = require("./routes/api/v1/news");

var app = express();

// Middleware
app.use(logger("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Make user available in all views (JWT-based)
app.use(setUserLocals);

// Shop route
app.get("/admin-shop", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pages", "admin-shop.html"));
});

app.use("/api/products", require("./routes/api/v1/products"));
app.use("/api/orders", require("./routes/api/v1/orders"));
app.use("/api/reviews", require("./routes/api/v1/reviews"));

// Route handlers
app.use("/api/v1/auth", authApiV1Router);
app.use("/api/v1/admin", adminApiV1Router);
app.use("/api/v1", reportApiV1Router);
app.use("/api/v1", petApiV1Router);
app.use("/api/v1", petSnapApiV1Router);
app.use("/api/v1", favoritesApiV1Router);
app.use("/api/v1", adoptionRequestApiV1Router);
app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/adopt", petRouter);
app.use("/", adoptionRequestRouter);
app.use("/", reportRouter);
app.use("/api/v1", newsApiV1Router);

// Swagger UI Route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// Catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function (err, req, res, next) {
  const status = err.status || 500;

  if (
    (req.path || "").startsWith("/api") ||
    req.xhr ||
    (req.headers.accept && req.headers.accept.includes("application/json"))
  ) {
    return res.status(status).json({
      success: false,
      message: err.message || "Đã xảy ra lỗi",
    });
  }

  return res
    .status(status)
    .sendFile(path.join(__dirname, "public", "pages", "error.html"));
});

module.exports = app;
