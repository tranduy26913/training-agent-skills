# 01 — Backend: Vocabulary FlashCard

> Related: [00-index.md](./00-index.md) | [02-frontend.md](./02-frontend.md) | [03-behavior.md](./03-behavior.md) | [04-quality.md](./04-quality.md)

---

## 1. Data Models

### 1.1 Database Schema

```sql
-- ============================================================
-- FlashCard Learning — User Progress Schema
-- ============================================================

CREATE TABLE IF NOT EXISTS `user_vocabulary_progress` (
  `user_id`       INT UNSIGNED NOT NULL,
  `vocabulary_id` INT UNSIGNED NOT NULL,
  `status`        ENUM('new', 'learning', 'known') NOT NULL DEFAULT 'new',
  `review_count`  INT UNSIGNED NOT NULL DEFAULT 0,
  `last_reviewed` TIMESTAMP NULL DEFAULT NULL,
  `is_favorite`   TINYINT(1) NOT NULL DEFAULT 0,
  `created_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `vocabulary_id`),
  FOREIGN KEY (`user_id`)       REFERENCES `users`(`id`)       ON DELETE CASCADE,
  FOREIGN KEY (`vocabulary_id`) REFERENCES `vocabularies`(`id`) ON DELETE CASCADE,
  INDEX `idx_uvp_user_status`   (`user_id`, `status`),
  INDEX `idx_uvp_user_level`    (`user_id`, `vocabulary_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

> **Ghi chú:** Bảng `vocabularies` không thay đổi. `learn_count` trong bảng `vocabularies` được tăng khi User hoàn thành một phiên học (batch update, không tăng từng thẻ).

### 1.2 TypeScript DTOs (`server/src/models/learn.model.ts`)

```typescript
export type ProgressStatus = 'new' | 'learning' | 'known';

// DTO cho một từ kèm progress của user
export interface LearnVocabularyItem {
  id: number;
  kanji: string | null;
  hiragana: string | null;
  romaji: string | null;
  meaning_vi: string;
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  tags: string[];
  media_url: string | null;
  note: string | null;
  progress: UserProgressDto | null;
}

export interface UserProgressDto {
  status: ProgressStatus;
  review_count: number;
  last_reviewed: string | null; // ISO string
  is_favorite: boolean;
}

// DTO thống kê theo level
export interface LevelStatsDto {
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  total: number;        // Tổng từ trong hệ thống ở level này
  known: number;        // Số từ User đã đánh dấu known
  learning: number;     // Số từ đang học
  new_count: number;    // Số từ chưa học lần nào
}

// Request: cập nhật progress 1 từ
export interface UpdateProgressDto {
  vocabulary_id: number;
  status: ProgressStatus;
}

// Request: batch cập nhật cuối phiên học
export interface BatchUpdateProgressDto {
  updates: UpdateProgressDto[];
}

// Request: toggle favorite
export interface ToggleFavoriteDto {
  vocabulary_id: number;
}

// Response: toggle favorite
export interface ToggleFavoriteResponse {
  vocabulary_id: number;
  is_favorite: boolean;
}
```

---

## 2. API Endpoints

### 2.1 GET `/api/learn/stats` — Thống kê tiến độ theo level

**Mô tả:** Trả về thống kê tiến độ của User theo từng cấp độ JLPT (dùng cho `LearnLevelPage`).

**Auth:** JWT, role `user`

**Request:** không có query params

**Response `200`:**
```json
{
  "data": [
    { "level": "N5", "total": 120, "known": 45, "learning": 20, "new_count": 55 },
    { "level": "N4", "total": 200, "known": 10, "learning": 5, "new_count": 185 },
    ...
  ]
}
```

**Errors:**
| Code | Tình huống |
|------|-----------|
| `401` | Chưa đăng nhập |
| `403` | Role không phải `user` |

---

### 2.2 GET `/api/learn/vocabularies` — Danh sách từ theo level

**Mô tả:** Lấy danh sách từ vựng có `status = 'publish'` theo level, kèm progress của user hiện tại.

**Auth:** JWT, role `user`

**Query Params:**

| Param | Kiểu | Bắt buộc | Mô tả |
|-------|------|----------|-------|
| `level` | `N5\|N4\|N3\|N2\|N1` | Yes | Cấp độ JLPT |
| `progress_status` | `all\|new\|learning\|known` | No (default: `all`) | Filter theo tiến độ |
| `page` | number | No (default: 1) | Trang |
| `limit` | number | No (default: 50, max: 200) | Số từ mỗi trang |

**Response `200`:**
```json
{
  "data": [
    {
      "id": 1,
      "kanji": "食べる",
      "hiragana": "たべる",
      "romaji": "taberu",
      "meaning_vi": "ăn",
      "level": "N5",
      "tags": ["động từ"],
      "media_url": null,
      "note": null,
      "progress": {
        "status": "known",
        "review_count": 5,
        "last_reviewed": "2026-05-30T10:00:00.000Z",
        "is_favorite": false
      }
    }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 120, "totalPages": 3 }
}
```

**Errors:**
| Code | Tình huống |
|------|-----------|
| `400` | `level` không hợp lệ |
| `401` | Chưa đăng nhập |
| `403` | Role không phải `user` |

---

### 2.3 POST `/api/learn/progress/batch` — Cập nhật tiến độ cuối phiên học

**Mô tả:** Batch upsert trạng thái học sau khi kết thúc phiên. Mỗi record được upsert theo cặp `(user_id, vocabulary_id)`. Đồng thời tăng `review_count` và cập nhật `last_reviewed`. Sau khi upsert xong, tăng `learn_count` trong bảng `vocabularies` cho tất cả từ trong phiên.

**Auth:** JWT, role `user`

**Request Body:**
```json
{
  "updates": [
    { "vocabulary_id": 1, "status": "known" },
    { "vocabulary_id": 2, "status": "learning" }
  ]
}
```

**Validation:**
- `updates`: mảng không rỗng, tối đa 200 phần tử
- `vocabulary_id`: integer dương, tồn tại trong bảng `vocabularies`
- `status`: enum `'new' | 'learning' | 'known'`

**Response `200`:**
```json
{ "updated": 2 }
```

**Errors:**
| Code | Tình huống |
|------|-----------|
| `400` | `updates` rỗng hoặc sai format |
| `401` | Chưa đăng nhập |
| `403` | Role không phải `user` |

---

### 2.4 POST `/api/learn/favorite/:vocabularyId` — Toggle Favorite

**Mô tả:** Toggle trạng thái `is_favorite` của 1 từ cho user hiện tại. Nếu chưa có progress record thì tạo mới với status `'new'`, `is_favorite = true`.

**Auth:** JWT, role `user`

**Path Params:**
| Param | Kiểu | Mô tả |
|-------|------|-------|
| `vocabularyId` | number | ID từ vựng |

**Response `200`:**
```json
{ "vocabulary_id": 1, "is_favorite": true }
```

**Errors:**
| Code | Tình huống |
|------|-----------|
| `404` | `vocabularyId` không tồn tại hoặc từ bị ẩn/xóa |
| `401` | Chưa đăng nhập |
| `403` | Role không phải `user` |

---

## 3. Validation Rules

### 3.1 Client-side

| Field | Rule |
|-------|------|
| `level` (query param) | Phải là một trong: `N5, N4, N3, N2, N1` |
| `updates[].vocabulary_id` | Phải là integer dương |
| `updates[].status` | Phải là `new`, `learning`, hoặc `known` |
| `updates` length | Tối đa 200 phần tử |

### 3.2 Server-side

| Field | Rule |
|-------|------|
| `level` | Validate enum trước khi truy vấn DB |
| `vocabulary_id` trong batch | Kiểm tra tồn tại và `status = 'publish'` trong bảng `vocabularies` |
| `limit` | Clamp về 200 nếu vượt quá |
| `page` | Phải ≥ 1 |

### 3.3 Business Rules

- Chỉ User với role `user` mới được truy cập các endpoint `/api/learn/*`.
- Từ vựng có `status != 'publish'` không được xuất hiện trong danh sách học.
- `review_count` chỉ tăng 1 mỗi lần batch, không tăng theo số lần lật thẻ.
- Toggle favorite hoạt động dạng upsert: nếu chưa có progress record thì tạo mới với `status = 'new'`.

---

## 4. Error Handling

### 4.1 Standard Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "details": [{ "field": "level", "message": "level phải là N1–N5" }]
  }
}
```

### 4.2 Error Scenarios

| Scenario | HTTP Code | Error Code |
|----------|-----------|-----------|
| Token hết hạn / không hợp lệ | `401` | `UNAUTHORIZED` |
| Role không phải `user` | `403` | `FORBIDDEN` |
| `level` sai enum | `400` | `VALIDATION_ERROR` |
| `vocabularyId` không tồn tại | `404` | `NOT_FOUND` |
| `updates` rỗng | `400` | `VALIDATION_ERROR` |
| Lỗi DB không mong muốn | `500` | `INTERNAL_ERROR` |
