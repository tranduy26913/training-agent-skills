# Frontend Specification

## 1. User Experience Overview

### Primary User Journeys

- Admin mở trang `/users`, lọc hoặc tìm kiếm user, sau đó chuyển trang hoặc sắp xếp dữ liệu để tìm đúng account cần thao tác.
- Admin tạo user mới từ `/users/create`, nhập thông tin hợp lệ, nhận phản hồi thành công và quay lại danh sách.
- Admin mở `/users/:id/edit`, cập nhật profile quản trị của user và xem lịch sử audit log song song.

### Entry Points

- Route `/users` cho list page.
- Route `/users/create` cho create flow.
- Route `/users/:id/edit` cho edit flow.

### Permissions and Visibility Rules

- Toàn bộ user management routes chỉ hiển thị cho admin.
- `points` hiển thị read-only.
- `last_login_at` hiển thị dạng text hoặc `-` nếu chưa có dữ liệu.
- AuditLogViewer chỉ xuất hiện trên edit page.

---

## 2. Page Specifications

### 2.1 User List Page (`/users`)

#### Purpose

Cho phép admin theo dõi và truy cập nhanh tới các thao tác quản lý user trên toàn hệ thống.

#### Display

- `id`: text, sortable.
- `name`: text, sortable.
- `email`: text, sortable.
- `role`: badge, sortable.
- `status`: badge màu, sortable.
- `created_at`: định dạng `DD/MM/YYYY HH:mm`, sortable, mặc định sort desc.
- `updated_at`: định dạng `DD/MM/YYYY HH:mm`, sortable.
- `last_login_at`: định dạng `DD/MM/YYYY HH:mm` hoặc `-` nếu null.
- `points`: number, read-only.
- `actions`: nút Edit và Delete.

#### Filtering and Search

- Search theo `name` hoặc `email` với debounce 300ms.
- Filter theo `role`.
- Filter theo `status`.
- Filter theo date range cho created/updated.
- Nút `Clear Filters` reset toàn bộ filter và load lại từ page 1.

#### Sorting

- Server-side sorting.
- Default sort theo `created_at desc`.
- Chỉ whitelist các field được backend chấp nhận.

#### Pagination

- Server-side pagination.
- Default 10 items per page.
- Cho phép chọn 10, 25, 50.

#### Empty, Loading, and Error States

- Empty: hiển thị empty state của bảng khi không có user phù hợp filter.
- Loading: hiển thị 5 skeleton rows thay vì overlay spinner.
- Error: hiển thị toast lỗi chung và giữ filter hiện tại để admin retry.

#### UX Interactions

- Click row hoặc nút Edit để vào edit page.
- Click Delete mở confirm dialog trước khi gọi API.
- Thay đổi filter hoặc sort reset page về 1.

### 2.2 Create User Page (`/users/create`)

#### Purpose

Cho phép admin tạo tài khoản user mới với các field quản trị cơ bản và validation đầy đủ trước khi submit.

#### Form Fields

- **name** (required): min 2, max 50.
- **email** (required): đúng format, unique.
- **role** (required): `admin | user | moderator`, default `user`.
- **status** (required): `active | inactive | suspended`, default `active`.
- **note** (optional): max 500.
- **birthday** (optional): valid date, không được ở tương lai.

#### Form Actions

- **Save**: validate client-side, kiểm tra duplicate email, submit lên API, hiển thị success toast, điều hướng về list.
- **Cancel**: quay lại list page.

#### Validation

- Client-side: required, format, max/min length, no future birthday.
- Server-side dependencies: duplicate email, enum validation, final business rule enforcement.

#### Error Feedback

- Inline: field error cho `name`, `email`, `note`, `birthday`.
- Global: toast cho lỗi hệ thống hoặc lỗi không map trực tiếp vào field.

### 2.3 Edit User Page (`/users/:id/edit`)

#### Purpose

Cho phép admin chỉnh sửa thông tin user hiện hữu và xem lịch sử thay đổi gần nhất trên cùng màn hình.

#### Form Fields

- Các field giống create page.
- `points`: read-only.
- `created_at`: read-only.

#### Form Actions

- **Save**: validate, submit PUT, refresh audit log nếu thành công.
- **Cancel**: quay lại list page.

#### Additional Panel (Optional)

- Audit history sidebar hiển thị tối đa 10 log gần nhất.

#### Validation

- Unique email loại trừ chính user hiện tại.
- Không cho chỉnh `points` từ form.
- Không cho nhập `birthday` ở tương lai.

---

## 3. Component Specifications

### 3.1 Layout Overview

```text
DefaultLayout
├── AppTopbar
├── AppSidebar
└── <router-view>
    ├── UserListPage
    ├── UserCreatePage
    └── UserEditPage
```

### 3.2 Component Responsibilities

#### UserListPage.vue

- Điều phối `UserFilters` và `UserTable`.
- Đồng bộ filters, page, sort với store.

**Flow - onMounted:**
1. Khởi tạo default filters.
2. Gọi `fetchUsers(defaultFilters)`.

#### UserTable.vue

- Render PrimeVue DataTable với list users.
- Emit hành động `edit`, `delete`, `pageChange`, `sortChange`.

#### UserFilters.vue

- Chứa search box, role filter, status filter, date range filter, clear button.
- Search dùng debounce, dropdown/date thay đổi áp dụng ngay.

#### UserForm.vue

- Dùng chung cho create và edit mode.

**Props:**
- `mode`: `'create' | 'edit'`
- `initialData?`: `User`

**Emits:**
- `submit(formData)`
- `cancel`

#### AuditLogViewer.vue

- Hiển thị danh sách audit log của user trong sidebar với format dễ đọc.

---

## 4. Client State and Data Fetching

### 4.1 Composable

#### useUsers.ts

```typescript
getUsers(filters)
createUser(data)
getUser(id)
updateUser(id, data)
deleteUser(id)
getUserActivity(id)
checkEmail(email, excludeId?)

users: Ref<User[]>
loading: Ref<boolean>
error: Ref<string>
pagination: Ref<PaginationInfo>
```

### 4.2 Store Management

#### File: client/src/stores/users.store.ts

Use this state/getter/action pattern:

```typescript
interface UsersState {
  users: User[]
  currentUser: User | null
  auditLogs: AuditLog[]
  pagination: PaginationInfo
  filters: UserFilters
  loading: boolean
  loadingUser: boolean
  loadingActivity: boolean
  error: string | null
}
```

Store dependencies:

| Store | Role |
|-------|------|
| useUsersStore | Manage users state and CRUD actions |
| useAuthStore | Provide auth token/context |
| useUiStore | Show success/error toasts |

---

## 5. Accessibility and Localization

### Accessibility Requirements

- Bảng, form fields và dialog phải truy cập được bằng keyboard.
- Sau khi submit lỗi, focus nên quay về field đầu tiên có lỗi.
- Delete confirmation phải có nhãn hành động rõ ràng để tránh thao tác nhầm.

### Localization Requirements

- Label, placeholder, validation messages hỗ trợ `en`, `vi`, `ja`.
- Date/time hiển thị theo formatter thống nhất của project.
- Badge status và role labels dùng translation keys thay vì hard-coded text.