require("dotenv").config();
var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");

// Middleware
var { setUserLocals } = require("./middleware/authMiddleware");

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

var app = express();

// View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Middleware
app.use(logger("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Make user available in all views (JWT-based)
app.use(setUserLocals);

// Route handlers
app.use("/api/v1/auth", authApiV1Router);
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

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
