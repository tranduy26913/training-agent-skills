---
title: User Management - Backend
version: 1.2
author: Admin Team
date: 2026-05-17
status: Approved
---

# User Management — Backend

> Related: [00-index.md](./00-index.md) | [02-frontend.md](./02-frontend.md) | [03-behavior.md](./03-behavior.md) | [04-quality.md](./04-quality.md)

---

## 1. Data Models

### 1.1 Database Schema

Schema được khai báo bằng **Prisma** tại `server/prisma/schema.prisma`. Các
model liên quan đến users module:

#### `User` (table `users`)

| Property | Type | Notes |
|----------|------|-------|
| `id` | `Int @id @default(autoincrement())` | UNSIGNED, auto-increment |
| `name` | `String` | VARCHAR(100), NOT NULL |
| `email` | `String @unique` | VARCHAR(255), NOT NULL |
| `password` | `String` | VARCHAR(255), bcrypt hash; không bao giờ trả về client |
| `role` | `String @default("user")` | VARCHAR(20); values: `admin` / `user` / `moderator` |
| `status` | `String @default("active")` | VARCHAR(20); values: `active` / `inactive` / `suspended` |
| `avatar` | `String?` | VARCHAR(500), nullable |
| `lastLoginAt` | `DateTime?` (column `last_login_at`) | set on auth login |
| `points` | `Int @default(0)` | read-only từ API user management |
| `note` | `String?` (v1.2) | VARCHAR(500), nullable |
| `birthday` | `DateTime?` (v1.2) | DATE, nullable; không cho phép tương lai |
| `createdAt` | `DateTime @default(now())` (column `created_at`) | |
| `updatedAt` | `DateTime @updatedAt` (column `updated_at`) | |
| `auditLogsAsAdmin` | `AuditLog[] @relation("AuditLogAdmin")` | relation |
| `auditLogsAsTarget` | `AuditLog[] @relation("AuditLogTarget")` | relation |
| Indexes | `@@index([role])`, `@@index([status])` | |
| `@@map` | `"users"` | |

#### `AuditLog` (table `audit_logs`)

| Property | Type | Notes |
|----------|------|-------|
| `id` | `Int @id @default(autoincrement())` | UNSIGNED |
| `adminId` | `Int` (column `admin_id`) | FK → `User.id`, ON DELETE CASCADE |
| `targetUserId` | `Int` (column `target_user_id`) | FK → `User.id`, ON DELETE CASCADE |
| `action` | `String` | VARCHAR(20); values: `CREATE` / `UPDATE` / `DELETE` |
| `changedFields` | `Json?` (column `changed_fields`) | `{ field: { old, new } }` |
| `timestamp` | `DateTime @default(now())` | DATETIME(0) |
| Index | `@@index([targetUserId])` | |
| `@@map` | `"audit_logs"` | |

#### `Role` (table `roles`)

| Property | Type | Notes |
|----------|------|-------|
| `id` | `Int @id @default(autoincrement())` | UNSIGNED |
| `name` | `String @unique` | VARCHAR(50) |
| `description` | `String?` | VARCHAR(255) |
| `createdAt` | `DateTime @default(now())` (column `created_at`) | |
| `@@map` | `"roles"` | |

### 1.2 TypeScript Models

> **Quy ước:** Mô tả type chỉ liệt kê tên + property (không dùng code block).
> Trỏ file thực tế để tra cứu khi cần.

#### Server types — `server/src/models/users.model.ts`

Type `User`
- alias của `PrismaUser` (import từ `@prisma/client`)

Type `AuditLog`
- `id: number`
- `admin_id: number`
- `target_user_id: number`
- `action: string`
- `changed_fields: ChangedFields` (xem `common.model.ts`)
- `timestamp: Date`
- `admin_name: string`

Interface `UserFilters` extends `PaginationParams`, `SortParams`
- `search?: string`
- `role?: string`
- `status?: string`
- `startDate?: string`
- `endDate?: string`

Interface `AuditLogDTO`
- `admin_id: number`
- `target_user_id: number`
- `action: AuditAction` (`'CREATE' | 'UPDATE' | 'DELETE'`)
- `changed_fields?: ChangedFields`

#### Client types — `client/src/types/users.types.ts`

Interface `User` (response shape, snake_case timestamps)
- `id: number`
- `name: string`
- `email: string`
- `role: 'admin' | 'user' | 'moderator'`
- `status: 'active' | 'inactive' | 'suspended'`
- `avatar: string | null`
- `note: string | null`
- `birthday: string | null` — ISO date `YYYY-MM-DD`
- `points: number`
- `last_login_at: string | null` — ISO datetime
- `created_at: string`
- `updated_at: string`

Interface `CreateUserDto`
- `name: string` — required
- `email: string` — required, valid email
- `role: 'admin' | 'user' | 'moderator'` — required
- `status: 'active' | 'inactive' | 'suspended'` — required
- `note?: string` — optional, max 500
- `birthday?: string` — optional, ISO date, không tương lai

Type `UpdateUserDto`
- alias của `CreateUserDto`

Interface `UserFilters` extends `PaginationParams`, `SortParams`
- `search?: string`
- `role?: 'admin' | 'user' | 'moderator'`
- `status?: 'active' | 'inactive' | 'suspended'`
- `startDate?: string`
- `endDate?: string`

Interface `AuditLog`
- `id: number`
- `admin_id: number`
- `target_user_id: number`
- `action: 'CREATE' | 'UPDATE' | 'DELETE'`
- `changed_fields: Record<string, { old: unknown; new: unknown }> | null`
- `timestamp: string`
- `admin_name: string`

> **Shared types** (`UserRole`, `UserStatus`, `AuditAction`, `PaginationParams`, `SortParams`, `ChangedFields`, `PaginationInfo`) được định nghĩa trong `client/src/types/api.types.ts` và được `users.types.ts` re-use.

---

## 2. API Endpoints

### SV-001 — GET /api/users
**Danh sách user có filter, phân trang, sắp xếp**

**Request:**
```
GET /api/users?page=1&limit=20&search=john&role=admin&status=active
  &startDate=2026-01-01&endDate=2026-12-31&sortBy=created_at&sortOrder=desc
```

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| page | number | No | 1 | Trang hiện tại |
| limit | number | No | 20 | Số items per page |
| search | string | No | — | Tìm theo name hoặc email (LIKE, case-insensitive) |
| role | string | No | — | Filter: `admin` / `user` / `moderator` |
| status | string | No | — | Filter: `active` / `inactive` / `suspended` |
| startDate | string | No | — | ISO 8601 date, lọc `created_at >=` |
| endDate | string | No | — | ISO 8601 date, lọc `created_at <=` |
| sortBy | string | No | `created_at` | Field to sort — whitelist enforced |
| sortOrder | string | No | `desc` | `asc` / `desc` |

**Allowed sortBy whitelist:** `id`, `name`, `email`, `role`, `status`, `created_at`, `updated_at`. Bất kỳ giá trị nào ngoài whitelist sẽ fallback về default sort `created_at DESC`.

**Flow:**
1. `authMiddleware` xác thực JWT token
2. Kiểm tra `user.role === 'admin'` → 403 nếu không phải
3. Parse và validate query params; validate `sortBy` trong whitelist
4. Build SQL động với array conditions/params (tránh SQL injection)
5. Thực thi COUNT query để lấy tổng records
6. Thực thi SELECT query với LIMIT/OFFSET
7. Trả về danh sách kèm pagination metadata

**Response 200:**
```json
{
  "data": User[],
  "pagination": { "page": 1, "limit": 10, "total": 45, "pages": 5 }
}
```

**Errors:** 401 Not authenticated | 403 Not admin

---

### SV-002 — POST /api/users
**Tạo user mới**

**Request Body:** `CreateUserDto`

**Flow:**
1. `authMiddleware` + admin check
2. Validate request body (Zod schema)
3. Kiểm tra email tồn tại → 409 nếu trùng
4. Sinh password: `<email_username>123` (e.g. `jane123`)
5. Hash password với bcrypt
6. INSERT vào `users` (points=0, last_login_at=NULL)
7. INSERT vào `audit_logs` (action=`CREATE`, changed_fields=null)
8. Trả về UserDto (không bao gồm password)

**Response 201:** `{ "data": User }`

**Errors:** 400 Validation | 401 | 403 | 409 Email already exists

---

### SV-003 — GET /api/users/:id
**Lấy chi tiết user**

**Flow:**
1. `authMiddleware` + admin check
2. Parse `:id` (integer validation)
3. Query `users` WHERE id=? → 404 nếu không tìm thấy
4. Trả về UserDto (loại bỏ password)

**Response 200:** `{ "data": User }`

**Errors:** 401 | 403 | 404 User not found

---

### SV-004 — PUT /api/users/:id
**Cập nhật thông tin user**

**Request Body:** `UpdateUserDto`

**Flow:**
1. `authMiddleware` + admin check
2. Parse `:id`, query user hiện tại → 404 nếu không có
3. Validate body (Zod schema); `points` bị bỏ qua nếu gửi lên
4. Kiểm tra email unique loại trừ user hiện tại → 409 nếu trùng
5. Build `changed_fields` = diff(oldUser, newData) — chỉ các field thực sự thay đổi
6. UPDATE `users`; INSERT `audit_logs` (action=`UPDATE`, changed_fields)
7. Trả về UserDto mới nhất

**Response 200:** `{ "data": User }`

**Errors:** 400 | 401 | 403 | 404 | 409

---

### SV-005 — DELETE /api/users/:id
**Xóa user**

**Flow:**
1. `authMiddleware` + admin check
2. Kiểm tra `req.user.id !== id` → 400 nếu admin xóa chính mình
3. Query user → 404 nếu không có
4. INSERT `audit_logs` (action=`DELETE`, snapshot trước khi xóa)
5. DELETE FROM `users`

**Response 200:** `{ "message": "User deleted successfully" }`

**Errors:** 400 Cannot delete self | 401 | 403 | 404

---

### SV-006 — GET /api/users/:id/activity
**Lịch sử thay đổi user**

**Query Parameters:** `limit` (optional, default 20)

**Flow:**
1. `authMiddleware` + admin check
2. Kiểm tra user tồn tại → 404 nếu không có
3. SELECT `audit_logs` JOIN `users` ON `admin_id` WHERE `target_user_id=id` ORDER BY timestamp DESC LIMIT ?

**Response 200:**
```json
{
  "data": AuditLog[]
}
```

**Errors:** 401 | 403 | 404

---

### SV-007 — GET /api/users/check-email
**Kiểm tra email trùng lặp (real-time validation)**

**Query Parameters:**

| Param | Required | Description |
|-------|----------|-------------|
| email | Yes | Email cần kiểm tra |
| excludeId | No | ID user loại trừ (dùng khi edit) |

**Flow:**
1. Validate `email` format, required
2. Normalize to lowercase
3. Query: `WHERE email = ?` (hoặc `AND id != excludeId` nếu có)
4. Trả về `{ "exists": true/false }`

**Response 200:** `{ "exists": false }`

**Errors:** 400 Missing/invalid email | 401 | 403

> **Note:** Endpoint yêu cầu admin auth (cùng router với các endpoint user management khác). Gọi từ client với debounce 500ms qua composable `useEmailValidation`.

---

## 3. Validation Rules
### Zod schemas

| Field | Rule |
|-------|------|
| Name | Required, min 2, max 50 chars |
| Email | Required, valid email format |
| Role | Required, enum: admin/user/moderator |
| Status | Required, enum: active/inactive/suspended |
| Note | Optional, max 500 chars |
| Birthday | Optional, valid ISO date, không được là ngày tương lai |

DTOs (server-side):
- `CreateUserInput` (từ `createUserSchema`)
- `UpdateUserInput` (từ `updateUserSchema`)
- `CheckEmailQuery` (từ `checkEmailSchema`)

Cả `CreateUserInput` và `UpdateUserInput` đều có cùng shape: `name`, `email`, `role`, `status`, `note?`, `birthday?`.

### Business Rules

| Rule | Mô tả |
|------|-------|
| Email unique | Email không được trùng với user khác (SV-002, SV-004) |
| No self-delete | Admin không thể xóa chính mình (SV-005) |
| points read-only | `points` không thể được set/update qua API user management |
| Password auto-gen | Pattern: `<email_username>123`, hash với bcrypt |
| sortBy whitelist | Chỉ các field được phép mới được dùng để sort (tránh SQL injection) |

---

## 4. Error Handling

### Standard Error Format

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Error Scenarios

| Scenario | Status | Code |
|----------|--------|------|
| Not authenticated | 401 | `UNAUTHORIZED` |
| Not admin | 403 | `FORBIDDEN` |
| Invalid input | 400 | `VALIDATION_ERROR` |
| Email already exists | 409 | `EMAIL_EXISTS` |
| User not found | 404 | `USER_NOT_FOUND` |
| Delete self | 400 | `CANNOT_DELETE_SELF` |
| Database error | 500 | `INTERNAL_ERROR` |
