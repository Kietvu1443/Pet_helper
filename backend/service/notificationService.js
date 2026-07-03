/**
 * notificationService.js
 * Ghi thông báo vào bảng `notifications`.
 * Thiết kế mở rộng: có thể thêm email/push sau này.
 */
const { pool } = require("../config/db");

const notificationService = {
  /**
   * Gửi thông báo cho một user.
   * @param {number} userId
   * @param {string} title
   * @param {string} message
   * @param {string} type - 'system' | 'return_workflow'
   */
  async send(userId, title, message, type = "return_workflow") {
    try {
      await pool.execute(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
        [userId, title, message, type],
      );
    } catch (err) {
      // Không throw để không làm gián đoạn luồng chính
      console.error("[notificationService] Ghi thông báo thất bại:", err.message);
    }
  },

  /**
   * Lấy danh sách thông báo của user (20 mới nhất).
   */
  async getForUser(userId, limit = 20) {
    const [rows] = await pool.execute(
      `SELECT id, title, message, type, is_read, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [userId, String(limit)],
    );
    return rows;
  },

  /**
   * Đánh dấu tất cả thông báo của user là đã đọc.
   */
  async markAllRead(userId) {
    await pool.execute(
      `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`,
      [userId],
    );
  },

  /**
   * Đếm số thông báo chưa đọc.
   */
  async countUnread(userId) {
    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? AND is_read = 0`,
      [userId],
    );
    return total;
  },

  // ── Message templates cho Pet Return Workflow ─────────────────────────────

  async notifyStaffNewReturn(staffUserIds, petName, returnId) {
    for (const sid of staffUserIds) {
      await this.send(
        sid,
        "📬 Yêu cầu trả thú cưng mới",
        `Có yêu cầu trả lại "${petName}" (Mã hồ sơ: #${returnId}). Vui lòng xem xét và xử lý.`,
      );
    }
  },

  async notifyUserStatusChange(userId, petName, newStatus, adminNotes) {
    const statusMessages = {
      approved_online: {
        title: "✅ Yêu cầu trả đã được duyệt online",
        message: `Yêu cầu trả "${petName}" đã được chấp thuận. ${adminNotes ? `Ghi chú từ trạm: ${adminNotes}` : "Vui lòng liên hệ trạm để sắp xếp bàn giao thực tế."}`,
      },
      completed: {
        title: "🏡 Bàn giao thú cưng hoàn tất",
        message: `Trạm đã xác nhận nhận lại "${petName}". Cảm ơn bạn đã liên hệ và hợp tác.`,
      },
      rejected: {
        title: "❌ Yêu cầu trả bị từ chối",
        message: `Yêu cầu trả "${petName}" đã bị từ chối. ${adminNotes ? `Lý do: ${adminNotes}` : "Vui lòng liên hệ trạm để được hỗ trợ thêm."}`,
      },
      cancelled: {
        title: "🔄 Yêu cầu trả đã hủy",
        message: `Yêu cầu trả "${petName}" của bạn đã được hủy thành công.`,
      },
    };

    const tpl = statusMessages[newStatus];
    if (tpl) {
      await this.send(userId, tpl.title, tpl.message);
    }
  },
};

module.exports = notificationService;
