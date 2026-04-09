const reportService = require("../service/reportService");
const {
  isProduction,
  getImageUrl,
  getCloudinaryId,
} = require("../config/upload");

// Phone regex validation: 9-15 digits, optionally starting with + or containing -
const PHONE_REGEX = /^[0-9\-\+]{9,15}$/;

const reportController = {
  // ============ PAGE RENDERS ============

  renderLostForm(req, res) {
    res.render("reports", {
      title: "Đăng Tin Tìm Bé Lạc - Pet Helper",
      oldData: null,
      error: null,
    });
  },

  renderFoundForm(req, res) {
    res.render("founded", {
      title: "Báo Tin Đã Tìm Thấy Bé - Pet Helper",
      oldData: null,
      error: null,
    });
  },

  renderPublicList(req, res) {
    res.render("report-list", {
      title: "Thú Cưng Thất Lạc & Tìm Thấy - Pet Helper",
      submitted: req.query.submitted || undefined,
    });
  },

  renderMyReports(req, res) {
    res.render("my-reports", {
      title: "Báo Cáo Của Tôi - Pet Helper",
    });
  },

  renderAdminPage(req, res) {
    res.render("admin/reports", {
      title: "Quản Lý Báo Cáo - Pet Helper",
    });
  },
    renderSheep(req, res) {
    res.render("Sheep", {
      title: "Cute smool sheep",
    });
  },


  renderTips(req, res) {
    res.render("tips", {
      title: "Mẹo Tìm Kiếm Hiệu Quả - Pet Helper",
      modalTitle: "Mẹo Tìm Kiếm Hiệu Quả",
      subTitle: "Đừng hoảng loạn, hãy bình tĩnh!",
      tips: [
        { 
          icon: "ph-clock-countdown", 
          colorClass: "bg-teal-100 text-teal-600",
          title: "1. Tìm kiếm trong \"Giờ Vàng\"", 
          desc: "3 tiếng đầu tiên là quan trọng nhất. Hãy tìm quanh bán kính 500m từ nơi thất lạc." 
        },
        { 
          icon: "ph-t-shirt", 
          colorClass: "bg-orange-100 text-orange-500",
          title: "2. Đặt đồ vật quen thuộc", 
          desc: "Đặt khay cát (đối với mèo) hoặc bát ăn, áo cũ của bạn trước cửa. Mùi hương quen thuộc sẽ dẫn đường bé về." 
        },
        { 
          icon: "ph-share-network", 
          colorClass: "bg-blue-100 text-blue-600",
          title: "3. Tận dụng mạng xã hội", 
          desc: "Đăng bài vào các hội nhóm cứu trợ, thú cưng tại khu vực. Ghi rõ SĐT và có hậu tạ nếu cần." 
        },
        { 
          icon: "ph-security-camera", 
          colorClass: "bg-purple-100 text-purple-600",
          title: "4. Kiểm tra camera", 
          desc: "Nhờ hàng xóm kiểm tra camera an ninh để xem hướng di chuyển của bé." 
        },
        { 
          icon: "ph-heart-beat", 
          colorClass: "bg-pink-100 text-pink-500",
          title: "5. Trấn an tinh thần", 
          desc: "Thú cưng rất nhạy cảm với tâm trạng của chủ. Nếu bạn quá hoảng loạn, bé có thể sợ hãi mà trốn kỹ hơn. Hãy gọi tên bé với giọng nhẹ nhàng, vui vẻ như lúc cho ăn.",
          fullWidth: true
        }
      ]
    });
  },

  // ============ FORM SUBMISSION ============

  async submitReport(req, res) {
    try {
      const { type } = req.body;

      // --- Validate type ---
      if (!type || !["lost", "found"].includes(type)) {
        return res.status(400).json({ message: "Loại báo cáo không hợp lệ (lost hoặc found)" });
      }

      // --- Validate images ---
      const files = req.files || [];
      if (files.length === 0) {
        return res.status(400).json({ message: "Vui lòng tải lên ít nhất một ảnh" });
      }

      // --- Build report data based on source form ---
      let reportData;

      if (type === "lost") {
        // reports.ejs field mapping
        const phone = req.body.phone || "";
        if (!phone || !PHONE_REGEX.test(phone.trim())) {
          return res.status(400).json({ message: "Số điện thoại không hợp lệ (9-15 ký tự số)" });
        }
        reportData = {
          type: "lost",
          reporter_name: req.body.name || null,
          phone: phone.trim(),
          email: req.body.email || null,
          address: req.body.location || null,
          found_location: null,
          pet_code: null,
          pet_type: req.body.type_pet || req.body.type || "Khác", // 'type' in form is species selector
          species: req.body.species || null,
          color: req.body.color || null,
          gender: req.body.gender || "unknown",
          description: req.body.description || null,
        };
        // Fix: The form's select `name="type"` is used for the report type hidden field,
        // so we need a separate mapping for pet_type from the original 'type' select
        // which has been renamed in the form to 'pet_type'
        reportData.pet_type = req.body.pet_type || "Khác";
      } else {
        // founded.ejs field mapping
        const phone = req.body.phone || "";
        if (!phone || !PHONE_REGEX.test(phone.trim())) {
          return res.status(400).json({ message: "Số điện thoại không hợp lệ (9-15 ký tự số)" });
        }
        reportData = {
          type: "found",
          reporter_name: req.body.finderName || null,
          phone: phone.trim(),
          email: req.body.email || null,
          address: null,
          found_location: req.body.location || null,
          pet_code: null,
          pet_type: req.body.species || "Khác",
          species: null,
          color: req.body.furColor || null,
          gender: req.body.gender || "unknown",
          description: req.body.description || null,
        };
      }

      reportData.user_id = req.user && req.user.id ? Number(req.user.id) : null;

      // --- Process uploaded images ---
      const imageRecords = files.map((file) => ({
        imagePath: isProduction ? file.path : getImageUrl(file),
        cloudinaryId: getCloudinaryId(file),
      }));

      // --- Create report (transactional) ---
      await reportService.createReport(reportData, imageRecords);

      // Redirect to a success page or back
      return res.redirect("/reports/list?submitted=1");
    } catch (error) {
      console.error("Error submitting report:", error);
      return res.status(500).json({ message: "Đã xảy ra lỗi khi gửi báo cáo" });
    }
  },

  // ============ PUBLIC API ============

  async getPublicReports(req, res) {
    try {
      const type = req.query.type || null;
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));

      const result = await reportService.getPublicReports({ type, page, limit });
      return res.json(result);
    } catch (error) {
      console.error("Error fetching public reports:", error);
      return res.status(500).json({ message: "Không thể tải danh sách báo cáo" });
    }
  },

  async getMyReports(req, res) {
    try {
      const userId = req.user && req.user.id ? Number(req.user.id) : 0;
      if (!userId || Number.isNaN(userId)) {
        return res.status(401).json({ message: "Vui lòng đăng nhập" });
      }

      const view = req.query.view === "recent" ? "recent" : "full";

      if (view === "recent") {
        const limit = Math.min(10, Math.max(5, parseInt(req.query.limit) || 8));
        const result = await reportService.getMyRecentReports({ userId, limit });
        return res.json({ view, ...result });
      }

      const status = ["pending", "approved", "rejected"].includes(req.query.status)
        ? req.query.status
        : null;
      const type = ["lost", "found"].includes(req.query.type) ? req.query.type : null;
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(24, Math.max(6, parseInt(req.query.limit) || 12));

      const result = await reportService.getMyReports({
        userId,
        status,
        type,
        page,
        limit,
      });

      return res.json({ view, ...result });
    } catch (error) {
      console.error("Error fetching my reports:", error);
      return res.status(500).json({ message: "Không thể tải báo cáo của bạn" });
    }
  },

  // ============ ADMIN API ============

  async getAdminReports(req, res) {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));

      const result = await reportService.getAdminReports({ page, limit });
      return res.json(result);
    } catch (error) {
      console.error("Error fetching admin reports:", error);
      return res.status(500).json({ message: "Không thể tải danh sách báo cáo" });
    }
  },

  async updateReportStatus(req, res) {
    try {
      const reportId = Number(req.params.id);
      const { status } = req.body;

      if (!reportId || Number.isNaN(reportId)) {
        return res.status(400).json({ message: "ID báo cáo không hợp lệ" });
      }

      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Trạng thái không hợp lệ" });
      }

      const result = await reportService.updateReportStatus({ reportId, status });
      return res.json({ message: "Cập nhật trạng thái thành công", report: result });
    } catch (error) {
      return res
        .status(error.status || 500)
        .json({ message: error.message || "Không thể cập nhật trạng thái" });
    }
  },

  async revertReport(req, res) {
    try {
      const reportId = Number(req.params.id);
      if (!reportId || Number.isNaN(reportId)) {
        return res.status(400).json({ message: "ID báo cáo không hợp lệ" });
      }

      const result = await reportService.revertReport({ reportId });
      return res.json({ message: "Hoàn tác thành công", report: result });
    } catch (error) {
      return res
        .status(error.status || 500)
        .json({ message: error.message || "Không thể hoàn tác báo cáo" });
    }
  },

  async deleteReport(req, res) {
    try {
      const reportId = Number(req.params.id);
      if (!reportId || Number.isNaN(reportId)) {
        return res.status(400).json({ message: "ID báo cáo không hợp lệ" });
      }

      const result = await reportService.deleteReport(reportId);
      return res.json({ message: "Xóa báo cáo thành công", report: result });
    } catch (error) {
      return res
        .status(error.status || 500)
        .json({ message: error.message || "Không thể xóa báo cáo" });
    }
  },
};

module.exports = reportController;
