const { pool } = require("../config/db");

const PetLike = {
  // Create a new like/pass interaction
  async create(userId, petId, status) {
    try {
      const [result] = await pool.execute(
        "INSERT INTO pet_likes (user_id, pet_id, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE status = ?",
        [userId, petId, status, status],
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error creating pet like:", error);
      throw error;
    }
  },

  // Get random pets that the user hasn't interacted with yet
  async findRandomPets(userId, limit = 10) {
    try {
      // IMPORTANT: Use pool.query() instead of pool.execute() because
      // mysql2 prepared statements (execute) don't handle LIMIT ? correctly
      // (they stringify the parameter, causing SQL errors).
      const safeLimit = parseInt(limit, 10) || 10;
      const query = `
        SELECT p.* 
        FROM pets p 
        LEFT JOIN pet_likes pl ON p.id = pl.pet_id AND pl.user_id = ?
        WHERE pl.id IS NULL AND p.status = 'available'
        ORDER BY RAND() 
        LIMIT ${safeLimit}
      `;
      const [rows] = await pool.execute(query, [userId]);
      return rows;
    } catch (error) {
      console.error("Error finding random pets:", error);
      throw error;
    }
  },

  // Get pets liked by the user
  async findLikedPets(userId) {
    try {
      const query = `
        SELECT p.*, pl.created_at as liked_at
        FROM pets p
        JOIN pet_likes pl ON p.id = pl.pet_id
        WHERE pl.user_id = ? AND pl.status = 'liked'
        ORDER BY pl.created_at DESC
      `;
      const [rows] = await pool.execute(query, [userId]);
      return rows;
    } catch (error) {
      console.error("Error finding liked pets:", error);
      throw error;
    }
  },
};

module.exports = PetLike;
