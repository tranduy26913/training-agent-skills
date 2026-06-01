-- UP
-- User vocabulary progress table for FlashCard learning feature / FlashCard学習機能のユーザー語彙進捗テーブル

CREATE TABLE IF NOT EXISTS `user_vocabulary_progress` (
  `user_id`       INT UNSIGNED NOT NULL,
  `vocabulary_id` INT UNSIGNED NOT NULL,
  `status`        ENUM('new', 'learning', 'known') NOT NULL DEFAULT 'new',
  `review_count`  INT UNSIGNED NOT NULL DEFAULT 0,
  `last_reviewed` TIMESTAMP NULL DEFAULT NULL,
  `is_favorite`   TINYINT(1) NOT NULL DEFAULT 0,
  `created_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `vocabulary_id`),
  FOREIGN KEY (`user_id`)       REFERENCES `users`(`id`)        ON DELETE CASCADE,
  FOREIGN KEY (`vocabulary_id`) REFERENCES `vocabularies`(`id`) ON DELETE CASCADE,
  INDEX `idx_uvp_user_status`   (`user_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
