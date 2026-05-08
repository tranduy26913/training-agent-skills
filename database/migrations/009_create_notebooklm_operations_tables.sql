-- UP
CREATE TABLE IF NOT EXISTS `dead_letter_jobs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `original_job_id` INT UNSIGNED NOT NULL,
  `job_type` VARCHAR(50) NOT NULL,
  `payload` JSON NOT NULL,
  `failure_reason` TEXT NULL,
  `note` TEXT NULL,
  `moved_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_dead_letter_jobs_original_job` FOREIGN KEY (`original_job_id`) REFERENCES `jobs`(`id`) ON DELETE CASCADE,
  INDEX `idx_dead_letter_jobs_original_job_id` (`original_job_id`),
  INDEX `idx_dead_letter_jobs_job_type` (`job_type`),
  INDEX `idx_dead_letter_jobs_moved_at` (`moved_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `job_metrics_daily` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `metric_date` DATE NOT NULL,
  `job_type` VARCHAR(50) NOT NULL,
  `total_jobs` INT UNSIGNED NOT NULL DEFAULT 0,
  `failed_jobs` INT UNSIGNED NOT NULL DEFAULT 0,
  `avg_duration_ms` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_job_metrics_daily_date_type` (`metric_date`, `job_type`),
  INDEX `idx_job_metrics_daily_date` (`metric_date`),
  INDEX `idx_job_metrics_daily_type` (`job_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `job_metrics_daily`;
DROP TABLE IF EXISTS `dead_letter_jobs`;