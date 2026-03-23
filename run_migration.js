const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "pet_helper",
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0
  });

  const queries = [
    `CREATE TABLE IF NOT EXISTS reports (
        id INT PRIMARY KEY AUTO_INCREMENT,
        type ENUM('lost','found') NOT NULL,
        reporter_name VARCHAR(255) NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255) NULL,
        address TEXT NULL,
        found_location TEXT NULL,
        pet_code VARCHAR(50) NULL,
        pet_type VARCHAR(50) NOT NULL,
        species VARCHAR(255) NULL,
        color VARCHAR(100) NULL,
        gender ENUM('male','female','unknown') DEFAULT 'unknown',
        description TEXT NULL,
        status ENUM('pending','approved','rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `ALTER TABLE pet_images ADD COLUMN report_id INT NULL`,
    `ALTER TABLE pet_images ADD COLUMN cloudinary_id VARCHAR(255) NULL`,
    `ALTER TABLE pet_images MODIFY COLUMN pet_id INT NULL`,
    `ALTER TABLE pet_images ADD CONSTRAINT fk_petimages_report FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE`,
    `CREATE INDEX idx_reports_status_type ON reports (status, type)`,
    `CREATE INDEX idx_reports_created_desc ON reports (created_at DESC)`,
    `CREATE INDEX idx_petimages_reportid ON pet_images (report_id)`
  ];

  try {
    for (const text of queries) {
      try {
        await pool.query(text);
        console.log("✅ Success:", text.substring(0, 50) + "...");
      } catch (err) {
        // Ignore duplicate column, index or foreign key errors
        if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_DUP_KEYNAME' || err.errno === 1061 || err.code === 'ER_CANT_CREATE_TABLE' || err.errno === 1826) {
          console.log("⏩ Skipped (already exists):", text.substring(0, 50) + "...");
        } else {
          console.error("❌ Error on:", text.substring(0, 50) + "...");
          console.error(err.message);
        }
      }
    }
  } catch (error) {
    console.error("❌ Fatal Migration Error:", error);
  } finally {
    await pool.end();
  }
}

runMigration();
