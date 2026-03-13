const { pool } = require("../config/db");

const AdoptionRequest = {
  // Get all adoption requests with user and pet info
  async findAll(status = null) {
    try {
      const validStatuses = ['pending', 'approved', 'rejected', 'cancelled'];
      let query = `
        SELECT
          ar.id,
          ar.user_id,
          u.display_name AS adopter,
          u.email AS adopter_email,
          ar.pet_id,
          p.name AS pet_name,
          pi.image_path AS pet_image,
          ar.message,
          ar.status,
          ar.reviewed_by,
          ar.created_at,
          ar.reviewed_at
        FROM adoption_requests ar
        JOIN users u ON ar.user_id = u.id
        JOIN pets p ON ar.pet_id = p.id
        LEFT JOIN pet_images pi ON pi.pet_id = p.id AND pi.display_order = 0
      `;
      const params = [];

      if (status) {
        if (!validStatuses.includes(status)) {
          throw new Error(`Invalid status value: ${status}`);
        }
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

  // Get adoption request by ID
  async findById(id) {
    try {
      const [rows] = await pool.execute(
        `SELECT
          ar.id,
          ar.user_id,
          u.display_name AS adopter,
          u.email AS adopter_email,
          ar.pet_id,
          p.name AS pet_name,
          pi.image_path AS pet_image,
          ar.message,
          ar.status,
          ar.reviewed_by,
          ar.created_at,
          ar.reviewed_at
        FROM adoption_requests ar
        JOIN users u ON ar.user_id = u.id
        JOIN pets p ON ar.pet_id = p.id
        LEFT JOIN pet_images pi ON pi.pet_id = p.id AND pi.display_order = 0
        WHERE ar.id = ?`,
        [id],
      );
      return rows[0] || null;
    } catch (error) {
      console.error("Error finding adoption request by ID:", error);
      throw error;
    }
  },

  // Check if user already has a pending/approved request for a pet
  async findExisting(userId, petId) {
    try {
      const [rows] = await pool.execute(
        `SELECT id FROM adoption_requests
         WHERE user_id = ? AND pet_id = ? AND status IN ('pending', 'approved')
         LIMIT 1`,
        [userId, petId],
      );
      return rows[0] || null;
    } catch (error) {
      console.error("Error finding existing adoption request:", error);
      throw error;
    }
  },

  // Create new adoption request
  async create(userId, petId, message) {
    try {
      const [result] = await pool.execute(
        `INSERT INTO adoption_requests (user_id, pet_id, message) VALUES (?, ?, ?)`,
        [userId, petId, message || null],
      );
      return { id: result.insertId };
    } catch (error) {
      console.error("Error creating adoption request:", error);
      throw error;
    }
  },

  // Approve a request using a transaction to avoid race conditions
  async approve(requestId, adminId) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Lock the row to prevent concurrent approval
      const [rows] = await conn.execute(
        `SELECT * FROM adoption_requests WHERE id = ? AND status = 'pending' FOR UPDATE`,
        [requestId],
      );

      if (rows.length === 0) {
        await conn.rollback();
        return {
          success: false,
          message: "Yêu cầu không tồn tại hoặc đã được xử lý",
        };
      }

      const request = rows[0];
      const petId = request.pet_id;

      // Approve this request
      await conn.execute(
        `UPDATE adoption_requests
         SET status = 'approved', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [adminId, requestId],
      );

      // Mark the pet as adopted
      await conn.execute(`UPDATE pets SET status = 'adopted' WHERE id = ?`, [
        petId,
      ]);

      // Reject all other pending requests for the same pet
      await conn.execute(
        `UPDATE adoption_requests
         SET status = 'rejected', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
         WHERE pet_id = ? AND status = 'pending' AND id != ?`,
        [adminId, petId, requestId],
      );

      await conn.commit();
      return { success: true };
    } catch (error) {
      await conn.rollback();
      console.error("Error approving adoption request:", error);
      throw error;
    } finally {
      conn.release();
    }
  },

  // Reject a single request
  async reject(requestId, adminId) {
    try {
      const [result] = await pool.execute(
        `UPDATE adoption_requests
         SET status = 'rejected', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
         WHERE id = ? AND status = 'pending'`,
        [adminId, requestId],
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error rejecting adoption request:", error);
      throw error;
    }
  },
};

module.exports = AdoptionRequest;
