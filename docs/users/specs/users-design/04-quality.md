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

#### Unit Tests (service layer — `src/modules/admin/users/users.service.test.ts` hoặc trong `users.controller.test.ts`)

| # | Test Name | Setup | Action | Assert |
|---|-----------|-------|--------|--------|
| U-BE-01 | generatePassword: tạo đúng format | email = `jane@example.com` | gọi `generatePassword(email)` | trả về `jane123` |
| U-BE-02 | generatePassword: email có subdomain | email = `john.doe@company.co` | gọi `generatePassword(email)` | trả về `john.doe123` |
| U-BE-03 | buildChangedFields: detect thay đổi | old = `{name:'A', role:'user'}`, new = `{name:'B', role:'user'}` | gọi `buildChangedFields(old, new)` | trả về `{name:{old:'A',new:'B'}}` |
| U-BE-04 | buildChangedFields: không thay đổi | old = new | gọi `buildChangedFields(old, old)` | trả về `null` |
| U-BE-05 | createUser: duplicate email → throw | mock DB trả về user cùng email | gọi `createUser(data)` | throw `ServiceError('Email already exists', 409)` |
| U-BE-06 | deleteUser: self-delete → throw | `adminId = 1`, `targetId = 1` | gọi `deleteUser(1, 1)` | throw `ServiceError('Cannot delete your own account', 400)` |
| U-BE-07 | getUsers: filter theo role | mock repository | gọi `getUsers({ role:'admin' })` | repository nhận where clause với `role='admin'` |
| U-BE-08 | getUsers: sortBy whitelist | sortBy = `email` | gọi `getUsers({ sortBy:'email' })` | repository resolve orderBy `{ email: 'asc'/'desc' }` |
| U-BE-09 | getUsers: invalid sortBy → bỏ qua | sortBy = `'; DROP TABLE users; --` | gọi `getUsers({...})` | fallback về default sort `createdAt DESC` |
| U-BE-10 | getUsers: sortBy không trong whitelist → bỏ qua | sortBy = `last_login_at` | gọi `getUsers({ sortBy:'last_login_at' })` | fallback về default sort `createdAt DESC` (không throw) |

#### Integration Tests (HTTP endpoints — `src/modules/admin/users/users.controller.test.ts`)

| # | Endpoint | Method | Scenario | Expected Status |
|---|----------|--------|----------|----------------|
| I-BE-01 | `/api/admin/users` | GET | Admin authenticated, no filters | 200 + `data[]` + `pagination` |
| I-BE-02 | `/api/admin/users` | GET | Non-admin user | 403 |
| I-BE-03 | `/api/admin/users` | GET | No auth | 401 |
| I-BE-04 | `/api/admin/users` | GET | With `search=john&role=admin` | 200 + filtered results |
| I-BE-05 | `/api/admin/users` | GET | `page=2&limit=25` | 200 + correct offset |
| I-BE-06 | `/api/admin/users` | POST | Valid body, unique email | 201 + UserDto |
| I-BE-07 | `/api/admin/users` | POST | Duplicate email | 409 |
| I-BE-08 | `/api/admin/users` | POST | Invalid body (short name) | 400 |
| I-BE-09 | `/api/admin/users` | POST | Birthday in the future | 400 |
| I-BE-10 | `/api/admin/users/:id` | GET | Existing user | 200 + UserDto |
| I-BE-11 | `/api/admin/users/:id` | GET | Non-existent user | 404 |
| I-BE-12 | `/api/admin/users/:id` | PUT | Valid update | 200 + updated UserDto |
| I-BE-13 | `/api/admin/users/:id` | PUT | Email conflicts with another user | 409 |
| I-BE-14 | `/api/admin/users/:id` | PUT | Email same as self → OK | 200 |
| I-BE-15 | `/api/admin/users/:id` | PUT | Attempt to set `points` | 200 + `points` unchanged |
| I-BE-16 | `/api/admin/users/:id` | DELETE | Delete other user | 200 |
| I-BE-17 | `/api/admin/users/:id` | DELETE | Delete self | 400 |
| I-BE-18 | `/api/admin/users/:id` | DELETE | Non-existent user | 404 |
| I-BE-19 | `/api/admin/users/:id/activity` | GET | Existing user | 200 + `data[]` |
| I-BE-20 | `/api/admin/users/:id/activity` | GET | Non-existent user | 404 |
| I-BE-21 | `/api/admin/users/check-email` | GET | Not exists | 200 + `{exists:false}` |
| I-BE-22 | `/api/admin/users/check-email` | GET | Exists | 200 + `{exists:true}` |
| I-BE-23 | `/api/admin/users/check-email` | GET | Exists + excludeId = same user | 200 + `{exists:false}` |
| I-BE-24 | `/api/admin/users/check-email` | GET | Missing email param | 400 |

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
| F-LIST-06 | handleFilterChange reset page | — | UserFilters emit `filter-change` | `fetchUsers` gọi với `page=1` |
| F-LIST-07 | fetchUsers gọi onMounted | mock store | render | `fetchUsers` được gọi 1 lần |

#### UserCreatePage (`UserCreatePage.test.ts`)

| # | Test Name | Setup | Action | Assert |
|---|-----------|-------|--------|--------|
| F-CREATE-01 | handleSubmit gọi createUser | mock store | UserForm emit `submit(data)` | `usersStore.createUser(data)` được gọi |
| F-CREATE-02 | Redirect sau create thành công | mock createUser resolve | submit | `router.push({ name:'UserList' })` |
| F-CREATE-03 | Hiển thị toast email error khi 409 | mock createUser throw error với `response.status === 409` | submit | toast với `users.emailInUse` được add |
| F-CREATE-04 | handleCancel redirect về list | — | UserForm emit `cancel` | `router.push({ name:'UserList' })` |

#### UserEditPage (`UserEditPage.test.ts`)

| # | Test Name | Setup | Action | Assert |
|---|-----------|-------|--------|--------|
| F-EDIT-01 | fetchUser + fetchUserActivity onMounted | mock store | render | cả 2 được gọi với `id` |
| F-EDIT-02 | clearCurrentUser onUnmounted | — | unmount component | `usersStore.clearCurrentUser()` được gọi |
| F-EDIT-03 | handleSubmit gọi updateUser | — | UserForm emit `submit(data)` | `usersStore.updateUser(id, data)` |
| F-EDIT-04 | Redirect về list sau update thành công | mock updateUser resolve | submit | `router.push({ name:'UserList' })` |
| F-EDIT-05 | 409 → toast emailInUse | mock updateUser throw error với `response.status === 409` | submit | toast với `users.emailInUse` |

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
| F-FILTER-01 | Emit filter-change khi type search | — | type vào search input | emit `filter-change` với search |
| F-FILTER-02 | Search debounced (300ms) | fake timers | type nhanh | emit chỉ 1 lần sau 300ms |
| F-FILTER-03 | Emit filter-change khi chọn role | — | chọn `admin` từ dropdown | emit với `role='admin'` |
| F-FILTER-04 | Clear Filters reset tất cả | filters đang có giá trị | click Clear Filters | emit filter-change với empty filters |

#### UserForm.vue (`UserForm.test.ts`)

| # | Test Name | Setup | Action | Assert |
|---|-----------|-------|--------|--------|
| F-FORM-01 | Validation: name required | name = '' | click Save | inline error hiển thị |
| F-FORM-02 | Validation: name min 2 | name = 'A' | click Save | inline error `min 2 chars` |
| F-FORM-03 | Validation: email required | email = '' | click Save | inline error hiển thị |
| F-FORM-04 | Validation: email format | email = 'bad' | click Save | inline error `invalid email` |
| F-FORM-05 | Save disabled khi emailServerError | `useEmailValidation` mock trả về `emailError='emailAlreadyExists'` | render | Save button disabled |
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
| F-AUDIT-04 | Render tất cả entries trả về từ API | `logs = 25 items` | render | 25 items render (max do backend `limit=20` mặc định; client không tự cắt) |

#### useUsers.ts (`useUsers.test.ts`)

| # | Test Name | Setup | Action | Assert |
|---|-----------|-------|--------|--------|
| F-COMP-01 | getUsers gọi đúng endpoint | mock usersApiService | gọi `getUsers({page:1})` | `usersApiService.getUsers({page:1})` được gọi và trả về PaginatedData |
| F-COMP-02 | createUser gọi POST | mock usersApiService | gọi `createUser(data)` | `usersApiService.create(data)` được gọi |
| F-COMP-03 | updateUser gọi PUT với id | mock usersApiService | gọi `updateUser(5, data)` | `usersApiService.update(5, data)` được gọi |
| F-COMP-04 | deleteUser gọi DELETE | mock usersApiService | gọi `deleteUser(3)` | `usersApiService.delete(3)` được gọi |
| F-COMP-05 | getUserActivity gọi activity endpoint | mock usersApiService | gọi `getUserActivity(2)` | `usersApiService.getUserActivity(2)` được gọi |

#### useEmailValidation.ts (`useEmailValidation.test.ts`)

| # | Test Name | Setup | Action | Assert |
|---|-----------|-------|--------|--------|
| F-EV-01 | Initial state: empty error, not checking | `email=ref('')` | render | `isChecking=false`, `emailError=''` |
| F-EV-02 | Không gọi API khi email rỗng | `email=ref('')` | advance timers 200ms | `usersApiService.checkEmail` không được gọi |
| F-EV-03 | Không gọi API khi email format không hợp lệ | `email=ref('not-an-email')` | advance timers 200ms | `usersApiService.checkEmail` không được gọi |
| F-EV-04 | Set `emailAlreadyExists` error khi email đã dùng | mock `checkEmail` resolve `{exists:true}` | set `email='used@test.com'` | `emailError='emailAlreadyExists'` |
| F-EV-05 | Clear error khi email available | mock `checkEmail` resolve `{exists:false}` | set `email='free@test.com'` | `emailError=''` |
| F-EV-06 | Truyền `excludeId` cho API khi edit | `excludeId=ref(3)` | set `email='test@test.com'` | `checkEmail` được gọi với `('test@test.com', 3)` |
| F-EV-07 | Reset `emailError` ngay khi email thay đổi | error đang có | set `email='new@test.com'` | `emailError=''` ngay lập tức (không đợi debounce) |

#### users.store.ts (`users.store.test.ts`)

| # | Test Name | Setup | Action | Assert |
|---|-----------|-------|--------|--------|
| F-STORE-01 | fetchUsers: cập nhật users + pagination | mock useUsers.getUsers | gọi `fetchUsers()` | `users` và `pagination` được set |
| F-STORE-02 | fetchUsers: loading flag | — | trong khi fetch | `loading=true`; sau khi xong `loading=false` |
| F-STORE-03 | createUser: gọi composable, KHÔNG reload list | mock useUsers.createUser | gọi `createUser(data)` | composable được gọi; `fetchUsers` KHÔNG được gọi lại |
| F-STORE-04 | deleteUser: tự động reload fetchUsers | mock deleteUser resolve | gọi `deleteUser(1)` | `fetchUsers` được gọi lại tự động |
| F-STORE-05 | resetFilters: reset + fetchUsers | filters đang có giá trị | gọi `resetFilters()` | filters về `{}`, `fetchUsers` được gọi |
| F-STORE-06 | clearCurrentUser: clear state | `currentUser = mockUser` | gọi `clearCurrentUser()` | `currentUser=null, auditLogs=[]` |
| F-STORE-07 | fetchUsers: set error khi fail | mock apiClient throw | gọi `fetchUsers()` | `error` được set |
| F-STORE-08 | createUser KHÔNG throw `{code:'EMAIL_EXISTS'}` | mock createUser throw error 409 | gọi `createUser(data)` | lỗi propagate ra ngoài (KHÔNG được wrap thành `{code:'EMAIL_EXISTS'}`) |

---

## 2. Performance Considerations

| Mục | Yêu cầu |
|-----|---------|
| Server-side pagination | Tất cả queries dùng Prisma `skip`/`take`; không load toàn bộ records về client |
| Indexed columns | `@@index([role])`, `@@index([status])` trên model `User`; `@@index([targetUserId])` trên `AuditLog` |
| sortBy whitelist | Prevent arbitrary field injection; chỉ các indexed/frequently-sorted fields được phép |
| Email check debounce | 500ms debounce trên client để tránh quá nhiều requests |
| Search debounce | 300ms trên UserFilters component |
| Lazy load pages | Dynamic import `UserListPage`, `UserCreatePage`, `UserEditPage` qua route-level code splitting |
| Promise.all | Repository chạy `findMany` + `count` song song |

---

## 3. Security Considerations

| Mục | Biện pháp |
|-----|-----------|
| Authentication | JWT Bearer token + admin role xác thực mọi endpoint (bao gồm `check-email`) |
| Authorization | Admin-only: `requireRole('admin')` guard trên router, kiểm tra `role === 'admin'` |
| SQL Injection | Prisma parameterized queries — không raw SQL; sortBy whitelist |
| sortBy injection | Whitelist validation cho `sortBy` param trước khi dùng trong query |
| Password | Bcrypt hash (không lưu plaintext); không bao giờ expose trong response |
| Audit trail | Mọi CREATE/UPDATE/DELETE ghi vào `audit_logs` kèm `changed_fields` |
| Self-deletion | Backend check `req.user.id !== targetId` → 400 nếu vi phạm |
| XSS | PrimeVue renders escaped HTML; không dùng `v-html` với dữ liệu user input |

---

