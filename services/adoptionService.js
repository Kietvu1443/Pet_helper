const { pool } = require("../config/db");

const adoptionService = {
  // Get all adoption requests joined with users, pets, and pet_images
  async getAllRequests() {
    const [rows] = await pool.execute(`
      SELECT
        ar.id,
        ar.user_id     AS userId,
        u.name         AS adopter,
        u.display_name AS adopterDisplayName,
        u.email        AS adopterEmail,
        u.address      AS adopterAddress,
        ar.pet_id      AS petId,
        p.name         AS petName,
        p.pet_type     AS petType,
        pi.image_path  AS petImage,
        ar.message,
        ar.status,
        ar.reviewed_by AS reviewedBy,
        DATE_FORMAT(ar.created_at, '%Y-%m-%d') AS date
      FROM adoption_requests ar
      JOIN users u  ON ar.user_id = u.id
      JOIN pets  p  ON ar.pet_id  = p.id
      LEFT JOIN pet_images pi ON pi.pet_id = p.id AND pi.display_order = 0
      ORDER BY ar.created_at DESC
    `);
    return rows;
  },

  // Approve an adoption request (uses a transaction to avoid race conditions)
  async approveRequest(requestId, adminId) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Fetch the request and lock the associated pet row
      const [[request]] = await conn.execute(
        "SELECT id, status, pet_id FROM adoption_requests WHERE id = ? FOR UPDATE",
        [requestId]
      );

      if (!request) {
        await conn.rollback();
        return { success: false, message: "Không tìm thấy yêu cầu" };
      }

      if (request.status !== "pending") {
        await conn.rollback();
        return { success: false, message: "Yêu cầu này không còn ở trạng thái chờ xử lý" };
      }

      // 2. Lock the pet row and check it hasn't already been adopted
      const [[pet]] = await conn.execute(
        "SELECT id, status FROM pets WHERE id = ? FOR UPDATE",
        [request.pet_id]
      );

      if (!pet) {
        await conn.rollback();
        return { success: false, message: "Không tìm thấy thú cưng" };
      }

      if (pet.status === "adopted") {
        await conn.rollback();
        return { success: false, message: "Thú cưng này đã được nhận nuôi" };
      }

      // 3. Approve this request
      await conn.execute(
        `UPDATE adoption_requests
         SET status = 'approved', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [adminId, requestId]
      );

      // 4. Mark pet as adopted
      await conn.execute(
        "UPDATE pets SET status = 'adopted' WHERE id = ?",
        [request.pet_id]
      );

      // 5. Reject all other pending requests for the same pet
      await conn.execute(
        `UPDATE adoption_requests
         SET status = 'rejected', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
         WHERE pet_id = ? AND status = 'pending' AND id != ?`,
        [adminId, request.pet_id, requestId]
      );

      await conn.commit();
      return { success: true };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },

  // Reject an adoption request
  async rejectRequest(requestId, adminId) {
    const [[request]] = await pool.execute(
      "SELECT id, status FROM adoption_requests WHERE id = ?",
      [requestId]
    );

    if (!request) {
      return { success: false, message: "Không tìm thấy yêu cầu" };
    }

    if (request.status !== "pending") {
      return { success: false, message: "Yêu cầu này không còn ở trạng thái chờ xử lý" };
    }

    await pool.execute(
      `UPDATE adoption_requests
       SET status = 'rejected', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [adminId, requestId]
    );

    return { success: true };
  },
};

module.exports = adoptionService;
