-- UP
CREATE TABLE IF NOT EXISTS `employees` (
  `id`              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `employee_code`   VARCHAR(20)  NOT NULL UNIQUE,
  `full_name`       VARCHAR(100) NOT NULL,
  `email`           VARCHAR(255) NOT NULL UNIQUE,
  `phone`           VARCHAR(20)  NULL,
  `department`      ENUM('engineering','hr','finance','marketing','operations') NOT NULL,
  `position`        ENUM('engineer','senior_engineer','team_lead','manager','director','analyst','specialist','intern') NOT NULL,
  `salary`          DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `hire_date`       DATE         NOT NULL,
  `status`          ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `created_at`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_employees_code`       (`employee_code`),
  INDEX `idx_employees_email`      (`email`),
  INDEX `idx_employees_department` (`department`),
  INDEX `idx_employees_status`     (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `employees`;
