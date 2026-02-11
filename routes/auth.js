const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");

// GET - Show login/register page
router.get("/login", authController.showLoginPage);

// POST - Handle registration
router.post("/register", authController.register);

// POST - Handle login
router.post("/login", authController.login);

// GET - Handle logout
router.get("/logout", authController.logout);

module.exports = router;
