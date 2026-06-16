---
title: User Management - Behavior
version: 1.2
author: Admin Team
date: 2026-05-17
---

# User Management — Behavior

> Related: [00-index.md](./00-index.md) | [01-backend.md](./01-backend.md) | [02-frontend.md](./02-frontend.md) | [04-quality.md](./04-quality.md)

---

## 1. Page Events & Handlers

### 1.1 UserListPage

**onMounted:**
1. Khởi tạo `defaultFilters = {}` (rỗng; server trả về default `limit=20`, `sortBy=created_at`, `sortOrder=desc`)
2. Gọi `usersStore.fetchUsers(defaultFilters)`

**handleFilterChange(filters: UserFilters):**
1. Merge filters mới, reset `page = 1`
2. Gọi `usersStore.fetchUsers(mergedFilters)`
> Debounce đã xử lý trong `UserFilters` component (300ms cho search)

**handlePageChange(page: number):**
1. Gọi `usersStore.fetchUsers({ ...activeFilters, page })`

**handleSortChange(field: string, order: 1 | -1):**
1. Cập nhật local `sortField` / `sortOrder` state
2. Gọi `usersStore.fetchUsers({ ...activeFilters, sortBy: field, sortOrder: order === 1 ? 'asc' : 'desc', page: 1 })`

**handleEdit(id: number):**
1. `router.push({ name: 'UserEdit', params: { id } })`

**handleDelete(id: number):**
1. Hiển thị `ConfirmDialog` (xem Section 3)
2. Nếu confirm → `usersStore.deleteUser(id)` → toast success → reload table (đã được store xử lý)

> **Sort whitelist:** Sortable columns ở client là `id`, `name`, `email`, `role`, `status`, `created_at`, `updated_at`, `last_login_at`, `points`. Server chỉ chấp nhận `id, name, email, role, status, created_at, updated_at` (whitelist); `last_login_at` và `points` sẽ bị fallback về default `created_at DESC` nếu gửi lên.

---

### 1.2 UserCreatePage

**handleSubmit(formData: CreateUserDto):**
1. Gọi `usersStore.createUser(formData)`
2. Thành công → toast success → `router.push({ name: 'UserList' })`
3. Lỗi 409 (`EMAIL_EXISTS`) → toast `users.emailInUse`
4. Lỗi khác → toast `users.createdError`

> **Note:** Email duplicate check được xử lý hoàn toàn ở client bởi `useEmailValidation` composable trong `UserForm`. Form không truyền `emailError` prop cho parent.

**handleCancel():**
1. `router.push({ name: 'UserList' })`

---

### 1.3 UserEditPage

**onMounted:**
1. Lấy `id` từ `route.params.id` (parse to number)
2. Gọi tuần tự: `usersStore.fetchUser(id)` rồi `usersStore.fetchUserActivity(id)`
3. Populate form khi `currentUser` available (UserForm watch `initialData`)

**onUnmounted:**
1. `usersStore.clearCurrentUser()`

**handleSubmit(formData: UpdateUserDto):**
1. Gọi `usersStore.updateUser(id, formData)`
2. Thành công → toast success → `router.push({ name: 'UserList' })`
3. Lỗi 409 → toast `users.emailInUse`
4. Lỗi khác → toast `users.updatedError`

**handleCancel():**
1. `router.push({ name: 'UserList' })`

---

## 2. UI States

### UserListPage

| State | Trigger | Behavior |
|-------|---------|----------|
| Loading | `usersStore.loading = true` | UserTable hiển thị 5 dòng skeleton |
| Empty | `users.length === 0` && không loading | DataTable hiển thị "No users found" |
| Error | `usersStore.error !== null` | Toast error hiển thị message |
| Success | Sau khi deleteUser | Toast "User deleted successfully" |

### UserCreatePage / UserEditPage

| State | Trigger | Behavior |
|-------|---------|----------|
| Loading (form) | `props.loading = true` | Form inputs disabled; submit button loading state |
| Email checking | `useEmailValidation.isChecking = true` | Spinner icon bên cạnh email input |
| Email error | `useEmailValidation.emailError = 'emailAlreadyExists'` | Inline error dưới email field; Save button disabled |
| Validation error | Submit với fields invalid | Inline error dưới từng field |
| Submitting | Sau khi click Save | Save button loading state; không cho double-submit |
| Success (create) | Sau createUser | Toast success; redirect về UserList |
| Success (edit) | Sau updateUser | Toast success; redirect về UserList (audit log KHÔNG refresh tự động — chỉ refresh khi user mở lại edit page) |
| Error (create/edit) | Server trả 409 | Toast `users.emailInUse` |
| Error (khác) | Server trả lỗi khác | Toast `users.createdError` / `users.updatedError` |

### AuditLogViewer

| State | Trigger | Behavior |
|-------|---------|----------|
| Loading | `props.loading = true` | 3 dòng Skeleton (PrimeVue Skeleton) |
| Empty | `logs.length === 0` | Message "No activity yet" (`users.noActivity`) |
| Populated | Dữ liệu có | List các entries với icon CREATE/UPDATE/DELETE + format message |

**Format mỗi entry:**
- CREATE: `"{admin_name} created this user on {DD/MM/YYYY HH:mm}"`
- DELETE: `"{admin_name} deleted this user on {DD/MM/YYYY HH:mm}"`
- UPDATE với changed_fields: `"{admin_name} changed {field} from '{old}' to '{new}'[, ...] on {DD/MM/YYYY HH:mm}"`
- UPDATE không có changed_fields: `"{admin_name} updated this user on {DD/MM/YYYY HH:mm}"`

---

## 3. Confirm Dialogs

### Delete User Dialog

| Thuộc tính | Giá trị |
|-----------|---------|
| Trigger | Click Delete button trong UserTable |
| Header | `users.deleteHeader` |
| Message | `users.deleteConfirm` |
| Confirm button | `common.yes` (severity=danger) |
| Cancel button | `common.no` |
| On confirm | `usersStore.deleteUser(id)` (store sẽ tự reload danh sách) → toast success `users.deletedSuccess` |
| On cancel | Đóng dialog, không action |
| On error | Toast `users.deletedError` |

---

## 4. Navigation Flows

| Action | From | To | Condition |
|--------|------|----|-----------|
| Click "Create User" button | UserListPage | UserCreatePage | Always |
| Click Edit button / row | UserListPage | UserEditPage | Always |
| Submit create form (success) | UserCreatePage | UserListPage | After successful create |
| Click Cancel (create) | UserCreatePage | UserListPage | Always |
| Submit edit form (success) | UserEditPage | UserListPage | After successful update |
| Click Cancel (edit) | UserEditPage | UserListPage | Always |
| Access `/users` (non-admin) | Any | Redirect (403) | Router guard `meta.roles: ['admin']` |

---

## 5. Sequence Diagrams

### 5.1 Create User Flow

```
Admin          Frontend        Backend          Database
  │                │               │                │
  │── Fill form ───►               │                │
  │                │── validate ──►│                │
  │                │  (client)     │                │
  │── Click Save ──►               │                │
  │                │── POST /api/users              │
  │                │               │── auth check   │
  │                │               │── validate body│
  │                │               │── check email ─►
  │                │               │◄── not exists ─│
  │                │               │── INSERT users ─►
  │                │               │── INSERT audit ─►
  │                │               │◄── 201 ─────── │
  │                │◄── 201 ───────│                │
  │◄── toast OK ───│               │                │
  │◄── redirect ───│               │                │
```

### 5.2 Edit User Flow (với email check)

```
Admin          Frontend        Backend          Database
  │                │               │                │
  │── Change email─►               │                │
  │                │── debounce ───►               │
  │                │  500ms        │                │
  │                │── GET check-email              │
  │                │               │── SELECT ──────►
  │                │               │◄── exists=false│
  │                │◄── {exists:false}              │
  │── Click Save ──►               │                │
  │                │── PUT /api/users/:id           │
  │                │               │── auth check   │
  │                │               │── validate     │
  │                │               │── diff fields  │
  │                │               │── UPDATE ──────►
  │                │               │── INSERT audit ►
  │                │               │◄── 200 ────────│
  │                │◄── 200 ───────│                │
  │◄── toast OK ───│               │                │
  │                │── reload audit│                │
```

### 5.3 Delete User Flow

```
Admin          Frontend        Backend          Database
  │                │               │                │
  │── Click Del ───►               │                │
  │                │── show confirm dialog          │
  │── Confirm ─────►               │                │
  │                │── DELETE /api/users/:id        │
  │                │               │── auth check   │
  │                │               │── check not self
  │                │               │── INSERT audit ─►
  │                │               │── DELETE ───────►
  │                │               │◄── 200 ─────── │
  │                │◄── 200 ───────│                │
  │◄── toast OK ───│               │                │
  │                │── reload list │                │
```
