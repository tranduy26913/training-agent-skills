---
title: Employee Management Feature Design (COBOL Backend)
version: 1.0
author: Training Team
date: 2026-05-06
status: Draft
---

# Employee Management Feature Design (COBOL Backend)

## Executive Summary

Chức năng quản lý nhân viên (`employees`) là một module training độc lập, được thiết kế để thực hành ngôn ngữ COBOL trong môi trường hệ thống hiện đại. Toàn bộ business logic CRUD (create, read, update, delete) được xử lý bởi các COBOL program chạy dưới dạng CGI binary phía sau Apache HTTP server. Node.js đóng vai trò là API gateway: tiếp nhận HTTP request từ frontend, chuyển tiếp đến lớp COBOL qua HTTP nội bộ, và trả về response cho client. Module này hoàn toàn tách biệt với các chức năng khác trong hệ thống.

## Changelog

| Version | Date | Author | Summary |
|---------|------|--------|---------|
| 1.0 | 2026-05-06 | Training Team | Thiết kế ban đầu |

---

## 1. Objective & Scope

### Purpose

Xây dựng chức năng quản lý nhân viên phục vụ mục đích **training ngôn ngữ COBOL**. Module minh họa cách tích hợp COBOL vào hệ thống Node.js hiện đại thông qua kiến trúc CGI microservice. Admin có thể xem danh sách, tạo mới, chỉnh sửa và xóa thông tin nhân viên thông qua giao diện Vue.js, trong khi toàn bộ xử lý nghiệp vụ và tương tác database được thực hiện bởi COBOL.

### In Scope

- Xem danh sách nhân viên với phân trang và tìm kiếm
- Lọc theo phòng ban (`department`) và trạng thái (`status`)
- Xem chi tiết thông tin một nhân viên
- Tạo mới nhân viên
- Chỉnh sửa thông tin nhân viên
- Xóa nhân viên
- COBOL xử lý toàn bộ CRUD bao gồm cả read (list, detail)
- Node.js controller thuần túy: nhận request → validate input → forward đến COBOL CGI → trả response
- Vue.js frontend: giao diện CRUD hoàn chỉnh theo chuẩn dự án

### Out of Scope

- Audit log (chức năng này dành cho training riêng)
- Import/export dữ liệu nhân viên
- Quản lý phân quyền chi tiết (chỉ áp dụng rule: phải là admin)
- Tích hợp với bảng `users` hiện tại
- Gửi email thông báo
- Upload avatar nhân viên

---

## 2. Architecture

### 2.1 System Architecture

```text
[Vue.js Frontend :5173]
        |
     HTTP/REST (JWT Bearer Token)
        |
[Node.js API :3000]
  ├── employees.routes.ts       ← Định nghĩa route, áp dụng middleware auth
  ├── employees.validation.ts   ← Zod schema validate input
  ├── employees.controller.ts   ← Parse req/res, gọi CobolGateway, map lỗi
  └── employees.service.ts      ← CobolGateway: gọi HTTP đến Apache CGI
        |
     HTTP nội bộ (localhost:8081)
        |
[Apache CGI Server :8081]
  └── /cgi-bin/
      ├── emp-list.cgi      ← EMP-LIST.cbl   (GET /api/employees)
      ├── emp-detail.cgi    ← EMP-DETAIL.cbl (GET /api/employees/:id)
      ├── emp-create.cgi    ← EMP-CREATE.cbl (POST /api/employees)
      ├── emp-update.cgi    ← EMP-UPDATE.cbl (PUT /api/employees/:id)
      └── emp-delete.cgi    ← EMP-DELETE.cbl (DELETE /api/employees/:id)
        |
     ODBC (MySQL Connector/ODBC)
        |
[MySQL Database]
  └── employees (bảng mới, độc lập)
```

### 2.2 Data Model

#### employees (NEW)

```sql
CREATE TABLE `employees` (
  `id`              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `employee_code`   VARCHAR(20)  NOT NULL UNIQUE,
  `full_name`       VARCHAR(100) NOT NULL,
  `email`           VARCHAR(255) NOT NULL UNIQUE,
  `phone`           VARCHAR(20)  NULL,
  `department`      ENUM('engineering','hr','finance','marketing','operations') NOT NULL,
  `position`        ENUM('engineer','senior_engineer','team_lead','manager','director','analyst','specialist','intern') NOT NULL,
  `salary`          DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `hire_date`       DATE         NOT NULL,
  `status`          ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `created_at`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_employees_code`       (`employee_code`),
  INDEX `idx_employees_email`      (`email`),
  INDEX `idx_employees_department` (`department`),
  INDEX `idx_employees_status`     (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### COBOL File Structure

```text
cobol/                          ← Thư mục gốc, ngang hàng với server/ và client/
├── src/
│   ├── EMP-LIST.cbl            ← Lấy danh sách có pagination + filter
│   ├── EMP-DETAIL.cbl          ← Lấy chi tiết 1 nhân viên theo id
│   ├── EMP-CREATE.cbl          ← Tạo nhân viên mới
│   ├── EMP-UPDATE.cbl          ← Cập nhật thông tin nhân viên
│   └── EMP-DELETE.cbl          ← Xóa nhân viên
├── copybooks/
│   └── EMP-RECORD.cpy          ← Data structure dùng chung: định nghĩa fields nhân viên
├── build/
│   └── *.cgi                   ← Compiled CGI binaries (GnuCOBOL output)
├── Makefile                    ← Build toàn bộ: `make all`
└── apache/
    └── httpd.conf              ← Apache config: ScriptAlias /cgi-bin/ → build/
```

---

## 3. Feature Specifications

### 3.1 Employee List Page (`/employees`)

#### Display

Bảng dữ liệu hiển thị các cột:

- **Mã NV** (`employee_code`): hiển thị, có thể sort
- **Họ và tên** (`full_name`): hiển thị, có thể sort
- **Email** (`email`): hiển thị
- **Phòng ban** (`department`): hiển thị badge màu theo department
- **Chức vụ** (`position`): hiển thị badge theo giá trị enum
- **Lương** (`salary`): định dạng tiền tệ (VND)
- **Ngày vào làm** (`hire_date`): định dạng `DD/MM/YYYY`
- **Trạng thái** (`status`): badge `Active` / `Inactive`
- **Hành động**: nút Edit, Delete

#### Filtering & Search

- Tìm kiếm tự do theo `full_name` hoặc `email` (debounce 500ms)
- Lọc theo `department`: dropdown các giá trị enum
- Lọc theo `status`: `Active` / `Inactive` / `All`
- Nút Clear Filters reset toàn bộ filter và reload bảng

#### Pagination

- Server-side pagination
- Mặc định: 10 bản ghi / trang
- Tùy chọn: 10, 25, 50

#### UX Interactions

- Click hàng → điều hướng đến trang Edit
- Click nút Edit → điều hướng đến `/employees/:id/edit`
- Click nút Delete → hiển thị confirm dialog → gọi API xóa → reload bảng
- Sau khi tạo/sửa thành công → toast thông báo thành công

### 3.2 Employee Create Page (`/employees/create`)

#### Form Fields

- **Mã nhân viên** (`employee_code`, bắt buộc): chữ, số, gạch dưới; tối đa 20 ký tự; unique
- **Họ và tên** (`full_name`, bắt buộc): 2–100 ký tự
- **Email** (`email`, bắt buộc): định dạng email hợp lệ; unique
- **Số điện thoại** (`phone`, tùy chọn): tối đa 20 ký tự
- **Phòng ban** (`department`, bắt buộc): dropdown chọn từ danh sách enum
- **Chức vụ** (`position`, bắt buộc): dropdown chọn từ danh sách enum (`engineer`, `senior_engineer`, `team_lead`, `manager`, `director`, `analyst`, `specialist`, `intern`)
- **Lương** (`salary`, bắt buộc): số dương, tối đa 12 chữ số
- **Ngày vào làm** (`hire_date`, bắt buộc): date picker, không được là tương lai
- **Trạng thái** (`status`, bắt buộc): mặc định `active`

#### Form Actions

- **Save**: validate client-side → gọi `POST /api/employees` → thành công → redirect về `/employees` + toast
- **Cancel**: xác nhận nếu form đã có dữ liệu → về `/employees`

#### Validation

- Client-side: Zod schema kiểm tra kiểu dữ liệu và required fields trước khi submit
- Server-side (COBOL): kiểm tra `employee_code` unique, `email` unique, `hire_date` không tương lai

### 3.3 Employee Edit Page (`/employees/:id/edit`)

#### Form Fields

- Tương tự Create; load dữ liệu hiện tại khi mount
- `employee_code` (readonly, không cho sửa sau khi đã tạo)
- `id` không hiển thị trên form

#### Form Actions

- **Save**: validate client-side → gọi `PUT /api/employees/:id` → thành công → redirect về `/employees` + toast
- **Cancel**: xác nhận nếu form đã thay đổi → về `/employees`

#### Additional Panel (Optional)

- Không áp dụng trong phiên bản này.

#### Validations

- Không thể sửa `employee_code`
- `email` phải unique (ngoại trừ chính nó)
- COBOL kiểm tra record tồn tại trước khi update

---

## 4. Backend API Specification

> Node.js controller **không chứa business logic**. Toàn bộ xử lý được uỷ quyền cho COBOL CGI thông qua `CobolGateway` (employees.service.ts).

### 4.1 Endpoints

#### SV-001 - GET /api/employees
**Lấy danh sách nhân viên có pagination và filter — uỷ quyền cho EMP-LIST.cbl**

Request:
```http
GET /api/employees?page=1&limit=10&search=nguyen&department=engineering&status=active
```

Query Parameters:
- `page` (tùy chọn): mặc định 1
- `limit` (tùy chọn): mặc định 10
- `search` (tùy chọn): tìm theo full_name hoặc email
- `department` (tùy chọn): lọc theo phòng ban
- `status` (tùy chọn): `active` | `inactive`

Flow:
1. Xác thực JWT token
2. Kiểm tra role = `admin`
3. Validate query parameters (Zod)
4. CobolGateway gọi `GET http://localhost:8081/cgi-bin/emp-list.cgi?{querystring}`
5. COBOL truy vấn MySQL, trả JSON
6. Node.js trả response về client

Response (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "employee_code": "EMP001",
      "full_name": "Nguyễn Văn A",
      "email": "nguyenvana@example.com",
      "phone": "0901234567",
      "department": "engineering",
      "position": "Software Engineer",
      "salary": 15000000.00,
      "hire_date": "2024-01-15",
      "status": "active",
      "created_at": "2024-01-15T08:00:00Z",
      "updated_at": "2024-01-15T08:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "pages": 5
  }
}
```

Errors:
- 401: Chưa xác thực
- 403: Không có quyền admin
- 502: COBOL service không phản hồi

---

#### SV-002 - POST /api/employees
**Tạo nhân viên mới — uỷ quyền cho EMP-CREATE.cbl**

Request Body:
```json
{
  "employee_code": "EMP010",
  "full_name": "Trần Thị B",
  "email": "tranthib@example.com",
  "phone": "0912345678",
  "department": "hr",
  "position": "HR Specialist",
  "salary": 12000000.00,
  "hire_date": "2026-05-06",
  "status": "active"
}
```

Flow:
1. Xác thực JWT token
2. Kiểm tra role = `admin`
3. Validate request body (Zod)
4. CobolGateway gọi `POST http://localhost:8081/cgi-bin/emp-create.cgi` với body JSON qua stdin
5. COBOL kiểm tra unique, insert, trả JSON record mới tạo
6. Node.js trả 201 response

Response (201 Created):
```json
{
  "data": {
    "id": 11,
    "employee_code": "EMP010",
    "full_name": "Trần Thị B",
    ...
  }
}
```

Errors:
- 400: Dữ liệu không hợp lệ
- 409: `employee_code` hoặc `email` đã tồn tại
- 502: COBOL service không phản hồi

---

#### SV-003 - GET /api/employees/:id
**Lấy chi tiết một nhân viên — uỷ quyền cho EMP-DETAIL.cbl**

Flow:
1. Xác thực JWT token
2. Kiểm tra role = `admin`
3. Validate route param `id` là số nguyên dương
4. CobolGateway gọi `GET http://localhost:8081/cgi-bin/emp-detail.cgi?id={id}`
5. COBOL query MySQL, trả JSON
6. Node.js trả response

Response (200 OK):
```json
{
  "data": {
    "id": 1,
    "employee_code": "EMP001",
    "full_name": "Nguyễn Văn A",
    ...
  }
}
```

Errors:
- 404: Không tìm thấy nhân viên
- 502: COBOL service không phản hồi

---

#### SV-004 - PUT /api/employees/:id
**Cập nhật thông tin nhân viên — uỷ quyền cho EMP-UPDATE.cbl**

Request Body:
```json
{
  "full_name": "Nguyễn Văn A (Updated)",
  "email": "updated@example.com",
  "phone": "0909090909",
  "department": "operations",
  "position": "Senior Engineer",
  "salary": 18000000.00,
  "hire_date": "2024-01-15",
  "status": "active"
}
```

Flow:
1. Xác thực JWT token
2. Kiểm tra role = `admin`
3. Validate route param và request body (Zod)
4. CobolGateway gọi `PUT http://localhost:8081/cgi-bin/emp-update.cgi?id={id}` với body JSON qua stdin
5. COBOL kiểm tra record tồn tại, kiểm tra email unique, update, trả JSON record đã cập nhật
6. Node.js trả response

Response (200 OK):
```json
{
  "data": {
    "id": 1,
    "employee_code": "EMP001",
    "full_name": "Nguyễn Văn A (Updated)",
    ...
  }
}
```

Errors:
- 400: Dữ liệu không hợp lệ
- 404: Không tìm thấy nhân viên
- 409: Email đã tồn tại ở nhân viên khác
- 502: COBOL service không phản hồi

---

#### SV-005 - DELETE /api/employees/:id
**Xóa nhân viên — uỷ quyền cho EMP-DELETE.cbl**

Flow:
1. Xác thực JWT token
2. Kiểm tra role = `admin`
3. Validate route param `id`
4. CobolGateway gọi `DELETE http://localhost:8081/cgi-bin/emp-delete.cgi?id={id}`
5. COBOL kiểm tra record tồn tại, delete, trả JSON xác nhận
6. Node.js trả response

Response (200 OK):
```json
{
  "message": "Employee deleted successfully"
}
```

Errors:
- 404: Không tìm thấy nhân viên
- 502: COBOL service không phản hồi

---

#### SV-006 - GET /api/employees/:id/activity

Không áp dụng trong phiên bản này. Audit log nằm ngoài scope.

### 4.2 Authorization

Tất cả endpoint yêu cầu:
1. JWT token hợp lệ (middleware `authenticateToken` hiện tại)
2. Role = `admin` (middleware `requireAdmin`)

Không có endpoint công khai.

### 4.3 Error Handling

Tất cả lỗi từ COBOL CGI được Node.js map sang HTTP status code chuẩn. Định dạng lỗi theo chuẩn dự án:

```json
{
  "error": "Mô tả lỗi",
  "code": "ERROR_CODE",
  "details": {}
}
```

COBOL CGI trả lỗi dưới dạng JSON với field `status: "ERROR"` và `code`:

| COBOL Error Code | Node.js HTTP Status |
|-----------------|---------------------|
| `NOT_FOUND`     | 404                 |
| `DUPLICATE_CODE` | 409                |
| `DUPLICATE_EMAIL` | 409              |
| `VALIDATION_ERROR` | 400             |
| `DB_ERROR`      | 502                 |

---

## 5. Frontend Components

### 5.1 File Structure

```text
client/src/pages/employees/
├── EmployeeListPage.vue
├── EmployeeCreatePage.vue
├── EmployeeEditPage.vue
├── components/
│   ├── EmployeeTable.vue
│   ├── EmployeeFilters.vue
│   └── EmployeeForm.vue
├── composables/
│   └── useEmployees.ts
└── employees.routes.ts

client/src/
├── types/
│   └── employees.types.ts
├── services/
│   └── employees.service.ts
└── stores/
    └── employees.store.ts
```

### 5.2 Component Details

#### Layout Overview

```text
[DefaultLayout]
├── [Topbar]
├── [Sidebar] ← thêm menu item "Employees"
└── <router-view>
    ├── EmployeeListPage    <- /employees
    ├── EmployeeCreatePage  <- /employees/create
    └── EmployeeEditPage    <- /employees/:id/edit
```

Component relationships:

```text
EmployeeListPage
  ├── EmployeeFilters  emits: filter-change, clear
  └── EmployeeTable    emits: edit(id), delete(id)

EmployeeCreatePage
  └── EmployeeForm     emits: submit(data), cancel

EmployeeEditPage
  └── EmployeeForm     emits: submit(data), cancel
```

#### EmployeeListPage.vue

- Quản lý state filter, pagination
- Lắng nghe sự kiện từ EmployeeFilters và EmployeeTable
- Gọi store action để fetch data

**Flow - onMounted:**
1. Đọc query params từ URL (page, limit, search, department, status)
2. Khởi tạo filter state
3. Gọi `employeesStore.fetchEmployees(filters)`

**Flow - handleFilterChange(filters):**
1. Cập nhật filter state
2. Reset page về 1
3. Gọi `employeesStore.fetchEmployees(filters)`

#### EmployeeTable.vue

- Hiển thị PrimeVue DataTable với dữ liệu từ store
- Props: `employees`, `loading`, `pagination`
- Emits: `edit(id: number)`, `delete(id: number)`, `page-change(page: number)`

#### EmployeeFilters.vue

- Thanh tìm kiếm và các bộ lọc
- Emits: `filter-change(filters)`, `clear`

**Flow - handleSearchInput(value):**
1. Debounce 500ms
2. Emit `filter-change` với search value mới

#### EmployeeForm.vue

- Form dùng chung cho Create và Edit
- Sử dụng PrimeVue `InputText`, `Dropdown`, `InputNumber`, `Calendar`

**Props:**
- `mode`: `'create' | 'edit'`
- `initialData?`: `Employee | null`

**Emits:**
- `submit(formData: CreateEmployeeDto | UpdateEmployeeDto)`
- `cancel`

**Flow - handleSubmit():**
1. Validate tất cả fields (Zod / VeeValidate)
2. Nếu hợp lệ: emit `submit(formData)`
3. Nếu không hợp lệ: hiển thị lỗi inline

#### EmployeeCreatePage.vue

- Render `EmployeeForm` mode=`create`
- Lắng nghe `submit` → gọi `employeesStore.createEmployee(data)` → redirect `/employees`

#### EmployeeEditPage.vue

- onMounted: gọi `employeesStore.fetchEmployee(id)` để load dữ liệu
- Render `EmployeeForm` mode=`edit` với `initialData`
- Lắng nghe `submit` → gọi `employeesStore.updateEmployee(id, data)` → redirect `/employees`

### 5.3 Composable

#### useEmployees.ts

```typescript
// API calls (gọi employees.service.ts)
getEmployees(filters: EmployeeFilters): Promise<PaginatedResult<Employee>>
createEmployee(data: CreateEmployeeDto): Promise<Employee>
getEmployee(id: number): Promise<Employee>
updateEmployee(id: number, data: UpdateEmployeeDto): Promise<Employee>
deleteEmployee(id: number): Promise<void>

// Reactive state
employees: Ref<Employee[]>
loading: Ref<boolean>
error: Ref<string | null>
pagination: Ref<PaginationInfo>
```

### 5.4 Store Management

#### File: `client/src/stores/employees.store.ts`

```typescript
interface EmployeesState {
  employees: Employee[]
  currentEmployee: Employee | null
  pagination: PaginationInfo
  filters: EmployeeFilters
  loading: boolean
  error: string | null
}

// Actions
fetchEmployees(filters?: EmployeeFilters): Promise<void>
fetchEmployee(id: number): Promise<void>
createEmployee(data: CreateEmployeeDto): Promise<Employee>
updateEmployee(id: number, data: UpdateEmployeeDto): Promise<void>
deleteEmployee(id: number): Promise<void>
```

Store dependencies:

| Store | Role |
|-------|------|
| useEmployeesStore | Quản lý state nhân viên |
| useAuthStore | Cung cấp auth token |
| useUiStore | Hiển thị toast thành công / lỗi |

---

## 6. Sequence Diagrams

### 6.1 Create Flow

```text
Actor        Vue Frontend      Node.js           COBOL CGI        MySQL
  |               |               |                  |               |
  |-- Submit -->  |               |                  |               |
  |               |-- POST ------>|                  |               |
  |               |   /employees  | validate (Zod)   |               |
  |               |               |-- POST HTTP ----->|               |
  |               |               |  emp-create.cgi   |               |
  |               |               |                  |-- INSERT ---->|
  |               |               |                  |<-- OK --------|
  |               |               |<-- JSON 201 ------|               |
  |               |<-- 201 -------|                  |               |
  |<-- redirect   |               |                  |               |
```

### 6.2 Delete Flow

```text
Actor        Vue Frontend      Node.js           COBOL CGI        MySQL
  |               |               |                  |               |
  |-- Confirm --> |               |                  |               |
  |               |-- DELETE ---->|                  |               |
  |               |  /employees/:id verify JWT       |               |
  |               |               |-- DELETE HTTP --->|               |
  |               |               |  emp-delete.cgi   |               |
  |               |               |                  |-- DELETE ---->|
  |               |               |                  |<-- OK --------|
  |               |               |<-- JSON 200 ------|               |
  |               |<-- 200 -------|                  |               |
  |<-- toast OK   |               |                  |               |
```

---

## 7. Security Considerations

- **Authentication**: Tất cả API endpoint yêu cầu JWT token hợp lệ qua middleware `authenticateToken`
- **Authorization**: Chỉ role `admin` được phép truy cập, kiểm tra trong middleware `requireAdmin`
- **Input Validation**: Zod validate toàn bộ input tại Node.js trước khi chuyển đến COBOL; COBOL validate lại ở tầng business logic
- **SQL Injection Prevention**: COBOL dùng `EXEC SQL` với parameterized host variables, không nối chuỗi SQL trực tiếp
- **Sensitive Data Protection**: Trường `salary` chỉ hiển thị với admin; không log salary trong console
- **COBOL CGI Isolation**: Apache chạy CGI với user Unix riêng (không phải root); CGI process chỉ có quyền kết nối MySQL, không có quyền filesystem ngoài thư mục `build/`
- **Audit Trail**: Không áp dụng trong phiên bản này (ngoài scope)

---

## 8. Error Scenarios & Handling

| Scenario | Status | Response |
|----------|--------|----------|
| Chưa xác thực (thiếu/hết hạn token) | 401 | `"Not authenticated"` |
| Không phải admin | 403 | `"Forbidden"` |
| Dữ liệu đầu vào không hợp lệ | 400 | `"Validation error"` + chi tiết field |
| `employee_code` hoặc `email` đã tồn tại | 409 | `"Already exists"` |
| Không tìm thấy nhân viên | 404 | `"Employee not found"` |
| COBOL CGI không phản hồi / lỗi 5xx | 502 | `"COBOL service unavailable"` |
| Lỗi ODBC / MySQL từ COBOL | 502 | `"Database error"` |

---

## 9. Testing Strategy

### Backend Tests

- **Unit**: Test `CobolGateway` (employees.service.ts) bằng cách mock HTTP calls đến Apache; kiểm tra mapping lỗi COBOL → HTTP status
- **Integration**: Test các COBOL program trực tiếp qua curl đến Apache CGI với dữ liệu thật trong MySQL test database
- **Authorization**: Test middleware `requireAdmin` từ chối non-admin request

### Frontend Tests

- **Component**: Test `EmployeeForm` validate đúng, emit đúng sự kiện; test `EmployeeFilters` debounce search
- **Integration**: Test `EmployeeListPage` với mock store, kiểm tra filter → fetch → render flow
- **E2E**: Flow tạo, sửa, xóa nhân viên từ đầu đến cuối (Playwright)

---

## 10. Performance Considerations

- **Pagination**: Server-side pagination do COBOL xử lý với `EXEC SQL ... LIMIT :limit OFFSET :offset`
- **Filtering**: Các cột `department`, `status`, `email`, `employee_code` đã được đánh index
- **Search**: `full_name` và `email` dùng `LIKE '%search%'` — chấp nhận được với dữ liệu training (không cần full-text search)
- **Caching**: Không áp dụng — đây là môi trường training, không yêu cầu performance cao
- **Lazy Loading**: Vue router lazy load các page component (`() => import(...)`)
- **COBOL CGI overhead**: Mỗi request tạo 1 process mới — chấp nhận được cho mục đích training
