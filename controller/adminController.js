const adoptionService = require("../services/adoptionService");

const adminController = {
  // GET /api/admin/adoption-requests[?status=pending|approved|rejected]
  async getAdoptionRequests(req, res) {
    try {
      const { status } = req.query;
      const validStatuses = ["pending", "approved", "rejected", "cancelled"];
      const filter = validStatuses.includes(status) ? status : null;

      const requests = await adoptionService.getAdoptionRequests(filter);
      return res.json(requests);
    } catch (error) {
      console.error("Error fetching adoption requests:", error);
      return res.status(500).json({ message: "Lỗi máy chủ" });
    }
  },

  // PATCH /api/admin/adoption-requests/:id/status
  async updateRequestStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!["approved", "rejected"].includes(status)) {
        return res
          .status(400)
          .json({ message: "Trạng thái không hợp lệ. Chỉ chấp nhận: approved, rejected" });
      }

      const adminId = req.user.id;

      if (status === "approved") {
        await adoptionService.approveRequest(id, adminId);
      } else {
        await adoptionService.rejectRequest(id, adminId);
      }

      return res.json({ message: "Cập nhật trạng thái thành công" });
    } catch (error) {
      console.error("Error updating adoption request status:", error);
      const statusCode = error.status || 500;
      return res.status(statusCode).json({ message: error.message || "Lỗi máy chủ" });
    }
  },

  // GET /admin/adoption-review  (renders EJS page)
  async getAdoptionReviewPage(req, res) {
    try {
      return res.render("admin/adoption-review", {
        title: "Xét duyệt nhận nuôi - Pet Helper",
      });
    } catch (error) {
      console.error("Error rendering adoption review page:", error);
      return res.status(500).render("error", {
        message: "Đã xảy ra lỗi",
        error: { status: 500 },
      });
    }
  },
};

module.exports = adminController;
