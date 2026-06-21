```markdown
---
title: [Feature] - Backend Specification
version: [e.g., 1.0]
author: [Team or Owner]
date: [YYYY-MM-DD]
---

# [Feature] - Backend Specification

> Related: [00-index.md](./00-index.md) | [02-frontend.md](./02-frontend.md) | [03-behavior.md](./03-behavior.md) | [04-quality.md](./04-quality.md)

---

## 1. Data Models

### 1.1 Database Schema

> Mô tả schema theo dạng khai báo **Prisma model** (bảng property). Nếu project dùng ORM khác (TypeORM, Sequelize, Drizzle, ...) thay thuộc tính `@` / `@@` cho phù hợp.

#### `ModelName` (table `[table_name]`)

| Property | Type / Prisma Modifier | Notes |
|----------|------------------------|-------|
| `id` | `Int @id @default(autoincrement())` | UNSIGNED, auto-increment |
| `fieldA` | `String` | NOT NULL |
| `fieldB` | `String?` | nullable |
| `fieldC` | `DateTime @default(now())` (column `created_at`) | timestamp |
| `updatedAt` | `DateTime @updatedAt` (column `updated_at`) | auto-updated |
| `relationField` | `RelatedModel[] @relation("Name")` | relation (if applicable) |
| Indexes | `@@index([fieldA])`, `@@index([fieldB, fieldC])` | |
| `@@map` | `"table_name"` | |

#### `RelatedModel` (table `[related_table]`, if applicable)

| Property | Type / Prisma Modifier | Notes |
|----------|------------------------|-------|
| `id` | `Int @id @default(autoincrement())` | |
| `parentId` | `Int` (column `parent_id`) | FK → `ModelName.id`, `onDelete: Cascade` |
| `parent` | `ModelName @relation("Name", fields: [parentId], references: [id], onDelete: Cascade)` | |
| `@@map` | `"related_table"` | |

### 1.2 TypeScript Models
Chỉ liệt kê tên của các data models liên quan đến feature này. Không bao gồm định nghĩa đầy đủ.
Bao gồm full path của các files nơi các models này được định nghĩa.
``` markdown
### [model_name].model.ts (`models/`)
- `[ModelName]` (field1, field2, field3, ...)

---

## 2. API Endpoints

### 2.1 Authorization

Tất cả endpoints yêu cầu:
1. JWT token hợp lệ trong header `Authorization: Bearer <token>`
2. Role/permission validation cho mỗi endpoint

---

### SV-001 — GET `/api/[resource]`
**List all [resource] with pagination and filtering**

**Required Role:** `[role]`

Request:
```http
GET /api/[resource]?page=1&limit=10&search=keyword&filterA=value
Authorization: Bearer <token>
```

Query Parameters:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Số trang |
| `limit` | number | No | 10 | Số items mỗi trang (tối đa 100) |
| `search` | string | No | - | Tìm kiếm theo [field] |
| `filterA` | string | No | - | Lọc theo [field A] |

Flow:
1. Xác thực JWT token
2. Kiểm tra role/permission
3. Validate query parameters
4. Query database với filters và pagination
5. Trả về result với pagination metadata

Response (200 OK):
```json
{
  "data": [{resource objects}], (CHỈ MÔ TẢ TÊN MODEL, KHÔNG LIỆT KÊ CHI TIẾT CÁC TRƯỜNG)
  "pagination": {...pagination metadata}
}
```

Errors:
| Status | Code | Message |
|--------|------|---------|
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Insufficient permissions |

---

### SV-002 — POST `/api/[resource]`
**Create a new [resource]**

**Required Role:** `[role]`

Request:
```http
POST /api/[resource]
Authorization: Bearer <token>
Content-Type: application/json

{
  "fieldA": "value",
  "fieldB": "value",
  "fieldC": "optional value"
}
```

Flow:
1. Xác thực JWT token
2. Kiểm tra role/permission
3. Validate request body (xem Validation Rules)
4. Kiểm tra trùng lặp nếu applicable
5. Insert record vào database
6. Trả về entity đã tạo

Response (201 Created):
```json
{
  "data": [{resource objects}], (CHỈ MÔ TẢ TÊN MODEL, KHÔNG LIỆT KÊ CHI TIẾT CÁC TRƯỜNG)
}
```

Errors:
| Status | Code | Message |
|--------|------|---------|
| 400 | `VALIDATION_ERROR` | Validation failed |
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 409 | `CONFLICT` | [Resource] already exists |

---

### SV-003 — GET `/api/[resource]/:id`
**Get single [resource] by ID**

**Required Role:** `[role]`

Request:
```http
GET /api/[resource]/1
Authorization: Bearer <token>
```

Flow:
1. Xác thực JWT token
2. Kiểm tra role/permission
3. Validate `id` route parameter (positive integer)
4. Query theo id
5. Trả về entity hoặc 404

Response (200 OK):
```json
{
  "data": {resource objects}  (CHỈ MÔ TẢ TÊN MODEL, KHÔNG LIỆT KÊ CHI TIẾT CÁC TRƯỜNG)
}
```

Errors:
| Status | Code | Message |
|--------|------|---------|
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | [Resource] not found |

---

### SV-004 — PUT `/api/[resource]/:id`
**Update an existing [resource]**

**Required Role:** `[role]`

Request:
```http
PUT /api/[resource]/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "fieldA": "new value"
}
```

Flow:
1. Xác thực JWT token
2. Kiểm tra role/permission
3. Validate `id` route parameter và request body
4. Kiểm tra record tồn tại
5. Kiểm tra duplicate conflicts nếu applicable
6. Update record
7. Trả về entity đã cập nhật

Response (200 OK):
```json
{
  "data": {resource objects}  (CHỈ MÔ TẢ TÊN MODEL, KHÔNG LIỆT KÊ CHI TIẾT CÁC TRƯỜNG)
}
```

Errors:
| Status | Code | Message |
|--------|------|---------|
| 400 | `VALIDATION_ERROR` | Validation failed |
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | [Resource] not found |
| 409 | `CONFLICT` | Duplicate value conflict |

---

### SV-005 — DELETE `/api/[resource]/:id`
**Delete a [resource]**

**Required Role:** `[role]`

Request:
```http
DELETE /api/[resource]/1
Authorization: Bearer <token>
```

Flow:
1. Xác thực JWT token
2. Kiểm tra role/permission
3. Validate `id` route parameter
4. Kiểm tra record tồn tại
5. Kiểm tra business constraints (e.g., cannot delete if has dependents)
6. Delete record
7. Trả về success message

Response (200 OK):
```json
{
  "message": "Deleted successfully"
}
```

Errors:
| Status | Code | Message |
|--------|------|---------|
| 400 | `BAD_REQUEST` | Cannot delete: [business reason] |
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | [Resource] not found |

---

## 3. Validation Rules

### 3.1 Client-Side Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| `fieldA` | Required, min 2 chars, max 100 chars | "Field A is required" / "Min 2 characters" |
| `fieldB` | Required, must be valid enum value | "Field B is required" |
| `fieldC` | Optional, max 500 chars | "Max 500 characters" |

### 3.2 Server-Side Validation

| Field | Rule | HTTP Status |
|-------|------|-------------|
| `fieldA` | Required, string, 2–100 chars | 400 |
| `fieldB` | Required, must be in allowed values | 400 |
| `fieldC` | Optional, string, max 500 chars | 400 |
| `id` (route param) | Must be positive integer | 400 |

### 3.3 Business Rules

- [Rule 1]: [Description] -> [Error if violated]
- [Rule 2]: [Description] -> [Error if violated]

---

## 4. Error Handling

### 4.1 Standard Error Response Format

Tất cả errors PHẢI tuân theo format này:
```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### 4.2 Error Scenarios

| Scenario | HTTP Status | Code | Response Message |
|----------|-------------|------|-----------------|
| Not authenticated | 401 | `UNAUTHORIZED` | "Not authenticated" |
| Forbidden | 403 | `FORBIDDEN` | "Insufficient permissions" |
| Validation failed | 400 | `VALIDATION_ERROR` | "Validation error: [details]" |
| Duplicate conflict | 409 | `CONFLICT` | "[Resource] already exists" |
| Not found | 404 | `NOT_FOUND` | "[Resource] not found" |
| Business rule violation | 400 | `BUSINESS_ERROR` | "[Specific reason]" |
| Database error | 500 | `INTERNAL_ERROR` | "Internal server error" |

---
```