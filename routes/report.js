const express = require("express");
const router = express.Router();
const reportController = require("../controller/reportController");
const { upload } = require("../config/upload");
const {
  isAuthenticated,
  requireRole,
} = require("../middleware/authMiddleware");

// ============ Rate Limiting for POST /reports ============
let rateLimit;
try {
  rateLimit = require("express-rate-limit");
} catch (e) {
  // Fallback if express-rate-limit is not installed
  rateLimit = null;
}

let reportSubmitLimiter;
if (rateLimit) {
  reportSubmitLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // max 10 submissions per 15 min per IP
    message: { message: "Bạn đã gửi quá nhiều báo cáo. Vui lòng thử lại sau." },
    standardHeaders: true,
    legacyHeaders: false,
  });
} else {
  reportSubmitLimiter = (req, res, next) => next();
}

// ============ PUBLIC ROUTES ============

// Render forms
router.get("/lost", reportController.renderLostForm);
router.get("/found", reportController.renderFoundForm);
router.get("/tips", reportController.renderTips);

// Submit report (multipart, rate limited)
router.post(
  "/reports",
  reportSubmitLimiter,
  upload.array("images", 10),
  reportController.submitReport,
);

// Public feed page
router.get("/reports/list", reportController.renderPublicList);

// Public API
router.get("/api/reports", reportController.getPublicReports);

// ============ ADMIN ROUTES (Staff + Admin only) ============

router.get(
  "/admin/reports",
  isAuthenticated,
  requireRole([0, 1]),
  reportController.renderAdminPage,
);

router.get(
  "/api/admin/reports",
  isAuthenticated,
  requireRole([0, 1]),
  reportController.getAdminReports,
);

router.patch(
  "/api/admin/reports/:id/status",
  isAuthenticated,
  requireRole([0, 1]),
  reportController.updateReportStatus,
);

router.patch(
  "/api/admin/reports/:id/revert",
  isAuthenticated,
  requireRole([0, 1]),
  reportController.revertReport,
);

router.delete(
  "/api/admin/reports/:id",
  isAuthenticated,
  requireRole([0, 1]),
  reportController.deleteReport,
);

module.exports = router;
