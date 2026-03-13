const { pool } = require("../config/db");

const AdoptionRequest = {
  // Get all adoption requests with user + pet + image info
  async findAll(status = null) {
    try {
      let query = `
        SELECT
          ar.id,
          ar.user_id   AS userId,
          u.display_name AS adopter,
          ar.pet_id    AS petId,
          p.name       AS petName,
          ar.message,
          ar.status,
          ar.reviewed_by  AS reviewedBy,
          ar.created_at   AS date,
          ar.reviewed_at  AS reviewedAt,
          pi.image_path   AS petImage
        FROM adoption_requests ar
        JOIN users  u  ON u.id  = ar.user_id
        JOIN pets   p  ON p.id  = ar.pet_id
        LEFT JOIN pet_images pi ON pi.pet_id = ar.pet_id AND pi.display_order = 0
      `;
      const params = [];

      if (status) {
        query += " WHERE ar.status = ?";
        params.push(status);
      }

      query += " ORDER BY ar.created_at DESC";

      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      console.error("Error finding adoption requests:", error);
      throw error;
    }
  },

  // Get single adoption request by ID
  async findById(id) {
    try {
      const [rows] = await pool.execute(
        `SELECT
          ar.id,
          ar.user_id   AS userId,
          u.display_name AS adopter,
          u.email        AS adopterEmail,
          ar.pet_id    AS petId,
          p.name       AS petName,
          ar.message,
          ar.status,
          ar.reviewed_by  AS reviewedBy,
          ar.created_at   AS date,
          ar.reviewed_at  AS reviewedAt,
          pi.image_path   AS petImage
        FROM adoption_requests ar
        JOIN users  u  ON u.id  = ar.user_id
        JOIN pets   p  ON p.id  = ar.pet_id
        LEFT JOIN pet_images pi ON pi.pet_id = ar.pet_id AND pi.display_order = 0
        WHERE ar.id = ?`,
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      console.error("Error finding adoption request by ID:", error);
      throw error;
    }
  },

  // Update status of a single request (with optional connection for transactions)
  async updateStatus(id, status, reviewedBy, conn = null) {
    try {
      const executor = conn || pool;
      const [result] = await executor.execute(
        `UPDATE adoption_requests
         SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [status, reviewedBy, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error updating adoption request status:", error);
      throw error;
    }
  },

  // Reject all other pending requests for the same pet (used during approval)
  async rejectOtherPending(petId, approvedId, reviewedBy, conn = null) {
    try {
      const executor = conn || pool;
      const [result] = await executor.execute(
        `UPDATE adoption_requests
         SET status = 'rejected', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
         WHERE pet_id = ? AND status = 'pending' AND id != ?`,
        [reviewedBy, petId, approvedId]
      );
      return result.affectedRows;
    } catch (error) {
      console.error("Error rejecting other pending requests:", error);
      throw error;
    }
  },
};

module.exports = AdoptionRequest;
