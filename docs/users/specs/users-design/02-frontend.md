---
title: User Management - Frontend
version: 1.2
author: Admin Team
date: 2026-05-17
---

# User Management — Frontend

> Related: [00-index.md](./00-index.md) | [01-backend.md](./01-backend.md) | [03-behavior.md](./03-behavior.md) | [04-quality.md](./04-quality.md)

---

## 1. File Structure

```
client/src/
├── pages/users/
│   ├── UserListPage.vue              # Trang danh sách user
│   ├── UserCreatePage.vue            # Trang tạo user
│   ├── UserEditPage.vue              # Trang chỉnh sửa user + audit sidebar
│   ├── users.routes.ts               # Route definitions
│   ├── components/
│   │   ├── UserTable.vue             # PrimeVue DataTable wrapper
│   │   ├── UserFilters.vue           # Search + filter controls + Clear Filters
│   │   ├── UserForm.vue              # Form dùng chung create/edit
│   │   └── AuditLogViewer.vue        # Hiển thị lịch sử audit
│   └── composables/
│       └── useUsers.ts               # API call wrappers
├── stores/
│   └── users.store.ts                # Pinia store quản lý user state
└── composables/
    └── useEmailValidation.ts         # Email duplicate check với debounce 500ms
```

---

## 2. Layout & Wireframes

### Application Layout

Tất cả trang users render trong `DefaultLayout`:

```
DefaultLayout
├── AppTopbar
├── AppSidebar (Users menu item highlighted)
└── <router-view>
    ├── UserListPage        ← /users
    ├── UserCreatePage      ← /users/create
    └── UserEditPage        ← /users/:id/edit
```

### Component Tree

```
UserListPage
  ├── UserFilters    (emits: filterChange)
  └── UserTable      (emits: edit, delete, pageChange, sortChange)

UserCreatePage
  └── UserForm (mode="create")  (emits: submit, cancel)

UserEditPage
  ├── UserForm (mode="edit")    (emits: submit, cancel)
  └── AuditLogViewer            (props: logs, loading)
```

### Route Definitions (`users.routes.ts`)

```typescript
[
  { path: '',        name: 'UserList',   component: () => import('./UserListPage.vue'),   meta: { title: 'Users' } },
  { path: 'create',  name: 'UserCreate', component: () => import('./UserCreatePage.vue'), meta: { title: 'Create User' } },
  { path: ':id/edit',name: 'UserEdit',   component: () => import('./UserEditPage.vue'),   meta: { title: 'Edit User' } },
]
```

---

## 3. Screen Item Specifications

### 3.1 UserListPage (`/users`)

| # | ItemName | Control | Type | Required | Validation | Placeholder | DisplayText | Description | Notes |
|---|----------|---------|------|----------|------------|-------------|-------------|-------------|-------|
| **—** | **UserFilters** | | | | | | | **Component** | |
| 1 | searchInput | TextInput | string | No | — | `users.searchPlaceholder` | — | Tìm kiếm theo name hoặc email | Debounce 300ms; emits filterChange |
| 2 | roleFilter | Dropdown | string | No | enum | — | `users.role` | Lọc theo role | Options: All/Admin/User/Moderator; emits filterChange |
| 3 | statusFilter | Dropdown | string | No | enum | — | `users.status` | Lọc theo status | Options: All/Active/Inactive/Suspended; emits filterChange |
| 4 | dateRangePicker | DatePicker | string[] | No | — | — | `users.dateRange` | Lọc theo ngày tạo | emits filterChange |
| 5 | clearFiltersBtn | Button | — | — | — | — | `users.clearFilters` | Reset tất cả filters và reload | emits filterChange với rỗng |
| **—** | **UserTable** | | | | | | | **Component** | |
| 6 | colId | Column | number | — | — | — | `users.id` | ID user | Sortable |
| 7 | colName | Column | string | — | — | — | `users.name` | Tên user | Sortable |
| 8 | colEmail | Column | string | — | — | — | `users.email` | Email user | Sortable |
| 9 | colRole | Column | string | — | — | — | `users.role` | Badge theo role | Sortable |
| 10 | colStatus | Column | string | — | — | — | `users.status` | Badge màu: active=success, inactive=warning, suspended=danger | Sortable |
| 11 | colCreatedAt | Column | string | — | — | — | `users.createdAt` | Ngày tạo DD/MM/YYYY HH:mm | Sortable; default sort DESC |
| 12 | colUpdatedAt | Column | string | — | — | — | `users.updatedAt` | Ngày cập nhật DD/MM/YYYY HH:mm | Sortable |
| 13 | colLastLogin | Column | string | — | — | — | `users.lastLogin` | Thời gian login cuối hoặc "-" | Sortable |
| 14 | colPoints | Column | number | — | — | — | `users.points` | Điểm số (read-only) | Sortable |
| 15 | editBtn | Button | — | — | — | — | `common.edit` | Điều hướng đến UserEditPage | emits edit(id) |
| 16 | deleteBtn | Button | — | — | — | — | `common.delete` | Mở confirm dialog xóa | emits delete(id) |
| 17 | pagination | Pagination | — | — | — | — | Server-side pagination | Default `limit=20`; emits `pageChange` |

### 3.2 UserCreatePage (`/users/create`)

| # | ItemName | Control | Type | Required | Validation | Placeholder | DisplayText | Description | Notes |
|---|----------|---------|------|----------|------------|-------------|-------------|-------------|-------|
| **—** | **UserForm (create mode)** | | | | | | | **Component** | |
| 1 | nameInput | TextInput | string | Yes | min 2, max 50 | `users.namePlaceholder` | `users.name` | Tên user | Inline error bên dưới |
| 2 | emailInput | TextInput | string | Yes | email format, unique | `users.emailPlaceholder` | `users.email` | Email; check duplicate debounce 500ms | Spinner khi đang check; lỗi "Email already exists" |
| 3 | roleSelect | Dropdown | string | Yes | enum | — | `users.role` | Vai trò; default "user" | Options: Admin/User/Moderator |
| 4 | statusSelect | Dropdown | string | Yes | enum | — | `users.status` | Trạng thái; default "active" | Options: Active/Inactive/Suspended |
| 5 | noteInput | Textarea | string | No | max 500 | `users.notePlaceholder` | `users.note` | Ghi chú bổ sung | Character counter hiển thị `n/500` |
| 6 | birthdayPicker | DatePicker | string | No | no future dates | — | `users.birthday` | Ngày sinh | maxDate = today |
| 7 | saveBtn | Button | — | — | — | — | `common.save` | Submit form | Disabled khi email đang check hoặc có email error từ server (do `useEmailValidation` composable) |
| 8 | cancelBtn | Button | — | — | — | — | `common.cancel` | Quay lại UserListPage | Không cần confirm |

### 3.3 UserEditPage (`/users/:id/edit`)

| # | ItemName | Control | Type | Required | Validation | Placeholder | DisplayText | Description | Notes |
|---|----------|---------|------|----------|------------|-------------|-------------|-------------|-------|
| **—** | **UserForm (edit mode)** | | | | | | | **Component** | |
| 1 | nameInput | TextInput | string | Yes | min 2, max 50 | `users.namePlaceholder` | `users.name` | Tên user | |
| 2 | emailInput | TextInput | string | Yes | email format, unique (excl. self) | `users.emailPlaceholder` | `users.email` | Email; check duplicate loại trừ user hiện tại | debounce 500ms |
| 3 | roleSelect | Dropdown | string | Yes | enum | — | `users.role` | Vai trò | |
| 4 | statusSelect | Dropdown | string | Yes | enum | — | `users.status` | Trạng thái | |
| 5 | noteInput | Textarea | string | No | max 500 | `users.notePlaceholder` | `users.note` | Ghi chú bổ sung | Character counter |
| 6 | birthdayPicker | DatePicker | string | No | no future dates | — | `users.birthday` | Ngày sinh | maxDate = today |
| 7 | pointsDisplay | Text | number | No | — | — | `users.points` | Điểm (read-only) | Chỉ hiển thị, không edit |
| 8 | createdAtDisplay | TextInput | string | No | — | — | `users.createdAt` | Ngày tạo (read-only) | disabled |
| 9 | saveBtn | Button | — | — | — | — | `common.save` | Submit form | |
| 10 | cancelBtn | Button | — | — | — | — | `common.cancel` | Quay lại UserListPage | |
| **—** | **AuditLogViewer** | | | | | | | **Component** | |
| 11 | auditList | List | AuditLog[] | — | — | — | `users.auditHistory` | Danh sách thay đổi gần nhất | Max 10 items; skeleton khi loading |

---

## 4. Component Details

### UserTable.vue

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| users | `UserDto[]` | Yes | Danh sách users để hiển thị |
| loading | `boolean` | Yes | Hiển thị skeleton khi true |
| pagination | `PaginationInfo` | Yes | Metadata phân trang |

**Emits:**
| Event | Payload | Description |
|-------|---------|-------------|
| edit | `id: number` | User click Edit button |
| delete | `id: number` | User click Delete button |
| pageChange | `page: number` | User chuyển trang |
| sortChange | `(field: string, order: 1 \| -1)` | User click sort column (1=asc, -1=desc) |

**Skeleton:** Hiển thị 5 dòng `<Skeleton>` per cell khi `loading=true`. Không dùng `loading` prop của DataTable (tránh spinner overlay).

---

### UserFilters.vue

**Emits:**
| Event | Payload | Description |
|-------|---------|-------------|
| filterChange | `UserFilters` | Mỗi khi filter thay đổi |

**Internal state:** `search`, `role`, `status`, `dateRange`

**Debounce:** Search input debounce 300ms (clearTimeout/setTimeout pattern)

---

### UserForm.vue

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| mode | `'create' \| 'edit'` | Yes | Phân biệt create/edit mode |
| initialData | `User` | No | Pre-populate form ở edit mode |
| loading | `boolean` | No | Loading state cho submit button |

**Emits:**
| Event | Payload | Description |
|-------|---------|-------------|
| submit | `{ name, email, role, status, note, birthday }` | Form data sau khi pass validation |
| cancel | — | User click Cancel |

**Email validation:** Sử dụng `useEmailValidation` composable nội bộ (với `excludeId = mode === 'edit' ? initialData.id : undefined`); spinner hiển thị khi đang check; Save button bị disable khi có email error hoặc đang check.

---

### AuditLogViewer.vue

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| logs | `AuditLogDto[]` | Yes | Danh sách audit logs |
| loading | `boolean` | Yes | Skeleton khi true |

**Format mỗi entry:** `"{admin_name} changed {field} from '{old}' to '{new}' on DD/MM/YYYY HH:mm"`

---

## 5. Composable

### useUsers.ts (`pages/users/composables/`)
Methods (re-export types `User`, `CreateUserDto`, `UpdateUserDto`, `UserFilters`, `AuditLog`, `PaginationInfo`):
- `getUsers(filters?: UserFilters): Promise<PaginatedData<User>>` - Gọi API lấy danh sách
- `getUser(id: number): Promise<User>` - Lấy chi tiết user
- `createUser(data: CreateUserDto): Promise<User>` - Tạo user mới
- `updateUser(id: number, data: UpdateUserDto): Promise<User>` - Cập nhật user
- `deleteUser(id: number): Promise<void>` - Xóa user
- `getUserActivity(id: number, limit?: number): Promise<AuditLog[]>` - Lấy lịch sử audit gần nhất

### useEmailValidation.ts (`composables/`)
Composable dùng `watchDebounced` từ `@vueuse/core` với default 500ms debounce.
- Input: `email: Ref<string>`, `excludeId?: Ref<number | undefined> | number`, `debounceMs = 500`
- Output: `{ isChecking: Ref<boolean>, emailError: Ref<string>, reset(): void }`
- Skip API call khi email rỗng hoặc format không hợp lệ.
- Khi `emailError.value === 'emailAlreadyExists'` form sẽ disable submit.---

## 6. Store

### users.store.ts (`stores/`)
State (sử dụng Composition API với `ref`/`shallowRef`):
- `users: User[]` (ref)
- `currentUser: User | null` (ref)
- `auditLogs: AuditLog[]` (ref)
- `pagination: PaginationInfo` (ref, default `{ page:1, limit:20, total:0, pages:0 }`)
- `filters: UserFilters` (ref, default `{}`)
- `loading: boolean` (shallowRef)
- `loadingUser: boolean` (shallowRef)
- `loadingActivity: boolean` (shallowRef)
- `error: string | null` (shallowRef)

Getters:
- `totalUsers: number` (computed từ `pagination.total`)
- `hasUsers: boolean` (computed từ `users.length > 0`)
- `isLastPage: boolean` (computed từ `pagination.page >= pagination.pages`)

Actions:
- `fetchUsers(newFilters?: UserFilters): Promise<void>` → merge filters (nếu có), gọi GET SV-001; cập nhật `users` + `pagination`. Lỗi được set vào `error`.
- `fetchUser(id: number): Promise<void>` → gọi GET SV-003; cập nhật `currentUser`. Lỗi được set vào `error`.
- `createUser(data: CreateUserDto): Promise<void>` → gọi POST SV-002; không tự reload danh sách.
- `updateUser(id: number, data: UpdateUserDto): Promise<void>` → gọi PUT SV-004; không tự reload.
- `deleteUser(id: number): Promise<void>` → gọi DELETE SV-005; gọi lại `fetchUsers()` để reload danh sách.
- `fetchUserActivity(id: number): Promise<void>` → gọi GET SV-006; cập nhật `auditLogs`. Lỗi set vào `error`.
- `resetFilters(): void` → reset `filters` về `{}` và gọi `fetchUsers()`.
- `clearCurrentUser(): void` → set `currentUser = null`, `auditLogs = []`.

> **Note:** `createUser` và `updateUser` KHÔNG ném `{ code:'EMAIL_EXISTS' }`. Validation email trùng được xử lý hoàn toàn phía client qua `useEmailValidation` composable. Nếu server trả 409, page sẽ bắt response và hiển thị toast.
---

## 7. TypeScript Types & Interfaces

> **Quy ước:** Mô tả type chỉ liệt kê tên + property (không dùng code block).
> Trỏ file thực tế để tra cứu khi cần.

### `client/src/types/users.types.ts`

Interface `User` (response shape, snake_case timestamps)
- `id: number`
- `name: string`
- `email: string`
- `role: UserRole` — `'admin' | 'user' | 'moderator'`
- `status: UserStatus` — `'active' | 'inactive' | 'suspended'`
- `avatar: string | null`
- `last_login_at: string | null` — ISO datetime
- `points: number`
- `note: string | null`
- `birthday: string | null` — ISO date `YYYY-MM-DD`
- `created_at: string`
- `updated_at: string`

Interface `CreateUserDto`
- `name: string` — required
- `email: string` — required
- `role: UserRole` — required
- `status: UserStatus` — required
- `note?: string` — optional
- `birthday?: string` — optional, ISO date

Type `UpdateUserDto`
- alias của `CreateUserDto`

Interface `UserFilters` extends `PaginationParams`, `SortParams`
- `search?: string`
- `role?: string`
- `status?: string`
- `startDate?: string`
- `endDate?: string`

Interface `AuditLog`
- `id: number`
- `admin_id: number`
- `target_user_id: number`
- `action: AuditAction` — `'CREATE' | 'UPDATE' | 'DELETE'`
- `changed_fields: ChangedFields` — `Record<string, { old, new }> | null`
- `timestamp: string`
- `admin_name: string`

### `client/src/types/api.types.ts` (shared types)

Type `UserRole`
- `'admin' | 'user' | 'moderator'`

Type `UserStatus`
- `'active' | 'inactive' | 'suspended'`

Type `AuditAction`
- `'CREATE' | 'UPDATE' | 'DELETE'`

Interface `PaginationInfo`
- `page: number`
- `limit: number`
- `total: number`
- `pages: number`

Interface `PaginatedData<T>`
- `data: T[]`
- `pagination: PaginationInfo`

Interface `PaginationParams`
- `page?: number`
- `limit?: number`

Interface `SortParams`
- `sortBy?: string`
- `sortOrder?: 'asc' | 'desc'`

Type `ChangedFields`
- `Record<string, { old: unknown; new: unknown }> | null`

Interface `ApiErrorResponse`
- `message: string`
---

## 8. Database Schema Reference

Xem chi tiết tại [01-backend.md → Section 1](./01-backend.md).
