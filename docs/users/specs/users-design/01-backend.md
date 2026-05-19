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

#### users (existing — columns added in v1.2)

```sql
users {
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(50)  NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password      VARCHAR(255) NOT NULL,           -- bcrypt hashed, never exposed
  role          ENUM('admin','user','moderator') NOT NULL DEFAULT 'user',
  status        ENUM('active','inactive','suspended') NOT NULL DEFAULT 'active',
  avatar        VARCHAR(500) NULL,
  note          VARCHAR(500) NULL,               -- v1.2
  birthday      DATE         NULL,               -- v1.2
  points        INT          NOT NULL DEFAULT 0, -- v1.2, read-only from API
  last_login_at TIMESTAMP    NULL,               -- v1.2, set on auth login
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role  (role),
  INDEX idx_status (status)
}
```

#### audit_logs (new in v1.0)

```sql
audit_logs {
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_id       INT UNSIGNED NOT NULL,
  target_user_id INT UNSIGNED NOT NULL,
  action         ENUM('CREATE','UPDATE','DELETE') NOT NULL,
  changed_fields JSON NULL,   -- { "field": { "old": "...", "new": "..." } }
  timestamp      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id)       REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_audit_target (target_user_id)
}
```

### 1.2 TypeScript DTOs

```typescript
// Response type — never includes password
export interface UserDto {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  status: 'active' | 'inactive' | 'suspended';
  avatar: string | null;
  note: string | null;
  birthday: string | null;        // ISO date "YYYY-MM-DD"
  points: number;
  last_login_at: string | null;   // ISO datetime
  created_at: string;
  updated_at: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  status: 'active' | 'inactive' | 'suspended';
  note?: string;
  birthday?: string;              // "YYYY-MM-DD", no future dates
}

export interface UpdateUserDto {
  name: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  status: 'active' | 'inactive' | 'suspended';
  note?: string;
  birthday?: string;
  // points: NOT accepted — read-only
}

export interface AuditLogDto {
  id: number;
  admin_id: number;
  admin_name: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  changed_fields: Record<string, { old: unknown; new: unknown }> | null;
  timestamp: string;
}

export interface UserListResponse {
  data: UserDto[];
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

### SV-001 — GET /api/users
**Danh sách user có filter, phân trang, sắp xếp**

**Request:**
```
GET /api/users?page=1&limit=10&search=john&role=admin&status=active
  &startDate=2026-01-01&endDate=2026-12-31&sortBy=created_at&sortOrder=desc
```

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| page | number | No | 1 | Trang hiện tại |
| limit | number | No | 10 | Số items per page (10/25/50) |
| search | string | No | — | Tìm theo name hoặc email (LIKE, case-insensitive) |
| role | string | No | — | Filter: `admin` / `user` / `moderator` |
| status | string | No | — | Filter: `active` / `inactive` / `suspended` |
| startDate | string | No | — | ISO 8601 date, lọc `created_at >=` |
| endDate | string | No | — | ISO 8601 date, lọc `created_at <=` |
| sortBy | string | No | `created_at` | Field to sort — whitelist enforced |
| sortOrder | string | No | `desc` | `asc` / `desc` |

**Allowed sortBy whitelist:** `id`, `name`, `email`, `role`, `status`, `created_at`, `updated_at`, `last_login_at`, `points`

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
  "data": [
    {
      "id": 1, "name": "John Doe", "email": "john@example.com",
      "role": "admin", "status": "active",
      "note": "Some note", "birthday": "1990-01-15",
      "points": 0, "last_login_at": "2026-04-20T14:30:00Z",
      "created_at": "2026-01-15T10:30:00Z", "updated_at": "2026-04-10T14:20:00Z"
    }
  ],
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

**Response 201:** `{ "data": UserDto }`

**Errors:** 400 Validation | 401 | 403 | 409 Email already exists

---

### SV-003 — GET /api/users/:id
**Lấy chi tiết user**

**Flow:**
1. `authMiddleware` + admin check
2. Parse `:id` (integer validation)
3. Query `users` WHERE id=? → 404 nếu không tìm thấy
4. Trả về UserDto (loại bỏ password)

**Response 200:** `{ "data": UserDto }`

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

**Response 200:** `{ "data": UserDto }`

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

**Query Parameters:** `limit` (optional, default 10)

**Flow:**
1. `authMiddleware` + admin check
2. Kiểm tra user tồn tại → 404 nếu không có
3. SELECT `audit_logs` JOIN `users` ON `admin_id` WHERE `target_user_id=id` ORDER BY timestamp DESC LIMIT ?

**Response 200:**
```json
{
  "data": [
    {
      "id": 1, "admin_id": 5, "admin_name": "Admin User",
      "action": "UPDATE",
      "changed_fields": { "name": { "old": "John", "new": "John Smith" } },
      "timestamp": "2026-04-15T10:00:00Z"
    }
  ]
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

**Errors:** 400 Missing/invalid email

> **Note:** Endpoint không yêu cầu auth. Gọi từ client với debounce 500ms.

---

## 3. Validation Rules

### Client-side

| Field | Rule |
|-------|------|
| Name | Required, min 2, max 50 chars |
| Email | Required, valid email format |
| Role | Required, enum: admin/user/moderator |
| Status | Required, enum: active/inactive/suspended |
| Note | Optional, max 500 chars |
| Birthday | Optional, valid date, không được là ngày tương lai |

### Server-side (Zod schema)

```typescript
// createUserSchema / updateUserSchema
z.object({
  name:     z.string().min(2).max(50),
  email:    z.string().email(),
  role:     z.enum(['admin', 'user', 'moderator']),
  status:   z.enum(['active', 'inactive', 'suspended']),
  note:     z.string().max(500).optional(),
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(
    d => new Date(d) <= new Date(), 'Birthday cannot be in the future'
  ).optional(),
})
```

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
