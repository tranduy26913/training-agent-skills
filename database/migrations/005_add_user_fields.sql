-- UP
ALTER TABLE `users`
  ADD COLUMN `last_login_at` TIMESTAMP NULL DEFAULT NULL AFTER `avatar`,
  ADD COLUMN `points` INT NOT NULL DEFAULT 0 AFTER `last_login_at`,
  ADD COLUMN `note` VARCHAR(500) NULL DEFAULT NULL AFTER `points`,
  ADD COLUMN `birthday` DATE NULL DEFAULT NULL AFTER `note`;

-- DOWN
ALTER TABLE `users`
  DROP COLUMN `birthday`,
  DROP COLUMN `note`,
  DROP COLUMN `points`,
  DROP COLUMN `last_login_at`;
