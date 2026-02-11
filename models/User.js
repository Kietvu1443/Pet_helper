const { pool } = require("../config/db");
const bcrypt = require("bcryptjs");

const User = {
  // Find user by email
  async findByEmail(email) {
    try {
      const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [
        email,
      ]);
      return rows[0] || null;
    } catch (error) {
      console.error("Error finding user by email:", error);
      throw error;
    }
  },

  // Find user by display name (for login)
  async findByDisplayName(displayName) {
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM users WHERE display_name = ?",
        [displayName],
      );
      return rows[0] || null;
    } catch (error) {
      console.error("Error finding user by display name:", error);
      throw error;
    }
  },

  // Find user by ID
  async findById(id) {
    try {
      const [rows] = await pool.execute(
        "SELECT id, display_name, name, email, role, birthday, address, created_at FROM users WHERE id = ?",
        [id],
      );
      return rows[0] || null;
    } catch (error) {
      console.error("Error finding user by ID:", error);
      throw error;
    }
  },

  // Create new user
  async create(userData) {
    try {
      const { display_name, name, email, password, birthday, address } =
        userData;

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const [result] = await pool.execute(
        `INSERT INTO users (display_name, name, email, password, role, birthday, address) 
         VALUES (?, ?, ?, ?, 2, ?, ?)`,
        [
          display_name,
          name,
          email,
          hashedPassword,
          birthday || null,
          address || null,
        ],
      );

      return { id: result.insertId, display_name, name, email, role: 2 };
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  // Compare password
  async comparePassword(inputPassword, hashedPassword) {
    return bcrypt.compare(inputPassword, hashedPassword);
  },

  // Update user role (admin only)
  async updateRole(userId, newRole) {
    try {
      const [result] = await pool.execute(
        "UPDATE users SET role = ? WHERE id = ?",
        [newRole, userId],
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error updating user role:", error);
      throw error;
    }
  },

  // Get all users (admin only)
  async findAll() {
    try {
      const [rows] = await pool.execute(
        "SELECT id, display_name, name, email, role, created_at FROM users ORDER BY created_at DESC",
      );
      return rows;
    } catch (error) {
      console.error("Error finding all users:", error);
      throw error;
    }
  },
};

module.exports = User;
