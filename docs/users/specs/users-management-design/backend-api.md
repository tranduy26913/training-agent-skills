# Backend API Specification

## 1. API Overview

### Base Path

- `/api/users`

### Authentication Model

- JWT authentication qua `authMiddleware`.

### Authorization Model

- Toàn bộ CRUD user management yêu cầu `user.role === 'admin'`.
- Endpoint duplicate email check có thể là public nội bộ hoặc yêu cầu auth; hiện chưa chốt và được giữ trong open questions của `index.md`.

### Idempotency and Concurrency Rules

- GET endpoints là idempotent.
- Create không idempotent, phải rely vào unique email để tránh duplicate records.
- Update có conflict khi email trùng với user khác.
- Delete phải fail nếu target là chính admin hiện tại.

---

## 2. Endpoint Specifications

### 2.1 SV-001 - GET /api/users

**Lấy danh sách user có filter, sort và pagination.**

Request:
```http
GET /api/users?page=1&limit=10&search=john&role=admin&status=active&startDate=2026-01-01&endDate=2026-12-31&sortBy=created_at&sortOrder=desc
```

Query Parameters:
- `page` (optional): default 1.
- `limit` (optional): default 10.
- `search` (optional): tìm theo `name` hoặc `email`.
- `role` (optional): `admin | user | moderator`.
- `status` (optional): `active | inactive | suspended`.
- `startDate` (optional): ISO date.
- `endDate` (optional): ISO date.
- `sortBy` (optional): field đã whitelist.
- `sortOrder` (optional): `asc | desc`.

Flow:
1. Verify JWT token.
2. Check admin permission.
3. Validate query parameters.
4. Build SQL filters và COUNT query.
5. Query danh sách users với LIMIT/OFFSET.
6. Return data và pagination metadata.

Response (200 OK):
```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "pages": 0
  }
}
```

Errors:
- 401: Not authenticated
- 403: Forbidden

---

### 2.2 SV-002 - POST /api/users

**Tạo user mới.**

Request Body:
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "user",
  "status": "active",
  "note": "Ghi chú về user này",
  "birthday": "1990-05-15"
}
```

Flow:
1. Verify JWT token.
2. Check admin permission.
3. Validate request body.
4. Check duplicate email.
5. Generate default password from email username and hash it.
6. Insert new user with default `points = 0` and `last_login_at = NULL`.
7. Write CREATE audit log.
8. Return created user without password.

Response (201 Created):
```json
{
  "data": {}
}
```

Errors:
- 400: Validation error
- 409: Email already exists
- 401: Not authenticated
- 403: Forbidden

---

### 2.3 SV-003 - GET /api/users/:id

**Lấy chi tiết user.**

Flow:
1. Verify JWT token.
2. Check admin permission.
3. Validate route param.
4. Query user by id.
5. Return detail without password.

Response (200 OK):
```json
{
  "data": {}
}
```

Errors:
- 404: User not found
- 401: Not authenticated
- 403: Forbidden

---

### 2.4 SV-004 - PUT /api/users/:id

**Cập nhật thông tin user.**

Request Body:
```json
{
  "name": "John Smith",
  "email": "john.smith@example.com",
  "role": "moderator",
  "status": "inactive",
  "note": "Updated note",
  "birthday": "1985-03-20"
}
```

Flow:
1. Verify JWT token.
2. Check admin permission.
3. Validate route param và request body.
4. Query current user by id.
5. Check duplicate email excluding current id.
6. Build `changed_fields` diff.
7. Update allowed fields only.
8. Write UPDATE audit log.
9. Return updated entity.

Response (200 OK):
```json
{
  "data": {}
}
```

Errors:
- 400: Validation error
- 404: User not found
- 409: Email already exists
- 401: Not authenticated
- 403: Forbidden

---

### 2.5 SV-005 - DELETE /api/users/:id

**Xóa user.**

Flow:
1. Verify JWT token.
2. Check admin permission.
3. Validate route param.
4. Fail nếu `req.user.id === targetUserId`.
5. Query target user.
6. Write DELETE audit log snapshot.
7. Delete user record.
8. Return success message.

Response (200 OK):
```json
{
  "message": "User deleted successfully"
}
```

Errors:
- 400: Cannot delete self
- 404: User not found
- 401: Not authenticated
- 403: Forbidden

---

### 2.6 SV-006 - GET /api/users/:id/activity

**Lấy lịch sử thay đổi của user.**

Query Parameters:
- `limit` (optional): default 10.

Flow:
1. Verify JWT token.
2. Check admin permission.
3. Validate route param và existence của target user.
4. Query `audit_logs` theo `target_user_id`.
5. Sort `timestamp DESC`.
6. Return logs.

Response (200 OK):
```json
{
  "data": []
}
```

---

### 2.7 SV-007 - GET /api/users/check-email

**Kiểm tra email có bị trùng lặp hay không.**

Request:
```http
GET /api/users/check-email?email=john@example.com&excludeId=1
```

Query Parameters:
- `email` (required): email cần kiểm tra.
- `excludeId` (optional): user id loại trừ khi edit.

Flow:
1. Validate query parameters.
2. Normalize email về lowercase.
3. Query `users` theo email, có hoặc không loại trừ `excludeId`.
4. Return `exists: true | false`.

Response (200 OK):
```json
{
  "exists": false
}
```

Errors:
- 400: Missing email or invalid email format

---

## 3. Shared Authorization Rules

All endpoints require:
1. JWT verification và user context attachment.
2. Admin role validation.

Special cases:
- DELETE yêu cầu self-delete guard bổ sung.
- Duplicate email check cần chốt quyết định auth requirement trước khi implement production.

---

## 4. Validation and Error Contract

### Validation Rules

- `name`: required, min 2, max 50.
- `email`: required, valid format, unique.
- `role`: enum `admin | user | moderator`.
- `status`: enum `active | inactive | suspended`.
- `note`: optional, max 500.
- `birthday`: optional, valid date, không ở tương lai.
- `points`: không được cập nhật từ create/edit endpoints.

### Error Handling

All errors must follow this format:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Error Scenarios

| Scenario | Status | Response |
|----------|--------|----------|
| Not authenticated | 401 | `Not authenticated` |
| Not admin | 403 | `Forbidden - admin only` |
| Invalid email format | 400 | `Invalid email format` |
| Email already exists | 409 | `Email already exists` |
| User not found | 404 | `User not found` |
| Delete self | 400 | `Cannot delete own account` |
| Validation failed | 400 | Detailed field errors |
| Database error | 500 | `Internal server error` |

---

## 5. Business Rules

- Admin không được xóa chính mình.
- Email phải unique toàn hệ thống, kể cả khi có debounce check ở client.
- `points` và `last_login_at` chỉ là dữ liệu hiển thị trong feature này.
- Mọi thao tác create, update, delete phải ghi audit log.
- `changed_fields` của update chỉ chứa các field thật sự thay đổi.