const User = require("../models/User");
const Report = require("../models/Report");
const { pool } = require("../config/db");
const { sendSuccess, sendError } = require("../utils/apiResponse");

const ALLOWED_STATUSES = ["active", "banned"];
const ALLOWED_ROLES = [1, 2]; // Admin (0) cannot be assigned via API
const ALLOWED_REPORT_ACTIONS = ["resolve", "reject", "ban"];

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const adminApiV1Controller = {
  /**
   * GET /api/v1/admin/users
   * Admin & Staff can view users with pagination and filtering.
   */
  async getUsers(req, res) {
    try {
      const page = Math.max(1, toNumber(req.query.page, 1));
      const limit = Math.min(50, Math.max(1, toNumber(req.query.limit, 20)));
      const status = ALLOWED_STATUSES.includes(req.query.status) ? req.query.status : undefined;
      const role = req.query.role !== undefined ? Number(req.query.role) : undefined;

      // Validate role filter
      if (role !== undefined && ![0, 1, 2].includes(role)) {
        return sendError(res, 400, "Giá trị role không hợp lệ (0, 1, hoặc 2)");
      }

      const result = await User.findAll({ page, limit, status, role });
      const totalPages = Math.ceil(result.total / limit);

      return sendSuccess(res, 200, "Lấy danh sách người dùng thành công", {
        data: result.data,
        page,
        limit,
        total: result.total,
        totalPages,
      });
    } catch (error) {
      console.error("[Admin API v1] getUsers error:", error);
      return sendError(res, 500, "Không thể tải danh sách người dùng");
    }
  },

  /**
   * PATCH /api/v1/admin/users/:id/role
   * Admin only. Change user role (staff <-> user).
   */
  async updateUserRole(req, res) {
    try {
      const targetId = Number(req.params.id);
      const newRole = Number(req.body.role);

      // Validate input
      if (!targetId || Number.isNaN(targetId)) {
        return sendError(res, 400, "ID người dùng không hợp lệ");
      }
      if (!ALLOWED_ROLES.includes(newRole)) {
        return sendError(res, 400, "Giá trị role không hợp lệ (chỉ cho phép 1 hoặc 2)");
      }

      // Prevent self-modification
      if (req.user.id === targetId) {
        return sendError(res, 400, "Bạn không thể tự thay đổi quyền của chính mình");
      }

      // Check target user exists
      const targetUser = await User.findById(targetId);
      if (!targetUser) {
        return sendError(res, 404, "Không tìm thấy người dùng");
      }

      // Prevent changing another admin's role
      if (targetUser.role === 0) {
        return sendError(res, 403, "Không thể thay đổi quyền của admin khác");
      }

      const updated = await User.updateRole(targetId, newRole);
      if (!updated) {
        return sendError(res, 500, "Không thể cập nhật quyền người dùng");
      }

      return sendSuccess(res, 200, "Cập nhật quyền thành công", {
        userId: targetId,
        role: newRole,
      });
    } catch (error) {
      console.error("[Admin API v1] updateUserRole error:", error);
      return sendError(res, 500, "Đã xảy ra lỗi khi cập nhật quyền");
    }
  },

  /**
   * PATCH /api/v1/admin/users/:id/status
   * Admin only. Ban or unban a user.
   */
  async updateUserStatus(req, res) {
    try {
      const targetId = Number(req.params.id);
      const status = req.body.status;
      const reason = String(req.body.reason || "").trim() || null;

      // Validate input
      if (!targetId || Number.isNaN(targetId)) {
        return sendError(res, 400, "ID người dùng không hợp lệ");
      }
      if (!ALLOWED_STATUSES.includes(status)) {
        return sendError(res, 400, "Trạng thái không hợp lệ (active hoặc banned)");
      }

      // Prevent self-ban
      if (req.user.id === targetId) {
        return sendError(res, 400, "Bạn không thể tự khóa chính mình");
      }

      // Check target user exists
      const targetUser = await User.findById(targetId);
      if (!targetUser) {
        return sendError(res, 404, "Không tìm thấy người dùng");
      }

      // Prevent banning another admin
      if (targetUser.role === 0) {
        return sendError(res, 403, "Không thể khóa tài khoản admin khác");
      }

      const updated = await User.updateStatus(targetId, status, reason);
      if (!updated) {
        return sendError(res, 500, "Không thể cập nhật trạng thái người dùng");
      }

      return sendSuccess(res, 200, status === "banned" ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản", {
        userId: targetId,
        status,
      });
    } catch (error) {
      console.error("[Admin API v1] updateUserStatus error:", error);
      return sendError(res, 500, "Đã xảy ra lỗi khi cập nhật trạng thái");
    }
  },

  /**
   * GET /api/v1/admin/reports
   * Admin & Staff can view reports with pagination and status filter.
   */
  async getReports(req, res) {
    try {
      const page = Math.max(1, toNumber(req.query.page, 1));
      const limit = Math.min(100, Math.max(1, toNumber(req.query.limit, 20)));
      const status = req.query.status || null;

      // Validate status filter
      if (status && !["pending", "approved", "rejected", "resolved"].includes(status)) {
        return sendError(res, 400, "Trạng thái lọc không hợp lệ");
      }

      const result = await Report.findAll({ page, limit, status });
      const totalPages = Math.ceil(result.total / limit);

      return sendSuccess(res, 200, "Lấy danh sách báo cáo thành công", {
        data: result.data,
        page,
        limit,
        total: result.total,
        totalPages,
      });
    } catch (error) {
      console.error("[Admin API v1] getReports error:", error);
      return sendError(res, 500, "Không thể tải danh sách báo cáo");
    }
  },

  /**
   * PATCH /api/v1/admin/reports/:id
   * Admin only. Handle a report: resolve, reject, or ban (resolve + ban user).
   * The "ban" action uses a database transaction.
   */
  async handleReport(req, res) {
    try {
      const reportId = Number(req.params.id);
      const action = req.body.action;
      const reason = String(req.body.reason || "").trim() || null;

      // Validate input
      if (!reportId || Number.isNaN(reportId)) {
        return sendError(res, 400, "ID báo cáo không hợp lệ");
      }
      if (!ALLOWED_REPORT_ACTIONS.includes(action)) {
        return sendError(res, 400, "Hành động không hợp lệ (resolve, reject, hoặc ban)");
      }

      // Find report
      const report = await Report.findById(reportId);
      if (!report) {
        return sendError(res, 404, "Không tìm thấy báo cáo");
      }
      if (report.status !== "pending" && report.status !== "approved") {
        return sendError(res, 409, "Báo cáo này đã được xử lý");
      }

      // Simple resolve or reject (no transaction needed)
      if (action === "resolve" || action === "reject") {
        const newStatus = action === "resolve" ? "resolved" : "rejected";
        await Report.updateStatus(reportId, newStatus);
        return sendSuccess(res, 200, `Báo cáo đã được ${action === "resolve" ? "xử lý" : "từ chối"}`, {
          reportId,
          status: newStatus,
        });
      }

      // Ban action: resolve report + ban user in a transaction
      if (action === "ban") {
        if (!report.user_id) {
          return sendError(res, 400, "Báo cáo này không có thông tin người dùng để khóa");
        }

        // Check the target user
        const targetUser = await User.findById(report.user_id);
        if (!targetUser) {
          return sendError(res, 404, "Không tìm thấy người dùng liên quan");
        }
        if (targetUser.role === 0) {
          return sendError(res, 403, "Không thể khóa tài khoản admin");
        }
        if (targetUser.status === "banned") {
          // User already banned, just resolve the report
          await Report.updateStatus(reportId, "resolved");
          return sendSuccess(res, 200, "Người dùng đã bị khóa trước đó. Báo cáo đã được xử lý.", {
            reportId,
            status: "resolved",
            userId: report.user_id,
            userStatus: "banned",
          });
        }

        // Transaction: resolve report + ban user
        const connection = await pool.getConnection();
        try {
          await connection.beginTransaction();

          await connection.execute(
            "UPDATE reports SET status = 'resolved' WHERE id = ?",
            [reportId],
          );

          const bannedAt = new Date();
          const banReason = reason || "Vi phạm quy định (từ báo cáo #" + reportId + ")";
          await connection.execute(
            "UPDATE users SET status = 'banned', banned_reason = ?, banned_at = ? WHERE id = ?",
            [banReason, bannedAt, report.user_id],
          );

          await connection.commit();

          return sendSuccess(res, 200, "Đã xử lý báo cáo và khóa tài khoản người dùng", {
            reportId,
            status: "resolved",
            userId: report.user_id,
            userStatus: "banned",
          });
        } catch (error) {
          await connection.rollback();
          throw error;
        } finally {
          connection.release();
        }
      }
    } catch (error) {
      console.error("[Admin API v1] handleReport error:", error);
      return sendError(res, 500, "Đã xảy ra lỗi khi xử lý báo cáo");
    }
  },
};

module.exports = adminApiV1Controller;
