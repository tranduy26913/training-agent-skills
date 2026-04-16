-- Seed roles
INSERT INTO `roles` (`name`, `description`) VALUES
  ('admin', 'Full access to all features'),
  ('user', 'Standard user access'),
  ('moderator', 'Can moderate content and users')
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);
