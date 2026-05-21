---
title: Vocabulary Management - Backend
version: 1.0
date: 2026-05-20
---

# Vocabulary Management — Backend

> Related: [00-index.md](./00-index.md) | [02-frontend.md](./02-frontend.md) | [03-behavior.md](./03-behavior.md) | [04-quality.md](./04-quality.md)

---

## 1. Data Models

### 1.1 DB Schema

#### Bảng `vocabularies`

```sql
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
  created_by      INT NOT NULL,
  updated_by      INT NOT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_vocab_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT fk_vocab_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Bảng `vocabulary_relations`

```sql
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
```

> Quan hệ 2 chiều: khi insert `(A, B, type)`, service tự insert thêm `(B, A, type)` trong cùng transaction.

#### Bảng `vocabulary_reports`

```sql
CREATE TABLE vocabulary_reports (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  vocab_id    INT NOT NULL,
  reporter_id INT NOT NULL,
  reason      TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  status      ENUM('pending','resolved','rejected') NOT NULL DEFAULT 'pending',
  resolved_by INT,
  resolved_at DATETIME,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vreport_vocab      FOREIGN KEY (vocab_id)    REFERENCES vocabularies(id) ON DELETE CASCADE,
  CONSTRAINT fk_vreport_reporter   FOREIGN KEY (reporter_id) REFERENCES users(id),
  CONSTRAINT fk_vreport_resolver   FOREIGN KEY (resolved_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Bảng `vocabulary_audit_logs`

```sql
CREATE TABLE vocabulary_audit_logs (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  vocab_id       INT NOT NULL,
  admin_id       INT NOT NULL,
  action         ENUM('CREATE','UPDATE','DELETE') NOT NULL,
  changed_fields JSON COMMENT 'Object: {field: {old, new}}',
  timestamp      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_val_vocab FOREIGN KEY (vocab_id) REFERENCES vocabularies(id) ON DELETE CASCADE,
  CONSTRAINT fk_val_admin FOREIGN KEY (admin_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Bảng `vocabulary_analytics`

```sql
CREATE TABLE vocabulary_analytics (
  vocab_id       INT PRIMARY KEY,
  learn_count    INT NOT NULL DEFAULT 0,
  favorite_count INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_va_vocab FOREIGN KEY (vocab_id) REFERENCES vocabularies(id) ON DELETE CASCADE
) ENGINE=InnoDB;
```

---

### 1.2 TypeScript DTOs

```typescript
// server/src/models/vocabularies.model.ts

import type { RowDataPacket } from 'mysql2/promise';

// DB row types
export interface VocabularyRow extends RowDataPacket {
  id: number;
  meaning_vi: string;
  hiragana: string;
  romaji: string | null;
  kanji: string | null;
  sino_vietnamese: string | null;
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  image_url: string | null;
  note: string | null;
  tags: string[] | null;       // JSON parsed
  status: 'publish' | 'hide' | 'deleted';
  version: number;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
}

export interface VocabularyRelationRow extends RowDataPacket {
  id: number;
  vocab_id: number;
  related_vocab_id: number;
  relation_type: 'related' | 'synonym' | 'antonym';
}

export interface VocabularyReportRow extends RowDataPacket {
  id: number;
  vocab_id: number;
  reporter_id: number;
  reason: string;
  status: 'pending' | 'resolved' | 'rejected';
  resolved_by: number | null;
  resolved_at: string | null;
  created_at: string;
  reporter_name?: string;
  resolved_by_name?: string;
}

export interface VocabularyAuditLogRow extends RowDataPacket {
  id: number;
  vocab_id: number;
  admin_id: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  changed_fields: Record<string, { old: unknown; new: unknown }> | null;
  timestamp: string;
  admin_name?: string;
}

export interface VocabularyAnalyticsRow extends RowDataPacket {
  vocab_id: number;
  learn_count: number;
  favorite_count: number;
}

// Simple projection for MultiSelect
export interface VocabularySimpleRow extends RowDataPacket {
  id: number;
  kanji: string | null;
  hiragana: string;
  meaning_vi: string;
}

// Filters
export interface VocabularyFilters {
  search?: string;
  level?: string;
  status?: string;
  tag?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// DTOs
export interface CreateVocabularyDto {
  meaning_vi: string;
  hiragana: string;
  romaji?: string;
  kanji?: string;
  sino_vietnamese?: string;
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  image_url?: string;
  note?: string;
  tags?: string[];
  status: 'publish' | 'hide' | 'deleted';
  related_ids?: number[];
  synonym_ids?: number[];
  antonym_ids?: number[];
}

export type UpdateVocabularyDto = Partial<CreateVocabularyDto>;
```

---

## 2. API Endpoints

### 2.1 GET `/api/vocabularies` — Danh sách từ vựng

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Tìm theo meaning_vi, kanji, hiragana, romaji (LIKE) |
| `level` | string | N5/N4/N3/N2/N1 |
| `status` | string | publish/hide/deleted |
| `tag` | string | Tìm trong JSON tags array |
| `page` | number | Default 1 |
| `limit` | number | Default 20, max 100 |
| `sortBy` | string | id/meaning_vi/hiragana/level/status/created_at/updated_at |
| `sortOrder` | string | asc/desc |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "data": [VocabularyRow, ...],
    "pagination": { "page": 1, "limit": 20, "total": 150, "pages": 8 }
  }
}
```

---

### 2.2 GET `/api/vocabularies/list/simple` — Lightweight list cho MultiSelect

**Response 200:**
```json
{
  "success": true,
  "data": [{ "id": 1, "kanji": "日本語", "hiragana": "にほんご", "meaning_vi": "Tiếng Nhật" }, ...]
}
```

---

### 2.3 GET `/api/vocabularies/:id` — Chi tiết từ vựng

**Response 200:**
```json
{
  "success": true,
  "data": {
    ...VocabularyRow,
    "relations": {
      "related": [VocabularySimple, ...],
      "synonym": [VocabularySimple, ...],
      "antonym": [VocabularySimple, ...]
    },
    "reports": [VocabularyReportRow, ...],
    "analytics": { "learn_count": 0, "favorite_count": 0 },
    "created_by_name": "Admin",
    "updated_by_name": "Admin"
  }
}
```

**Errors:** 404 nếu không tìm thấy.

---

### 2.4 POST `/api/vocabularies` — Tạo từ vựng mới

**Request body:** `CreateVocabularyDto`

**Flow:**
1. Validate input (Zod)
2. Insert vào `vocabularies` (version = 1)
3. Insert analytics row (`vocab_id`, learn_count=0, favorite_count=0)
4. Nếu `related_ids` / `synonym_ids` / `antonym_ids` có giá trị: insert pairs 2 chiều vào `vocabulary_relations`
5. Ghi `vocabulary_audit_logs` (action = 'CREATE')
6. Return created vocabulary

**Response 201:** `{ "success": true, "data": VocabularyRow }`

**Errors:** 400 validation error.

---

### 2.5 PUT `/api/vocabularies/:id` — Cập nhật từ vựng

**Request body:** `UpdateVocabularyDto`

**Flow:**
1. Validate input (Zod)
2. Lấy current record để tính `changed_fields`
3. Update `vocabularies` (version += 1)
4. Nếu relations thay đổi: xóa hết relations cũ, insert mới (cả 2 chiều) trong transaction
5. Ghi `vocabulary_audit_logs` (action = 'UPDATE', `changed_fields`)
6. Return updated vocabulary

**Response 200:** `{ "success": true, "data": VocabularyRow }`

**Errors:** 400 validation, 404 not found.

---

### 2.6 DELETE `/api/vocabularies/:id` — Xóa mềm từ vựng

**Flow:**
1. Set `status = 'deleted'`, `version += 1`
2. Ghi `vocabulary_audit_logs` (action = 'DELETE')

**Response 200:** `{ "success": true, "data": { "id": 1 } }`

**Errors:** 404 not found.

---

### 2.7 GET `/api/vocabularies/:id/audit-logs` — Lịch sử thay đổi

**Response 200:**
```json
{
  "success": true,
  "data": [VocabularyAuditLogRow, ...]
}
```

---

### 2.8 PATCH `/api/vocabularies/reports/:reportId/resolve` — Resolve report

**Flow:**
1. Kiểm tra report tồn tại và đang ở trạng thái 'pending'
2. Set `status = 'resolved'`, `resolved_by = adminId`, `resolved_at = NOW()`

**Response 200:** `{ "success": true, "data": VocabularyReportRow }`

**Errors:** 404 report not found, 409 nếu đã được xử lý.

---

### 2.9 PATCH `/api/vocabularies/reports/:reportId/reject` — Reject report

**Flow:** Tương tự resolve nhưng set `status = 'rejected'`.

**Response 200:** `{ "success": true, "data": VocabularyReportRow }`

---

## 3. Validation Rules

### 3.1 Client-side (Zod schema)

| Field | Rule |
|-------|------|
| `meaning_vi` | required, string, min 1, max 500 |
| `hiragana` | required, string, min 1, max 200 |
| `romaji` | optional, string, max 200 |
| `kanji` | optional, string, max 200 |
| `sino_vietnamese` | optional, string, max 200 |
| `level` | required, enum N5/N4/N3/N2/N1 |
| `image_url` | optional, URL format hoặc empty string |
| `note` | optional, string, max 2000 |
| `tags` | optional, array of string, mỗi tag max 50 chars, tối đa 20 tags |
| `status` | required, enum publish/hide/deleted |
| `related_ids` | optional, array of number |
| `synonym_ids` | optional, array of number |
| `antonym_ids` | optional, array of number |

### 3.2 Server-side business rules

- `related_ids`, `synonym_ids`, `antonym_ids` phải tồn tại trong DB và không được trỏ vào chính từ vựng đang được tạo/sửa
- Một cặp vocab không thể có cùng `relation_type` hơn một lần (UNIQUE constraint)
- Khi update relations, transaction bao gồm cả delete cũ và insert mới

---

## 4. Error Handling

### 4.1 Standard Error Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [{ "field": "hiragana", "message": "Hiragana là bắt buộc" }]
  }
}
```

### 4.2 Error Scenarios

| Scenario | HTTP Status | Error Code |
|----------|------------|------------|
| Validation thất bại | 400 | `VALIDATION_ERROR` |
| Từ vựng không tồn tại | 404 | `NOT_FOUND` |
| Report không tồn tại | 404 | `REPORT_NOT_FOUND` |
| Report đã được xử lý | 409 | `REPORT_ALREADY_RESOLVED` |
| Related vocab ID không tồn tại | 400 | `INVALID_RELATION_TARGET` |
| Self-relation (vocab liên quan với chính nó) | 400 | `SELF_RELATION_NOT_ALLOWED` |
| Unauthorized (không phải admin) | 403 | `FORBIDDEN` |
