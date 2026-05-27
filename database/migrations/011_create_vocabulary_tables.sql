-- UP
-- Vocabulary management tables / 語彙管理テーブル

CREATE TABLE IF NOT EXISTS `vocabularies` (
  `id`              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `meaning_vi`      VARCHAR(500) NOT NULL,
  `hiragana`        VARCHAR(200) NULL,
  `romaji`          VARCHAR(200) NULL,
  `kanji`           VARCHAR(200) NULL,
  `sino_vietnamese` VARCHAR(200) NULL,
  `level`           ENUM('N5','N4','N3','N2','N1') NOT NULL,
  `media_url`       VARCHAR(500) NULL,
  `note`            TEXT NULL,
  `status`          ENUM('publish','hide','delete') NOT NULL DEFAULT 'publish',
  `learn_count`     INT UNSIGNED NOT NULL DEFAULT 0,
  `favorite_count`  INT UNSIGNED NOT NULL DEFAULT 0,
  `version`         INT UNSIGNED NOT NULL DEFAULT 1,
  `created_by`      INT UNSIGNED NOT NULL,
  `updated_by`      INT UNSIGNED NULL,
  `created_at`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`),
  FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`),
  INDEX `idx_vocab_level`  (`level`),
  INDEX `idx_vocab_status` (`status`),
  FULLTEXT INDEX `idx_vocab_search` (`meaning_vi`, `hiragana`, `romaji`, `kanji`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tags` (
  `id`   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  INDEX `idx_tags_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `vocabulary_tags` (
  `vocabulary_id` INT UNSIGNED NOT NULL,
  `tag_id`        INT UNSIGNED NOT NULL,
  PRIMARY KEY (`vocabulary_id`, `tag_id`),
  FOREIGN KEY (`vocabulary_id`) REFERENCES `vocabularies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tag_id`)        REFERENCES `tags`(`id`)         ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `vocabulary_relationships` (
  `vocabulary_id` INT UNSIGNED NOT NULL,
  `related_id`    INT UNSIGNED NOT NULL,
  `type`          ENUM('related','synonym','antonym') NOT NULL,
  PRIMARY KEY (`vocabulary_id`, `related_id`, `type`),
  FOREIGN KEY (`vocabulary_id`) REFERENCES `vocabularies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`related_id`)    REFERENCES `vocabularies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `vocabulary_change_logs` (
  `id`            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `vocabulary_id` INT UNSIGNED NOT NULL,
  `changed_by`    INT UNSIGNED NOT NULL,
  `field_name`    VARCHAR(100) NOT NULL,
  `old_value`     TEXT NULL,
  `new_value`     TEXT NULL,
  `changed_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`vocabulary_id`) REFERENCES `vocabularies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`changed_by`)    REFERENCES `users`(`id`),
  INDEX `idx_vcl_vocab` (`vocabulary_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `vocabulary_reports` (
  `id`            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `vocabulary_id` INT UNSIGNED NOT NULL,
  `reported_by`   INT UNSIGNED NOT NULL,
  `reason`        TEXT NOT NULL,
  `status`        ENUM('pending','resolved') NOT NULL DEFAULT 'pending',
  `resolved_by`   INT UNSIGNED NULL,
  `resolved_at`   TIMESTAMP NULL,
  `created_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`vocabulary_id`) REFERENCES `vocabularies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reported_by`)   REFERENCES `users`(`id`),
  FOREIGN KEY (`resolved_by`)   REFERENCES `users`(`id`),
  INDEX `idx_vr_vocab`   (`vocabulary_id`),
  INDEX `idx_vr_status`  (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `vocabulary_reports`;
DROP TABLE IF EXISTS `vocabulary_change_logs`;
DROP TABLE IF EXISTS `vocabulary_relationships`;
DROP TABLE IF EXISTS `vocabulary_tags`;
DROP TABLE IF EXISTS `tags`;
DROP TABLE IF EXISTS `vocabularies`;
