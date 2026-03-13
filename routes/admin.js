const express = require("express");
const router = express.Router();
const adminController = require("../controller/adminController");
const { hasRole, isAuthenticated } = require("../middleware/authMiddleware");

// Only admin (role 0) and staff (role 1) may access these routes
const requireAdminOrStaff = hasRole([0, 1]);

// --- Page route ---
// GET /admin/adoption-review  → render the EJS admin UI
router.get(
  "/adoption-review",
  requireAdminOrStaff,
  adminController.getAdoptionReviewPage
);

// --- API routes ---
// GET /admin/api/adoption-requests
router.get(
  "/api/adoption-requests",
  requireAdminOrStaff,
  adminController.getAdoptionRequests
);

// PATCH /admin/api/adoption-requests/:id/status
router.patch(
  "/api/adoption-requests/:id/status",
  requireAdminOrStaff,
  adminController.updateRequestStatus
);

module.exports = router;
