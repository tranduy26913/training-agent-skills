# Employee Management (COBOL Backend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use skill executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng chức năng quản lý nhân viên độc lập, toàn bộ business logic CRUD do COBOL CGI xử lý, Node.js làm API gateway, Vue.js làm frontend.

**Architecture:** Vue.js frontend gọi Node.js REST API. Node.js controller validate input (Zod) rồi forward đến Apache CGI server (port 8081) qua HTTP nội bộ. Mỗi operation map 1-1 với một COBOL program (GnuCOBOL). COBOL kết nối MySQL trực tiếp qua ODBC.

**Tech Stack:** GnuCOBOL 3.x, Apache httpd (CGI), MySQL Connector/ODBC, Node.js/Express/Zod, Vue 3/Pinia/PrimeVue

---

## File Map

### Tạo mới

| File | Mô tả |
|------|-------|
| `database/migrations/006_create_employees_table.sql` | Migration tạo bảng `employees` |
| `cobol/src/EMP-LIST.cbl` | COBOL program: lấy danh sách nhân viên có pagination + filter |
| `cobol/src/EMP-DETAIL.cbl` | COBOL program: lấy chi tiết 1 nhân viên theo id |
| `cobol/src/EMP-CREATE.cbl` | COBOL program: tạo nhân viên mới |
| `cobol/src/EMP-UPDATE.cbl` | COBOL program: cập nhật thông tin nhân viên |
| `cobol/src/EMP-DELETE.cbl` | COBOL program: xóa nhân viên |
| `cobol/copybooks/EMP-RECORD.cpy` | Copybook: định nghĩa data structure nhân viên dùng chung |
| `cobol/Makefile` | Build script compile tất cả `.cbl` →  `.cgi` |
| `cobol/apache/httpd.conf` | Apache config: ScriptAlias `/cgi-bin/` → `cobol/build/` |
| `server/src/models/employees.model.ts` | DB row types, DTO types cho employees |
| `server/src/modules/employees/employees.validation.ts` | Zod schema cho create/update/query |
| `server/src/modules/employees/employees.service.ts` | `CobolGateway`: HTTP calls đến Apache CGI |
| `server/src/modules/employees/employees.controller.ts` | Parse req/res, gọi gateway, map lỗi |
| `server/src/modules/employees/employees.routes.ts` | Route definitions với auth middleware |
| `server/src/modules/employees/employees.service.test.ts` | Unit tests cho CobolGateway |
| `server/src/modules/employees/employees.controller.test.ts` | Unit tests cho controller |
| `client/src/types/employees.types.ts` | TypeScript types cho frontend |
| `client/src/services/employees.service.ts` | API calls từ frontend đến Node.js |
| `client/src/stores/employees.store.ts` | Pinia store: state management |
| `client/src/pages/employees/employees.routes.ts` | Vue Router route definitions |
| `client/src/pages/employees/EmployeeListPage.vue` | Trang danh sách nhân viên |
| `client/src/pages/employees/EmployeeCreatePage.vue` | Trang tạo nhân viên |
| `client/src/pages/employees/EmployeeEditPage.vue` | Trang sửa nhân viên |
| `client/src/pages/employees/components/EmployeeTable.vue` | PrimeVue DataTable component |
| `client/src/pages/employees/components/EmployeeFilters.vue` | Thanh filter/search |
| `client/src/pages/employees/components/EmployeeForm.vue` | Form dùng chung create/edit |

### Sửa đổi

| File | Thay đổi |
|------|----------|
| `server/src/models/index.ts` | Export `employees.model.ts` |
| `server/src/app.ts` | Đăng ký `employeesRoutes` |
| `client/src/router/routes.ts` | Import và spread `employeeRoutes` |

---

## Task 1: Database Migration

**Files:**
- Create: `database/migrations/006_create_employees_table.sql`

- [ ] Viết SQL migration tạo bảng `employees` với tất cả columns và indexes theo spec (bao gồm ENUM cho `department`, `position`, `status`)

- [ ] Chạy migration lên database:

  ```
  cd server && npm run migrate
  ```

  Expected: migration chạy thành công, không có error

- [ ] Verify bảng tồn tại:

  ```sql
  DESCRIBE employees;
  ```

  Expected: 11 columns hiển thị đúng kiểu dữ liệu

- [ ] Commit:

  ```
  git add database/migrations/006_create_employees_table.sql
  git commit -m "feat(db): add employees table migration"
  ```

---

## Task 2: COBOL Infrastructure Setup

**Files:**
- Create: `cobol/copybooks/EMP-RECORD.cpy`
- Create: `cobol/Makefile`
- Create: `cobol/apache/httpd.conf`

- [ ] Tạo copybook `EMP-RECORD.cpy` định nghĩa group item `WS-EMPLOYEE` với tất cả fields (id PIC 9(10), employee-code PIC X(20), full-name PIC X(100), email PIC X(255), phone PIC X(20), department PIC X(20), position PIC X(20), salary PIC 9(12)V99, hire-date PIC X(10), status PIC X(10))

- [ ] Tạo `Makefile` với target `all` compile 5 programs dùng `cobc -x -o build/<name>.cgi src/<NAME>.cbl`, target `clean` xóa `build/`

- [ ] Tạo `cobol/apache/httpd.conf` cấu hình:
  - `Listen 8081`
  - `ScriptAlias /cgi-bin/ "<abs-path>/cobol/build/"`
  - `AddHandler cgi-script .cgi`
  - `Options +ExecCGI` trong thư mục `build/`

- [ ] Verify GnuCOBOL và ODBC đã cài:

  ```
  cobc --version
  odbcinst -q -d
  ```

  Expected: version string và danh sách ODBC driver có MySQL

- [ ] Commit:

  ```
  git add cobol/copybooks/ cobol/Makefile cobol/apache/
  git commit -m "feat(cobol): add COBOL infrastructure, copybook, Makefile, Apache config"
  ```

---

## Task 3: COBOL Programs — Read Operations (EMP-LIST + EMP-DETAIL)

**Files:**
- Create: `cobol/src/EMP-LIST.cbl`
- Create: `cobol/src/EMP-DETAIL.cbl`

> Mỗi COBOL CGI program có cấu trúc: `IDENTIFICATION DIVISION` → `ENVIRONMENT DIVISION` (ODBC config) → `DATA DIVISION` (host variables) → `PROCEDURE DIVISION` (đọc input, EXEC SQL, build JSON output ra stdout). Luôn in `Content-Type: application/json` trước JSON body.

- [ ] Viết `EMP-LIST.cbl`:
  - Đọc `QUERY_STRING` từ environment variable
  - Parse các params: `page`, `limit`, `search`, `department`, `status`
  - `EXEC SQL` SELECT với `WHERE` động, `LIMIT` và `OFFSET` tính từ page/limit
  - Build JSON array response dạng `{"status":"OK","data":[...],"pagination":{...}}`
  - Trường hợp lỗi ODBC: trả `{"status":"ERROR","code":"DB_ERROR"}`

- [ ] Viết `EMP-DETAIL.cbl`:
  - Đọc `id` từ `QUERY_STRING`
  - `EXEC SQL SELECT ... WHERE id = :WS-ID`
  - Nếu `SQLCODE = 100` (NOT FOUND): trả `{"status":"ERROR","code":"NOT_FOUND"}`
  - Trả JSON object nhân viên

- [ ] Build và test thủ công:

  ```
  cd cobol && make all
  # Khởi Apache
  httpd -f apache/httpd.conf
  # Test EMP-LIST
  curl "http://localhost:8081/cgi-bin/emp-list.cgi?page=1&limit=10"
  # Test EMP-DETAIL
  curl "http://localhost:8081/cgi-bin/emp-detail.cgi?id=1"
  ```

  Expected: JSON response hợp lệ (hoặc `NOT_FOUND` nếu chưa có data)

- [ ] Commit:

  ```
  git add cobol/src/EMP-LIST.cbl cobol/src/EMP-DETAIL.cbl
  git commit -m "feat(cobol): implement EMP-LIST and EMP-DETAIL CGI programs"
  ```

---

## Task 4: COBOL Programs — Write Operations (EMP-CREATE + EMP-UPDATE + EMP-DELETE)

**Files:**
- Create: `cobol/src/EMP-CREATE.cbl`
- Create: `cobol/src/EMP-UPDATE.cbl`
- Create: `cobol/src/EMP-DELETE.cbl`

- [ ] Viết `EMP-CREATE.cbl`:
  - Đọc JSON từ `stdin` (dùng `ACCEPT` hoặc đọc từ `SYSIN`)
  - Parse fields từ JSON string vào host variables
  - Kiểm tra unique: `EXEC SQL SELECT COUNT(*) WHERE employee_code = :WS-CODE` → nếu > 0 trả `DUPLICATE_CODE`
  - Kiểm tra unique email tương tự → `DUPLICATE_EMAIL`
  - `EXEC SQL INSERT INTO employees ...`
  - `EXEC SQL SELECT LAST_INSERT_ID()` để lấy id mới
  - Trả JSON record vừa tạo với `"status":"CREATED"`

- [ ] Viết `EMP-UPDATE.cbl`:
  - Đọc `id` từ `QUERY_STRING`, JSON body từ `stdin`
  - Kiểm tra record tồn tại → `NOT_FOUND` nếu không
  - Kiểm tra email unique (ngoại trừ chính nó) → `DUPLICATE_EMAIL` nếu trùng
  - `EXEC SQL UPDATE employees SET ... WHERE id = :WS-ID`
  - Trả JSON record sau khi cập nhật

- [ ] Viết `EMP-DELETE.cbl`:
  - Đọc `id` từ `QUERY_STRING`
  - Kiểm tra record tồn tại → `NOT_FOUND`
  - `EXEC SQL DELETE FROM employees WHERE id = :WS-ID`
  - Trả `{"status":"OK","message":"Employee deleted successfully"}`

- [ ] Build và test thủ công:

  ```
  cd cobol && make all
  # Test CREATE
  curl -X POST "http://localhost:8081/cgi-bin/emp-create.cgi" \
    -H "Content-Type: application/json" \
    -d '{"employee_code":"EMP001","full_name":"Test User","email":"test@test.com","department":"engineering","position":"engineer","salary":10000000,"hire_date":"2025-01-01","status":"active"}'
  # Test UPDATE
  curl -X PUT "http://localhost:8081/cgi-bin/emp-update.cgi?id=1" \
    -H "Content-Type: application/json" \
    -d '{"full_name":"Updated User","email":"test@test.com","department":"hr","position":"manager","salary":15000000,"hire_date":"2025-01-01","status":"active"}'
  # Test DELETE
  curl -X DELETE "http://localhost:8081/cgi-bin/emp-delete.cgi?id=1"
  ```

  Expected: JSON responses với `"status":"CREATED"`, `"status":"OK"`

- [ ] Commit:

  ```
  git add cobol/src/EMP-CREATE.cbl cobol/src/EMP-UPDATE.cbl cobol/src/EMP-DELETE.cbl
  git commit -m "feat(cobol): implement EMP-CREATE, EMP-UPDATE, EMP-DELETE CGI programs"
  ```

---

## Task 5: Node.js Backend — Model, Validation, CobolGateway + Tests

**Files:**
- Create: `server/src/models/employees.model.ts`
- Modify: `server/src/models/index.ts`
- Create: `server/src/modules/employees/employees.validation.ts`
- Create: `server/src/modules/employees/employees.service.ts`
- Create: `server/src/modules/employees/employees.service.test.ts`

- [ ] **Viết failing test trước** (`employees.service.test.ts`):
  - Mock `axios.get` / `axios.post` / `axios.put` / `axios.delete` 
  - Test `getEmployees()`: mock trả `{status:"OK", data:[], pagination:{}}` → expect service trả `PaginatedResult`
  - Test `createEmployee()`: mock trả `{status:"CREATED", data:{id:1,...}}` → expect Employee object
  - Test error mapping: mock trả `{status:"ERROR", code:"NOT_FOUND"}` → expect ServiceError với status 404
  - Test error mapping: `DUPLICATE_EMAIL` → ServiceError 409
  - Test error mapping: COBOL service down (axios throws) → ServiceError 502

  ```
  cd server && npx vitest run src/modules/employees/employees.service.test.ts
  ```

  Expected: FAIL — `employees.service.ts` chưa tồn tại

- [ ] Tạo `employees.model.ts`: định nghĩa `EmployeeRow`, `EmployeeFilters`, `CreateEmployeeDto`, `UpdateEmployeeDto`. Export từ `models/index.ts`

- [ ] Tạo `employees.validation.ts`: Zod schema `createEmployeeSchema`, `updateEmployeeSchema`, `listEmployeesSchema` với các enum values từ spec

- [ ] Tạo `employees.service.ts` — class `CobolGateway`:
  - `COBOL_BASE_URL = process.env.COBOL_CGI_URL || 'http://localhost:8081/cgi-bin'`
  - `getEmployees(filters)` → `GET /emp-list.cgi?{qs}` → parse response → trả `PaginatedResult`
  - `getEmployee(id)` → `GET /emp-detail.cgi?id={id}`
  - `createEmployee(data)` → `POST /emp-create.cgi` với body JSON
  - `updateEmployee(id, data)` → `PUT /emp-update.cgi?id={id}` với body JSON
  - `deleteEmployee(id)` → `DELETE /emp-delete.cgi?id={id}`
  - Private `mapCobolError(code)`: `NOT_FOUND`→404, `DUPLICATE_CODE`/`DUPLICATE_EMAIL`→409, `VALIDATION_ERROR`→400, `DB_ERROR`→502

- [ ] Chạy lại tests:

  ```
  cd server && npx vitest run src/modules/employees/employees.service.test.ts
  ```

  Expected: tất cả PASS

- [ ] Commit:

  ```
  git add server/src/models/employees.model.ts server/src/models/index.ts \
    server/src/modules/employees/employees.validation.ts \
    server/src/modules/employees/employees.service.ts \
    server/src/modules/employees/employees.service.test.ts
  git commit -m "feat(server): add employees model, validation, CobolGateway service with tests"
  ```

---

## Task 6: Node.js Backend — Controller, Routes, App Registration + Tests

**Files:**
- Create: `server/src/modules/employees/employees.controller.ts`
- Create: `server/src/modules/employees/employees.routes.ts`
- Create: `server/src/modules/employees/employees.controller.test.ts`
- Modify: `server/src/app.ts`

- [ ] **Viết failing test trước** (`employees.controller.test.ts`):
  - Mock `CobolGateway` hoàn toàn
  - Test `GET /api/employees` với valid JWT admin → expect `sendSuccess` được gọi với data
  - Test `POST /api/employees` với invalid body → expect 400
  - Test `DELETE /api/employees/999` khi gateway throw ServiceError(404) → expect 404 response
  - Test `GET /api/employees` không có JWT → expect 401

  ```
  cd server && npx vitest run src/modules/employees/employees.controller.test.ts
  ```

  Expected: FAIL

- [ ] Tạo `employees.controller.ts`: mỗi method chỉ parse req → gọi `cobolGateway` method → `sendSuccess` hoặc `handleError`. Không có business logic.

- [ ] Tạo `employees.routes.ts`: theo đúng pattern của `users.routes.ts` — `router.use(authMiddleware, requireRole('admin'))`, map 5 routes đến controller methods với Zod validate middleware

- [ ] Sửa `server/src/app.ts`: import `employeesRoutes` và thêm `app.use(\`${appConfig.apiPrefix}/employees\`, employeesRoutes)`

- [ ] Chạy lại tests:

  ```
  cd server && npx vitest run src/modules/employees/employees.controller.test.ts
  ```

  Expected: tất cả PASS

- [ ] Integration smoke test (cần Apache + COBOL đang chạy):

  ```
  cd server && npm run dev
  curl -H "Authorization: Bearer <admin-token>" http://localhost:3000/api/employees
  ```

  Expected: `{"data":[],"pagination":{...}}`

- [ ] Commit:

  ```
  git add server/src/modules/employees/ server/src/app.ts
  git commit -m "feat(server): add employees controller, routes; register in app"
  ```

---

## Task 7: Frontend — Types, Service, Store

**Files:**
- Create: `client/src/types/employees.types.ts`
- Create: `client/src/services/employees.service.ts`
- Create: `client/src/stores/employees.store.ts`

- [ ] Tạo `employees.types.ts`: export `Employee`, `EmployeeFilters`, `CreateEmployeeDto`, `UpdateEmployeeDto`, `EmployeeDepartment` (union type), `EmployeePosition` (union type), `EmployeeStatus` (union type)

- [ ] Tạo `employees.service.ts`: 5 functions gọi `apiService` (theo pattern của `users.service.ts`) — `getEmployees`, `getEmployee`, `createEmployee`, `updateEmployee`, `deleteEmployee`

- [ ] Tạo `employees.store.ts` (Pinia): state theo spec, actions gọi service, dùng `useUiStore` để toast. Theo đúng pattern của `users.store.ts`

- [ ] Chạy type check:

  ```
  cd client && npx vue-tsc --noEmit
  ```

  Expected: no type errors trong files mới

- [ ] Commit:

  ```
  git add client/src/types/employees.types.ts \
    client/src/services/employees.service.ts \
    client/src/stores/employees.store.ts
  git commit -m "feat(client): add employees types, service, and Pinia store"
  ```

---

## Task 8: Frontend — Components (EmployeeForm, EmployeeFilters, EmployeeTable)

**Files:**
- Create: `client/src/pages/employees/components/EmployeeForm.vue`
- Create: `client/src/pages/employees/components/EmployeeFilters.vue`
- Create: `client/src/pages/employees/components/EmployeeTable.vue`

- [ ] Tạo `EmployeeFilters.vue`:
  - PrimeVue `InputText` cho search (debounce 500ms dùng `useDebounce` từ VueUse)
  - PrimeVue `Dropdown` cho department filter (options từ `EmployeeDepartment` enum)
  - PrimeVue `Dropdown` cho status filter
  - Nút Clear Filters
  - Emits: `filter-change(filters: EmployeeFilters)`, `clear`

- [ ] Tạo `EmployeeTable.vue`:
  - PrimeVue `DataTable` + `Column` hiển thị tất cả columns từ spec
  - Cột `department` và `position` dùng PrimeVue `Tag` (badge)
  - Cột `salary` format `Intl.NumberFormat` VND
  - Cột `hire_date` format `DD/MM/YYYY`
  - Cột actions: nút Edit (`pi-pencil`) và Delete (`pi-trash`)
  - Props: `employees: Employee[]`, `loading: boolean`, `pagination: PaginationInfo`
  - Emits: `edit(id: number)`, `delete(id: number)`, `page-change(page: number)`

- [ ] Tạo `EmployeeForm.vue`:
  - Props: `mode: 'create' | 'edit'`, `initialData?: Employee | null`, `loading?: boolean`
  - Emits: `submit(data: CreateEmployeeDto | UpdateEmployeeDto)`, `cancel`
  - PrimeVue `InputText` cho employee_code (readonly trong edit mode), full_name, email, phone
  - PrimeVue `Dropdown` cho department, position, status
  - PrimeVue `InputNumber` cho salary (mode=currency locale=vi-VN)
  - PrimeVue `DatePicker` cho hire_date (maxDate=today)
  - Validation dùng Zod inline (theo pattern của UserForm.vue)

- [ ] Visual check:

  ```
  cd client && npm run dev
  ```

  Mở browser kiểm tra từng component render (tạm thời hardcode data nếu chưa có routes)

- [ ] Commit:

  ```
  git add client/src/pages/employees/components/
  git commit -m "feat(client): add EmployeeForm, EmployeeFilters, EmployeeTable components"
  ```

---

## Task 9: Frontend — Pages và Routes

**Files:**
- Create: `client/src/pages/employees/EmployeeListPage.vue`
- Create: `client/src/pages/employees/EmployeeCreatePage.vue`
- Create: `client/src/pages/employees/EmployeeEditPage.vue`
- Create: `client/src/pages/employees/employees.routes.ts`
- Modify: `client/src/router/routes.ts`

- [ ] Tạo `employees.routes.ts`: theo đúng pattern của `users.routes.ts` với lazy load, `requiresAuth: true`, `roles: ['admin']`

  ```typescript
  // routes: /employees, /employees/create, /employees/:id/edit
  ```

- [ ] Tạo `EmployeeListPage.vue`:
  - `onMounted`: đọc query params → `employeesStore.fetchEmployees(filters)`
  - Render `EmployeeFilters` + `EmployeeTable`
  - Handle `filter-change` → reset page → fetch lại
  - Handle `edit(id)` → `router.push('/employees/:id/edit')`
  - Handle `delete(id)` → confirm dialog → `employeesStore.deleteEmployee(id)` → toast

- [ ] Tạo `EmployeeCreatePage.vue`:
  - Render `EmployeeForm mode="create"`
  - Handle `submit` → `employeesStore.createEmployee(data)` → redirect `/employees`
  - Handle `cancel` → confirm nếu form dirty → redirect

- [ ] Tạo `EmployeeEditPage.vue`:
  - `onMounted`: `employeesStore.fetchEmployee(route.params.id)`
  - Render `EmployeeForm mode="edit" :initialData="currentEmployee"`
  - Handle `submit` → `employeesStore.updateEmployee(id, data)` → redirect
  - Handle `cancel` → confirm nếu form dirty → redirect

- [ ] Sửa `client/src/router/routes.ts`: import `employeeRoutes`, spread vào `routes` array

- [ ] E2E smoke test thủ công:
  1. Đăng nhập với admin account
  2. Điều hướng đến `/employees` → thấy bảng trống
  3. Tạo nhân viên mới → điền đủ fields → Save → redirect về list → thấy 1 record
  4. Click Edit → sửa full_name → Save → toast thành công
  5. Click Delete → confirm → record biến mất

- [ ] Commit:

  ```
  git add client/src/pages/employees/ client/src/router/routes.ts
  git commit -m "feat(client): add employee pages, routes; wire up to router"
  ```

---

## Task 10: Sidebar Menu Item

**Files:**
- Modify: `client/src/components/layout/` (tìm Sidebar component)

- [ ] Tìm file Sidebar trong `client/src/components/layout/`, thêm menu item "Employees" với icon `pi-users` (hoặc `pi-id-card`), route `/employees`, role guard `admin`

- [ ] Visual check: sidebar hiển thị menu item sau khi đăng nhập admin

- [ ] Commit:

  ```
  git add client/src/components/layout/
  git commit -m "feat(client): add Employees menu item to sidebar"
  ```

---

## Self-Review

**Spec coverage check:**

| Spec Requirement | Task |
|-----------------|------|
| Database table `employees` | Task 1 |
| COBOL EMP-LIST (GET list) | Task 3 |
| COBOL EMP-DETAIL (GET detail) | Task 3 |
| COBOL EMP-CREATE | Task 4 |
| COBOL EMP-UPDATE | Task 4 |
| COBOL EMP-DELETE | Task 4 |
| CobolGateway service + error mapping | Task 5 |
| Node.js Controller + Routes | Task 6 |
| Frontend types + service + store | Task 7 |
| EmployeeForm, Filters, Table components | Task 8 |
| List/Create/Edit pages + routing | Task 9 |
| Sidebar menu item | Task 10 |
| Authorization (admin only) | Task 6 (routes middleware) |
| Zod validation (server) | Task 5 |
| Zod validation (client) | Task 8 |
| COBOL ODBC SQL injection prevention | Task 3-4 (host variables) |

**Naming consistency:**
- `CobolGateway` class dùng nhất quán từ Task 5 đến Task 6
- `employeesStore` dùng nhất quán trong pages (Task 7-9)
- COBOL program names: `EMP-LIST`, `EMP-DETAIL`, `EMP-CREATE`, `EMP-UPDATE`, `EMP-DELETE` nhất quán trong tất cả tasks

**Estimated Effort:** 3–4 ngày làm việc (developer có kinh nghiệm, không có AI assistance, bao gồm thời gian học cú pháp COBOL CGI và ODBC)
