const express = require("express");
const router = express.Router();
const adoptionRequestController = require("../controller/adoptionRequestController");
const {
  isAuthenticated,
  requireVerified,
  requireRole,
} = require("../middleware/authMiddleware");

router.get(
  "/admin/adoption-requests",
  isAuthenticated,
  requireRole([0, 1]),
  adoptionRequestController.renderAdminPage,
);

router.post(
  "/api/adoption-requests",
  requireVerified,
  adoptionRequestController.createAdoptionRequest,
);

router.get(
  "/api/admin/adoption-requests",
  isAuthenticated,
  requireRole([0, 1]),
  adoptionRequestController.getAdminAdoptionRequests,
);

router.patch(
  "/api/admin/adoption-requests/:id/status",
  isAuthenticated,
  requireRole([0, 1]),
  adoptionRequestController.updateAdminAdoptionRequestStatus,
);

router.patch(
  "/api/admin/adoption-requests/:id/revert",
  isAuthenticated,
  requireRole([0, 1]),
  adoptionRequestController.revertApprovedRequest,
);

module.exports = router;
