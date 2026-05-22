-- Migration 011: Create vocabularies tables

-- UP

CREATE TABLE vocabularies (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  meaning_vi      VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  hiragana        VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  romaji          VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  kanji           VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  sino_vietnamese VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  level           ENUM('N5','N4','N3','N2','N1') NOT NULL,
  image_url       VARCHAR(500),
  note            TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  tags            JSON COMMENT 'Array of free-text tag strings',
  status          ENUM('publish','hide','deleted') NOT NULL DEFAULT 'publish',
  version         INT NOT NULL DEFAULT 1,
  created_by      INT UNSIGNED NOT NULL,
  updated_by      INT UNSIGNED NOT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_vocab_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT fk_vocab_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE vocabulary_relations (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  vocab_id         INT NOT NULL,
  related_vocab_id INT NOT NULL,
  relation_type    ENUM('related','synonym','antonym') NOT NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vr_vocab        FOREIGN KEY (vocab_id)         REFERENCES vocabularies(id) ON DELETE CASCADE,
  CONSTRAINT fk_vr_related      FOREIGN KEY (related_vocab_id) REFERENCES vocabularies(id) ON DELETE CASCADE,
  CONSTRAINT uq_vr_pair         UNIQUE (vocab_id, related_vocab_id, relation_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE vocabulary_reports (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  vocab_id    INT NOT NULL,
  reporter_id INT UNSIGNED NOT NULL,
  reason      TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  status      ENUM('pending','resolved','rejected') NOT NULL DEFAULT 'pending',
  resolved_by INT UNSIGNED,
  resolved_at DATETIME,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vreport_vocab      FOREIGN KEY (vocab_id)    REFERENCES vocabularies(id) ON DELETE CASCADE,
  CONSTRAINT fk_vreport_reporter   FOREIGN KEY (reporter_id) REFERENCES users(id),
  CONSTRAINT fk_vreport_resolver   FOREIGN KEY (resolved_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE vocabulary_audit_logs (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  vocab_id       INT NOT NULL,
  admin_id       INT UNSIGNED NOT NULL,
  action         ENUM('CREATE','UPDATE','DELETE') NOT NULL,
  changed_fields JSON COMMENT 'Object: {field: {old, new}}',
  timestamp      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_val_vocab FOREIGN KEY (vocab_id) REFERENCES vocabularies(id) ON DELETE CASCADE,
  CONSTRAINT fk_val_admin FOREIGN KEY (admin_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE vocabulary_analytics (
  vocab_id       INT PRIMARY KEY,
  learn_count    INT NOT NULL DEFAULT 0,
  favorite_count INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_va_vocab FOREIGN KEY (vocab_id) REFERENCES vocabularies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_vocabularies_level      ON vocabularies(level);
CREATE INDEX idx_vocabularies_status     ON vocabularies(status);
CREATE INDEX idx_vocabularies_created_at ON vocabularies(created_at);
