const AdoptionRequest = require("../models/AdoptionRequest");

const adoptionController = {
  // GET /admin/adoption-review – Render the admin adoption review page
  showReviewPage: (req, res) => {
    res.render("admin/adoption-review", {
      title: "Xét duyệt nhận nuôi - Pet Helper",
    });
  },

  // GET /api/admin/adoption-requests – Return all adoption requests as JSON
  getAdoptionRequests: async (req, res) => {
    try {
      const { status } = req.query;
      const requests = await AdoptionRequest.findAll(status || null);

      const formatted = requests.map((r) => ({
        id: r.id,
        userId: r.user_id,
        adopter: r.adopter,
        adopterEmail: r.adopter_email,
        petId: r.pet_id,
        petName: r.pet_name,
        petImage: r.pet_image,
        message: r.message,
        status: r.status,
        date: r.created_at
          ? new Date(r.created_at).toISOString().split("T")[0]
          : null,
        reviewedAt: r.reviewed_at
          ? new Date(r.reviewed_at).toISOString().split("T")[0]
          : null,
      }));

      res.json(formatted);
    } catch (error) {
      console.error("Error fetching adoption requests:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  // PATCH /api/admin/adoption-requests/:id/status – Approve or reject a request
  updateRequestStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Trạng thái không hợp lệ" });
      }

      const adminId = req.user.id;

      if (status === "approved") {
        const result = await AdoptionRequest.approve(id, adminId);
        if (!result.success) {
          return res.status(400).json({ message: result.message });
        }
      } else {
        const updated = await AdoptionRequest.reject(id, adminId);
        if (!updated) {
          return res.status(400).json({
            message: "Yêu cầu không tồn tại hoặc đã được xử lý",
          });
        }
      }

      res.json({
        success: true,
        message:
          status === "approved" ? "Đã duyệt yêu cầu" : "Đã từ chối yêu cầu",
      });
    } catch (error) {
      console.error("Error updating adoption request status:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  // POST /api/adoption-requests – Submit a new adoption request (authenticated users)
  submitRequest: async (req, res) => {
    try {
      const userId = req.user.id;
      const { petId, message } = req.body;

      if (!petId) {
        return res.status(400).json({ message: "Thiếu thông tin thú cưng" });
      }

      // Prevent duplicate requests
      const existing = await AdoptionRequest.findExisting(userId, petId);
      if (existing) {
        return res.status(400).json({
          message: "Bạn đã gửi yêu cầu nhận nuôi cho thú cưng này rồi",
        });
      }

      const newRequest = await AdoptionRequest.create(userId, petId, message);
      res.status(201).json({
        success: true,
        id: newRequest.id,
        message: "Đã gửi yêu cầu nhận nuôi thành công",
      });
    } catch (error) {
      console.error("Error submitting adoption request:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  },
};

module.exports = adoptionController;
