-- Migration: Refactor pets.image_url -> pet_images, add adoption_requests
-- Compatible with MySQL 8+ and MariaDB 10.3+
-- Safe to run multiple times (idempotent)

USE pet_helper;

-- 1) Ensure pet_images has cloudinary_id for Cloudinary migration flow
SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'pet_images'
    AND COLUMN_NAME = 'cloudinary_id'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE pet_images ADD COLUMN cloudinary_id VARCHAR(255) NULL AFTER display_order',
  'SELECT ''cloudinary_id already exists'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) Backfill pet_images from legacy pets.image_url when needed
SET @legacy_col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'pets'
    AND COLUMN_NAME = 'image_url'
);
SET @sql := IF(
  @legacy_col_exists = 1,
  'INSERT INTO pet_images (pet_id, image_path, display_order, cloudinary_id, created_at)
   SELECT p.id, p.image_url, 0, NULL, COALESCE(p.created_at, CURRENT_TIMESTAMP)
   FROM pets p
   WHERE p.image_url IS NOT NULL
     AND TRIM(p.image_url) <> ''''
     AND NOT EXISTS (
       SELECT 1
       FROM pet_images pi
       WHERE pi.pet_id = p.id
         AND pi.display_order = 0
     )',
  'SELECT ''pets.image_url does not exist, skip backfill'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3) Drop legacy redundant column pets.image_url
SET @legacy_col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'pets'
    AND COLUMN_NAME = 'image_url'
);
SET @sql := IF(
  @legacy_col_exists = 1,
  'ALTER TABLE pets DROP COLUMN image_url',
  'SELECT ''pets.image_url already removed'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4) Ensure foreign key pet_images.pet_id -> pets.id ON DELETE CASCADE
SET @has_cascade_fk := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
  JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS r
    ON r.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA
   AND r.CONSTRAINT_NAME = k.CONSTRAINT_NAME
  WHERE k.TABLE_SCHEMA = DATABASE()
    AND k.TABLE_NAME = 'pet_images'
    AND k.COLUMN_NAME = 'pet_id'
    AND k.REFERENCED_TABLE_NAME = 'pets'
    AND r.DELETE_RULE = 'CASCADE'
);

SET @drop_fk_clauses := (
  SELECT GROUP_CONCAT(CONCAT('DROP FOREIGN KEY `', CONSTRAINT_NAME, '`') SEPARATOR ', ')
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'pet_images'
    AND COLUMN_NAME = 'pet_id'
    AND REFERENCED_TABLE_NAME = 'pets'
);

SET @sql := IF(
  @has_cascade_fk > 0,
  'SELECT ''pet_images.pet_id already has ON DELETE CASCADE''',
  IF(
    @drop_fk_clauses IS NULL,
    'ALTER TABLE pet_images ADD CONSTRAINT fk_pet_images_pet_id FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE',
    CONCAT(
      'ALTER TABLE pet_images ',
      @drop_fk_clauses,
      ', ADD CONSTRAINT fk_pet_images_pet_id FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE'
    )
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5) Add performance indexes if missing
SET @idx_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'pets'
    AND INDEX_NAME = 'idx_pets_status_created'
);
SET @sql := IF(
  @idx_exists = 0,
  'ALTER TABLE pets ADD INDEX idx_pets_status_created (status, created_at)',
  'SELECT ''idx_pets_status_created already exists'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'pet_images'
    AND INDEX_NAME = 'idx_pet_display'
);
SET @sql := IF(
  @idx_exists = 0,
  'ALTER TABLE pet_images ADD INDEX idx_pet_display (pet_id, display_order)',
  'SELECT ''idx_pet_display already exists'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'pet_images'
    AND INDEX_NAME = 'idx_pet_images_pet_created'
);
SET @sql := IF(
  @idx_exists = 0,
  'ALTER TABLE pet_images ADD INDEX idx_pet_images_pet_created (pet_id, created_at)',
  'SELECT ''idx_pet_images_pet_created already exists'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'pet_images'
    AND INDEX_NAME = 'idx_pet_images_cloudinary'
);
SET @sql := IF(
  @idx_exists = 0,
  'ALTER TABLE pet_images ADD INDEX idx_pet_images_cloudinary (cloudinary_id)',
  'SELECT ''idx_pet_images_cloudinary already exists'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6) Create adoption_requests table
CREATE TABLE IF NOT EXISTS adoption_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  pet_id INT NOT NULL,
  message TEXT,
  status ENUM('pending', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
  reviewed_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME NULL,
  CONSTRAINT fk_adoption_requests_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_adoption_requests_pet
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
  CONSTRAINT fk_adoption_requests_reviewer
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_adoption_requests_user_created (user_id, created_at),
  INDEX idx_adoption_requests_pet_status (pet_id, status),
  INDEX idx_adoption_requests_reviewer (reviewed_by)
);
