---
title: Project Management - Backend
version: 1.01
author: Admin Team
date: 2026-06-25
---

# Project Management — Backend

> Related: [00-index.md](./00-index.md) | [02-frontend.md](./02-frontend.md) | [03-behavior.md](./03-behavior.md) | [04-quality.md](./04-quality.md)

---

## 1. Data Models

### 1.1 Database Schema (Prisma models)

#### `Project` (table `projects`)

| Property | Type / Prisma Modifier | Notes |
|----------|------------------------|-------|
| `id` | `Int @id @default(autoincrement())` | UNSIGNED, auto-increment |
| `name` | `String` | VARCHAR(200), NOT NULL |
| `description` | `String?` | TEXT, nullable |
| `projectPrompt` | `String?` (column `project_prompt`) | TEXT, nullable — system prompt riêng của Project |
| `headline` | `String?` | TEXT, nullable — hidden field, dự trữ tương lai |
| `caption` | `String?` | TEXT, nullable — hidden field, dự trữ tương lai |
| `subtext` | `String?` | TEXT, nullable — hidden field, dự trữ tương lai |
| `ownerId` | `Int` (column `owner_id`) | FK → `User.id`, NOT NULL |
| `owner` | `User @relation(fields: [ownerId], references: [id], onDelete: Restrict)` | Không cho xoá User đang sở hữu Project |
| `scripts` | `Script[]` | [NEW - CR-SCRIPT-001] Relation 1-N: Project có nhiều Scripts. Xem `docs/scripts/specs/scripts-design/01-backend.md` |
| `isDeleted` | `Boolean @default(false)` (column `is_deleted`) | Soft delete flag |
| `createdAt` | `DateTime @default(now())` (column `created_at`) | |
| `updatedAt` | `DateTime @updatedAt` (column `updated_at`) | auto-updated |
| Indexes | `@@index([ownerId])`, `@@index([isDeleted])` | |
| `@@map` | `"projects"` | |

### 1.2 TypeScript Models

> **Quy ước:** Mô tả type chỉ liệt kê tên + property (không dùng code block). Trỏ file thực tế để tra cứu khi cần.

#### Server types — `server/src/models/projects.model.ts`

Interface `Project`
- `id: number`
- `name: string`
- `description: string | null`
- `projectPrompt: string | null`
- `headline: string | null`
- `caption: string | null`
- `subtext: string | null`
- `ownerId: number`
- `isDeleted: boolean`
- `createdAt: Date`
- `updatedAt: Date`

Interface `CreateProjectDto`
- `name: string` — required
- `description?: string` — optional
- `projectPrompt?: string` — optional

Interface `UpdateProjectDto`
- `name?: string` — optional
- `description?: string` — optional
- `projectPrompt?: string` — optional

---

## 2. API Endpoints

### 2.1 Authorization

All endpoints require:
1. Valid JWT token in `Authorization: Bearer <token>` header
2. Role: `admin`

---

### SV-001 — GET /api/admin/projects
**Danh sách Project (không phân trang, không filter)**

**Required Role:** `admin`

Request:
```http
GET /api/admin/projects
Authorization: Bearer <token>
```

Flow:
1. Verify JWT token
2. Check role admin
3. Query database: lấy tất cả projects có `isDeleted = false`, join với User để lấy `ownerName`
4. Sắp xếp theo `updatedAt` giảm dần (mới nhất lên đầu)
5. Trả về danh sách

Response (200 OK):
```json
{
  "data": Project[]
}
```

Errors:
| Status | Code | Message |
|--------|------|---------|
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Insufficient permissions |

---

### SV-002 — POST /api/admin/projects
**Tạo Project mới**

**Required Role:** `admin`

Request:
```http
POST /api/admin/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Fanpage ABC",
  "description": "Project cho fanpage ABC về ẩm thực",
  "projectPrompt": "Bạn là content creator cho fanpage ABC, chuyên về ẩm thực đường phố Việt Nam..."
}
```

Flow:
1. Verify JWT token
2. Check role admin
3. Validate request body (name required, min 2, max 200)
4. Set `ownerId` từ authenticated user
5. Set `headline`, `caption`, `subtext` mặc định rỗng (`''`)
6. Insert record to database
7. Ghi audit log (CREATE)
8. Return created entity

Response (201 Created):
```json
{
  "data": Project
}
```

Errors:
| Status | Code | Message |
|--------|------|---------|
| 400 | `VALIDATION_ERROR` | Validation failed |
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Insufficient permissions |

---

### SV-003 — GET /api/admin/projects/:id
**Lấy chi tiết Project theo ID**

**Required Role:** `admin`

Request:
```http
GET /api/admin/projects/1
Authorization: Bearer <token>
```

Flow:
1. Verify JWT token
2. Check role admin
3. Validate `id` route parameter (positive integer)
4. Query by id, chỉ lấy project có `isDeleted = false`
5. Return entity hoặc 404

Response (200 OK):
```json
{
  "data": Project
}
```

Errors:
| Status | Code | Message |
|--------|------|---------|
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Project not found |

---

### SV-004 — PUT /api/admin/projects/:id
**Cập nhật Project**

**Required Role:** `admin`

Request:
```http
PUT /api/admin/projects/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Fanpage ABC - Updated",
  "description": "Mô tả mới cho project",
  "projectPrompt": "System prompt mới..."
}
```

Flow:
1. Verify JWT token
2. Check role admin
3. Validate `id` route parameter và request body
4. Check record exists và `isDeleted = false`
5. Update record (chỉ update các field được gửi lên)
6. Ghi audit log (UPDATE)
7. Return updated entity

Response (200 OK):
```json
{
  "data": Project
}
```

Errors:
| Status | Code | Message |
|--------|------|---------|
| 400 | `VALIDATION_ERROR` | Validation failed |
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Project not found |

---

### SV-005 — DELETE /api/admin/projects/:id
**Xoá Project (soft delete)**

**Required Role:** `admin`

Request:
```http
DELETE /api/admin/projects/1
Authorization: Bearer <token>
```

Flow:
1. Verify JWT token
2. Check role admin
3. Validate `id` route parameter
4. Check record exists và `isDeleted = false`
5. Set `isDeleted = true` (soft delete)
6. Ghi audit log (DELETE)
7. Return success

Response (200 OK):
```json
{
  "message": "Project deleted successfully"
}
```

Errors:
| Status | Code | Message |
|--------|------|---------|
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Project not found |

---

## 3. Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| `name` | Required, string, min 2, max 200 | "Tên project phải từ 2-200 ký tự" |
| `description` | Optional, string, max 2000 | "Mô tả không được quá 2000 ký tự" |
| `projectPrompt` | Optional, string, max 10000 | "Prompt không được quá 10000 ký tự" |

---

## 4. Error Handling

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `VALIDATION_ERROR` | Request body/params không hợp lệ |
| 401 | `UNAUTHORIZED` | Thiếu hoặc sai JWT token |
| 403 | `FORBIDDEN` | Không có quyền admin |
| 404 | `NOT_FOUND` | Project không tồn tại hoặc đã bị xoá |
| 500 | `INTERNAL_ERROR` | Lỗi server không xác định |
