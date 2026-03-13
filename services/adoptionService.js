const { pool } = require("../config/db");
const AdoptionRequest = require("../models/AdoptionRequest");

const adoptionService = {
  // Retrieve adoption requests, optionally filtered by status
  async getAdoptionRequests(status = null) {
    return AdoptionRequest.findAll(status);
  },

  // Approve an adoption request inside a transaction to prevent race conditions
  async approveRequest(requestId, adminId) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Lock the row so no other transaction can approve simultaneously
      const [rows] = await conn.execute(
        "SELECT id, pet_id, status FROM adoption_requests WHERE id = ? FOR UPDATE",
        [requestId]
      );

      if (!rows.length) {
        const err = new Error("Không tìm thấy yêu cầu nhận nuôi");
        err.status = 404;
        throw err;
      }

      const request = rows[0];

      if (request.status !== "pending") {
        const err = new Error("Yêu cầu này đã được xử lý");
        err.status = 400;
        throw err;
      }

      // Approve the selected request
      await AdoptionRequest.updateStatus(requestId, "approved", adminId, conn);

      // Mark the pet as adopted
      await conn.execute(
        "UPDATE pets SET status = 'adopted' WHERE id = ?",
        [request.pet_id]
      );

      // Reject every other pending request for the same pet
      await AdoptionRequest.rejectOtherPending(request.pet_id, requestId, adminId, conn);

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
    const request = await AdoptionRequest.findById(requestId);

    if (!request) {
      const err = new Error("Không tìm thấy yêu cầu nhận nuôi");
      err.status = 404;
      throw err;
    }

    if (request.status !== "pending") {
      const err = new Error("Yêu cầu này đã được xử lý");
      err.status = 400;
      throw err;
    }

    await AdoptionRequest.updateStatus(requestId, "rejected", adminId);
    return { success: true };
  },
};

module.exports = adoptionService;
