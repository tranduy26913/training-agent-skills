# User Management Implementation Plan
> **For agentic workers:** REQUIRED SUB-SKILL: Use skill executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement full CRUD user management for admins — list, create, edit, delete with audit log tracking.

**Architecture:** Backend exposes 6 REST endpoints under `/api/users` protected by `authMiddleware` + `requireRole('admin')`. Frontend adds a Pinia store, composable, and 3 pages (List, Create, Edit) with shared components.

**Tech Stack:** Express + MySQL (mysql2/promise, Zod), Vue 3 Composition API + PrimeVue DataTable, Pinia, Axios.

---

## File Map

### Backend (server/src/)
| File | Action | Responsibility |
|------|--------|---------------|
| `modules/users/users.repository.ts` | Create | DB queries for users + audit_logs |
| `modules/users/users.service.ts` | Create | Business logic (password gen, diff, audit) |
| `modules/users/users.validation.ts` | Create | Zod schemas for create/update |
| `modules/users/users.controller.ts` | Create | Route handlers for SV-001…SV-006 |
| `modules/users/users.routes.ts` | Create | Express router wiring |
| `app.ts` | Modify | Mount `/api/users` router |
| `database/migrate.ts` | Modify | Run migration 004 on startup (if needed) |

### Database
| File | Action |
|------|--------|
| `database/migrations/004_create_audit_logs_table.sql` | Create |

### Frontend (client/src/)
| File | Action | Responsibility |
|------|--------|---------------|
| `pages/users/users.routes.ts` | Modify | Add create + edit routes |
| `pages/users/UserListPage.vue` | Modify | Wire store + child components |
| `pages/users/UserCreatePage.vue` | Create | Create form page |
| `pages/users/UserEditPage.vue` | Create | Edit form page with audit sidebar |
| `pages/users/components/UserTable.vue` | Create | PrimeVue DataTable |
| `pages/users/components/UserFilters.vue` | Create | Search + filter bar |
| `pages/users/components/UserForm.vue` | Create | Shared create/edit form |
| `pages/users/components/AuditLogViewer.vue` | Create | Sidebar audit log list |
| `pages/users/composables/useUsers.ts` | Create | API call functions |
| `stores/users.store.ts` | Create | Pinia store for user state |

---

## Task 1 — Database: audit_logs migration

**Effort (hours):** 0.5

**Files:**
- Create: `database/migrations/004_create_audit_logs_table.sql`

**Implementation:**
```sql
-- UP
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `admin_id` INT UNSIGNED NOT NULL,
  `target_user_id` INT UNSIGNED NOT NULL,
  `action` ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL,
  `changed_fields` JSON NULL,
  `timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`target_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_audit_target` (`target_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DOWN
DROP TABLE IF EXISTS `audit_logs`;
```

**Verification:**
- [ ] Run migration manually: `mysql -u root -p training < database/migrations/004_create_audit_logs_table.sql`
- [ ] `SHOW TABLES;` shows `audit_logs`

**Commit:**
```bash
git add database/migrations/004_create_audit_logs_table.sql
git commit -m "feat(db): add audit_logs migration"
```

---

## Task 2 — Backend: Repository

**Effort (hours):** 1.5

**Files:**
- Create: `server/src/modules/users/users.repository.ts`

**Implementation:**
```typescript
// Extends BaseRepository<User>
// findAllWithFilters(filters): SELECT with dynamic WHERE (search LIKE, role=, status=, date range), COUNT(*) for total, LIMIT/OFFSET
// findById(id): SELECT excluding password column
// create(data): INSERT, return insertId
// update(id, data): UPDATE SET ..., return affectedRows
// deleteById(id): DELETE WHERE id=?
// createAuditLog(entry: {admin_id, target_user_id, action, changed_fields}): INSERT into audit_logs
// getAuditLogs(targetUserId, limit): SELECT audit_logs JOIN users ON admin_id=users.id ORDER BY timestamp DESC LIMIT ?
```

Key note for `findAllWithFilters`: build query using an array of conditions and params to avoid SQL injection:
```typescript
// const conditions: string[] = []
// const params: unknown[] = []
// if (search) { conditions.push('(name LIKE ? OR email LIKE ?)'); params.push(`%${search}%`, `%${search}%`) }
// ... same pattern for role, status, startDate, endDate
// WHERE clause: conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
```

**Verification:**
- [ ] Unit test: `findAllWithFilters` with search, role, status, date params returns correct SQL conditions
- [ ] Unit test: `createAuditLog` inserts a row; `getAuditLogs` returns it with `admin_name`

**Commit:**
```bash
git add server/src/modules/users/users.repository.ts
git commit -m "feat(users): add users repository"
```

---

## Task 3 — Backend: Validation + Service

**Effort (hours):** 1.5

**Files:**
- Create: `server/src/modules/users/users.validation.ts`
- Create: `server/src/modules/users/users.service.ts`

**Implementation:**

`users.validation.ts`:
```typescript
// createUserSchema: z.object({ name: z.string().min(3).max(100), email: z.string().email(), role: z.enum(['admin','user','moderator']), status: z.enum(['active','inactive','suspended']) })
// updateUserSchema: same as createUserSchema (all required per spec)
```

`users.service.ts`:
```typescript
// generatePassword(email): extract username before '@', append '123' → e.g. "jane.smith123"
// buildChangedFields(oldUser, newData): compare name/email/role/status fields, return only changed ones as { field: { old, new } }
// getUsers(filters, adminId): repo.findAllWithFilters(filters)
// getUser(id): repo.findById(id) or throw 404
// createUser(data, adminId): check email unique (throw 409), hash password, repo.create(), repo.createAuditLog({action:'CREATE', changed_fields:null})
// updateUser(id, data, adminId): getUser(id), check email unique excluding id (throw 409), buildChangedFields, repo.update(), repo.createAuditLog({action:'UPDATE', changed_fields})
// deleteUser(id, adminId): if id===adminId throw 400, getUser(id), repo.createAuditLog({action:'DELETE'}), repo.deleteById()
// getUserActivity(id, limit): getUser(id), repo.getAuditLogs(id, limit)
```

**Verification:**
- [ ] Unit test: `generatePassword('jane@example.com')` → `'jane123'`
- [ ] Unit test: `buildChangedFields` returns only changed keys
- [ ] Unit test: `createUser` with duplicate email throws 409 error
- [ ] Unit test: `deleteUser` with `id === adminId` throws 400

**Commit:**
```bash
git add server/src/modules/users/users.validation.ts server/src/modules/users/users.service.ts
git commit -m "feat(users): add users service and validation"
```

---

## Task 4 — Backend: Controller + Routes + Mount

**Effort (hours):** 1.5

**Files:**
- Create: `server/src/modules/users/users.controller.ts`
- Create: `server/src/modules/users/users.routes.ts`
- Modify: `server/src/app.ts`

**Implementation:**

`users.controller.ts`:
```typescript
// getUsers(req, res): parse query params → usersService.getUsers(filters) → sendSuccess(res, { data, pagination })
// getUser(req, res): usersService.getUser(id) → sendSuccess(res, { data: user })
// createUser(req, res): validate body with createUserSchema → usersService.createUser(data, adminId) → sendSuccess(res, { data }, 201)
// updateUser(req, res): validate body with updateUserSchema → usersService.updateUser(id, data, adminId) → sendSuccess(res, { data })
// deleteUser(req, res): usersService.deleteUser(id, adminId) → sendSuccess(res, { message: 'User deleted successfully' })
// getUserActivity(req, res): usersService.getUserActivity(id, limit) → sendSuccess(res, { data })
// Error mapping: catch errors, map code 409→sendError(res,msg,409), 404→sendError(res,msg,404), 400→sendError(res,msg,400), else 500
```

`users.routes.ts`:
```typescript
// router.use(authMiddleware, requireRole('admin'))
// GET  /          → controller.getUsers
// POST /          → validateMiddleware(createUserSchema), controller.createUser
// GET  /:id       → controller.getUser
// PUT  /:id       → validateMiddleware(updateUserSchema), controller.updateUser
// DELETE /:id     → controller.deleteUser
// GET  /:id/activity → controller.getUserActivity
```

`app.ts` modification:
```typescript
// import usersRouter from './modules/users/users.routes'
// app.use('/api/users', usersRouter)   ← add after existing /api/auth mount
```

**Verification:**
- [ ] `curl -H "Authorization: Bearer <token>" http://localhost:3001/api/users` returns `{ data: [...], pagination: {...} }`
- [ ] POST with duplicate email returns 409
- [ ] DELETE own account returns 400
- [ ] No auth returns 401; non-admin returns 403

**Commit:**
```bash
git add server/src/modules/users/
git commit -m "feat(users): add users controller, routes; mount /api/users"
```

---

## Task 5 — Frontend: Store + Composable + Types

**Effort (hours):** 1.5

**Files:**
- Create: `client/src/stores/users.store.ts`
- Create: `client/src/pages/users/composables/useUsers.ts`

**Implementation:**

`useUsers.ts` — thin API wrappers using `apiClient`:
```typescript
// getUsers(filters): GET /api/users?{filters}
// getUser(id): GET /api/users/:id
// createUser(data): POST /api/users
// updateUser(id, data): PUT /api/users/:id
// deleteUser(id): DELETE /api/users/:id
// getUserActivity(id, limit?): GET /api/users/:id/activity?limit={limit}
// All return response.data
```

`users.store.ts` — Pinia store with `defineStore('users', () => { ... })`:
```typescript
// state: users, currentUser, auditLogs, pagination, filters, loading, loadingUser, loadingActivity, error
// getters: totalUsers, hasUsers, isLastPage
// fetchUsers(filters?): set loading, call useUsers.getUsers, update users+pagination, reset error; catch → error = msg
// fetchUser(id): set loadingUser, call useUsers.getUser, set currentUser; catch → error
// createUser(data): call useUsers.createUser; on 409 throw {code:'EMAIL_EXISTS'}; useUiStore().showSuccess toast on success
// updateUser(id, data): call useUsers.updateUser; on 409 throw {code:'EMAIL_EXISTS'}; toast success
// deleteUser(id): call useUsers.deleteUser; fetchUsers(filters) to reload; toast success
// fetchUserActivity(id): set loadingActivity, call useUsers.getUserActivity, set auditLogs
// resetFilters(): reset filters, fetchUsers()
// clearCurrentUser(): currentUser=null, auditLogs=[]
```

Add `showSuccess(msg)` / `showError(msg)` to `ui.store.ts` if not present — check first.

**Verification:**
- [ ] `useUsersStore().fetchUsers()` in Vue devtools populates `users` state
- [ ] `createUser` with duplicate email throws `{code:'EMAIL_EXISTS'}`

**Commit:**
```bash
git add client/src/pages/users/composables/useUsers.ts client/src/stores/users.store.ts
git commit -m "feat(users): add users store and composable"
```

---

## Task 6 — Frontend: Shared Components (UserTable, UserFilters, UserForm, AuditLogViewer)

**Effort (hours):** 3

**Files:**
- Create: `client/src/pages/users/components/UserTable.vue`
- Create: `client/src/pages/users/components/UserFilters.vue`
- Create: `client/src/pages/users/components/UserForm.vue`
- Create: `client/src/pages/users/components/AuditLogViewer.vue`

**Implementation:**

`UserTable.vue`:
```typescript
// Props: users: User[], loading: boolean, pagination: PaginationInfo
// Emits: edit(id: number), delete(id: number), pageChange(page: number)
// PrimeVue DataTable with columns: ID, Name, Email, Role, Status (Tag severity map: active→success, inactive→warning, suspended→danger), Created At (format DD/MM/YYYY HH:mm), Updated At, Actions (Edit button + Delete button)
// Show DataTable skeleton (skeletonRows=5) when loading
// Empty message when no users
// Controlled pagination: :rows="pagination.limit" :totalRecords="pagination.total" @page="emit('pageChange', $event.page + 1)"
```

`UserFilters.vue`:
```typescript
// Emits: filterChange(filters: UserFilters)
// Template: InputText (search, debounce 300ms via setTimeout), Select (role: All/Admin/User/Moderator), Select (status: All/Active/Inactive/Suspended), DatePicker range (startDate/endDate)
// Each change calls emitFilters() with current state; search uses clearTimeout/setTimeout for debounce
```

`UserForm.vue`:
```typescript
// Props: mode: 'create' | 'edit', initialData?: User
// Emits: submit(formData: CreateUserDto | UpdateUserDto), cancel
// Fields: Name (InputText), Email (InputText), Role (Select), Status (Select), Created At (read-only InputText, only in edit mode)
// Client validation: name required + 3-100 chars, email required + valid format; show inline error messages
// handleSubmit(): validate → if errors show inline, else emit submit(formData)
// watch initialData and populate form fields (for edit mode)
```

`AuditLogViewer.vue`:
```typescript
// Props: logs: AuditLog[], loading: boolean
// formatLogEntry(log): iterate log.changed_fields keys → "changed {field} from '{old}' to '{new}'"; join with ', '; full string: "{admin_name} {changes} on {timestamp}"
// Render as Timeline or simple list; skeleton when loading; empty state when no logs
```

**Verification:**
- [ ] Storybook / manual: UserTable renders with mock data, Edit/Delete buttons emit correct ids
- [ ] UserFilters: type in search → filterChange fires after 300ms with search value
- [ ] UserForm: submit with empty name shows inline error; valid submit emits formData

**Commit:**
```bash
git add client/src/pages/users/components/
git commit -m "feat(users): add shared user components"
```

---

## Task 7 — Frontend: Pages + Routes

**Effort (hours):** 2

**Files:**
- Modify: `client/src/pages/users/users.routes.ts`
- Modify: `client/src/pages/users/UserListPage.vue`
- Create: `client/src/pages/users/UserCreatePage.vue`
- Create: `client/src/pages/users/UserEditPage.vue`

**Implementation:**

`users.routes.ts` additions:
```typescript
// { path: 'create', name: 'UserCreate', component: () => import('./UserCreatePage.vue'), meta: { title: 'Create User' } }
// { path: ':id/edit', name: 'UserEdit', component: () => import('./UserEditPage.vue'), meta: { title: 'Edit User' } }
```

`UserListPage.vue`:
```typescript
// onMounted: usersStore.fetchUsers()
// handleFilterChange(filters): usersStore.filters = filters; usersStore.fetchUsers(filters) (debounced in UserFilters already)
// handlePageChange(page): usersStore.fetchUsers({ ...filters, page })
// handleDelete(id): PrimeVue useConfirm() dialog → on accept: usersStore.deleteUser(id)
// handleEdit(id): router.push({ name: 'UserEdit', params: { id } })
// Template: UserFilters @filterChange + UserTable @edit @delete @pageChange
```

`UserCreatePage.vue`:
```typescript
// handleSubmit(formData): await usersStore.createUser(formData); navigate to 'UserList'
//   catch {code:'EMAIL_EXISTS'}: set emailError ref → pass as prop to UserForm to display inline
// Template: page header + UserForm mode="create" @submit @cancel(router.push UserList)
```

`UserEditPage.vue`:
```typescript
// onMounted: await usersStore.fetchUser(id); await usersStore.fetchUserActivity(id)
// onUnmounted: usersStore.clearCurrentUser()
// handleSubmit(formData): await usersStore.updateUser(id, formData); await usersStore.fetchUserActivity(id)
//   catch {code:'EMAIL_EXISTS'}: set emailError ref
// Template: two-column layout — left: UserForm mode="edit" :initialData="currentUser", right: AuditLogViewer :logs="auditLogs"
```

**Verification:**
- [ ] Navigate to `/users` → table loads with paginated data
- [ ] Navigate to `/users/create` → fill form → save → redirected to `/users`, new user appears
- [ ] Navigate to `/users/1/edit` → form pre-populated, audit sidebar shows history
- [ ] Delete user → confirm dialog → user removed from table
- [ ] Non-admin user navigating to `/users` → redirected (router guard already in place via `meta.roles`)

**Commit:**
```bash
git add client/src/pages/users/ client/src/stores/users.store.ts
git commit -m "feat(users): add list, create, edit pages and routes"
```

---

**Effort Total (hours):** ~11.5

---

## Self-Review Checklist

- [x] SV-001 GET /api/users with all query params → Task 2 (repository filter) + Task 4 (controller)
- [x] SV-002 POST /api/users with password generation → Task 3 (service.generatePassword)
- [x] SV-003 GET /api/users/:id → Task 4
- [x] SV-004 PUT /api/users/:id with changed_fields diff → Task 3 (buildChangedFields)
- [x] SV-005 DELETE /api/users/:id self-check → Task 3 (deleteUser check)
- [x] SV-006 GET /api/users/:id/activity → Task 2 (getAuditLogs) + Task 4
- [x] audit_logs table → Task 1
- [x] Pagination (page, limit, total, pages) → Task 2 + Task 4 + Task 6 (UserTable)
- [x] Debounce 300ms on search → Task 6 (UserFilters)
- [x] Email already exists → 409 → inline form error → Task 3 + Task 5 + Task 7
- [x] Cannot delete self → 400 → Task 3
- [x] Audit sidebar on edit page → Task 6 (AuditLogViewer) + Task 7 (UserEditPage)
- [x] Default password `<username>123` → Task 3 (generatePassword)
- [x] Auth + admin guard on all endpoints → Task 4 (users.routes.ts)
- [x] No placeholders found
