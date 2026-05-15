# Architecture and Data

## 1. Architecture

### 1.1 System Architecture

```text
┌─────────────────────────────────────────────────────┐
│                  Vue.js Frontend                    │
│  UserListPage, UserCreatePage, UserEditPage        │
└─────────────────┬───────────────────────────────────┘
                  │ HTTP/REST
┌─────────────────▼───────────────────────────────────┐
│              Express.js Backend                     │
│  Users Module                                       │
│  - Controller                                       │
│  - Service                                          │
│  - Repository                                       │
│  - Validation                                       │
│  Auth Middleware                                    │
└─────────────────┬───────────────────────────────────┘
                  │ SQL queries
┌─────────────────▼───────────────────────────────────┐
│                  MySQL Database                     │
│  - users                                            │
│  - audit_logs                                       │
└─────────────────────────────────────────────────────┘
```

### 1.2 Module Boundaries

- Frontend page layer: điều phối route, page layout, form/list interactions và toast navigation.
- Frontend shared components: hiển thị table, filters, form và audit log viewer.
- Backend controller: nhận request, map input/output HTTP, chuyển lỗi service thành HTTP status.
- Backend service: chứa business rules chính như email uniqueness, self-delete prevention, changed_fields audit payload.
- Backend repository: truy vấn `users`, `audit_logs`, filter/sort/pagination SQL.

### 1.3 External Integrations

- JWT auth middleware: xác thực request và attach `req.user`.
- Bcrypt: hash mật khẩu mặc định khi tạo user.
- PrimeVue UI components: DataTable, Dialog, form inputs, Toast, Skeleton.

---

## 2. Data Model

### 2.1 Existing Structures

#### Users Table (Existing)
```sql
users {
  id: INT (PRIMARY KEY)
  name: VARCHAR(100)
  email: VARCHAR(255) UNIQUE
  password: VARCHAR(255)
  role: ENUM('admin', 'user', 'moderator')
  status: ENUM('active', 'inactive', 'suspended')
  avatar: VARCHAR(500)
  last_login_at: TIMESTAMP NULL
  points: INT DEFAULT 0
  note: VARCHAR(500) NULL
  birthday: DATE NULL
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

### 2.2 New Structures

#### Audit Logs Table (NEW)
```sql
audit_logs {
  id: INT (PRIMARY KEY)
  admin_id: INT (FOREIGN KEY -> users.id)
  target_user_id: INT (FOREIGN KEY -> users.id)
  action: ENUM('CREATE', 'UPDATE', 'DELETE')
  changed_fields: JSON
  timestamp: DATETIME
}
```

### 2.3 Data Lifecycle

- User record được tạo bởi admin từ create form, password được sinh và hash trước khi lưu.
- User record được cập nhật bởi admin từ edit form, chỉ các field cho phép mới được persist.
- Khi xóa user, backend ghi audit snapshot trước khi xóa bản ghi khỏi `users`.
- Audit logs được append-only, không cho sửa từ UI admin.

### 2.4 Migration and Backward Compatibility

- Cần migration thêm các cột `last_login_at`, `points`, `note`, `birthday` nếu chưa có trong bảng `users`.
- Cần bảng `audit_logs` hoặc schema tương thích để lưu lịch sử thao tác.
- Dữ liệu user cũ phải tiếp tục hoạt động khi các field mới là nullable hoặc có default phù hợp.
- Các client cũ không gửi `note` và `birthday` vẫn phải được backend chấp nhận.

---

## 3. State Model

### 3.1 Entity States

| State | Meaning | Entry Condition | Exit Condition |
|-------|---------|-----------------|----------------|
| active | User hoạt động bình thường | Tạo mới hoặc cập nhật status sang active | Chuyển sang inactive hoặc suspended |
| inactive | User tạm ngưng sử dụng | Admin cập nhật status inactive | Chuyển sang active hoặc suspended |
| suspended | User bị khóa | Admin cập nhật status suspended | Chuyển sang active hoặc inactive |
| deleted | User đã bị xóa logic ở tầng nghiệp vụ, không còn record | Admin delete thành công | Terminal state trong phiên bản này |

### 3.2 State Transitions

1. `active`, `inactive`, `suspended` có thể chuyển qua lại qua edit form nếu admin có quyền.
2. `deleted` chỉ đạt được qua DELETE endpoint sau khi vượt qua self-delete guard.
3. `points` và `last_login_at` là dữ liệu hiển thị, không được chỉnh qua user management form.
4. Mọi transition create, update, delete đều phải phát sinh audit log tương ứng.

---

## 4. Sequence Diagrams

### 4.1 Primary Flow

```text
Admin         Frontend      Backend         Database
  |              |             |               |
  |-- Submit --->|             |               |
  |              |-- POST ---->|               |
  |              |             |-- validate -->|
  |              |             |-- insert ---->|
  |              |             |-- audit ----->|
  |              |<-- 201 -----|               |
```

### 4.2 Failure or Recovery Flow

```text
Admin         Frontend      Backend         Database
  |              |             |               |
  |-- Delete --->|             |               |
  |              |-- DELETE -->|               |
  |              |             |-- self-check -|
  |              |<-- 400 -----|               |
```