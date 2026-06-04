---
title: User Management - Quality
version: 1.2
author: Admin Team
date: 2026-05-17
status: Approved
---

# User Management — Quality

> Related: [00-index.md](./00-index.md) | [01-backend.md](./01-backend.md) | [02-frontend.md](./02-frontend.md) | [03-behavior.md](./03-behavior.md)

---

## 1. Test Coverage

### 1.1 Backend Tests

#### Unit Tests (service layer — `src/modules/users/users.service.test.ts`)

| # | Test Name | Setup | Action | Assert |
|---|-----------|-------|--------|--------|
| U-BE-01 | generatePassword: tạo đúng format | email = `jane@example.com` | gọi `generatePassword(email)` | trả về `jane123` |
| U-BE-02 | generatePassword: email có subdomain | email = `john.doe@company.co` | gọi `generatePassword(email)` | trả về `john.doe123` |
| U-BE-03 | buildChangedFields: detect thay đổi | old = `{name:'A', role:'user'}`, new = `{name:'B', role:'user'}` | gọi `buildChangedFields(old, new)` | trả về `{name:{old:'A',new:'B'}}` |
| U-BE-04 | buildChangedFields: không thay đổi | old = new | gọi `buildChangedFields(old, old)` | trả về `{}` |
| U-BE-05 | createUser: duplicate email → throw | mock DB trả về user cùng email | gọi `createUser(data)` | throw `EMAIL_EXISTS` |
| U-BE-06 | deleteUser: self-delete → throw | `adminId = 1`, `targetId = 1` | gọi `deleteUser(1, 1)` | throw `CANNOT_DELETE_SELF` |
| U-BE-07 | getUsers: filter theo role | mock DB | gọi `getUsers({ role:'admin' })` | query có điều kiện `role='admin'` |
| U-BE-08 | getUsers: sortBy whitelist | sortBy = `email` | gọi `getUsers({ sortBy:'email' })` | query có `ORDER BY email` |
| U-BE-09 | getUsers: invalid sortBy → bỏ qua | sortBy = `'; DROP TABLE users; --` | gọi `getUsers({...})` | fallback về default sort `created_at` |

#### Integration Tests (HTTP endpoints — `src/modules/users/users.routes.test.ts`)

| # | Endpoint | Method | Scenario | Expected Status |
|---|----------|--------|----------|----------------|
| I-BE-01 | `/api/users` | GET | Admin authenticated, no filters | 200 + `data[]` + `pagination` |
| I-BE-02 | `/api/users` | GET | Non-admin user | 403 |
| I-BE-03 | `/api/users` | GET | No auth | 401 |
| I-BE-04 | `/api/users` | GET | With `search=john&role=admin` | 200 + filtered results |
| I-BE-05 | `/api/users` | GET | `page=2&limit=25` | 200 + correct offset |
| I-BE-06 | `/api/users` | POST | Valid body, unique email | 201 + UserDto |
| I-BE-07 | `/api/users` | POST | Duplicate email | 409 |
| I-BE-08 | `/api/users` | POST | Invalid body (short name) | 400 |
| I-BE-09 | `/api/users` | POST | Birthday in the future | 400 |
| I-BE-10 | `/api/users/:id` | GET | Existing user | 200 + UserDto |
| I-BE-11 | `/api/users/:id` | GET | Non-existent user | 404 |
| I-BE-12 | `/api/users/:id` | PUT | Valid update | 200 + updated UserDto |
| I-BE-13 | `/api/users/:id` | PUT | Email conflicts with another user | 409 |
| I-BE-14 | `/api/users/:id` | PUT | Email same as self → OK | 200 |
| I-BE-15 | `/api/users/:id` | PUT | Attempt to set `points` | 200 + `points` unchanged |
| I-BE-16 | `/api/users/:id` | DELETE | Delete other user | 200 |
| I-BE-17 | `/api/users/:id` | DELETE | Delete self | 400 |
| I-BE-18 | `/api/users/:id` | DELETE | Non-existent user | 404 |
| I-BE-19 | `/api/users/:id/activity` | GET | Existing user | 200 + `data[]` |
| I-BE-20 | `/api/users/:id/activity` | GET | Non-existent user | 404 |
| I-BE-21 | `/api/users/check-email` | GET | Not exists | 200 + `{exists:false}` |
| I-BE-22 | `/api/users/check-email` | GET | Exists | 200 + `{exists:true}` |
| I-BE-23 | `/api/users/check-email` | GET | Exists + excludeId = same user | 200 + `{exists:false}` |
| I-BE-24 | `/api/users/check-email` | GET | Missing email param | 400 |

---

### 1.2 Frontend Tests

#### UserListPage (`UserListPage.test.ts`)

| # | Test Name | Setup | Action | Assert |
|---|-----------|-------|--------|--------|
| F-LIST-01 | Hiển thị skeleton khi loading | `usersStore.loading = true` | render | `UserTable` nhận `loading=true` |
| F-LIST-02 | Hiển thị dữ liệu khi loaded | `usersStore.users = [mockUser]` | render | UserTable render 1 row |
| F-LIST-03 | handleDelete gọi deleteUser | mock store | click Delete → click Confirm | `usersStore.deleteUser(id)` được gọi |
| F-LIST-04 | handleDelete cancel → không xóa | — | click Delete → click Cancel | `usersStore.deleteUser` không được gọi |
| F-LIST-05 | handleEdit điều hướng đến edit | — | UserTable emit `edit(1)` | `router.push({ name:'UserEdit', params:{id:1} })` |
| F-LIST-06 | handleFilterChange reset page | — | UserFilters emit `filterChange` | `fetchUsers` gọi với `page=1` |
| F-LIST-07 | fetchUsers gọi onMounted | mock store | render | `fetchUsers` được gọi 1 lần |

#### UserCreatePage (`UserCreatePage.test.ts`)

| # | Test Name | Setup | Action | Assert |
|---|-----------|-------|--------|--------|
| F-CREATE-01 | handleSubmit gọi createUser | mock store | UserForm emit `submit(data)` | `usersStore.createUser(data)` được gọi |
| F-CREATE-02 | Redirect sau create thành công | mock createUser resolve | submit | `router.push({ name:'UserList' })` |
| F-CREATE-03 | Hiển thị email error khi 409 | mock createUser throw `EMAIL_EXISTS` | submit | `emailError` set, truyền vào UserForm |
| F-CREATE-04 | handleCancel redirect về list | — | UserForm emit `cancel` | `router.push({ name:'UserList' })` |

#### UserEditPage (`UserEditPage.test.ts`)

| # | Test Name | Setup | Action | Assert |
|---|-----------|-------|--------|--------|
| F-EDIT-01 | fetchUser + fetchUserActivity onMounted | mock store | render | cả 2 được gọi với `id` |
| F-EDIT-02 | clearCurrentUser onUnmounted | — | unmount component | `usersStore.clearCurrentUser()` được gọi |
| F-EDIT-03 | handleSubmit gọi updateUser | — | UserForm emit `submit(data)` | `usersStore.updateUser(id, data)` |
| F-EDIT-04 | Refresh activity sau update | mock updateUser resolve | submit | `fetchUserActivity` được gọi lại |
| F-EDIT-05 | 409 → set emailError | mock updateUser throw `EMAIL_EXISTS` | submit | emailError propagated to UserForm |

#### UserTable.vue (`UserTable.test.ts`)

| # | Test Name | Setup | Action | Assert |
|---|-----------|-------|--------|--------|
| F-TABLE-01 | Render đúng số dòng | `users = [u1, u2, u3]` | render | 3 data rows |
| F-TABLE-02 | Emit `edit` khi click Edit | — | click Edit button (row 1) | emit `edit` với id=1 |
| F-TABLE-03 | Emit `delete` khi click Delete | — | click Delete button | emit `delete` |
| F-TABLE-04 | Hiển thị skeleton khi loading=true | `loading=true` | render | Skeleton components hiển thị |
| F-TABLE-05 | Hiển thị "No users found" khi empty | `users=[]`, `loading=false` | render | empty state message |
| F-TABLE-06 | Emit `pageChange` khi đổi trang | — | paginator interaction | emit `pageChange` |
| F-TABLE-07 | Hiển thị badge màu cho status | user status = `suspended` | render | cell có class `danger` |

#### UserFilters.vue (`UserFilters.test.ts`)

| # | Test Name | Setup | Action | Assert |
|---|-----------|-------|--------|--------|
| F-FILTER-01 | Emit filterChange khi type search | — | type vào search input | emit `filterChange` với search |
| F-FILTER-02 | Search debounced (300ms) | fake timers | type nhanh | emit chỉ 1 lần sau 300ms |
| F-FILTER-03 | Emit filterChange khi chọn role | — | chọn `admin` từ dropdown | emit với `role='admin'` |
| F-FILTER-04 | Clear Filters reset tất cả | filters đang có giá trị | click Clear Filters | emit filterChange với empty filters |

#### UserForm.vue (`UserForm.test.ts`)

| # | Test Name | Setup | Action | Assert |
|---|-----------|-------|--------|--------|
| F-FORM-01 | Validation: name required | name = '' | click Save | inline error hiển thị |
| F-FORM-02 | Validation: name min 2 | name = 'A' | click Save | inline error `min 2 chars` |
| F-FORM-03 | Validation: email required | email = '' | click Save | inline error hiển thị |
| F-FORM-04 | Validation: email format | email = 'bad' | click Save | inline error `invalid email` |
| F-FORM-05 | Save disabled khi emailError prop | `emailError = 'Email exists'` | render | Save button disabled |
| F-FORM-06 | Emit submit với data hợp lệ | form filled valid | click Save | emit `submit` với data |
| F-FORM-07 | Emit cancel | — | click Cancel | emit `cancel` |
| F-FORM-08 | Pre-populate ở edit mode | `initialData = mockUser, mode='edit'` | render | inputs hiển thị giá trị cũ |
| F-FORM-09 | points hiển thị readonly ở edit mode | `mode='edit'` | render | points field không editable |
| F-FORM-10 | Birthday không cho chọn ngày tương lai | — | mở date picker | dates sau hôm nay disabled |
| F-FORM-11 | Note character counter | note = 'hello' | render | hiển thị '5/500' |

#### AuditLogViewer.vue (`AuditLogViewer.test.ts`)

| # | Test Name | Setup | Action | Assert |
|---|-----------|-------|--------|--------|
| F-AUDIT-01 | Hiển thị skeleton khi loading=true | `loading=true` | render | Skeleton components |
| F-AUDIT-02 | Hiển thị "No history yet" khi empty | `logs=[], loading=false` | render | empty message |
| F-AUDIT-03 | Hiển thị đúng format log entry | `logs=[{action:'UPDATE',...}]` | render | format có admin name, field, old/new, date |
| F-AUDIT-04 | Tối đa 10 entries | `logs = 15 items` | render | chỉ 10 items render (hoặc trả về từ API) |

#### useUsers.ts (`useUsers.test.ts`)

| # | Test Name | Setup | Action | Assert |
|---|-----------|-------|--------|--------|
| F-COMP-01 | getUsers gọi đúng endpoint | mock apiClient | gọi `getUsers({page:1})` | `GET /api/users` với params |
| F-COMP-02 | createUser gọi POST | mock apiClient | gọi `createUser(data)` | `POST /api/users` với body |
| F-COMP-03 | updateUser gọi PUT với id | mock apiClient | gọi `updateUser(5, data)` | `PUT /api/users/5` |
| F-COMP-04 | deleteUser gọi DELETE | mock apiClient | gọi `deleteUser(3)` | `DELETE /api/users/3` |
| F-COMP-05 | getUserActivity gọi activity endpoint | mock apiClient | gọi `getUserActivity(2)` | `GET /api/users/2/activity` |

#### users.store.ts (`users.store.test.ts`)

| # | Test Name | Setup | Action | Assert |
|---|-----------|-------|--------|--------|
| F-STORE-01 | fetchUsers: cập nhật users + pagination | mock useUsers.getUsers | gọi `fetchUsers()` | `users` và `pagination` được set |
| F-STORE-02 | fetchUsers: loading flag | — | trong khi fetch | `loading=true`; sau khi xong `loading=false` |
| F-STORE-03 | createUser: gọi composable | mock useUsers.createUser | gọi `createUser(data)` | composable được gọi |
| F-STORE-04 | deleteUser: reload fetchUsers | mock deleteUser resolve | gọi `deleteUser(1)` | `fetchUsers` được gọi lại |
| F-STORE-05 | resetFilters: reset + fetchUsers | filters đang có giá trị | gọi `resetFilters()` | filters về default, fetchUsers gọi |
| F-STORE-06 | clearCurrentUser: clear state | `currentUser = mockUser` | gọi `clearCurrentUser()` | `currentUser=null, auditLogs=[]` |
| F-STORE-07 | fetchUsers: set error khi fail | mock apiClient throw | gọi `fetchUsers()` | `error` được set |

---

## 2. Performance Considerations

| Mục | Yêu cầu |
|-----|---------|
| Server-side pagination | Tất cả queries dùng LIMIT/OFFSET; không load toàn bộ records về client |
| Indexed columns | `idx_email`, `idx_role`, `idx_status` trên bảng `users`; `idx_audit_target` trên `audit_logs` |
| sortBy whitelist | Prevent SQL injection; chỉ các indexed/frequently-sorted fields được phép |
| Email check debounce | 500ms debounce trên client để tránh quá nhiều requests |
| Search debounce | 300ms trên UserFilters component |
| Lazy load pages | Dynamic import `UserListPage`, `UserCreatePage`, `UserEditPage` qua route-level code splitting |

---

## 3. Security Considerations

| Mục | Biện pháp |
|-----|-----------|
| Authentication | JWT Bearer token xác thực mọi endpoint (trừ `check-email`) |
| Authorization | Admin-only: tất cả endpoint user management kiểm tra `role === 'admin'` |
| SQL Injection | Dùng parameterized queries (prepared statements) cho mọi dynamic values |
| sortBy injection | Whitelist validation cho `sortBy` param trước khi dùng trong query |
| Password | Bcrypt hash (không lưu plaintext); không bao giờ expose trong response |
| Audit trail | Mọi CREATE/UPDATE/DELETE ghi vào `audit_logs` kèm `changed_fields` |
| Self-deletion | Backend check `req.user.id !== targetId` → 400 nếu vi phạm |
| XSS | PrimeVue renders escaped HTML; không dùng `v-html` với dữ liệu user input |

---

