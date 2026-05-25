/**
 * run-migration.js (v2) - Chạy từng statement một, đơn giản và debug rõ hơn
 */
require("dotenv").config();
const { pool } = require("../config/db");

const STATEMENTS = [
  // 1. Cho phép password nullable
  `ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL`,

  // 2. Tạo bảng user_connections
  `CREATE TABLE IF NOT EXISTS user_connections (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT NOT NULL,
    provider      VARCHAR(50) NOT NULL,
    provider_id   VARCHAR(255) NOT NULL,
    linked_email  VARCHAR(255) DEFAULT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_conn_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_provider (user_id, provider),
    UNIQUE KEY unique_provider_id (provider, provider_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // 3. Tạo bảng user_passkeys
  `CREATE TABLE IF NOT EXISTS user_passkeys (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    credential_id   VARCHAR(511) NOT NULL,
    public_key      TEXT NOT NULL,
    counter         BIGINT DEFAULT 0,
    device_type     VARCHAR(100) DEFAULT NULL,
    backed_up       TINYINT(1) DEFAULT 0,
    transports      VARCHAR(255) DEFAULT NULL,
    label           VARCHAR(100) DEFAULT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_passkey_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_credential_id (credential_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
];

(async () => {
  console.log("🚀 Chạy migration...\n");
  let ok = 0;
  let skipped = 0;
  let failed = 0;

  for (const stmt of STATEMENTS) {
    const preview = stmt.trim().slice(0, 70).replace(/\s+/g, " ");
    try {
      await pool.execute(stmt);
      console.log(`✅ OK: ${preview}...`);
      ok++;
    } catch (err) {
      if (
        err.code === "ER_DUP_KEYNAME" ||
        err.code === "ER_TABLE_EXISTS_ERROR" ||
        (err.message && err.message.toLowerCase().includes("duplicate"))
      ) {
        console.log(`⏭️  Skip (đã tồn tại): ${preview}...`);
        skipped++;
      } else {
        console.error(`❌ Lỗi: ${err.message}`);
        console.error(`   SQL: ${preview}`);
        failed++;
      }
    }
  }

  console.log(`\n📊 Kết quả: ${ok} thành công, ${skipped} bỏ qua, ${failed} lỗi`);
  process.exit(failed > 0 ? 1 : 0);
})();
