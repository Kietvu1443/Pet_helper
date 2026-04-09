const adoptionRequestService = require("../service/adoptionRequestService");

const allowedStatuses = ["approved", "rejected"];

const adoptionRequestController = {
  renderAdminPage(req, res) {
    res.render("admin/adoption-review", {
      title: "Xét Duyệt Thú Cưng - Pet Helper",
    });
  },

  async createAdoptionRequest(req, res) {
    try {
      const petId = Number(req.body.petId);
      const message = String(req.body.message || "").trim();

      if (!petId || Number.isNaN(petId)) {
        return res.status(400).json({ message: "petId không hợp lệ" });
      }

      if (!message) {
        return res.status(400).json({ message: "Vui lòng nhập lý do nhận nuôi" });
      }

      const result = await adoptionRequestService.createAdoptionRequest({
        userId: req.user.id,
        petId,
        message,
      });

      return res.status(201).json({
        message: "Đăng ký nhận nuôi thành công",
        request: result,
      });
    } catch (error) {
      return res
        .status(error.status || 500)
        .json({ message: error.message || "Không thể gửi yêu cầu nhận nuôi" });
    }
  },

  async getAdminAdoptionRequests(req, res) {
    try {
      const requests = await adoptionRequestService.getAdminAdoptionRequests();
      return res.status(200).json({ requests });
    } catch (error) {
      return res.status(500).json({ message: "Không thể tải danh sách hồ sơ" });
    }
  },

  async updateAdminAdoptionRequestStatus(req, res) {
    try {
      const requestId = Number(req.params.id);
      const status = req.body.status;

      if (!requestId || Number.isNaN(requestId)) {
        return res.status(400).json({ message: "ID hồ sơ không hợp lệ" });
      }

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "Trạng thái không hợp lệ" });
      }

      const result = await adoptionRequestService.updateAdoptionRequestStatus({
        requestId,
        status,
        reviewerId: req.user.id,
      });

      return res.status(200).json({
        message: "Cập nhật trạng thái thành công",
        request: result,
      });
    } catch (error) {
      return res
        .status(error.status || 500)
        .json({ message: error.message || "Không thể cập nhật trạng thái" });
    }
  },

  async revertApprovedRequest(req, res) {
    try {
      const requestId = Number(req.params.id);
      if (!requestId || Number.isNaN(requestId)) {
        return res.status(400).json({ message: "ID hồ sơ không hợp lệ" });
      }

      const result = await adoptionRequestService.revertApprovedRequest({
        requestId,
      });

      return res.status(200).json({
        message: "Huỷ duyệt thành công",
        request: result,
      });
    } catch (error) {
      return res
        .status(error.status || 500)
        .json({ message: error.message || "Không thể huỷ duyệt hồ sơ" });
    }
  },
};

module.exports = adoptionRequestController;
