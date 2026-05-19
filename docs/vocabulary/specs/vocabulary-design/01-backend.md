---
title: Vocabulary Management - Backend
version: 1.0
author: Admin Team
date: 2026-05-19
status: Draft
---

# Vocabulary Management — Backend

> Related: [00-index.md](./00-index.md) | [02-frontend.md](./02-frontend.md) | [03-behavior.md](./03-behavior.md) | [04-quality.md](./04-quality.md)

---

## 1. Data Models

### 1.1 Database Schema

#### vocabularies

```sql
vocabularies {
  id                 BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  meaning_vi         NVARCHAR(255) NOT NULL,
  hiragana_kana      NVARCHAR(255) NOT NULL,
  romaji             NVARCHAR(255) NOT NULL,
  kanji              NVARCHAR(255) NULL,
  sino_vietnamese    NVARCHAR(255) NULL,
  level              ENUM('N5','N4','N3','N2','N1') NOT NULL,
  media_url          NVARCHAR(500) NULL,
  note               NVARCHAR(1000) NULL,
  tags_json          JSON NULL,
  status             ENUM('publish','hide','delete') NOT NULL DEFAULT 'hide',
  version            INT UNSIGNED NOT NULL DEFAULT 1,
  created_by         BIGINT UNSIGNED NOT NULL,
  updated_by         BIGINT UNSIGNED NOT NULL,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vocab_status (status),
  INDEX idx_vocab_level (level),
  INDEX idx_vocab_meaning (meaning_vi),
  INDEX idx_vocab_kana (hiragana_kana),
  INDEX idx_vocab_romaji (romaji),
  INDEX idx_vocab_kanji (kanji)
}
```

#### vocabulary_relations

```sql
vocabulary_relations {
  id                   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  source_vocabulary_id BIGINT UNSIGNED NOT NULL,
  target_vocabulary_id BIGINT UNSIGNED NOT NULL,
  relation_type        ENUM('related','synonym','antonym') NOT NULL,
  created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_vocab_relation (source_vocabulary_id, target_vocabulary_id, relation_type),
  INDEX idx_source_relation (source_vocabulary_id, relation_type),
  INDEX idx_target_relation (target_vocabulary_id)
}
```

#### vocabulary_reports

```sql
vocabulary_reports {
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vocabulary_id    BIGINT UNSIGNED NOT NULL,
  reporter_user_id  BIGINT UNSIGNED NOT NULL,
  report_reason    NVARCHAR(100) NOT NULL,
  report_message   NVARCHAR(1000) NULL,
  status           ENUM('new','in_review','resolved','rejected') NOT NULL DEFAULT 'new',
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_by      BIGINT UNSIGNED NULL,
  reviewed_at      TIMESTAMP NULL,
  review_note      NVARCHAR(1000) NULL,
  INDEX idx_vocab_report (vocabulary_id, status)
}
```

#### vocabulary_metrics

```sql
vocabulary_metrics {
  vocabulary_id   BIGINT UNSIGNED PRIMARY KEY,
  learn_count     BIGINT UNSIGNED NOT NULL DEFAULT 0,
  favorite_count  BIGINT UNSIGNED NOT NULL DEFAULT 0,
  last_synced_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
}
```

#### audit_logs (existing generic table)

Thiết kế này reuse bảng audit hiện có bằng cách thêm/chuẩn hóa các trường sau nếu cần:

```sql
audit_logs {
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_id      BIGINT UNSIGNED NOT NULL,
  target_type    VARCHAR(50) NOT NULL,
  target_id      BIGINT UNSIGNED NOT NULL,
  action         ENUM('CREATE','UPDATE','DELETE') NOT NULL,
  changed_fields JSON NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
}
```

### 1.2 TypeScript DTOs

```typescript
export type VocabularyLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
export type VocabularyStatus = 'publish' | 'hide' | 'delete';
export type VocabularyRelationType = 'related' | 'synonym' | 'antonym';

export interface VocabularyDto {
  id: number;
  meaning_vi: string;
  hiragana_kana: string;
  romaji: string;
  kanji: string | null;
  sino_vietnamese: string | null;
  level: VocabularyLevel;
  media_url: string | null;
  note: string | null;
  tags: string[];
  status: VocabularyStatus;
  version: number;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
}

export interface VocabularyLookupItemDto {
  id: number;
  label: string;
  meaning_vi: string;
  hiragana_kana: string;
  level: VocabularyLevel;
  status: VocabularyStatus;
}

export interface CreateVocabularyDto {
  meaning_vi: string;
  hiragana_kana: string;
  romaji: string;
  kanji?: string | null;
  sino_vietnamese?: string | null;
  level: VocabularyLevel;
  media_url?: string | null;
  note?: string | null;
  tags?: string[];
  related_ids?: number[];
  synonym_ids?: number[];
  antonym_ids?: number[];
  status: VocabularyStatus;
}

export interface UpdateVocabularyDto extends CreateVocabularyDto {
  version: number;
}

export interface VocabularyChangeLogDto {
  id: number;
  actor_id: number;
  actor_name: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  changed_fields: Record<string, { old: unknown; new: unknown }> | null;
  created_at: string;
}

export interface VocabularyReportDto {
  id: number;
  reporter_user_id: number;
  reporter_name: string;
  report_reason: string;
  report_message: string | null;
  status: 'new' | 'in_review' | 'resolved' | 'rejected';
  created_at: string;
}

export interface VocabularyAuditDto {
  metadata: {
    created_by: number;
    created_by_name: string;
    updated_by: number;
    updated_by_name: string;
    version: number;
    created_at: string;
    updated_at: string;
  };
  change_log: VocabularyChangeLogDto[];
  report_info: VocabularyReportDto[];
}

export interface VocabularyAnalyticsDto {
  vocabulary_id: number;
  learn_count: number;
  favorite_count: number;
  last_synced_at: string;
}

export interface VocabularyListResponse {
  data: VocabularyDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
```

---

## 2. API Endpoints

### VA-001 — GET /api/admin/vocabularies
**Danh sách vocabulary cho admin**

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| page | number | No | 1 | Trang hiện tại |
| limit | number | No | 10 | Số item mỗi trang |
| search | string | No | — | Tìm theo nghĩa TV, Hira/Kana, Romaji, Kanji |
| level | string | No | — | Lọc theo N5..N1 |
| status | string | No | — | Lọc theo publish/hide/delete |
| tag | string | No | — | Lọc theo tag |
| sortBy | string | No | `updated_at` | Whitelist field sort |
| sortOrder | string | No | `desc` | `asc` / `desc` |

**Allowed sortBy whitelist:** `id`, `meaning_vi`, `hiragana_kana`, `romaji`, `kanji`, `level`, `status`, `version`, `created_at`, `updated_at`, `learn_count`, `favorite_count`

**Flow:**
1. Xác thực JWT và kiểm tra admin.
2. Validate query params, chuẩn hóa sortBy qua whitelist.
3. Build điều kiện SQL động với tham số hóa.
4. JOIN `vocabulary_metrics` nếu cần hiển thị counts trong list.
5. Trả về danh sách kèm pagination.

### VA-002 — POST /api/admin/vocabularies
**Tạo vocabulary mới**

**Request Body:** `CreateVocabularyDto`

**Flow:**
1. Xác thực JWT + admin.
2. Validate body bằng Zod.
3. Normalize tags: trim, remove empty values, dedupe.
4. INSERT `vocabularies` với `version=1`, `created_by=updated_by=current admin`.
5. INSERT `vocabulary_relations` cho 3 nhóm quan hệ nếu có.
6. INSERT `audit_logs` action `CREATE`.
7. Khởi tạo `vocabulary_metrics` nếu pipeline thống kê chưa có record.
8. Trả về `VocabularyDto`.

### VA-003 — GET /api/admin/vocabularies/:id
**Lấy chi tiết vocabulary**

**Flow:**
1. Xác thực JWT + admin.
2. Query vocabulary theo id, 404 nếu không có.
3. Query relations hiện tại theo 3 nhóm.
4. Trả về `VocabularyDto` với `tags[]` và các `related_ids / synonym_ids / antonym_ids` được map từ relation table ở response service layer.

### VA-004 — PUT /api/admin/vocabularies/:id
**Cập nhật vocabulary**

**Request Body:** `UpdateVocabularyDto`

**Flow:**
1. Xác thực JWT + admin.
2. Query record hiện tại, 404 nếu không có.
3. Validate body, normalize tags.
4. Tính diff để sinh `changed_fields`.
5. UPDATE `vocabularies`, set `updated_by`, tăng `version` lên 1.
6. Replace relations theo 3 nhóm bằng transaction.
7. INSERT `audit_logs` action `UPDATE`.
8. Trả về `VocabularyDto` mới nhất.

### VA-005 — GET /api/admin/vocabularies/lookup
**Lookup options cho 3 multiSelect quan hệ**

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| excludeId | number | No | — | Loại trừ chính record hiện tại khi edit |
| search | string | No | — | Tìm nhanh theo nghĩa/kana/kanji/romaji |
| limit | number | No | 50 | Giới hạn số options trả về |

**Flow:**
1. Xác thực JWT + admin.
2. Query trực tiếp từ `vocabularies` với điều kiện `id <> excludeId` nếu có.
3. Trả về danh sách lookup item gồm label và status để admin nhìn thấy ngữ cảnh.

### VA-006 — GET /api/admin/vocabularies/:id/audit
**Lấy audit tab data**

**Flow:**
1. Xác thực JWT + admin.
2. Lấy metadata từ `vocabularies`.
3. JOIN `users` để map `created_by_name`, `updated_by_name`.
4. Lấy change log từ `audit_logs` theo `target_type='VOCABULARY'` và `target_id`.
5. Lấy report info từ `vocabulary_reports`.
6. Trả về `VocabularyAuditDto`.

### VA-007 — GET /api/admin/vocabularies/:id/analytics
**Lấy analytics tab data**

**Flow:**
1. Xác thực JWT + admin.
2. Query `vocabulary_metrics` theo `vocabulary_id`.
3. Nếu chưa có record, trả về counts = 0.
4. Trả về `VocabularyAnalyticsDto`.

---

## 3. Validation Rules

- `meaning_vi`: required, 1-255 ký tự.
- `hiragana_kana`: required, 1-255 ký tự.
- `romaji`: required, 1-255 ký tự.
- `kanji`: optional, tối đa 255 ký tự.
- `sino_vietnamese`: optional, tối đa 255 ký tự.
- `level`: required, chỉ nhận `N5 | N4 | N3 | N2 | N1`.
- `media_url`: optional, phải là URL hợp lệ và tối đa 500 ký tự.
- `note`: optional, tối đa 1000 ký tự.
- `tags`: optional array, tối đa 20 phần tử, mỗi tag 1-50 ký tự sau khi trim.
- `related_ids / synonym_ids / antonym_ids`: optional arrays, không trùng phần tử, không được chứa chính record hiện tại khi edit.
- `status`: required, chỉ nhận `publish | hide | delete`.
- `version` trong update: required và phải là số nguyên dương.

---

## 4. Error Handling

| Code | Condition | Response |
|------|-----------|----------|
| 400 | Validation fail | Trả về danh sách field errors theo chuẩn API hiện có |
| 401 | No auth / invalid token | Unauthorized |
| 403 | Non-admin | Forbidden |
| 404 | Vocabulary không tồn tại | Not found |
| 409 | Conflict dữ liệu quan hệ hoặc version mismatch nếu server bật optimistic check | Conflict |

Quy ước soft delete: khi admin chọn status `delete`, backend thực hiện UPDATE trên `vocabularies.status = 'delete'`, tăng version và ghi audit log action `UPDATE` với thay đổi của field status; record không bị xóa cứng khỏi DB.
