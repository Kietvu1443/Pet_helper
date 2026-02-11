const { pool } = require("../config/db");

const Pet = {
  // Get all available pets
  async findAll(status = null) {
    try {
      let query = "SELECT * FROM pets";
      let params = [];

      if (status) {
        query += " WHERE status = ?";
        params.push(status);
      }

      query += " ORDER BY created_at DESC";

      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      console.error("Error finding all pets:", error);
      throw error;
    }
  },

  // Get pet by ID
  async findById(id) {
    try {
      const [rows] = await pool.execute("SELECT * FROM pets WHERE id = ?", [
        id,
      ]);
      return rows[0] || null;
    } catch (error) {
      console.error("Error finding pet by ID:", error);
      throw error;
    }
  },

  // Create new pet
  async create(petData) {
    try {
      const {
        name,
        pet_type,
        breed,
        age,
        gender,
        color,
        weight,
        pet_code,
        vaccination,
        description,
        image_url,
        contact_info,
        source_url,
      } = petData;

      const [result] = await pool.execute(
        `INSERT INTO pets (name, pet_type, breed, age, gender, color, weight, pet_code, vaccination, description, image_url, contact_info, source_url) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          pet_type || "Chó",
          breed || null,
          age || null,
          gender || null,
          color || null,
          weight || null,
          pet_code || null,
          vaccination || null,
          description || null,
          image_url || null,
          contact_info || null,
          source_url || null,
        ],
      );

      return { id: result.insertId, ...petData };
    } catch (error) {
      console.error("Error creating pet:", error);
      throw error;
    }
  },

  // Update pet
  async update(id, petData) {
    try {
      const {
        name,
        pet_type,
        breed,
        age,
        gender,
        color,
        weight,
        pet_code,
        vaccination,
        description,
        image_url,
        contact_info,
        source_url,
      } = petData;

      const [result] = await pool.execute(
        `UPDATE pets SET 
          name = ?, pet_type = ?, breed = ?, age = ?, gender = ?,
          color = ?, weight = ?, pet_code = ?, vaccination = ?,
          description = ?, image_url = ?, contact_info = ?, source_url = ?
         WHERE id = ?`,
        [
          name,
          pet_type || "Chó",
          breed || null,
          age || null,
          gender || null,
          color || null,
          weight || null,
          pet_code || null,
          vaccination || null,
          description || null,
          image_url || null,
          contact_info || null,
          source_url || null,
          id,
        ],
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error updating pet:", error);
      throw error;
    }
  },

  // Update pet status
  async updateStatus(id, status) {
    try {
      const [result] = await pool.execute(
        "UPDATE pets SET status = ? WHERE id = ?",
        [status, id],
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error updating pet status:", error);
      throw error;
    }
  },

  // Delete pet
  async delete(id) {
    try {
      const [result] = await pool.execute("DELETE FROM pets WHERE id = ?", [
        id,
      ]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error deleting pet:", error);
      throw error;
    }
  },
};

module.exports = Pet;
