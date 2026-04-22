---
title: User Profile Feature Design
version: 1.0
author: Admin Team
date: 2026-04-22
status: Draft
---

# User Profile Feature Design

## Executive Summary

Tính năng chỉnh sửa profile cá nhân cho phép tất cả user (bao gồm 3 role: `admin`, `moderator`, `user`) tự chỉnh sửa thông tin của chính mình bao gồm tên, ngày sinh, ghi chú và ảnh đại diện, cũng như đổi mật khẩu. Giao diện được truy cập thông qua dropdown avatar ở header layout. Tính năng này tách biệt hoàn toàn với phần quản lý user dành cho admin.

## Changelog

| Version | Date | Author | Summary |
|---------|------|--------|---------|
| 1.0 | 2026-04-22 | Admin Team | Initial design |

---

## 1. Objective & Scope

### Purpose

Cung cấp cho tất cả user (không phân biệt role) khả năng tự quản lý thông tin cá nhân của mình mà không cần thông qua admin. Endpoint sử dụng JWT token để xác định danh tính, đảm bảo user chỉ có thể chỉnh sửa thông tin của bản thân.

### In Scope

- Xem thông tin profile cá nhân tại route `/profile`
- Chỉnh sửa các field: `name`, `birthday`, `note`, `avatar` (base64)
- Hiển thị read-only: `email`, `role`
- Upload ảnh đại diện và lưu dưới dạng base64 vào database (giới hạn 2MB sau encode)
- Đổi mật khẩu qua modal riêng (yêu cầu xác nhận mật khẩu hiện tại)
- Dropdown avatar ở header layout dẫn đến trang profile và nút đăng xuất
- Cập nhật `authStore` ngay sau khi lưu thành công (avatar/tên hiển thị ở header đồng bộ tức thì)

### Out of Scope

- Đổi email (không được phép tự thay đổi)
- Thay đổi `role`, `status`, `points` (chỉ admin mới có quyền)
- Upload avatar lên file storage / CDN (tương lai)
- Xem lịch sử hoạt động / audit log của bản thân
- Thêm các menu item khác vào dropdown header (sẽ mở rộng trong tương lai)

---

## 2. Architecture

### 2.1 System Architecture

```text
[Vue.js Frontend]
  ProfilePage, ProfileForm, ChangePasswordModal,
  UserAvatarDropdown
      |
   HTTP/REST
      |
[Express.js Backend]
  ┌──────────────────────────────────────────┐
  │  Auth Module (mở rộng)                   │
  │  - Controller (GET/PUT /auth/me,         │
  │               PUT /auth/me/password)     │
  │  - Service (profile logic)               │
  │  - Validation (Zod schemas)              │
  └──────────────────────────────────────────┘
  ┌──────────────────────────────────────────┐
  │  Auth Middleware (verify JWT token)      │
  │  → User ID lấy từ token, không từ URL   │
  └──────────────────────────────────────────┘
      |
    SQL Query
      |
[MySQL Database]
  - users (existing, cập nhật name/birthday/note/avatar)
```

### 2.2 Data Model

#### users (Existing — không thêm cột mới)

```sql
users {
  id:           INT (PRIMARY KEY)
  name:         VARCHAR(100) NOT NULL        -- editable
  email:        VARCHAR(255) NOT NULL UNIQUE -- read-only
  password:     VARCHAR(255) NOT NULL        -- chỉ đổi qua /auth/me/password
  role:         ENUM('admin','user','moderator') -- read-only
  status:       ENUM('active','inactive','suspended')
  avatar:       TEXT NULL                    -- base64 string
  birthday:     DATE NULL                    -- editable
  note:         VARCHAR(500) NULL            -- editable
  last_login_at: TIMESTAMP NULL
  points:       INT NOT NULL DEFAULT 0
  created_at:   TIMESTAMP
  updated_at:   TIMESTAMP
}
```

Không có thay đổi schema database. Cột `avatar` (TEXT) đã tồn tại và đủ dung lượng để lưu base64.

---

## 3. Feature Specifications

### 3.1 Profile Page (`/profile`)

#### Display

- **Avatar**: Hiển thị ảnh hiện tại (hoặc initials placeholder nếu chưa có), có nút chọn ảnh mới
- **Name** (required): Input text, 2–100 ký tự
- **Email** (read-only): Hiển thị dạng disabled input
- **Role** (read-only): Hiển thị dạng badge/tag
- **Birthday** (optional): Date picker, không được là ngày trong tương lai
- **Note** (optional): Textarea, tối đa 500 ký tự

#### UX Interactions

- Khi trang load → hiển thị dữ liệu từ `authStore` (đã có sẵn, không cần fetch thêm)
- Click nút **"Lưu thay đổi"** → validate → gọi `PUT /auth/me` → toast success → cập nhật `authStore`
- Click nút **"Đổi mật khẩu"** → mở `ChangePasswordModal`
- Sau khi lưu thành công → avatar và tên ở header cập nhật ngay lập tức

#### Avatar Upload

- Click vào vùng avatar → mở file picker (chỉ nhận `image/*`)
- Sau khi chọn file → hiển thị preview tức thì bằng `FileReader.readAsDataURL()`
- Validate phía client: kích thước file gốc ≤ 2MB (trước khi encode)
- Nếu vượt quá → hiển thị toast error, không cho submit

### 3.2 Change Password Modal

#### Form Fields

- **Mật khẩu hiện tại** (required): Password input
- **Mật khẩu mới** (required): Password input, tối thiểu 8 ký tự
- **Xác nhận mật khẩu mới** (required): Phải khớp với "Mật khẩu mới"

#### Form Actions

- **Xác nhận**: Validate → gọi `PUT /auth/me/password` → đóng modal → toast success
- **Hủy**: Đóng modal, xóa form data

#### Validation

- Client-side: kiểm tra `newPassword === confirmPassword` trước khi submit
- Server-side: verify `currentPassword` với bcrypt trước khi đổi
- Nếu `currentPassword` sai → server trả `401` → hiển thị lỗi inline trong modal (không đóng modal)

### 3.3 User Avatar Dropdown (Header)

#### Display

- Hiển thị avatar (hoặc initials) và tên user hiện tại
- Click vào → mở dropdown menu

#### Dropdown Items

- **Hồ sơ cá nhân** → điều hướng đến `/profile`
- **Đăng xuất** → gọi logout, xóa token, redirect về `/login`

> Dropdown được thiết kế extensible — có thể thêm menu item mới mà không ảnh hưởng logic hiện tại.

---

## 4. Backend API Specification

### 4.1 Endpoints

#### SV-001 - GET /api/auth/me
**Lấy thông tin profile của user đang đăng nhập**

Request:
```http
GET /api/auth/me
Authorization: Bearer <token>
```

Flow:
1. Verify JWT token → lấy `userId` từ payload
2. Query user theo `userId`
3. Trả về thông tin user (không bao gồm `password`)

Response (200 OK):
```json
{
  "data": {
    "id": 1,
    "name": "Nguyen Van A",
    "email": "a@example.com",
    "role": "user",
    "status": "active",
    "avatar": "data:image/png;base64,...",
    "birthday": "1990-05-15",
    "note": "Ghi chú cá nhân",
    "points": 100,
    "last_login_at": "2026-04-22T10:00:00Z",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-04-22T10:00:00Z"
  }
}
```

Errors:
- 401: Token không hợp lệ hoặc hết hạn

---

#### SV-002 - PUT /api/auth/me
**Cập nhật thông tin profile của user đang đăng nhập**

Request:
```http
PUT /api/auth/me
Authorization: Bearer <token>
Content-Type: application/json
```

Request Body:
```json
{
  "name": "Nguyen Van A",
  "birthday": "1990-05-15",
  "note": "Ghi chú cá nhân",
  "avatar": "data:image/png;base64,..."
}
```

Flow:
1. Verify JWT token → lấy `userId` từ payload
2. Validate request body theo Zod schema
3. Kiểm tra kích thước `avatar` base64 (nếu có) ≤ ~2.7MB (tương đương 2MB file gốc)
4. Chỉ cập nhật các field được phép: `name`, `birthday`, `note`, `avatar`
5. Trả về user đã được cập nhật

Response (200 OK):
```json
{
  "data": {
    "id": 1,
    "name": "Nguyen Van A",
    "email": "a@example.com",
    "role": "user",
    "avatar": "data:image/png;base64,...",
    "birthday": "1990-05-15",
    "note": "Ghi chú cá nhân"
  }
}
```

Errors:
- 400: Validation error (name quá ngắn, birthday tương lai, v.v.)
- 401: Token không hợp lệ

---

#### SV-003 - PUT /api/auth/me/password
**Đổi mật khẩu của user đang đăng nhập**

Request:
```http
PUT /api/auth/me/password
Authorization: Bearer <token>
Content-Type: application/json
```

Request Body:
```json
{
  "currentPassword": "old_password",
  "newPassword": "new_password_123",
  "confirmPassword": "new_password_123"
}
```

Flow:
1. Verify JWT token → lấy `userId` từ payload
2. Validate request body theo Zod schema
3. Query user, verify `currentPassword` với bcrypt
4. Nếu sai → trả lỗi `401` với message rõ ràng
5. Hash `newPassword` với bcrypt
6. Cập nhật `password` trong database
7. Trả về success message

Response (200 OK):
```json
{
  "message": "Mật khẩu đã được cập nhật thành công"
}
```

Errors:
- 400: Validation error (`newPassword` < 8 ký tự, `confirmPassword` không khớp)
- 401: `currentPassword` không đúng hoặc token không hợp lệ

---

### 4.2 Authorization

Tất cả endpoints `/auth/me` yêu cầu:
1. JWT verification qua `authMiddleware` hiện có
2. **Không yêu cầu role cụ thể** — tất cả 3 role (`admin`, `moderator`, `user`) đều được phép

Nguyên tắc bảo mật quan trọng:
- `userId` **luôn lấy từ JWT token payload**, không bao giờ từ request body hoặc URL parameter
- Không thể cập nhật thông tin của user khác dù cố tình truyền `id` vào body
- Field `role`, `status`, `email`, `points` bị **whitelist bỏ qua** ở tầng service, không thể bị ghi đè

### 4.3 Error Handling

Tất cả lỗi trả về theo format thống nhất:
```json
{
  "error": "Mô tả lỗi",
  "code": "ERROR_CODE",
  "details": {}
}
```

---

## 5. Frontend Components

### 5.1 File Structure

```text
client/src/
├── pages/profile/
│   ├── ProfilePage.vue              # Route /profile
│   ├── profile.routes.ts            # Route definition
│   └── components/
│       ├── ProfileForm.vue          # Form chỉnh sửa profile
│       └── ChangePasswordModal.vue  # Modal đổi mật khẩu
├── components/layout/
│   └── UserAvatarDropdown.vue       # Dropdown header
├── composables/
│   └── useProfile.ts                # Composable cho profile & đổi MK
├── services/
│   └── profile.service.ts           # HTTP calls tới /auth/me
└── types/
    └── profile.types.ts             # UpdateProfileDto, ChangePasswordDto
```

### 5.2 Component Details

#### Layout Overview

```text
[DefaultLayout / AppLayout]
├── [AppHeader]
│   └── [UserAvatarDropdown]  ← mới
│       ├── "Hồ sơ cá nhân" → /profile
│       └── "Đăng xuất"
└── <router-view>
    └── [ProfilePage]  ← /profile (mới)
        ├── [ProfileForm]
        └── [ChangePasswordModal]
```

#### UserAvatarDropdown.vue

- Hiển thị avatar (hoặc initials) và tên từ `authStore`
- Dùng PrimeVue `Menu` component với `popup` mode
- Emits: không cần emit, tự xử lý navigation và logout

#### ProfilePage.vue

- Load data từ `authStore` khi mount (không cần gọi API riêng)
- Chứa `ProfileForm` và nút "Đổi mật khẩu" mở `ChangePasswordModal`
- Xử lý `onProfileSaved` → cập nhật `authStore`

**Flow - onMounted:**
1. Lấy user data từ `authStore.user`
2. Truyền vào `ProfileForm` qua props

**Flow - handleProfileSaved(updatedUser):**
1. Nhận emit từ `ProfileForm`
2. Gọi `authStore.updateUser(updatedUser)`
3. Hiển thị toast success

#### ProfileForm.vue

- Hiển thị avatar preview với nút chọn ảnh (hidden file input)
- Fields editable: `name`, `birthday`, `note`, `avatar`
- Fields read-only: `email` (disabled input), `role` (Badge)
- Dùng VeeValidate + Zod cho client-side validation

**Props:**
- `initialData`: `AuthUser`

**Emits:**
- `saved(updatedUser: AuthUser)`

**Flow - handleSubmit():**
1. Trigger VeeValidate validation
2. Validate avatar size ≤ 2MB (nếu có ảnh mới)
3. Gọi `useProfile.updateProfile(dto)`
4. Emit `saved(result)` khi thành công

**Flow - handleAvatarChange(event):**
1. Lấy file từ input
2. Kiểm tra `file.size ≤ 2 * 1024 * 1024`
3. Nếu quá lớn → toast error, return
4. Dùng `FileReader.readAsDataURL(file)` → cập nhật preview và form value

#### ChangePasswordModal.vue

- Modal dùng PrimeVue `Dialog`
- Ba fields: `currentPassword`, `newPassword`, `confirmPassword`
- Hiển thị lỗi inline khi `currentPassword` sai (không đóng modal)

**Props:**
- `visible`: `boolean`

**Emits:**
- `update:visible`
- `passwordChanged`

**Flow - handleSubmit():**
1. Validate client-side (`newPassword === confirmPassword`, độ dài)
2. Gọi `useProfile.changePassword(dto)`
3. Nếu thành công → emit `passwordChanged`, đóng modal, toast success
4. Nếu 401 → hiển thị lỗi inline "Mật khẩu hiện tại không đúng"

### 5.3 Composable

#### useProfile.ts

```typescript
// API calls
updateProfile(data: UpdateProfileDto): Promise<AuthUser>
changePassword(data: ChangePasswordDto): Promise<void>

// State
loading: Ref<boolean>
error: Ref<string | null>
```

### 5.4 Store Management

#### File: client/src/stores/auth.store.ts (mở rộng)

Thêm action vào `useAuthStore` hiện có:

```typescript
// Action mới
updateUser(updatedUser: Partial<AuthUser>): void
// → cập nhật user trong state và localStorage
```

Store dependencies:

| Store | Role |
|-------|------|
| useAuthStore | Lưu trữ và cập nhật thông tin user hiện tại |

---

## 6. Sequence Diagrams

### 6.1 Update Profile Flow

```text
User         ProfileForm    useProfile    profile.service   Backend     Database
  |               |              |               |              |            |
  |-- Submit ---->|              |               |              |            |
  |               |-- validate ->|               |              |            |
  |               |-- updateProfile(dto) ------->|              |            |
  |               |              |               |-- PUT /me -->|            |
  |               |              |               |              |-- UPDATE ->|
  |               |              |               |<-- 200 ------|            |
  |               |              |<-- AuthUser --|               |            |
  |               |<-- emit saved(user) ---------|               |            |
  |               |              |               |              |            |
  |  authStore.updateUser(user)  |               |              |            |
  |  [header avatar/name cập nhật]               |              |            |
  |<-- toast success ------------|               |              |            |
```

### 6.2 Change Password Flow

```text
User    ChangePasswordModal    useProfile    profile.service   Backend
  |              |                 |               |              |
  |-- Submit --->|                 |               |              |
  |              |-- validate ---->|               |              |
  |              |-- changePassword(dto) --------->|              |
  |              |                 |               |-- PUT /me/password -->|
  |              |                 |               |<-- 200 --------------|
  |              |<-- success ------|               |              |
  |              |-- close modal   |               |              |
  |<-- toast success --------------|               |              |
  |                                |               |              |
  |  [lỗi: currentPassword sai]   |               |              |
  |              |                 |               |<-- 401 ------|
  |              |<-- error --------|               |              |
  |<-- inline error "Mật khẩu hiện tại không đúng"|              |
```

---

## 7. Security Considerations

- **Authentication**: Tất cả endpoints `/auth/me` yêu cầu JWT hợp lệ qua `authMiddleware`
- **Authorization**: `userId` luôn được trích xuất từ JWT token, không chấp nhận từ request body hay URL — ngăn chặn tấn công IDOR
- **Input Validation**: Zod schema ở cả client và server; chỉ các field được whitelist mới được cập nhật
- **SQL Injection Prevention**: Sử dụng parameterized queries (đã áp dụng toàn bộ project)
- **Sensitive Data Protection**: `password` không bao giờ được trả về trong response; avatar base64 lưu trong DB (TEXT column)
- **Password Security**: `currentPassword` được verify bằng bcrypt trước khi cho phép đổi; `newPassword` được hash trước khi lưu
- **Avatar Size Limit**: Validate phía client (≤ 2MB gốc) và phía server (≤ ~2.7MB encoded) để tránh DoS qua large payload

---

## 8. Error Scenarios & Handling

| Scenario | Status | Response |
|----------|--------|----------|
| Token không hợp lệ / hết hạn | 401 | Redirect về `/login` |
| `currentPassword` sai khi đổi MK | 401 | Lỗi inline trong modal "Mật khẩu hiện tại không đúng" |
| `name` quá ngắn (< 2 ký tự) | 400 | Lỗi inline dưới field |
| `birthday` là ngày tương lai | 400 | Lỗi inline dưới field |
| `note` vượt quá 500 ký tự | 400 | Lỗi inline dưới field |
| Avatar vượt quá 2MB | 400 (client) | Toast error, không submit |
| Avatar payload > 2.7MB (server) | 400 | "File ảnh vượt quá giới hạn cho phép" |
| Network error | 500 | Toast error chung |
| Cập nhật thành công | 200 | Toast success, header đồng bộ ngay |
| Đổi mật khẩu thành công | 200 | Toast success, modal đóng |

---

## 9. Testing Strategy

### Backend Tests

- **Unit**: `profile.service.ts` — updateProfile (chỉ cập nhật đúng field), changePassword (verify currentPassword, hash newPassword)
- **Integration**: `PUT /auth/me` và `PUT /auth/me/password` với mock database
- **Authorization**: Verify `userId` luôn lấy từ token; không cho phép cập nhật user khác dù truyền `id` vào body

### Frontend Tests

- **Component**:
  - `ProfileForm.vue` — validation rules, avatar preview, emit `saved`
  - `ChangePasswordModal.vue` — password match validation, submit flow, inline error khi 401
  - `UserAvatarDropdown.vue` — render avatar/initials, dropdown items, navigation
- **Integration**: `useProfile.ts` — mock `profile.service`, kiểm tra state `loading`/`error`
- **E2E (Playwright)**:
  - Mọi role truy cập `/profile` từ dropdown header thành công
  - Cập nhật `name`, `birthday`, `note` → verify lưu thành công và header đồng bộ
  - Upload avatar → verify preview hiển thị và lưu thành công
  - Upload avatar > 2MB → verify toast error, không gọi API
  - Đổi mật khẩu đúng `currentPassword` → success
  - Đổi mật khẩu sai `currentPassword` → inline error, modal không đóng
  - Truy cập `/profile` khi chưa đăng nhập → redirect về `/login`

---
