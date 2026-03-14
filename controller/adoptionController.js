const adoptionService = require("../services/adoptionService");

const adoptionController = {
  // GET /admin/adoption-requests — render admin review page
  showReviewPage: (req, res) => {
    res.render("admin/adoption-review", {
      title: "Xét duyệt nhận nuôi - Pet Helper",
    });
  },

  // GET /admin/api/adoption-requests — return JSON list of all requests
  getAll: async (req, res) => {
    try {
      const requests = await adoptionService.getAllRequests();
      return res.json(requests);
    } catch (error) {
      console.error("Error fetching adoption requests:", error);
      return res.status(500).json({ message: "Lỗi máy chủ" });
    }
  },

  // PATCH /admin/api/adoption-requests/:id/status — approve or reject
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const adminId = req.user.id;

      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Trạng thái không hợp lệ. Chỉ chấp nhận 'approved' hoặc 'rejected'" });
      }

      let result;
      if (status === "approved") {
        result = await adoptionService.approveRequest(Number(id), adminId);
      } else {
        result = await adoptionService.rejectRequest(Number(id), adminId);
      }

      if (!result.success) {
        return res.status(409).json({ message: result.message });
      }

      return res.json({ message: "Cập nhật trạng thái thành công" });
    } catch (error) {
      console.error("Error updating adoption request status:", error);
      return res.status(500).json({ message: "Lỗi máy chủ" });
    }
  },
};

module.exports = adoptionController;
