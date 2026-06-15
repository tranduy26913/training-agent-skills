# Vocabulary Management — Backend Specification

> Related: [00-index.md](./00-index.md) | [02-frontend.md](./02-frontend.md) | [03-behavior.md](./03-behavior.md) | [04-quality.md](./04-quality.md)

---

## 1. Data Models

### 1.1 Database Schema

#### Bảng `vocabularies`

```
CREATE TABLE `vocabularies` (
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
```

#### Bảng `vocab_relations`

```
CREATE TABLE `vocab_relations` (
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
```

#### Bảng `vocab_change_logs`

```
CREATE TABLE `vocab_change_logs` (
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
```

#### Bảng `vocab_reports`

```
CREATE TABLE `vocab_reports` (
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
```

### 1.2 TypeScript Models (server/src/models/)

#### `vocabularies.model.ts`

**DB Row Types:**

- `VocabularyRow` — toàn bộ cột trong bảng vocabularies
- `VocabRelationRow` — toàn bộ cột trong bảng vocab_relations
- `VocabChangeLogRow` — toàn bộ cột trong bảng vocab_change_logs
- `VocabReportRow` — toàn bộ cột trong bảng vocab_reports

**Filter Types:**

- `VocabularyFilter` — các trường filter cho list: `kanji?`, `level?`, `status?`, `tag?`, `createdBy?`

**DTO Types:**

- `CreateVocabularyDto` — dữ liệu tạo mới (kanji, hiragana, romaji, meaning_vi, on_yomi, level, media_url, note, tags, status, relationIds)
- `UpdateVocabularyDto` — dữ liệu cập nhật (tất cả optional, relationIds để replace toàn bộ)
- `VocabularyResponse` — response trả về client (bao gồm relations)
- `VocabRelationDto` — thông tin quan hệ (id, kanji, hiragana, level)
- `VocabChangeLogDto` — thông tin change log
- `VocabReportDto` — thông tin báo cáo

**Enum Types:**

- `VocabularyStatus` — `'Publish' | 'Hide' | 'Delete'`
- `VocabLevel` — `'N5' | 'N4' | 'N3' | 'N2' | 'N1'`
- `VocabRelationType` — `'related' | 'synonym' | 'antonym'`
- `VocabReportStatus` — `'pending' | 'resolved' | 'dismissed'`

---

## 2. API Endpoints

### 2.1 GET `/api/vocabularies`

Lấy danh sách từ vựng có phân trang và filter.

**Request Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Số trang (default: 1) |
| `limit` | number | No | Số item/trang (default: 20, max: 100) |
| `sort` | string | No | Trường sort (default: 'created_at') |
| `order` | string | No | 'asc' hoặc 'desc' (default: 'desc') |
| `kanji` | string | No | Search theo Kanji (LIKE) |
| `level` | string | No | Filter theo cấp độ JLPT |
| `status` | string | No | Filter theo status |
| `tag` | string | No | Filter theo tag (JSON contains) |
| `createdBy` | number | No | Filter theo created_by |

**Response 200:**

```
{
  success: true,
  data: {
    items: VocabularyResponse[],
    pagination: { page, limit, total, totalPages }
  }
}
```

**Errors:** 400 (invalid params)

---

### 2.2 GET `/api/vocabularies/:id`

Lấy chi tiết 1 từ vựng bao gồm relations, change logs, reports.

**Response 200:**

```
{
  success: true,
  data: {
    vocabulary: VocabularyResponse,
    relations: {
      related: VocabRelationDto[],
      synonyms: VocabRelationDto[],
      antonyms: VocabRelationDto[]
    },
    changeLogs: VocabChangeLogDto[],
    reports: VocabReportDto[]
  }
}
```

**Errors:** 404 (not found), 404 (soft deleted)

---

### 2.3 POST `/api/vocabularies`

Tạo mới từ vựng.

**Request Body:**

```
{
  kanji: string (required),
  hiragana?: string,
  romaji?: string,
  meaning_vi: string (required),
  on_yomi?: string,
  level?: VocabLevel,
  media_url?: string,
  note?: string,
  tags?: string[],
  status?: VocabularyStatus,
  relations?: {
    related?: number[],
    synonyms?: number[],
    antonyms?: number[]
  }
}
```

**Response 201:**

```
{
  success: true,
  data: { id: number, vocabulary: VocabularyResponse }
}
```

**Errors:** 400 (validation), 409 (duplicate kanji + meaning_vi), 401/403 (auth)

---

### 2.4 PUT `/api/vocabularies/:id`

Cập nhật từ vựng. Tự động tăng version và tạo change log.

**Request Body:**

```
{
  kanji?: string,
  hiragana?: string,
  romaji?: string,
  meaning_vi?: string,
  on_yomi?: string,
  level?: VocabLevel,
  media_url?: string,
  note?: string,
  tags?: string[],
  status?: VocabularyStatus,
  relations?: {
    related?: number[],
    synonyms?: number[],
    antonyms?: number[]
  }
}
```

**Response 200:**

```
{
  success: true,
  data: { vocabulary: VocabularyResponse, version: number }
}
```

**Errors:** 400 (validation), 404 (not found), 404 (soft deleted), 401/403 (auth)

---

### 2.5 DELETE `/api/vocabularies/:id`

Soft delete (set status = 'Delete').

**Response 200:**

```
{
  success: true,
  data: { id: number, status: 'Delete' }
}
```

**Errors:** 404 (not found), 401/403 (auth)

---

### 2.6 PATCH `/api/vocabularies/:id/reports/:reportId`

Admin xử lý báo cáo (update status).

**Request Body:**

```
{
  status: 'resolved' | 'dismissed'
}
```

**Response 200:**

```
{
  success: true,
  data: { report: VocabReportDto }
}
```

**Errors:** 400 (invalid status), 404 (not found), 401/403 (auth)

---

### 2.7 GET `/api/vocabularies/:id/analytics`

Lấy thống kê analytics (read-only).

**Response 200:**

```
{
  success: true,
  data: {
    learnCount: number,
    favoriteCount: number,
    reportCount: number,
    relationCount: number
  }
}
```

**Errors:** 404 (not found)

---

## 3. Validation Rules

### 3.1 Client-side Validation

| Field | Rules |
|-------|-------|
| `kanji` | Required, 1-255 chars, không chỉ số |
| `hiragana` | Optional, 1-255 chars, chỉ Hiragana/Katakana |
| `romaji` | Optional, 1-255 chars, chỉ a-z |
| `meaning_vi` | Required, 1-1000 chars |
| `on_yomi` | Optional, 1-255 chars |
| `level` | Optional, must be one of N5/N4/N3/N2/N1 |
| `media_url` | Optional, valid URL format |
| `note` | Optional, max 2000 chars |
| `tags` | Optional, array of strings, max 10 tags, mỗi tag max 50 chars |
| `status` | Optional, default 'Publish', must be Publish/Hide/Delete |
| `relations` | Optional, array of valid vocab IDs |

### 3.2 Server-side Validation

Tất cả validation client-side đều được duplicate ở server-side bằng Zod schemas.

**Business Rules:**

- Không cho phép tạo mới nếu `kanji + meaning_vi` đã tồn tại (trừ khi edit)
- `level` chỉ được set khi `status !== 'Delete'`
- Không cho phép self-reference trong relations (vocab không thể quan hệ với chính nó)
- Không cho phép tạo circular reference trong relations
- `tags` max 10 tags
- `media_url` phải là URL hợp lệ nếu có

---

## 4. Error Handling

### 4.1 Standard Error Format

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### 4.2 Error Scenarios

| HTTP Code | Error Code | Description |
|-----------|-----------|-------------|
| 400 | `VALIDATION_ERROR` | Dữ liệu đầu vào không hợp lệ |
| 400 | `INVALID_RELATION` | Relation không hợp lệ (self-reference, circular) |
| 401 | `UNAUTHORIZED` | Chưa đăng nhập |
| 403 | `FORBIDDEN` | Không có quyền Admin |
| 404 | `NOT_FOUND` | Từ vựng không tồn tại |
| 404 | `SOFT_DELETED` | Từ vựng đã bị xóa |
| 409 | `DUPLICATE_VOCAB` | Kanji + Nghĩa đã tồn tại |
| 500 | `INTERNAL_ERROR` | Lỗi server |
