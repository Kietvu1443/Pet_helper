const { pool } = require("../config/db");

const DEFAULT_PLACEHOLDER_IMAGE = "/images/logo.svg";

const Report = {
  /**
   * Create a new report inside a transaction.
   * Returns the created report object.
   */
  async create(data, connection = null) {
    const conn = connection || pool;
    const {
      type,
      reporter_name,
      phone,
      email,
      address,
      found_location,
      pet_code,
      pet_type,
      species,
      color,
      gender,
      description,
    } = data;

    const [result] = await conn.execute(
      `INSERT INTO reports
        (type, reporter_name, phone, email, address, found_location, pet_code, pet_type, species, color, gender, description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        type,
        reporter_name || null,
        phone,
        email || null,
        address || null,
        found_location || null,
        pet_code || null,
        pet_type,
        species || null,
        color || null,
        gender || "unknown",
        description || null,
      ],
    );

    return { id: result.insertId, ...data, status: "pending" };
  },

  /**
   * Find a report by ID
   */
  async findById(id) {
    const [rows] = await pool.execute(
      "SELECT * FROM reports WHERE id = ? LIMIT 1",
      [id],
    );
    return rows[0] || null;
  },

  /**
   * Update report status (approve / reject)
   */
  async updateStatus(id, status) {
    const [result] = await pool.execute(
      "UPDATE reports SET status = ? WHERE id = ?",
      [status, id],
    );
    return result.affectedRows > 0;
  },

  /**
   * Find all reports (admin) with pagination.
   * Returns { data, total }
   */
  async findAll({ page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;

    const [countRows] = await pool.execute(
      "SELECT COUNT(*) AS total FROM reports",
    );
    const total = countRows[0].total;

    const [rows] = await pool.execute(
      `SELECT r.*,
              (SELECT pi.image_path FROM pet_images pi WHERE pi.report_id = r.id ORDER BY pi.display_order ASC LIMIT 1) AS image
       FROM reports r
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [String(limit), String(offset)],
    );

    // Fallback placeholder
    for (const row of rows) {
      if (!row.image) row.image = DEFAULT_PLACEHOLDER_IMAGE;
    }

    return { data: rows, total };
  },

  /**
   * Find approved reports filtered by type, with pagination.
   * Returns { data, total }
   */
  async findApproved({ type, page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const params = [];
    let whereClause = "WHERE r.status = 'approved'";

    if (type && (type === "lost" || type === "found")) {
      whereClause += " AND r.type = ?";
      params.push(type);
    }

    // Count
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM reports r ${whereClause}`,
      params,
    );
    const total = countRows[0].total;

    // Data
    const queryParams = [...params, String(limit), String(offset)];
    const [rows] = await pool.execute(
      `SELECT r.id, r.type, r.description,
              COALESCE(r.address, r.found_location) AS location,
              r.reporter_name, r.phone, r.created_at,
              (SELECT pi.image_path FROM pet_images pi WHERE pi.report_id = r.id ORDER BY pi.display_order ASC LIMIT 1) AS image
       FROM reports r
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      queryParams,
    );

    // Fallback placeholder
    for (const row of rows) {
      if (!row.image) row.image = DEFAULT_PLACEHOLDER_IMAGE;
    }

    return { data: rows, total };
  },

  /**
   * Delete a report by ID
   */
  async delete(id) {
    const [result] = await pool.execute("DELETE FROM reports WHERE id = ?", [
      id,
    ]);
    return result.affectedRows > 0;
  },
};

module.exports = Report;
