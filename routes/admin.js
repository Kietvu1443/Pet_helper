const express = require("express");
const router = express.Router();
const { isStaff } = require("../middleware/authMiddleware");
const adoptionController = require("../controller/adoptionController");

// Admin adoption review page (only admin & staff)
router.get("/adoption-requests", isStaff, adoptionController.showReviewPage);

// API: Get all adoption requests
router.get("/api/adoption-requests", isStaff, adoptionController.getAll);

// API: Approve or reject an adoption request
router.patch("/api/adoption-requests/:id/status", isStaff, adoptionController.updateStatus);

module.exports = router;
