-- Seed admin user
-- Password: admin123 (bcrypt hash)
INSERT INTO `users` (`name`, `email`, `password`, `role`, `status`) VALUES
  ('Administrator', 'admin@app.com', '$2a$10$GD6oSlL6xIYxbqnbmPWRoOguCv2cJPh7WUy158noFZDEBU6vRYlwa', 'admin', 'active')
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `password` = VALUES(`password`),
  `role` = VALUES(`role`),
  `status` = VALUES(`status`);
