---
title: User Management Feature Design
version: 1.0
author: Admin Team
date: 2026-04-15
status: Draft
---

# User Management Feature Design

## Executive Summary

Tính năng quản lý user cho phép các admin xem danh sách toàn bộ user, tìm kiếm/lọc, tạo user mới, chỉnh sửa thông tin user, thay đổi vai trò và trạng thái, và xóa user. Mỗi thao tác sẽ được ghi lại trong audit log để theo dõi và tuân thủ.

## Changelog

| Version | Date | Author | Summary |
|---------|------|--------|---------|
| 1.0 | 2026-04-15 | Admin Team | Initial design |
| 1.1 | 2026-04-16 | Admin Team | Add sortable columns and skeleton loading to UserTable |
| 1.2 | 2026-04-20 | Admin Team | [CR] Add Last Login, Points columns; Add Note & Birthday fields; Add email duplicate check; Add clear filter button |

---

## 1. Objective & Scope

### Purpose

Cung cấp giao diện quản lý toàn diện cho admin quản lý user account trong hệ thống, bao gồm các thao tác CRUD cơ bản và tracking lịch sử thay đổi.

### In Scope

- Xem danh sách user với phân trang
- Tìm kiếm user theo tên/email
- Lọc user theo role (admin/user/moderator) và status (active/inactive/suspended)
- Lọc theo date range (created/updated)
- Tạo user mới với mật khẩu mặc định: `username123`
- [UPDATE] Chỉnh sửa thông tin user (tên: 2-50 chars, email, role, status, note, birthday)
- [DEPRECATED] Chỉnh sửa thông tin user (tên, email, role, status)
- Xóa user (không thể xóa chính mình)
- Xem lịch sử audit log cho mỗi user
- Tracking audit log cho tất cả hành động (create/update/delete)
- [NEW] Hiển thị thời gian login cuối cùng và điểm số (points) trong bảng user
- [NEW] Thêm fields Note (optional, max 500 chars) và Birthday (optional) khi Create/Edit User
- [NEW] Validate duplicate email với debounce 500ms (server check)
- [NEW] Thêm nút Clear Filters để reset tất cả filter và reload bảng

### Out of Scope

- Quên mật khẩu / đặt lại mật khẩu cho user (tính năng riêng)
- Bulk operations (import/export đại lượng)
- Permission management (phân quyền chi tiết)
- User groups/departments

---

## 2. Architecture

### 2.1 System Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Vue.js Frontend                    │
│  (UserListPage, UserCreatePage, UserEditPage)      │
└─────────────────┬───────────────────────────────────┘
                  │ HTTP/REST
┌─────────────────▼───────────────────────────────────┐
│           Express.js Backend                        │
│  ┌──────────────────────────────────────────────┐  │
│  │  Users Module                                │  │
│  │  - Controller (routes handler)               │  │
│  │  - Service (business logic)                  │  │
│  │  - Repository (database queries)             │  │
│  │  - Validation (input schemas)                │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │  Auth Middleware (verify user + admin)       │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────┬───────────────────────────────────┘
                  │ SQL Query
┌─────────────────▼───────────────────────────────────┐
│            MySQL Database                           │
│  - users table                                      │
│  - audit_logs table (NEW)                           │
└─────────────────────────────────────────────────────┘
```

### 2.2 Data Model

#### Users Table (Existing)
```sql
users {
  id: INT (PRIMARY KEY)
  name: VARCHAR(100)
  email: VARCHAR(255) UNIQUE
  password: VARCHAR(255) (hashed)
  role: ENUM('admin', 'user', 'moderator')
  status: ENUM('active', 'inactive', 'suspended')
  avatar: VARCHAR(500)
  [NEW] last_login_at: TIMESTAMP (nullable)
  [NEW] points: INT (default 0)
  [NEW] note: VARCHAR(500) (nullable)
  [NEW] birthday: DATE (nullable)
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

#### Audit Logs Table (NEW)
```sql
audit_logs {
  id: INT (PRIMARY KEY)
  admin_id: INT (FOREIGN KEY → users.id)
  target_user_id: INT (FOREIGN KEY → users.id)
  action: ENUM('CREATE', 'UPDATE', 'DELETE')
  changed_fields: JSON (e.g., {"name": {"old": "John", "new": "Jane"}})
  timestamp: DATETIME
}
```

---

## 3. Feature Specifications

### 3.1 User List Page (`/users`)

#### Display

Hiển thị danh sách user dưới dạng bảng với các cột chi tiết như bảng dưới đây:

| No | Name | Control UI | Label (EN/VN/JP) | Validate | Description |
|----|------|------------|------------------|----------|-------------|
| 1 | ID | Text | ID/ID/ID | - | User ID, sortable |
| 2 | Name | Text | Name/Tên User/ユーザー名 | - | Tên user, sortable |
| 3 | Email | Text | Email/Email/メール | - | Email user, sortable |
| 4 | Role | Badge | Role/Vai Trò/ロール | - | Vai trò (admin/user/moderator), sortable |
| 5 | Status | Badge | Status/Trạng Thái/ステータス | - | Trạng thái (active/inactive/suspended) với badge màu, sortable |
| 6 | Created At | Text | Created At/Ngày Tạo/作成日 | - | Định dạng DD/MM/YYYY HH:mm, sortable, mặc định sort DESC |
| 7 | Updated At | Text | Updated At/Ngày Chỉnh Sửa/更新日 | - | Định dạng DD/MM/YYYY HH:mm, sortable |
| 8 | Last Login | Text | Last Login/Lần Login Cuối/最後のログイン | - | [NEW] Thời gian login cuối cùng hoặc "-" nếu chưa có (DD/MM/YYYY HH:mm format) |
| 9 | Points | Text | Points/Điểm/ポイント | - | [NEW] Số điểm của user (default 0, read-only) |
| 10 | Actions | Button | Actions/Thao Tác/アクション | - | Buttons: Edit, Delete (không sortable) |

#### Sorting

- Server-side sorting (lazy mode)
- Tất cả các cột trừ Actions đều có thể sort
- Click tiêu đề cột để sort ASC → click lại để sort DESC → click lần 3 để bỏ sort (removable)
- Mặc định: sort theo `created_at` DESC
- Query params gửi lên API: `sortBy` (tên field) và `sortOrder` (`asc` | `desc`)
- Backend whitelist các field được phép sort để tránh SQL injection

#### Skeleton Loading

- Khi bảng đang tải dữ liệu, hiển thị 5 dòng skeleton thay thế cho dữ liệu thực
- Mỗi cell hiển thị `<Skeleton>` component trong lúc loading
- Không sử dụng `loading` prop của DataTable (để tránh spinner overlay che bảng)

#### Filtering & Search

- **Search Box**: Tìm kiếm theo tên hoặc email (real-time)
- **Role Filter**: Dropdown lọc theo role (All, Admin, User, Moderator)
- **Status Filter**: Dropdown lọc theo status (All, Active, Inactive, Suspended)
- **Date Range Picker**: Lọc theo date range (created_at hoặc updated_at)
- [NEW] **Clear Filters Button**: Nút để reset tất cả filters về trạng thái rỗng và reload bảng user từ trang 1
  - Vị trí: Bên cạnh các filter controls
  - Behavior: Click → reset search, role, status, dateRange → apply filters → reload table

#### Pagination

- Server-side pagination
- Default: 10 items per page
- Có option để chọn 10, 25, 50 items per page

#### UX Interactions

- Click row hoặc nút "Edit" → navigate đến edit page
- Click nút "Delete" → confirmation dialog → API call → reload table
- Các filters tự động apply khi thay đổi (debounce: 300ms)
- Sort và filter đều reset page về 1

### 3.2 Create User Page (`/users/create`)

#### Form Fields

| No | Name | Control UI | Label (EN/VN/JP) | Required | Validation | Max Length | Description |
|----|------|------------|------------------|----------|------------|-----------|-------------|
| 1 | [UPDATE] Name | InputText | Name/Tên User/ユーザー名 | Yes | Min 2, Max 50 | 50 | Tên của user |
| 1 | [DEPRECATED] Name | InputText | Name/Tên User/ユーザー名 | Yes | Min 3, Max 100 | 100 | Tên của user |
| 2 | [UPDATE] Email | InputText | Email/Email/メール | Yes | Valid format, Unique* | - | Email của user, được check trùng lặp trên server |
| 2 | [DEPRECATED] Email | InputText | Email/Email/メール | Yes | Valid format, Unique | - | Email của user |
| 3 | Role | Select | Role/Vai Trò/ロール | Yes | Enum | - | Admin/User/Moderator, default "User" |
| 4 | Status | Select | Status/Trạng Thái/ステータス | Yes | Enum | - | Active/Inactive/Suspended, default "Active" |
| 5 | [NEW] Note | InputTextarea | Note/Ghi Chú/メモ | No | Max 500 | 500 | Ghi chú bổ sung (optional) |
| 6 | [NEW] Birthday | DatePicker | Birthday/Ngày Sinh/誕生日 | No | - | - | Ngày sinh (optional, no future dates) |

*[NEW] Email duplicate check: Validate trên server với debounce 500ms khi client input, không cho phép submit nếu email trùng lặp

#### Password Handling

- Mật khẩu được auto-generate theo pattern: `email_username123` (e.g., john.doe123)
- Mật khẩu **không** được hiển thị sau khi tạo
- Không có option thay đổi mật khẩu từ page này

#### Form Actions

- **Save** button: Validate client-side → Submit → Success message → Navigate back to list
- **Cancel** button: Navigate back to list (no confirmation needed)

#### Validation

- Client-side: Required fields, email format, [UPDATE] length constraints (Name: min 2 max 50, Email format, [NEW] Note: max 500)
- [DEPRECATED] length constraints (Name: min 3 max 100, Email format)
- Server-side: [UPDATE] Duplicate email check (excluding current user on edit), enum validation, length validation, [NEW] no future birthday

### 3.3 Edit User Page (`/users/:id/edit`)

#### Form Fields

| No | Name | Control UI | Label (EN/VN/JP) | Required | Validation | Max Length | Description |
|----|------|------------|------------------|----------|------------|-----------|-------------|
| 1 | [UPDATE] Name | InputText | Name/Tên User/ユーザー名 | Yes | Min 2, Max 50 | 50 | Tên của user |
| 1 | [DEPRECATED] Name | InputText | Name/Tên User/ユーザー名 | Yes | Min 3, Max 100 | 100 | Tên của user |
| 2 | [UPDATE] Email | InputText | Email/Email/メール | Yes | Valid format, Unique* | - | Email của user, được check trùng lặp trên server |
| 2 | [DEPRECATED] Email | InputText | Email/Email/メール | Yes | Valid format, Unique | - | Email của user |
| 3 | Role | Select | Role/Vai Trò/ロール | Yes | Enum | - | Admin/User/Moderator |
| 4 | Status | Select | Status/Trạng Thái/ステータス | Yes | Enum | - | Active/Inactive/Suspended |
| 5 | [NEW] Note | InputTextarea | Note/Ghi Chú/メモ | No | Max 500 | 500 | Ghi chú bổ sung (optional) |
| 6 | [NEW] Birthday | DatePicker | Birthday/Ngày Sinh/誕生日 | No | - | - | Ngày sinh (optional, no future dates) |
| 7 | [NEW] Points | Text (read-only) | Points/Điểm/ポイント | No | - | - | Số điểm (read-only, not editable) |
| 8 | Created At | InputText (read-only) | Created At/Ngày Tạo/作成日 | No | - | - | Hiển thị ngày tạo (read-only) |

*[NEW] Email duplicate check: Check trên server, loại trừ email của user hiện tại, không cho phép submit nếu email trùng lặp với user khác

#### Form Actions

- **Save** button: Validate → Submit → Success message → Stay on page hoặc back to list
- **Cancel** button: Back to list

#### Audit History Sidebar

- Format: "Admin Name changed Name from 'Old' to 'New' on DD/MM/YYYY HH:mm"
- List các thay đổi gần nhất (max 10 items)

#### Validations

- Không thể thay đổi một user khác ngoài việc gọi API
- Admin không thể sửa email thành email của user khác (unique constraint)
- Birthday không cho phép chọn ngày trong tương lai
- Note max 500 characters
- Không thể edit Points (read-only)

---

## 4. Backend API Specification

### 4.1 Endpoints

#### SV-001 — GET /api/users
**Danh sách user có filter**

Request:
```
GET /api/users?page=1&limit=10&search=john&role=admin&status=active&startDate=2026-01-01&endDate=2026-12-31
```

Query Parameters:
- `page` (optional): Trang hiện tại, default 1
- `limit` (optional): Số items per page, default 10
- `search` (optional): Tìm kiếm name hoặc email (case-insensitive)
- `role` (optional): Filter by role (admin/user/moderator)
- `status` (optional): Filter by status (active/inactive/suspended)
- `startDate` (optional): ISO 8601 date string
- `endDate` (optional): ISO 8601 date string
- `sortBy` (optional): Field to sort (default: created_at)
- `sortOrder` (optional): asc or desc (default: desc)

Flow:
1. `authMiddleware` xác thực JWT token, attach user vào request
2. Kiểm tra `user.role === 'admin'`, trả 403 nếu không phải admin
3. Parse và validate query parameters (page, limit, sortBy, sortOrder, ...)
4. Build câu SQL động với các điều kiện filter (search LIKE, role =, status =, date range)
5. Thực thi COUNT query để lấy tổng số records (phục vụ pagination)
6. Thực thi SELECT query với LIMIT/OFFSET tương ứng page và limit
7. Trả về danh sách users kèm metadata pagination

Response (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "admin",
      "status": "active",
      "note": "Some note",
      "birthday": "1990-01-15",
      "points": 0,
      "last_login_at": "2026-04-20T14:30:00Z",
      "created_at": "2026-01-15T10:30:00Z",
      "updated_at": "2026-04-10T14:20:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

Errors:
- 401: Not authenticated
- 403: Not admin

---

#### SV-002 — POST /api/users
**Tạo user mới**

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
1. `authMiddleware` xác thực JWT token
2. Kiểm tra `user.role === 'admin'`, trả 403 nếu không phải admin
3. Validate request body (required fields, email format, length, enum values)
4. Kiểm tra email đã tồn tại trong DB chưa, trả 409 nếu trùng
5. Sinh password theo pattern: `<email_username>123` (vd: `jane.smith123`)
6. Hash password bằng bcrypt
7. Insert bản ghi mới vào bảng `users` với:
   - All provided fields
   - points = 0 [NEW]
   - last_login_at = NULL [NEW]
8. Tạo entry trong bảng `audit_logs` với action = `CREATE`
9. Trả về thông tin user mới (không bao gồm password)

Response (201 Created):
```json
{
  "data": {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "user",
    "status": "active",
    "note": "Ghi chú về user này",
    "birthday": "1990-05-15",
    "points": 0,
    "last_login_at": null,
    "created_at": "2026-04-15T10:00:00Z",
    "updated_at": "2026-04-15T10:00:00Z"
  }
}
```

Validations:
- [UPDATE] Name: required, 2-50 chars
- [DEPRECATED] Name: required, 3-100 chars
- Email: required, valid format, unique
- Role: required, enum
- Status: required, enum
- [NEW] Note: optional, max 500 chars
- [NEW] Birthday: optional, valid date, no future dates

Audit Log: Tạo entry CREATE

Errors:
- 400: Validation error
- 409: Email already exists
- 401: Not authenticated
- 403: Not admin

---

#### SV-003 — GET /api/users/:id
**Lấy chi tiết user**

Flow:
1. `authMiddleware` xác thực JWT token
2. Kiểm tra `user.role === 'admin'`, trả 403 nếu không phải admin
3. Parse `:id` từ route params (kiểm tra là số nguyên hợp lệ)
4. Query bảng `users` theo `id`, trả 404 nếu không tồn tại
5. Trả về thông tin chi tiết user (không bao gồm password)

Response (200 OK):
```json
{
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin",
    "status": "active",
    "avatar": null,
    "note": "Some note",
    "birthday": "1990-01-15",
    "points": 0,
    "last_login_at": "2026-04-20T14:30:00Z",
    "created_at": "2026-01-15T10:30:00Z",
    "updated_at": "2026-04-10T14:20:00Z"
  }
}
```

Errors:
- 404: User not found
- 401: Not authenticated
- 403: Not admin

---

#### SV-004 — PUT /api/users/:id
**Cập nhật thông tin user**

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
1. `authMiddleware` xác thực JWT token
2. Kiểm tra `user.role === 'admin'`, trả 403 nếu không phải admin
3. Parse `:id` từ route params
4. Query user hiện tại theo `id`, trả 404 nếu không tồn tại
5. Validate request body (format, length, enum values)
6. Kiểm tra email unique, loại trừ chính user đang cập nhật, trả 409 nếu trùng
7. So sánh dữ liệu cũ vs mới để xây dựng `changed_fields` (chỉ lấy các field thực sự thay đổi)
8. Update bản ghi trong bảng `users` (note: points không thể được update từ endpoint này)
9. Tạo entry trong bảng `audit_logs` với action = `UPDATE` kèm `changed_fields`
10. Trả về thông tin user sau khi cập nhật

Response (200 OK):
```json
{
  "data": {
    "id": 1,
    "name": "John Smith",
    "email": "john.smith@example.com",
    "role": "moderator",
    "status": "inactive",
    "note": "Updated note",
    "birthday": "1985-03-20",
    "points": 0,
    "last_login_at": null,
    "updated_at": "2026-04-15T11:00:00Z"
  }
}
```

Validations:
- [UPDATE] Name: min 2, max 50 chars
- [DEPRECATED] Name: min 3, max 100 chars
- Email: valid format, unique (excluding current user)
- Role: enum
- Status: enum
- [NEW] Note: optional, max 500 chars
- [NEW] Birthday: optional, valid date, no future dates
- [NEW] Points: NOT editable (ignored if provided in request)

Audit Log: Tạo entry UPDATE với changed_fields

Authorization: Admin không thể sửa user khác để có quyền cao hơn admin (nếu có super-admin concept sau này)

Errors:
- 400: Validation error
- 404: User not found
- 409: Email already exists
- 401: Not authenticated
- 403: Not admin

---

#### SV-005 — DELETE /api/users/:id
**Xóa user**

Flow:
1. `authMiddleware` xác thực JWT token
2. Kiểm tra `user.role === 'admin'`, trả 403 nếu không phải admin
3. Parse `:id` từ route params
4. Kiểm tra `req.user.id !== id`, trả 400 nếu admin đang cố xóa chính mình
5. Query user theo `id`, trả 404 nếu không tồn tại
6. Tạo entry trong bảng `audit_logs` với action = `DELETE` (trước khi xóa để lưu snapshot)
7. Xóa bản ghi khỏi bảng `users`
8. Trả về thông báo thành công

Response (200 OK):
```json
{
  "message": "User deleted successfully"
}
```

Authorization:
- Admin không thể xóa chính mình
- Chỉ có thể xóa user khác

Audit Log: Tạo entry DELETE

Errors:
- 400: Cannot delete self
- 404: User not found
- 401: Not authenticated
- 403: Not admin

---

#### SV-006 — GET /api/users/:id/activity
**Lịch sử thay đổi user**

Query Parameters:
- `limit` (optional): Số items, default 10

Flow:
1. `authMiddleware` xác thực JWT token
2. Kiểm tra `user.role === 'admin'`, trả 403 nếu không phải admin
3. Parse `:id` từ route params; kiểm tra user tồn tại, trả 404 nếu không có
4. Query bảng `audit_logs` theo `target_user_id = id`, JOIN với `users` để lấy `admin_name`
5. Sắp xếp theo `timestamp DESC`, giới hạn `limit` bản ghi
6. Trả về danh sách audit log

Response (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "admin_id": 5,
      "admin_name": "Admin User",
      "action": "UPDATE",
      "changed_fields": {
        "name": { "old": "John", "new": "John Smith" },
        "role": { "old": "user", "new": "moderator" }
      },
      "timestamp": "2026-04-15T10:00:00Z"
    }
  ]
}
```

---

#### SV-007 — GET /api/users/check-email [NEW]
**Kiểm tra email có bị trùng lặp**

Request:
```
GET /api/users/check-email?email=john@example.com&excludeId=1
```

Query Parameters:
- `email` (required): Email cần kiểm tra
- `excludeId` (optional): ID của user cần loại trừ (dùng khi edit user để cho phép giữ nguyên email)

Flow:
1. Validate query parameters (email format, required)
2. Parse email, normalize to lowercase
3. Query bảng `users` để kiểm tra email:
   - Nếu `excludeId` có: WHERE email = ? AND id != excludeId
   - Nếu `excludeId` không có: WHERE email = ?
4. Trả về kết quả: `exists: true/false`

Response (200 OK):
```json
{
  "exists": false
}
```

hoặc

```json
{
  "exists": true
}
```

Errors:
- 400: Missing email parameter or invalid email format

Notes:
- Không cần auth token (hoặc có thể require auth)
- Được gọi từ client với debounce 500ms khi user nhập email
- Server có thể khu guard request frequency để tránh abuse

---

### 4.2 Authorization

Tất cả endpoints đều cần:
1. `authMiddleware`: Verify JWT token, attach user to request
2. Admin check: Verify user.role === 'admin'

Special case: DELETE endpoint cần thêm check `user.id !== target_user_id`

### 4.3 Error Handling

Tất cả errors follow format:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

---

## 5. Frontend Components

### 5.1 File Structure

```
client/src/pages/users/
├── UserListPage.vue              # Main list view
├── UserCreatePage.vue            # Create page
├── UserEditPage.vue              # Edit page with audit sidebar
├── components/
│   ├── UserTable.vue             # PrimeVue DataTable wrapper
│   ├── UserFilters.vue           # Search + filters widgets
│   ├── UserForm.vue              # Reusable form
│   └── AuditLogViewer.vue        # Audit history display
├── composables/
│   └── useUsers.ts               # API calls + state management
└── users.routes.ts               # Route definitions
```

### 5.2 Component Details

#### Layout Overview

Tất cả các trang users đều được render bên trong `DefaultLayout` thông qua `<router-view>`:

```
DefaultLayout
├── AppTopbar
├── AppSidebar
└── <router-view>
    ├── UserListPage               ← /users
    │   ├── UserFilters
    │   └── UserTable
    ├── UserCreatePage             ← /users/create
    │   └── UserForm (create mode)
    └── UserEditPage               ← /users/:id/edit
        ├── UserForm (edit mode)   [main content area]
        └── AuditLogViewer         [sidebar]
```

Quan hệ giữa các component:

```
UserListPage
  │  emits: deleteUser(id), editUser(id)
  ├── UserFilters ──── emits: filterChange(filters)
  └── UserTable  ──── emits: edit(id), delete(id), pageChange(page)

UserCreatePage
  │  calls: useUsersStore.createUser()
  ├── UserForm   ──── emits: submit(formData), cancel
  └── PasswordDisplay ──── shows generated password after create

UserEditPage
  │  calls: useUsersStore.getUser(), useUsersStore.updateUser()
  │          useUsersStore.getUserActivity()
  ├── UserForm   ──── emits: submit(formData), cancel
  └── AuditLogViewer ──── props: logs[]
```

---

#### UserListPage.vue

- Điều phối `UserFilters` + `UserTable`
- Lắng nghe `filterChange` từ `UserFilters`, cập nhật filters và reset về page 1
- Lắng nghe `pageChange` từ `UserTable`, cập nhật page hiện tại
- Lắng nghe `delete(id)` từ `UserTable`, hiện confirm dialog rồi gọi deleteUser

**Flow — `onMounted`:**
1. Khởi tạo filters mặc định
2. Gọi `useUsersStore.fetchUsers(defaultFilters)` để load danh sách ban đầu

**Flow — `handleFilterChange(filters)`:**
1. Cập nhật `activeFilters` (debounce 300ms)
2. Reset `page` về 1
3. Gọi `useUsersStore.fetchUsers(filters)`

**Flow — `handleDelete(id)`:**
1. Hiển thị PrimeVue `ConfirmDialog`
2. Nếu confirm → gọi `useUsersStore.deleteUser(id)`
3. Hiển thị success toast
4. Gọi lại `fetchUsers` để reload bảng

---

#### UserTable.vue

- PrimeVue `DataTable` wrapper hiển thị danh sách user
- Hiển thị các cột: ID, Name, Email, Role, Status (badge màu), Created At, Updated At, Actions
- Loading skeleton khi `loading = true`
- Empty state khi `users = []`
- Emit `edit(id)` khi click nút Edit hoặc click row
- Emit `delete(id)` khi click nút Delete
- Emit `pageChange(page)` khi chuyển trang (controlled pagination)

**Props:** `users: User[]`, `loading: boolean`, `pagination: PaginationInfo`

**Emits:** `edit(id)`, `delete(id)`, `pageChange(page)`

---

#### UserFilters.vue

- Thanh công cụ lọc phía trên bảng
- Chứa: Search input, Role dropdown, Status dropdown, Date range picker
- Tất cả thay đổi emit `filterChange(filters)` lên parent

**Flow — `handleSearchInput(value)`:**
1. Cập nhật `searchText`
2. Debounce 300ms → emit `filterChange`

**Flow — `handleDropdownChange(field, value)`:**
1. Cập nhật `role` hoặc `status`
2. Emit `filterChange` ngay lập tức

**Flow — `handleDateRangeChange(range)`:**
1. Cập nhật `startDate` / `endDate`
2. Emit `filterChange` ngay lập tức

---

#### UserForm.vue

- Form dùng chung cho cả Create và Edit mode (phân biệt qua prop `mode`)
- Create mode: Name, Email, Role (default "user"), Status (default "active")
- Edit mode: như trên + Created At (read-only)

**Props:** `mode: 'create' | 'edit'`, `initialData?: User`

**Emits:** `submit(formData)`, `cancel`

**Flow — `onMounted` (edit mode):**
1. Nhận `initialData` từ parent
2. Populate các field của form

**Flow — `generatePassword(email)`:**
1. Lấy phần username trước dấu `@`
2. Append `123` → trả về password string
3. (Chỉ dùng nội bộ để preview, không gửi lên server)

**Flow — `handleSubmit()`:**
1. Chạy client-side validation (required, email format, length)
2. Nếu có lỗi → hiển thị messages dưới từng field, dừng lại
3. Nếu pass → emit `submit(formData)` lên parent

---

#### UserCreatePage.vue

- Wrapper page cho luồng tạo user
- Sử dụng `UserForm` ở mode `create`
- Sau khi tạo thành công, navigate về `/users`

**Flow — `handleSubmit(formData)`:**
1. Gọi `useUsersStore.createUser(formData)`
2. Nếu thành công → hiển thị success toast, navigate về `/users`
3. Nếu lỗi 409 → hiển thị lỗi "Email already exists" trong form

---

#### UserEditPage.vue

- Wrapper page cho luồng chỉnh sửa user
- Layout hai cột: `UserForm` bên trái, `AuditLogViewer` sidebar bên phải

**Flow — `onMounted`:**
1. Lấy `id` từ route params
2. Gọi `useUsersStore.fetchUser(id)` → populate form
3. Gọi `useUsersStore.fetchUserActivity(id)` → populate audit sidebar

**Flow — `handleSubmit(formData)`:**
1. Gọi `useUsersStore.updateUser(id, formData)`
2. Nếu thành công → hiển thị success toast, refresh audit log
3. Nếu lỗi 409 → hiển thị lỗi "Email already exists" trong form

---

#### AuditLogViewer.vue

- Hiển thị danh sách audit log của một user trong sidebar
- Tối đa 10 entries gần nhất

**Props:** `logs: AuditLog[]`, `loading: boolean`

**Flow — `formatLogEntry(log)`:**
1. Với mỗi key trong `changed_fields` → tạo chuỗi `"changed {field} from '{old}' to '{new}'"`
2. Ghép thành: `"{admin_name} {changes} on {timestamp}"`
3. Trả về string để render

---



### 5.3 Composable

#### useUsers.ts
```typescript
// API calls
getUsers(filters)       // GET /api/users
createUser(data)       // POST /api/users
getUser(id)           // GET /api/users/:id
updateUser(id, data)  // PUT /api/users/:id
deleteUser(id)        // DELETE /api/users/:id
getUserActivity(id)   // GET /api/users/:id/activity

// State management
users: Ref<User[]>
loading: Ref<boolean>
error: Ref<string>
pagination: Ref<PaginationInfo>
```

---

### 5.4 Store Management

#### File: `client/src/stores/users.store.ts`

Pinia store quản lý toàn bộ state của Users feature, được inject vào các page components và composables.

```typescript
// State
interface UsersState {
  users: User[]                  // Danh sách user hiện tại đang hiển thị
  currentUser: User | null       // User đang được xem/chỉnh sửa
  auditLogs: AuditLog[]          // Audit log của currentUser
  pagination: PaginationInfo     // Thông tin phân trang
  filters: UserFilters           // Filters đang active
  loading: boolean               // Loading state cho list/CRUD
  loadingUser: boolean           // Loading state riêng cho fetchUser
  loadingActivity: boolean       // Loading state riêng cho fetchActivity
  error: string | null           // Error message khi có lỗi API
}

// Getters
totalUsers: number               // pagination.total
hasUsers: boolean                // users.length > 0
isLastPage: boolean              // pagination.page >= pagination.pages

// Actions
fetchUsers(filters?: UserFilters): Promise<void>
  // Gọi SV-001, cập nhật users + pagination

fetchUser(id: number): Promise<void>
  // Gọi SV-003, cập nhật currentUser

createUser(data: CreateUserDto): Promise<User>
  // Gọi SV-002, trả về user mới (không có password)

updateUser(id: number, data: UpdateUserDto): Promise<void>
  // Gọi SV-004, cập nhật currentUser

deleteUser(id: number): Promise<void>
  // Gọi SV-005, gọi lại fetchUsers sau khi xóa

fetchUserActivity(id: number): Promise<void>
  // Gọi SV-006, cập nhật auditLogs

resetFilters(): void
  // Reset filters về mặc định, gọi lại fetchUsers

clearCurrentUser(): void
  // Xóa currentUser và auditLogs khi rời khỏi edit page
```

#### Error Handling trong Store

- Mỗi action wrap trong `try/catch`; lỗi API được gán vào `state.error`
- HTTP 409 → throw error với code `EMAIL_EXISTS` để page component hiển thị lỗi inline trên form
- HTTP 4xx/5xx khác → hiển thị toast error toàn cục qua `ui.store`

#### Store Dependencies

| Store | Vai trò |
|-------|---------|
| `useUsersStore` | Quản lý users state, API calls |
| `useAuthStore` | Lấy JWT token để đính kèm vào request header |
| `useUiStore` | Hiển thị toast notification (success/error) |

---

## 6. Sequence Diagrams

### 6.1 Create User Flow

```
Admin         Frontend      Backend         Database
  │              │             │               │
  │─ Fill form ──┤             │               │
  │              │─ Validate ──┤               │
  │              │             │               │
  │─ Click Save ─┤             │               │
  │              │─ POST /users│               │
  │              │             │─ verify admin │
  │              │             │─ validate ────┤
  │              │             │               │
  │              │             │─ create record│
  │              │             │               │
  │              │             │─ log audit ──┤
  │              │             │               │
  │              │ 201 Created │               │
  │              │ w/ password │               │
  │              │             │               │
  │ Success msg ─┤             │               │
  │ password ────┤             │               │
```

### 6.2 Delete User Flow

```
Admin         Frontend      Backend         Database
  │              │             │               │
  │─ Click Del ──┤             │               │
  │              │─ Confirm? ──┤               │
  │─ Confirm ────┤             │               │
  │              │─ DELETE ────┤               │
  │              │  /users/:id │               │
  │              │             │─ verify admin │
  │              │             │─ check not self
  │              │             │               │
  │              │             │─ delete record│
  │              │             │               │
  │              │             │─ log audit ──┤
  │              │             │               │
  │              │ 200 OK ─────┤               │
  │              │             │               │
  │ Reload table ┤─ reload ────┤               │
```

---

## 7. Security Considerations

- **Authentication**: Tất cả endpoints require valid JWT token
- **Authorization**: Tất cả endpoints require admin role
- **Input Validation**: Server-side validation cho tất cả input
- **SQL Injection**: Sử dụng prepared statements (mysql2/promise)
- **Password**: Stored hashed (bcrypt), không bao giờ expose
- **Audit Trail**: Tất cả changes được tracked
- **Self-deletion Prevention**: Admin không thể xóa chính mình
- **Unique Constraints**: Email unique ở database level

---

## 8. Error Scenarios & Handling

| Scenario | Status | Response |
|----------|--------|----------|
| Not authenticated | 401 | "Not authenticated" |
| Not admin | 403 | "Forbidden - admin only" |
| Invalid email format | 400 | "Invalid email format" |
| Email already exists | 409 | "Email already exists" |
| User not found | 404 | "User not found" |
| Validation failed | 400 | Detailed validation errors |
| Delete self | 400 | "Cannot delete own account" |
| Database error | 500 | "Internal server error" |

---

## 9. Testing Strategy

### Backend Tests
- Unit: Service layer logic (validation, business rules)
- Integration: API endpoints with database
- Authorization: Admin checks, self-deletion prevention

### Frontend Tests
- Component: Form validation, rendering
- Integration: API calls, state management
- E2E: Full user workflows (create, edit, delete)

---

## 10. Performance Considerations

- **Pagination**: Server-side, default 10 items
- **Filtering**: Indexed columns (email, role, status)
- **Search**: Indexed FULLTEXT search on name/email (optional optimization)
- **Caching**: No caching required initially (data frequently changes)
- **Lazy Loading**: Audit logs load on demand

---

## 11. Future Enhancements

- Bulk import/export users
- Email invitation for new users
- Password reset functionality
- User groups/departments
- Fine-grained permissions
- User activity dashboard
- Two-factor authentication support

---

## Approval Sign-off

- [ ] Product Owner Review
- [ ] Technical Lead Review
- [ ] Security Review
