const express = require("express");
const router = express.Router();
const adoptionController = require("../controller/adoptionController");
const { isStaff, requireVerified } = require("../middleware/authMiddleware");

// Admin page: adoption review UI
router.get("/adoption-review", isStaff, adoptionController.showReviewPage);

// API: Get all adoption requests (admin/staff only)
router.get(
  "/api/admin/adoption-requests",
  isStaff,
  adoptionController.getAdoptionRequests,
);

// API: Approve or reject an adoption request (admin/staff only)
router.patch(
  "/api/admin/adoption-requests/:id/status",
  isStaff,
  adoptionController.updateRequestStatus,
);

// API: Submit a new adoption request (verified users only)
router.post(
  "/api/adoption-requests",
  requireVerified,
  adoptionController.submitRequest,
);

module.exports = router;
