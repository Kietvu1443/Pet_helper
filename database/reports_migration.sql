-- ====================================================
-- Migration: Lost & Found Pet Reporting System
-- ====================================================

USE pet_helper;

-- 1. Tạo bảng reports
CREATE TABLE IF NOT EXISTS reports (
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
);

-- 2. Thêm cột report_id vào pet_images, cho phép pet_id nullable
ALTER TABLE pet_images
    ADD COLUMN report_id INT NULL,
    ADD COLUMN cloudinary_id VARCHAR(255) NULL,
    MODIFY COLUMN pet_id INT NULL;

-- 3. Foreign Key cho report_id
ALTER TABLE pet_images
    ADD CONSTRAINT fk_petimages_report
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE;

-- 4. Indexes cho hiệu suất
CREATE INDEX idx_reports_status_type ON reports (status, type);
CREATE INDEX idx_reports_created_desc ON reports (created_at DESC);
CREATE INDEX idx_petimages_reportid ON pet_images (report_id);
