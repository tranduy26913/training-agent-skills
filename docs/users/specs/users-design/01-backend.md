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

#### Server types — `server/src/modules/admin/users/users.model.ts` (thực tế: `server/src/models/users.model.ts`)

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

#### Server common types — `server/src/models/common.model.ts`

Type `UserRole`
- `'admin' | 'user' | 'moderator'`

Type `AuditAction`
- `'CREATE' | 'UPDATE' | 'DELETE'`

Interface `PaginationParams`
- `page?: number`
- `limit?: number`

Interface `SortParams`
- `sortBy?: string`
- `sortOrder?: 'asc' | 'desc'`

Interface `PaginationInfo`
- `page: number`
- `limit: number`
- `total: number`
- `pages: number`

Interface `PaginatedResult<T>`
- `data: T[]`
- `pagination: PaginationInfo`

Type `ChangedFields`
- `Record<string, { old: unknown; new: unknown }> | null`

Class `ServiceError extends Error`
- `message: string`
- `code: number` (HTTP status)
- `errorCode?: string`

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

### SV-001 — GET /api/admin/users
**Danh sách user có filter, phân trang, sắp xếp**

**Request:**
```
GET /api/admin/users?page=1&limit=20&search=john&role=admin&status=active
  &startDate=2026-01-01&endDate=2026-12-31&sortBy=created_at&sortOrder=desc
```

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| page | number | No | 1 | Trang hiện tại |
| limit | number | No | 20 | Số items per page |
| search | string | No | — | Tìm theo name hoặc email (contains, case-insensitive) |
| role | string | No | — | Filter: `admin` / `user` / `moderator` |
| status | string | No | — | Filter: `active` / `inactive` / `suspended` |
| startDate | string | No | — | ISO 8601 date, lọc `createdAt >=` |
| endDate | string | No | — | ISO 8601 date, lọc `createdAt <=` |
| sortBy | string | No | `created_at` | Field to sort — whitelist enforced |
| sortOrder | string | No | `desc` | `asc` / `desc` |

**Allowed sortBy whitelist:** `id`, `name`, `email`, `role`, `status`, `created_at`, `updated_at`. Bất kỳ giá trị nào ngoài whitelist sẽ fallback về default sort `createdAt DESC`.

**Flow:**
1. `authMiddleware` xác thực JWT token + `requireRole('admin')` guard
2. Controller parse query params (page, limit, search, role, status, startDate, endDate, sortBy, sortOrder)
3. Gọi `usersService.getUsers(filters)`
4. Repository build Prisma `where` clause + resolve `orderBy` từ whitelist
5. `Promise.all`: `prisma.user.findMany` (with `select`, `skip`, `take`) + `prisma.user.count`
6. Service tính `pages = Math.ceil(total / limit)`
7. `sendSuccess(res, { data, pagination })`

**Response 200:**
```json
{
  "data": User[],
  "pagination": { "page": 1, "limit": 20, "total": 45, "pages": 3 }
}
```

**Errors:** 401 Not authenticated | 403 Not admin

---

### SV-002 — POST /api/admin/users
**Tạo user mới**

**Request Body:** `CreateUserInput` (từ `createUserSchema`)

**Flow:**
1. `authMiddleware` + `requireRole('admin')` guard
2. `validate(createUserSchema)` middleware validate body (Zod)
3. Controller lấy `adminId` qua `getAuthUserId(req)`
4. Service kiểm tra email tồn tại (`repository.findByEmail`) → throw `ServiceError('Email already exists', 409)`
5. Sinh password: `<email_username>123` (e.g. `jane123`)
6. Hash password với bcrypt (`hashPassword`)
7. `repository.create({ name, email, role, status, note, birthday, password })` → trả `newId`
8. `repository.createAuditLog({ admin_id, target_user_id: newId, action: 'CREATE', changed_fields: null })`
9. Trả về UserDto qua `getUser(newId)` (không bao gồm password)

**Response 201:** `{ "data": User }`

**Errors:** 400 Validation | 401 | 403 | 409 Email already exists

---

### SV-003 — GET /api/admin/users/:id
**Lấy chi tiết user**

**Flow:**
1. `authMiddleware` + admin check
2. Parse `:id` (Number conversion)
3. `repository.findByIdWithoutPassword(id)` → throw `ServiceError('User not found', 404)` nếu null
4. Trả về UserDto (loại bỏ password qua `select`)

**Response 200:** `{ "data": User }`

**Errors:** 401 | 403 | 404 User not found

---

### SV-004 — PUT /api/admin/users/:id
**Cập nhật thông tin user**

**Request Body:** `UpdateUserInput` (từ `updateUserSchema`)

**Flow:**
1. `authMiddleware` + admin check
2. Controller lấy `id` + `adminId` qua `getAuthUserId(req)`
3. Service `getUser(id)` → 404 nếu không có
4. `validate(updateUserSchema)` middleware validate body (Zod); `points` bị bỏ qua (không có trong schema)
5. Kiểm tra email unique loại trừ user hiện tại (`repository.findByEmail(email, id)`) → 409 nếu trùng
6. `buildChangedFields(oldUser, newData)` — diff chỉ các field thực sự thay đổi
7. `repository.update(id, { name, email, role, status, note, birthday })`
8. `repository.createAuditLog({ admin_id, target_user_id: id, action: 'UPDATE', changed_fields })`
9. Trả về UserDto mới nhất qua `getUser(id)`

**Response 200:** `{ "data": User }`

**Errors:** 400 | 401 | 403 | 404 | 409

---

### SV-005 — DELETE /api/admin/users/:id
**Xóa user**

**Flow:**
1. `authMiddleware` + admin check
2. Controller lấy `adminId` qua `getAuthUserId(req)`
3. Service kiểm tra `id === adminId` → throw `ServiceError('Cannot delete your own account', 400)`
4. `getUser(id)` → 404 nếu không có
5. `repository.createAuditLog({ admin_id, target_user_id: id, action: 'DELETE', changed_fields: null })` — ghi trước khi xóa
6. `repository.delete(id)`

**Response 200:** `{ "data": { "message": "User deleted successfully" } }`

**Errors:** 400 Cannot delete self | 401 | 403 | 404

---

### SV-006 — GET /api/admin/users/:id/activity
**Lịch sử thay đổi user**

**Query Parameters:** `limit` (optional, default 20)

**Flow:**
1. `authMiddleware` + admin check
2. `getUser(id)` → 404 nếu không có
3. `repository.getAuditLogs(id, limit)` — `prisma.auditLog.findMany` with `include: { admin: { select: { name: true } } }`, map sang snake_case

**Response 200:**
```json
{
  "data": AuditLog[]
}
```

**Errors:** 401 | 403 | 404

---

### SV-007 — GET /api/admin/users/check-email
**Kiểm tra email trùng lặp (real-time validation)**

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Email cần kiểm tra (Zod email validation) |
| excludeId | number | No | ID user loại trừ (dùng khi edit, `z.coerce.number().int().positive()`) |

**Flow:**
1. `validate(checkEmailSchema, 'query')` middleware validate query params
2. Controller parse `email` + `excludeId`
3. `repository.findByEmail(email, excludeId)` → trả `true/false`
4. `sendSuccess(res, { exists: boolean })`

**Response 200:** `{ "data": { "exists": false } }`

**Errors:** 400 Missing/invalid email | 401 | 403

> **Note:** Endpoint yêu cầu admin auth (cùng router với các endpoint user management khác). Gọi từ client với debounce 500ms qua composable `useEmailValidation`. Route `/check-email` đăng ký trước `/:id` để tránh conflict.

---

## 3. Validation Rules
### Zod schemas

Schema Zod trực tiếp (không wrap trong `z.object({ body: ... })`), định nghĩa tại `server/src/modules/admin/users/users.validation.ts`:

| Field | Rule |
|-------|------|
| Name | Required, min 2, max 50 chars |
| Email | Required, valid email format |
| Role | Required, enum: admin/user/moderator |
| Status | Required, enum: active/inactive/suspended |
| Note | Optional, max 500 chars |
| Birthday | Optional, valid ISO date string, không được là ngày tương lai (`refine`) |

DTOs (server-side, inferred từ Zod):
- `CreateUserInput` (từ `createUserSchema`)
- `UpdateUserInput` (từ `updateUserSchema`)
- `CheckEmailQuery` (từ `checkEmailSchema`, `excludeId` dùng `z.coerce.number().int().positive().optional()`)

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
  "error": "Error message"
}
```

`sendError(res, message, statusCode)` từ `@utils/response.util`. `errorMiddleware` bắt `ServiceError` và gọi `sendError`.

### Error Scenarios

| Scenario | Status | ServiceError message |
|----------|--------|---------------------|
| Not authenticated | 401 | `Access token required` / `Invalid or expired token` |
| Not admin | 403 | `Insufficient permissions` |
| Invalid input | 400 | Zod validation error (từ `validate` middleware) |
| Email already exists | 409 | `Email already exists` |
| User not found | 404 | `User not found` |
| Delete self | 400 | `Cannot delete your own account` |
| Database error | 500 | `Internal server error` (fallback từ `errorMiddleware`) |
