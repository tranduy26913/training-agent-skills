-- Vocabulary Management Tables Migration
-- Migration: 011
-- Description: Creates vocabularies, vocab_relations, vocab_change_logs, and vocab_reports tables
-- Created: 2026-06-12

-- ============================================================================
-- Table: vocabularies
-- Description: Main vocabulary table storing Japanese vocabulary entries
-- ============================================================================

CREATE TABLE IF NOT EXISTS `vocabularies` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `kanji` VARCHAR(255) NOT NULL COMMENT 'Kanji form',
  `hiragana` VARCHAR(255) NULL COMMENT 'Hira/Kana form',
  `romaji` VARCHAR(255) NULL COMMENT 'Romaji form',
  `meaning_vi` TEXT NOT NULL COMMENT 'Nghĩa tiếng Việt',
  `on_yomi` VARCHAR(255) NULL COMMENT 'Âm hán việt',
  `level` ENUM('N5','N4','N3','N2','N1') NULL COMMENT 'Cấp độ JLPT',
  `media_url` VARCHAR(500) NULL COMMENT 'Media URL (audio/image)',
  `note` TEXT NULL COMMENT 'Ghi chú',
  `tags` JSON NULL COMMENT 'Tags dạng JSON array ["tag1","tag2"]',
  `status` ENUM('Publish','Hide','Delete') NOT NULL DEFAULT 'Publish' COMMENT 'Status',
  `learn_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Số lần học',
  `favorite_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Số lần yêu thích',
  `created_by` INT UNSIGNED NULL COMMENT 'User ID người tạo',
  `updated_by` INT UNSIGNED NULL COMMENT 'User ID người cập nhật',
  `version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Version cho audit',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_vocab_kanji` (`kanji`),
  INDEX `idx_vocab_level` (`level`),
  INDEX `idx_vocab_status` (`status`),
  INDEX `idx_vocab_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- Table: vocab_relations
-- Description: Self-referencing table for vocabulary relationships (synonyms, antonyms, related)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `vocab_relations` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `vocab_id` INT UNSIGNED NOT NULL COMMENT 'Từ vựng chính',
  `target_vocab_id` INT UNSIGNED NOT NULL COMMENT 'Từ vựng liên quan',
  `relation_type` ENUM('related','synonym','antonym') NOT NULL COMMENT 'Loại quan hệ',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`vocab_id`) REFERENCES `vocabularies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`target_vocab_id`) REFERENCES `vocabularies`(`id`) ON DELETE CASCADE,
  INDEX `idx_vocab_rel_vocab` (`vocab_id`),
  INDEX `idx_vocab_rel_target` (`target_vocab_id`),
  INDEX `idx_vocab_rel_type` (`relation_type`),
  UNIQUE KEY `uk_vocab_relation` (`vocab_id`, `target_vocab_id`, `relation_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- Table: vocab_change_logs
-- Description: Audit trail table tracking all changes to vocabulary entries
-- ============================================================================

CREATE TABLE IF NOT EXISTS `vocab_change_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `vocab_id` INT UNSIGNED NOT NULL COMMENT 'Từ vựng bị thay đổi',
  `field_name` VARCHAR(100) NOT NULL COMMENT 'Trường bị thay đổi',
  `old_value` TEXT NULL COMMENT 'Giá trị cũ',
  `new_value` TEXT NULL COMMENT 'Giá trị mới',
  `changed_by` INT UNSIGNED NOT NULL COMMENT 'User ID người thay đổi',
  `change_reason` VARCHAR(500) NULL COMMENT 'Lý do thay đổi',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`vocab_id`) REFERENCES `vocabularies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`changed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_vocab_changelog_vocab` (`vocab_id`),
  INDEX `idx_vocab_changelog_field` (`field_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- Table: vocab_reports
-- Description: User reports table for flagging inappropriate or incorrect vocabulary entries
-- ============================================================================

CREATE TABLE IF NOT EXISTS `vocab_reports` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `vocab_id` INT UNSIGNED NOT NULL COMMENT 'Từ vựng bị báo cáo',
  `report_text` TEXT NOT NULL COMMENT 'Nội dung báo cáo',
  `status` ENUM('pending','resolved','dismissed') NOT NULL DEFAULT 'pending',
  `reported_by` INT UNSIGNED NOT NULL COMMENT 'User ID người báo cáo',
  `resolved_by` INT UNSIGNED NULL COMMENT 'Admin ID xử lý',
  `resolved_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`vocab_id`) REFERENCES `vocabularies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reported_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`resolved_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_vocab_report_vocab` (`vocab_id`),
  INDEX `idx_vocab_report_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
