# 01 — Backend: Vocabulary Management

> Related: [00-index.md](./00-index.md) | [02-frontend.md](./02-frontend.md) | [03-behavior.md](./03-behavior.md) | [04-quality.md](./04-quality.md)

---

## 1. Data Models

### 1.1 Database Schema

```sql
-- ============================================================
-- Vocabulary Management Schema
-- ============================================================

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
  INDEX `idx_vr_vocab` (`vocabulary_id`),
  INDEX `idx_vr_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 1.2 TypeScript DTOs (`server/src/models/vocabularies.model.ts`)

```typescript
export type VocabularyLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
export type VocabularyStatus = 'publish' | 'hide' | 'delete';
export type RelationshipType = 'related' | 'synonym' | 'antonym';
export type ReportStatus = 'pending' | 'resolved';

// DB row
export interface VocabularyRow {
  id: number;
  meaning_vi: string;
  hiragana: string | null;
  romaji: string | null;
  kanji: string | null;
  sino_vietnamese: string | null;
  level: VocabularyLevel;
  media_url: string | null;
  note: string | null;
  status: VocabularyStatus;
  learn_count: number;
  favorite_count: number;
  version: number;
  created_by: number;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
}

// Vocabulary detail (includes joined data)
export interface VocabularyDetail extends VocabularyRow {
  tags: string[];
  related_words: VocabSummary[];
  synonyms: VocabSummary[];
  antonyms: VocabSummary[];
  created_by_name: string;
  updated_by_name: string | null;
}

// Lightweight summary for MultiSelect options
export interface VocabSummary {
  id: number;
  kanji: string | null;
  hiragana: string | null;
  meaning_vi: string;
}

// Create DTO
export interface CreateVocabularyDto {
  meaning_vi: string;
  hiragana?: string;
  romaji?: string;
  kanji?: string;
  sino_vietnamese?: string;
  level: VocabularyLevel;
  media_url?: string;
  note?: string;
  status: VocabularyStatus;
  tags?: string[];                  // tag names (create-on-save)
  related_ids?: number[];
  synonym_ids?: number[];
  antonym_ids?: number[];
}

// Update DTO (same shape)
export type UpdateVocabularyDto = CreateVocabularyDto;

// Filter params
export interface VocabularyFilters extends PaginationParams, SortParams {
  search?: string;    // full-text across meaning_vi, kanji, hiragana, romaji
  level?: VocabularyLevel;
  status?: VocabularyStatus;
  tag?: string;
}

// Change log row
export interface VocabularyChangeLog {
  id: number;
  vocabulary_id: number;
  changed_by: number;
  changed_by_name: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_at: string;
}

// Report row
export interface VocabularyReport {
  id: number;
  vocabulary_id: number;
  reported_by: number;
  reported_by_name: string;
  reason: string;
  status: ReportStatus;
  resolved_by: number | null;
  resolved_by_name: string | null;
  resolved_at: string | null;
  created_at: string;
}
```

---

## 2. API Endpoints

Tất cả endpoints đều protected bằng middleware: `authenticate` + `requireRole('admin')`.

### 2.1 `GET /api/vocabularies`

**Mô tả:** Lấy danh sách từ vựng có filter và phân trang.

**Query params:**
```
search?    : string
level?     : 'N5'|'N4'|'N3'|'N2'|'N1'
status?    : 'publish'|'hide'|'delete'
tag?       : string
page?      : number (default: 1)
pageSize?  : number (default: 20, max: 100)
sortBy?    : 'created_at'|'updated_at'|'meaning_vi'|'level' (default: 'created_at')
sortOrder? : 'asc'|'desc' (default: 'desc')
```

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "meaning_vi": "ăn",
      "kanji": "食べる",
      "hiragana": "たべる",
      "level": "N5",
      "status": "publish",
      "tags": ["động từ", "N5"],
      "created_at": "2026-01-01T00:00:00Z"
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 150, "totalPages": 8 }
}
```

---

### 2.2 `GET /api/vocabularies/:id`

**Mô tả:** Lấy chi tiết một từ vựng (bao gồm tags, relationships).

**Response 200:** `VocabularyDetail` object.

**Errors:**
- `404` — vocabulary not found.

---

### 2.3 `POST /api/vocabularies`

**Mô tả:** Tạo từ vựng mới.

**Request body:** `CreateVocabularyDto`

**Flow:**
1. Validate input (Zod).
2. Insert `vocabularies` row.
3. Upsert tags (tạo tag nếu chưa tồn tại), link `vocabulary_tags`.
4. Insert `vocabulary_relationships` rows.
5. Return created `VocabularyDetail`.

**Response 201:** `VocabularyDetail`

**Errors:**
- `400` — validation error.

---

### 2.4 `PUT /api/vocabularies/:id`

**Mô tả:** Cập nhật từ vựng. Backend tự diff và ghi `vocabulary_change_logs`.

**Request body:** `UpdateVocabularyDto`

**Flow:**
1. Validate input (Zod).
2. Fetch current row.
3. Diff từng field scalar → insert `vocabulary_change_logs` rows cho các field thay đổi.
4. Update `vocabularies` row (`version + 1`, `updated_by = req.user.id`).
5. Sync tags: xóa liên kết cũ, upsert tags mới, link lại.
6. Sync relationships: xóa và re-insert.
7. Return updated `VocabularyDetail`.

**Response 200:** `VocabularyDetail`

**Errors:**
- `400` — validation.
- `404` — not found.

---

### 2.5 `DELETE /api/vocabularies/:id`

**Mô tả:** Soft delete — set `status = 'delete'`.

**Response 204:** No content.

**Errors:**
- `404` — not found.

---

### 2.6 `GET /api/vocabularies/:id/change-logs`

**Mô tả:** Lấy lịch sử thay đổi của một từ.

**Response 200:**
```json
{ "data": [ VocabularyChangeLog, ... ] }
```

---

### 2.7 `GET /api/vocabularies/:id/reports`

**Mô tả:** Lấy danh sách báo cáo của một từ (cho Admin).

**Query params:** `status?: 'pending'|'resolved'`

**Response 200:**
```json
{ "data": [ VocabularyReport, ... ] }
```

---

### 2.8 `PATCH /api/vocabularies/:id/reports/:reportId`

**Mô tả:** Cập nhật status báo cáo (Resolved/Pending).

**Request body:**
```json
{ "status": "resolved" | "pending" }
```

**Flow:** Set `status`, nếu `resolved` thì set `resolved_by = req.user.id`, `resolved_at = NOW()`. Nếu `pending` thì clear `resolved_by`, `resolved_at`.

**Response 200:** `VocabularyReport` đã cập nhật.

**Errors:**
- `404` — report not found.
- `400` — invalid status value.

---

### 2.9 `GET /api/tags/suggest`

**Mô tả:** Autocomplete tag (open, không cần admin auth).

**Query params:** `q: string` (min 1 ký tự)

**Response 200:**
```json
{ "data": ["động từ", "N5", "thức ăn"] }
```

---

### 2.10 `GET /api/vocabularies/search`

**Mô tả:** Tìm kiếm từ vựng cho MultiSelect (relationships). Tìm theo kanji, hiragana, romaji, meaning_vi.

**Query params:** `q: string`, `exclude?: string` (comma-separated IDs để loại trừ từ hiện tại)

**Response 200:**
```json
{ "data": [ { "id": 1, "kanji": "食べる", "hiragana": "たべる", "meaning_vi": "ăn" } ] }
```

---

## 3. Validation Rules

### Server-side (Zod schema `vocabularies.validation.ts`)

| Field | Rule |
|-------|------|
| `meaning_vi` | required, string, min 1, max 500 |
| `hiragana` | optional, string, max 200 |
| `romaji` | optional, string, max 200 |
| `kanji` | optional, string, max 200 |
| `sino_vietnamese` | optional, string, max 200 |
| `level` | required, enum `N5|N4|N3|N2|N1` |
| `media_url` | optional, valid URL format, max 500 |
| `note` | optional, string, max 5000 |
| `status` | required, enum `publish|hide|delete` |
| `tags` | optional, array of string, each max 100 |
| `related_ids` | optional, array of positive integers |
| `synonym_ids` | optional, array of positive integers |
| `antonym_ids` | optional, array of positive integers |

### Business rules

- `related_ids`, `synonym_ids`, `antonym_ids` không được chứa `id` của chính từ đang tạo/edit.
- Khi update, `version` tự tăng 1 mỗi lần lưu thành công.
- Soft delete: status = 'delete'. Từ vẫn còn trong DB và relationships.

---

## 4. Error Handling

### Standard error format

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable message"
}
```

### Error scenarios

| HTTP Code | Error Code | Tình huống |
|-----------|-----------|-----------|
| 400 | `VALIDATION_ERROR` | Input không hợp lệ (Zod fail) |
| 400 | `SELF_REFERENCE` | related/synonym/antonym chứa ID của chính từ đó |
| 401 | `UNAUTHORIZED` | Không có JWT token |
| 403 | `FORBIDDEN` | User không phải Admin |
| 404 | `VOCABULARY_NOT_FOUND` | `:id` không tồn tại |
| 404 | `REPORT_NOT_FOUND` | `:reportId` không tồn tại |
| 500 | `INTERNAL_ERROR` | Lỗi server không xác định |
