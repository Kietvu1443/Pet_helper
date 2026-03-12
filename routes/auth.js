const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");
const { isAuthenticated } = require("../middleware/authMiddleware");

// GET - Show login/register page
router.get("/login", authController.showLoginPage);

// POST - Handle registration
router.post("/register", authController.register);

// POST - Handle login
router.post("/login", authController.login);

// GET - Handle logout
router.get("/logout", authController.logout);

// POST - Send OTP for email verification
router.post("/send-otp", isAuthenticated, authController.sendOtp);

// POST - Verify OTP
router.post("/verify-otp", isAuthenticated, authController.verifyOtp);

module.exports = router;
