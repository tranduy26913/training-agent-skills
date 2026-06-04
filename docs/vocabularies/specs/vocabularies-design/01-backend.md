---
title: Admin Vocabulary Management - Backend Specification
version: 1.0
author: Admin Team
date: 2026-06-04
---

# Admin Vocabulary Management - Backend Specification

> Related: [00-index.md](./00-index.md) | [02-frontend.md](./02-frontend.md) | [03-behavior.md](./03-behavior.md) | [04-quality.md](./04-quality.md)

---

## 1. Data Models

### 1.1 Database Schema

```sql
-- vocabularies (NEW)
CREATE TABLE IF NOT EXISTS `vocabularies` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `meaning_vi` VARCHAR(500) NOT NULL COMMENT 'Nghĩa tiếng Việt',
  `hiragana` VARCHAR(100) NOT NULL COMMENT 'Hira/Kana',
  `romaji` VARCHAR(100) NOT NULL COMMENT 'Romaji',
  `kanji` VARCHAR(100) COMMENT 'Kanji (nếu có)',
  `han_viet` VARCHAR(100) COMMENT 'Âm Hán Việt',
  `level` ENUM('N5', 'N4', 'N3', 'N2', 'N1', 'other') NOT NULL DEFAULT 'N5' COMMENT 'Mức độ JLPT',
  `media_url` VARCHAR(500) COMMENT 'URL hình ảnh/âm thanh',
  `note` TEXT COMMENT 'Ghi chú thêm',
  `status` ENUM('publish', 'hide', 'deleted') NOT NULL DEFAULT 'hide' COMMENT 'Trạng thái hiển thị',
  `version` INT NOT NULL DEFAULT 1 COMMENT 'Version counter',
  `learn_count` INT NOT NULL DEFAULT 0 COMMENT 'Số lần học',
  `favorite_count` INT NOT NULL DEFAULT 0 COMMENT 'Số lần yêu thích',
  `created_by` INT UNSIGNED NOT NULL,
  `updated_by` INT UNSIGNED,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_vocabularies_level` (`level`),
  INDEX `idx_vocabularies_status` (`status`),
  INDEX `idx_vocabularies_created_by` (`created_by`),
  INDEX `idx_vocabularies_created_at` (`created_at`),
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- vocabulary_tags (NEW)
CREATE TABLE IF NOT EXISTS `vocabulary_tags` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `vocabulary_id` INT UNSIGNED NOT NULL,
  `tag` VARCHAR(100) NOT NULL COMMENT 'Tag mỗi từ vựng (e.g. "N5-basic", "hiragana")',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_vocabulary_tag` (`vocabulary_id`, `tag`),
  FOREIGN KEY (`vocabulary_id`) REFERENCES `vocabularies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- vocabulary_related_words (NEW)
CREATE TABLE IF NOT EXISTS `vocabulary_related_words` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `vocabulary_id` INT UNSIGNED NOT NULL,
  `related_vocabulary_id` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_vocabulary_related` (`vocabulary_id`, `related_vocabulary_id`),
  FOREIGN KEY (`vocabulary_id`) REFERENCES `vocabularies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`related_vocabulary_id`) REFERENCES `vocabularies`(`id`) ON DELETE CASCADE,
  CHECK (`vocabulary_id` <> `related_vocabulary_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- vocabulary_synonyms (NEW)
CREATE TABLE IF NOT EXISTS `vocabulary_synonyms` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `vocabulary_id` INT UNSIGNED NOT NULL,
  `synonym_vocabulary_id` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_vocabulary_synonym` (`vocabulary_id`, `synonym_vocabulary_id`),
  FOREIGN KEY (`vocabulary_id`) REFERENCES `vocabularies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`synonym_vocabulary_id`) REFERENCES `vocabularies`(`id`) ON DELETE CASCADE,
  CHECK (`vocabulary_id` <> `synonym_vocabulary_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- vocabulary_antonyms (NEW)
CREATE TABLE IF NOT EXISTS `vocabulary_antonyms` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `vocabulary_id` INT UNSIGNED NOT NULL,
  `antonym_vocabulary_id` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_vocabulary_antonym` (`vocabulary_id`, `antonym_vocabulary_id`),
  FOREIGN KEY (`vocabulary_id`) REFERENCES `vocabularies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`antonym_vocabulary_id`) REFERENCES `vocabularies`(`id`) ON DELETE CASCADE,
  CHECK (`vocabulary_id` <> `antonym_vocabulary_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- vocabulary_change_logs (NEW)
CREATE TABLE IF NOT EXISTS `vocabulary_change_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `vocabulary_id` INT UNSIGNED NOT NULL,
  `changed_fields` JSON COMMENT 'Danh sách field đã thay đổi: {"field": "old_value", "new_value"}',
  `changed_by` INT UNSIGNED NOT NULL,
  `change_description` TEXT COMMENT 'Mô tả thay đổi (e.g. "meaning_vi updated from X to Y")',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_vocab_changelog_vocab_id` (`vocabulary_id`),
  INDEX `idx_vocab_changelog_created_at` (`created_at`),
  FOREIGN KEY (`vocabulary_id`) REFERENCES `vocabularies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`changed_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- vocabulary_reports (NEW)
CREATE TABLE IF NOT EXISTS `vocabulary_reports` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `vocabulary_id` INT UNSIGNED NOT NULL,
  `reporter_id` INT UNSIGNED NOT NULL,
  `report_type` ENUM('incorrect_meaning', 'offensive_content', 'duplicate', 'other') NOT NULL,
  `report_reason` TEXT,
  `status` ENUM('pending', 'resolved', 'rejected') NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` TIMESTAMP NULL,
  INDEX `idx_vocab_reports_vocab_id` (`vocabulary_id`),
  INDEX `idx_vocab_reports_status` (`status`),
  FOREIGN KEY (`vocabulary_id`) REFERENCES `vocabularies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reporter_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 1.2 TypeScript Models

Models defined in `models/vocabularies.model.ts`:

- `Vocabulary` - Main vocabulary record (id, meaning_vi, hiragana, romaji, kanji, han_viet, level, media_url, note, status, version, learn_count, favorite_count, created_by, updated_by, created_at, updated_at, tags[], relatedWords[], synonyms[], antonyms[])
- `VocabularyTag` - Tag entry (id, vocabulary_id, tag)
- `VocabularyRelatedWord` - Related word link (id, vocabulary_id, related_vocabulary_id)
- `VocabularySynonym` - Synonym link (id, vocabulary_id, synonym_vocabulary_id)
- `VocabularyAntonym` - Antonym link (id, vocabulary_id, antonym_vocabulary_id)
- `VocabularyChangeLog` - Audit log entry (id, vocabulary_id, changed_fields, changed_by, change_description, created_at)
- `VocabularyReport` - User report (id, vocabulary_id, reporter_id, report_type, report_reason, status, created_at, resolved_at)
- `VocabularyFilters` - Filter parameters (status, level, tag, keyword, created_by, dateRange)
- `CreateVocabularyDto` - Request DTO for create
- `UpdateVocabularyDto` - Request DTO for update
- `VocabularyDetailDto` - Response DTO with full audit/analytics (for form page)

---

## 2. API Endpoints

### 2.1 Authorization

All endpoints require:
1. Valid JWT token in `Authorization: Bearer <token>` header
2. Role validation: Only `admin` role can access
3. Rate limiting: Standard 100 req/min per user

---

### V-001 — GET `/api/admin/vocabularies`
**List all vocabularies with pagination, filtering, and export**

**Required Role:** `admin`

Request:
```http
GET /api/admin/vocabularies?page=1&limit=20&status=publish&level=N5&tag=basic&search=日本&created_by=5&dateFrom=2026-01-01&dateTo=2026-06-04&export=false
Authorization: Bearer <token>
```

Query Parameters:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number |
| `limit` | number | No | 20 | Items per page (10/20/50 allowed) |
| `status` | string | No | — | Filter by status: `publish`, `hide`, `deleted` |
| `level` | string | No | — | Filter by level: N5/N4/N3/N2/N1/other |
| `tag` | string | No | — | Filter by tag (exact match) |
| `search` | string | No | — | Search in meaning_vi, hiragana, romaji |
| `created_by` | number | No | — | Filter by creator user_id |
| `dateFrom` | string | No | — | Filter created_at >= date (ISO 8601) |
| `dateTo` | string | No | — | Filter created_at <= date (ISO 8601) |
| `export` | boolean | No | false | If true, return CSV format instead of JSON |

Flow:
1. Verify JWT token
2. Verify admin role
3. Validate query parameters
4. Build WHERE clause with filters
5. Query database with pagination
6. If export=true, return CSV; else return JSON with pagination metadata

Response (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "meaning_vi": "日本",
      "hiragana": "にほん",
      "romaji": "nihon",
      "kanji": "日本",
      "han_viet": "Nhật Bản",
      "level": "N5",
      "media_url": null,
      "note": "đất nước",
      "status": "publish",
      "version": 1,
      "learn_count": 156,
      "favorite_count": 45,
      "created_by": 5,
      "updated_by": null,
      "created_at": "2026-01-15T10:30:00Z",
      "updated_at": "2026-01-15T10:30:00Z",
      "createdByUser": { "id": 5, "name": "Admin User", "email": "admin@example.com" },
      "tags": ["N5-basic", "country"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 145,
    "pages": 8
  }
}
```

CSV Export Format:
```csv
ID,Meaning (VI),Hiragana,Romaji,Kanji,Han Viet,Level,Status,Created By,Created At,Learn Count,Favorite Count
1,日本,にほん,nihon,日本,Nhật Bản,N5,publish,Admin User,2026-01-15,156,45
```

Errors:
| Status | Code | Message |
|--------|------|---------|
| 400 | `INVALID_QUERY_PARAMS` | Invalid query parameters |
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Only admin role allowed |
| 500 | `SERVER_ERROR` | Database query error |

---

### V-002 — GET `/api/admin/vocabularies/:id`
**Get single vocabulary with full details (audit, analytics, related words)**

**Required Role:** `admin`

Request:
```http
GET /api/admin/vocabularies/1
Authorization: Bearer <token>
```

Flow:
1. Verify JWT token
2. Verify admin role
3. Fetch vocabulary from database (with relations)
4. Fetch change logs
5. Fetch reports (without resolver details)
6. Return complete DTO

Response (200 OK):
```json
{
  "data": {
    "id": 1,
    "meaning_vi": "日本",
    "hiragana": "にほん",
    "romaji": "nihon",
    "kanji": "日本",
    "han_viet": "Nhật Bản",
    "level": "N5",
    "media_url": null,
    "note": "đất nước",
    "status": "publish",
    "version": 2,
    "learn_count": 156,
    "favorite_count": 45,
    "created_by": 5,
    "updated_by": 5,
    "created_at": "2026-01-15T10:30:00Z",
    "updated_at": "2026-03-20T14:45:00Z",
    "createdByUser": { "id": 5, "name": "Admin User", "email": "admin@example.com" },
    "updatedByUser": { "id": 5, "name": "Admin User", "email": "admin@example.com" },
    "tags": ["N5-basic", "country"],
    "relatedWords": [
      { "id": 2, "meaning_vi": "世界", "hiragana": "せかい", "romaji": "sekai" },
      { "id": 3, "meaning_vi": "国", "hiragana": "くに", "romaji": "kuni" }
    ],
    "synonyms": [
      { "id": 10, "meaning_vi": "日本国", "hiragana": "にほんこく", "romaji": "nihonkoku" }
    ],
    "antonyms": [],
    "changeLogs": [
      {
        "id": 1,
        "version": 1,
        "changed_fields": "meaning_vi, hiragana, romaji",
        "change_description": "Initial creation",
        "changed_by": 5,
        "changedByUser": { "id": 5, "name": "Admin User" },
        "created_at": "2026-01-15T10:30:00Z"
      },
      {
        "id": 2,
        "version": 2,
        "changed_fields": "note",
        "change_description": "note updated from '国' to '国 - country'",
        "changed_by": 5,
        "changedByUser": { "id": 5, "name": "Admin User" },
        "created_at": "2026-03-20T14:45:00Z"
      }
    ],
    "reports": [
      {
        "id": 1,
        "report_type": "incorrect_meaning",
        "report_reason": "Should include 日本国 as alternate meaning",
        "status": "pending",
        "reporter": { "id": 10, "name": "User Name" },
        "created_at": "2026-05-10T08:20:00Z",
        "resolved_at": null
      }
    ]
  }
}
```

Errors:
| Status | Code | Message |
|--------|------|---------|
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Only admin role allowed |
| 404 | `NOT_FOUND` | Vocabulary not found |
| 500 | `SERVER_ERROR` | Database query error |

---

### V-003 — POST `/api/admin/vocabularies`
**Create a new vocabulary**

**Required Role:** `admin`

Request:
```http
POST /api/admin/vocabularies
Authorization: Bearer <token>
Content-Type: application/json

{
  "meaning_vi": "日本",
  "hiragana": "にほん",
  "romaji": "nihon",
  "kanji": "日本",
  "han_viet": "Nhật Bản",
  "level": "N5",
  "media_url": null,
  "note": "đất nước",
  "status": "hide",
  "tags": ["N5-basic", "country"],
  "relatedWordIds": [2, 3],
  "synonymIds": [10],
  "antonymIds": []
}
```

Request Body Rules:
- `meaning_vi` - required, max 500 chars
- `hiragana` - required, max 100 chars
- `romaji` - required, max 100 chars
- `kanji` - optional, max 100 chars
- `han_viet` - optional, max 100 chars
- `level` - required, enum: N5/N4/N3/N2/N1/other
- `media_url` - optional, valid URL
- `note` - optional, max 2000 chars
- `status` - required, enum: publish/hide/deleted
- `tags` - optional, array of strings (max 10)
- `relatedWordIds` - optional, array of vocab IDs
- `synonymIds` - optional, array of vocab IDs
- `antonymIds` - optional, array of vocab IDs

Flow:
1. Verify JWT token
2. Verify admin role
3. Validate request body (Zod schema)
4. Check if vocabulary with same (hiragana, romaji) combination exists
5. Insert vocabulary record
6. Insert tags (if any)
7. Insert related word links (if any)
8. Insert synonym links (if any)
9. Insert antonym links (if any)
10. Create initial change log entry
11. Return created vocabulary with ID

Response (201 Created):
```json
{
  "data": {
    "id": 100,
    "meaning_vi": "日本",
    ...
    "version": 1,
    "created_at": "2026-06-04T15:30:00Z",
    "updated_at": "2026-06-04T15:30:00Z"
  }
}
```

Errors:
| Status | Code | Message |
|--------|------|---------|
| 400 | `VALIDATION_ERROR` | Validation failed (with detailed field errors) |
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Only admin role allowed |
| 409 | `CONFLICT` | Vocabulary with same hiragana/romaji already exists |
| 500 | `SERVER_ERROR` | Database insert error |

---

### V-004 — PUT `/api/admin/vocabularies/:id`
**Update vocabulary (increments version, creates change log)**

**Required Role:** `admin`

Request:
```http
PUT /api/admin/vocabularies/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "meaning_vi": "日本 (updated)",
  "note": "đất nước - updated",
  "status": "publish",
  "tags": ["N5-basic", "country", "new-tag"],
  "relatedWordIds": [2, 3, 5],
  "synonymIds": [10, 11],
  "antonymIds": []
}
```

Request Body Rules:
- All fields same as create, but all optional (only include changed fields)

Flow:
1. Verify JWT token
2. Verify admin role
3. Fetch current vocabulary
4. Validate request body
5. Detect changed fields
6. Update vocabulary record (version++, updated_by = current_user)
7. Update tags (delete old, insert new)
8. Update related words links (delete old, insert new)
9. Update synonym links (delete old, insert new)
10. Update antonym links (delete old, insert new)
11. Create change log entry with detailed description of changes
12. Return updated vocabulary

Response (200 OK):
```json
{
  "data": {
    "id": 1,
    "meaning_vi": "日本 (updated)",
    "version": 3,
    "updated_by": 5,
    "updated_at": "2026-06-04T16:00:00Z",
    ...
  }
}
```

Errors:
| Status | Code | Message |
|--------|------|---------|
| 400 | `VALIDATION_ERROR` | Validation failed |
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Only admin role allowed |
| 404 | `NOT_FOUND` | Vocabulary not found |
| 409 | `CONFLICT` | Vocabulary with same hiragana/romaji already exists (another record) |
| 500 | `SERVER_ERROR` | Database update error |

---

### V-005 — DELETE `/api/admin/vocabularies/:id`
**Soft delete vocabulary (sets status = 'deleted')**

**Required Role:** `admin`

Request:
```http
DELETE /api/admin/vocabularies/1
Authorization: Bearer <token>
```

Flow:
1. Verify JWT token
2. Verify admin role
3. Fetch vocabulary
4. Set status = 'deleted'
5. Create change log: "Vocabulary deleted by Admin User"
6. Return success response

Response (200 OK):
```json
{
  "message": "Vocabulary deleted successfully"
}
```

Errors:
| Status | Code | Message |
|--------|------|---------|
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Only admin role allowed |
| 404 | `NOT_FOUND` | Vocabulary not found |
| 500 | `SERVER_ERROR` | Database update error |

---

### V-006 — GET `/api/admin/vocabularies/export/csv`
**Export vocabularies as CSV file**

**Required Role:** `admin`

Request:
```http
GET /api/admin/vocabularies/export/csv?status=publish&level=N5&dateFrom=2026-01-01
Authorization: Bearer <token>
```

Query Parameters: Same as V-001 listing endpoint

Flow:
1. Verify JWT token
2. Verify admin role
3. Apply filters
4. Generate CSV content
5. Return file with header: `Content-Type: text/csv; charset=utf-8`

Response (200 OK):
```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="vocabularies_2026-06-04.csv"

ID,Meaning (VI),Hiragana,Romaji,Kanji,Han Viet,Level,Status,Created By,Created At,Learn Count,Favorite Count
1,日本,にほん,nihon,日本,Nhật Bản,N5,publish,Admin User,2026-01-15T10:30:00Z,156,45
```

Errors:
| Status | Code | Message |
|--------|------|---------|
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Only admin role allowed |
| 500 | `SERVER_ERROR` | Export generation error |

---

## 3. Validation Rules

### Client-Side Validation (Zod)

```typescript
const createVocabularySchema = z.object({
  meaning_vi: z.string().min(1).max(500),
  hiragana: z.string().min(1).max(100),
  romaji: z.string().min(1).max(100),
  kanji: z.string().max(100).optional(),
  han_viet: z.string().max(100).optional(),
  level: z.enum(['N5', 'N4', 'N3', 'N2', 'N1', 'other']),
  media_url: z.string().url().optional(),
  note: z.string().max(2000).optional(),
  status: z.enum(['publish', 'hide', 'deleted']),
  tags: z.array(z.string()).max(10).optional(),
  relatedWordIds: z.array(z.number().positive()).optional(),
  synonymIds: z.array(z.number().positive()).optional(),
  antonymIds: z.array(z.number().positive()).optional(),
});
```

### Server-Side Validation

- `meaning_vi` - required, 1-500 chars, no HTML tags
- `hiragana` - required, 1-100 chars, Japanese hiragana/katakana only
- `romaji` - required, 1-100 chars, alphanumeric + dash
- `level` - required, only enum values
- `media_url` - valid HTTP/HTTPS URL if provided
- `tags` - max 10 tags per vocabulary
- `relatedWordIds` - check vocabulary IDs exist in database
- `synonymIds` - check vocabulary IDs exist in database
- `antonymIds` - check vocabulary IDs exist in database
- Cross-field: vocabulary_id <> related_vocabulary_id (no self-reference)

### Business Rules

- Duplicate check: Combination of (hiragana, romaji) must be unique (except for deleted records)
- Related words count: No limit, but UI will paginate in dropdown
- Status transition: No restrictions (can go publish → hide → deleted → publish)
- Version management: Auto-increment on every update
- Deletion: Soft delete only (status = 'deleted'), keep data for audit

---

## 4. Error Handling

### Standard Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {
      "field": "optional field-level errors"
    }
  }
}
```

### Error Scenarios

| Scenario | Status | Code | Message |
|----------|--------|------|---------|
| Invalid JWT | 401 | `UNAUTHORIZED` | Invalid or expired token |
| Missing JWT | 401 | `UNAUTHORIZED` | No authorization header |
| Non-admin role | 403 | `FORBIDDEN` | Only admin role can access this resource |
| Invalid query params | 400 | `INVALID_QUERY_PARAMS` | Query parameter validation failed |
| Required field missing | 400 | `VALIDATION_ERROR` | Field 'X' is required |
| Invalid enum value | 400 | `VALIDATION_ERROR` | 'X' is not a valid level (must be N5/N4/N3/N2/N1/other) |
| Invalid URL format | 400 | `VALIDATION_ERROR` | Field 'media_url' must be a valid URL |
| Duplicate vocabulary | 409 | `CONFLICT` | Vocabulary with hiragana 'にほん' and romaji 'nihon' already exists |
| Vocabulary not found | 404 | `NOT_FOUND` | Vocabulary with id 999 not found |
| Related vocabulary not found | 400 | `VALIDATION_ERROR` | Related vocabulary with id 999 not found |
| Database error | 500 | `SERVER_ERROR` | Internal server error (with request ID for logging) |

---
