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
1. Khởi tạo `defaultFilters = { page: 1, limit: 10, sortBy: 'created_at', sortOrder: 'desc' }`
2. Gọi `usersStore.fetchUsers(defaultFilters)`

**handleFilterChange(filters: UserFilters):**
1. Merge filters mới, reset `page = 1`
2. Gọi `usersStore.fetchUsers(mergedFilters)`
> Debounce đã xử lý trong `UserFilters` component (300ms cho search)

**handlePageChange(page: number):**
1. Gọi `usersStore.fetchUsers({ ...activeFilters, page })`

**handleSortChange({ sortBy, sortOrder }):**
1. Gọi `usersStore.fetchUsers({ ...activeFilters, sortBy, sortOrder, page: 1 })`

**handleEdit(id: number):**
1. `router.push({ name: 'UserEdit', params: { id } })`

**handleDelete(id: number):**
1. Hiển thị `ConfirmDialog` (xem Section 3)
2. Nếu confirm → `usersStore.deleteUser(id)` → toast success → reload table

---

### 1.2 UserCreatePage

**handleSubmit(formData: CreateUserDto):**
1. Gọi `usersStore.createUser(formData)`
2. Thành công → toast success → `router.push({ name: 'UserList' })`
3. Lỗi 409 (`EMAIL_EXISTS`) → set `emailError = t('users.emailAlreadyExists')` → truyền vào `UserForm`

**handleCancel():**
1. `router.push({ name: 'UserList' })`

---

### 1.3 UserEditPage

**onMounted:**
1. Lấy `id` từ `route.params.id` (parse to number)
2. Gọi song song: `usersStore.fetchUser(id)` + `usersStore.fetchUserActivity(id)`
3. Populate form khi `currentUser` available

**onUnmounted:**
1. `usersStore.clearCurrentUser()`

**handleSubmit(formData: UpdateUserDto):**
1. Gọi `usersStore.updateUser(id, formData)`
2. Thành công → toast success → `usersStore.fetchUserActivity(id)` để refresh audit log
3. Lỗi 409 → set `emailError` → truyền vào `UserForm`

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
| Loading (form) | `usersStore.loadingUser = true` | Skeleton overlay trên form fields |
| Email checking | `useEmailValidation.isChecking = true` | Spinner icon bên cạnh email input |
| Email error | `emailError !== null` | Inline error dưới email field; Save button disabled |
| Validation error | Submit với fields invalid | Inline error dưới từng field |
| Submitting | Sau khi click Save | Save button loading state; không cho double-submit |
| Success (create) | Sau createUser | Toast success; redirect về UserList |
| Success (edit) | Sau updateUser | Toast success; audit log refresh |

### AuditLogViewer

| State | Trigger | Behavior |
|-------|---------|----------|
| Loading | `usersStore.loadingActivity = true` | Skeleton list |
| Empty | `auditLogs.length === 0` | Message "No history yet" |
| Populated | Dữ liệu có | List tối đa 10 entries |

---

## 3. Confirm Dialogs

### Delete User Dialog

| Thuộc tính | Giá trị |
|-----------|---------|
| Trigger | Click Delete button trong UserTable |
| Title | `users.deleteConfirmTitle` → "Delete User" |
| Message | `users.deleteConfirmMessage` → "Are you sure you want to delete this user? This action cannot be undone." |
| Confirm button | `common.delete` (danger style) |
| Cancel button | `common.cancel` |
| On confirm | `usersStore.deleteUser(id)` → toast success → reload table |
| On cancel | Đóng dialog, không action |

---

## 4. Navigation Flows

| Action | From | To | Condition |
|--------|------|----|-----------|
| Click "Create User" button | UserListPage | UserCreatePage | Always |
| Click Edit button / row | UserListPage | UserEditPage | Always |
| Submit create form (success) | UserCreatePage | UserListPage | After successful create |
| Click Cancel (create) | UserCreatePage | UserListPage | Always |
| Submit edit form (success) | UserEditPage | UserEditPage (stay) | After successful update |
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
