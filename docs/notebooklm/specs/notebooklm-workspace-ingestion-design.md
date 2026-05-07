---
title: NotebookLM Workspace and Ingestion Design
version: 1.0
author: Admin Team
date: 2026-05-07
status: Draft
---

# NotebookLM Workspace and Ingestion Design

## Executive Summary

Tài liệu này mô tả nhóm chức năng quản lý workspace tri thức và ingest tài liệu cho NotebookLM nội bộ. Mục tiêu là cho phép người dùng tạo workspace, phân quyền thành viên, upload tài liệu tối đa 100MB, và xử lý nền hoàn toàn qua MySQL queue bởi Python worker. Đây là nền tảng dữ liệu đầu vào cho toàn bộ các chức năng hỏi đáp phía sau.

## Changelog

| Version | Date | Author | Summary |
|---------|------|--------|---------|
| 1.0 | 2026-05-07 | Admin Team | Initial design |

---

## 1. Objective & Scope

### Purpose

Cung cấp luồng quản trị workspace và nhập liệu tài liệu chuẩn hóa, bảo đảm dữ liệu được lưu trữ trong MySQL, xử lý nền đáng tin cậy, và có khả năng chia sẻ theo nhóm người dùng chung dự án.

### In Scope

- Tạo, sửa, xóa workspace NotebookLM.
- Quản lý thành viên workspace theo vai trò `owner`, `editor`, `viewer`.
- Upload tài liệu định dạng `docx`, `pdf`, `xlsx`, `xls`, `md`, `csv`, `txt`.
- Giới hạn file tối đa 100MB, bắt buộc xử lý bất đồng bộ.
- Lưu file gốc vào MySQL (BLOB) và metadata tài liệu.
- Đẩy toàn bộ tác vụ ingest vào MySQL queue để Python worker xử lý.
- Theo dõi trạng thái ingest và tiến độ theo step.
- Xóa tài liệu phải đồng bộ xóa knowledge liên quan.

### Out of Scope

- Chat hỏi đáp và điều phối ngữ nghĩa chi tiết (được tách sang tài liệu chat).
- Dashboard vận hành chuyên sâu cho admin (được tách sang tài liệu operations).
- Đồng bộ file ra object storage ngoài database.

---

## 2. Architecture

### 2.1 System Architecture

```text
[Vue Frontend]
  Workspace pages, upload dialogs
      |
   HTTP/REST + SSE
      |
[Express API Gateway]
  - JWT validation
  - Workspace/member APIs
  - Document upload APIs
  - Job producer (MySQL queue)
      |
    SQL / Queue tables
      |
[MySQL]
  - workspaces
  - workspace_members
  - documents (BLOB)
  - jobs, job_steps
      |
   poll pending jobs
      |
[Python Worker]
  - Parse/OCR multi-language
  - Chunk + embedding
  - Index knowledge
      |
[Vector DB]
  - Store vectors, map by vector_id
```

### 2.2 Data Model

#### users (Existing)
```sql
users {
  id: INT (PRIMARY KEY)
  name: VARCHAR(100)
  email: VARCHAR(255)
  role: ENUM('admin','moderator','user')
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

#### workspace_ingestion_tables (NEW)
```sql
workspaces {
  id: INT (PRIMARY KEY)
  name: VARCHAR(255)
  description: TEXT
  owner_id: INT
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}

workspace_members {
  id: INT (PRIMARY KEY)
  workspace_id: INT
  user_id: INT
  role: ENUM('owner','editor','viewer')
  created_at: TIMESTAMP
}

documents {
  id: INT (PRIMARY KEY)
  workspace_id: INT
  uploaded_by: INT
  filename: VARCHAR(500)
  mime_type: VARCHAR(100)
  file_size: BIGINT
  file_data: LONGBLOB
  status: ENUM('pending','processing','indexed','failed','deleted')
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}

chunks {
  id: INT (PRIMARY KEY)
  document_id: INT
  workspace_id: INT
  chunk_index: INT
  chunk_text: TEXT
  vector_id: VARCHAR(255)
  created_at: TIMESTAMP
}

jobs {
  id: INT (PRIMARY KEY)
  type: ENUM('INGEST','DELETE_DOC','DELETE_WORKSPACE')
  status: ENUM('pending','processing','retrying','done','failed','dead_letter')
  payload: JSON
  retry_count: INT
  max_retries: INT
  error_message: TEXT
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}

job_steps {
  id: INT (PRIMARY KEY)
  job_id: INT
  step_name: VARCHAR(100)
  status: ENUM('pending','running','done','failed')
  progress_pct: TINYINT
  detail: TEXT
  started_at: TIMESTAMP
  finished_at: TIMESTAMP
}
```

---

## 3. Feature Specifications

### 3.1 Workspace List Page (`/notebooklm`)

#### Display

- Hiển thị danh sách workspace mà user sở hữu hoặc được chia sẻ.
- Mỗi item gồm: tên workspace, mô tả ngắn, vai trò của user, số lượng tài liệu.
- Có action `Edit`, `Delete`, `Share` theo quyền.

#### Filtering & Search

- Tìm kiếm theo tên workspace.
- Lọc theo vai trò (`owner`, `editor`, `viewer`).
- Lọc theo trạng thái hoạt động workspace (active/deleted logic mềm nếu có).

#### Pagination

- Server-side pagination.
- Mặc định 10 bản ghi/trang.
- Tùy chọn 10/25/50.

#### UX Interactions

- Nút tạo workspace mở form tạo nhanh.
- Chọn workspace điều hướng sang trang chi tiết.
- Xóa workspace tạo job nền `DELETE_WORKSPACE`.

### 3.2 Create Workspace Page (`/notebooklm/create`)

#### Form Fields

- **name** (required): Chuỗi 3-255 ký tự, unique theo owner.
- **description** (optional): Tối đa 1000 ký tự.

#### Form Actions

- **Save**: Validate -> gọi API tạo workspace -> về danh sách.
- **Cancel**: Quay lại danh sách không lưu.

#### Validation

- Client-side: required, max length.
- Server-side: required, unique name theo owner, sanitize input.

### 3.3 Edit Workspace Page (`/notebooklm/:id/edit`)

#### Form Fields

- `name`, `description` giống create.
- Role hiện tại của user ở chế độ read-only để tránh nhầm quyền.

#### Form Actions

- **Save**: Cập nhật metadata workspace.
- **Cancel**: Hủy chỉnh sửa.

#### Additional Panel (Optional)

- Panel thành viên workspace để thêm/xóa/chỉnh vai trò.
- Panel tài liệu để xem trạng thái ingest gần nhất.

#### Validations

- Chỉ `owner` hoặc `editor` được sửa metadata.
- Chỉ `owner` được thay đổi membership.

---

## 4. Backend API Specification

### 4.1 Endpoints

#### NBW-001 - GET /api/notebooklm/workspaces
**Lấy danh sách workspace của user**

Flow:
1. Verify JWT token
2. Resolve user permissions
3. Query workspace list + role
4. Return paginated result

Response (200 OK):
```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "pages": 0
  }
}
```

Errors:
- 401: Not authenticated
- 403: Forbidden

---

#### NBW-002 - POST /api/notebooklm/workspaces
**Tạo workspace mới**

Request Body:
```json
{
  "name": "Project A Knowledge",
  "description": "Workspace dùng chung dự án A"
}
```

Flow:
1. Verify JWT token
2. Validate request body
3. Insert workspace + owner membership
4. Return created workspace

Response (201 Created):
```json
{
  "data": {
    "id": 101
  }
}
```

Errors:
- 400: Validation error
- 409: Conflict name

---

#### NBW-003 - POST /api/notebooklm/workspaces/:id/documents
**Upload tài liệu và tạo job ingest**

Flow:
1. Verify JWT token
2. Check role (`editor` hoặc `owner`)
3. Validate file type and size
4. Save BLOB vào documents
5. Insert job type `INGEST`
6. Return documentId + jobId

Response (202 Accepted):
```json
{
  "data": {
    "documentId": 501,
    "jobId": 9001
  }
}
```

Errors:
- 400: Invalid file
- 403: Forbidden
- 413: Payload too large

---

#### NBW-004 - DELETE /api/notebooklm/workspaces/:id/documents/:docId
**Xóa tài liệu và knowledge liên quan qua queue**

Flow:
1. Verify JWT token
2. Check role (`editor` hoặc `owner`)
3. Insert job type `DELETE_DOC`
4. Return job id

Response (202 Accepted):
```json
{
  "data": {
    "jobId": 9002
  }
}
```

Errors:
- 404: Document not found

---

#### NBW-005 - GET /api/notebooklm/jobs/:jobId
**Lấy trạng thái job và tiến độ step**

Flow:
1. Verify JWT token
2. Check workspace access
3. Query jobs + job_steps
4. Return progress

Response (200 OK):
```json
{
  "data": {
    "status": "processing",
    "steps": []
  }
}
```

### 4.2 Authorization

All endpoints require:
1. JWT verification
2. Role/permission validation

Special cases:
- `viewer` chỉ có quyền xem danh sách tài liệu, không upload/xóa.
- Chỉ `owner` được xóa workspace.

### 4.3 Error Handling

All errors must follow this format:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

---

## 5. Frontend Components

### 5.1 File Structure

```text
client/src/pages/notebooklm/workspace/
├── WorkspaceListPage.vue
├── WorkspaceCreatePage.vue
├── WorkspaceEditPage.vue
├── components/
│   ├── WorkspaceTable.vue
│   ├── WorkspaceFilters.vue
│   ├── WorkspaceForm.vue
│   └── DocumentIngestionViewer.vue
├── composables/
│   └── useWorkspaceIngestion.ts
└── workspace.routes.ts
```

### 5.2 Component Details

#### Layout Overview

```text
[DefaultLayout]
├── [Topbar]
├── [Sidebar]
└── <router-view>
    ├── [WorkspaceListPage]    <- /notebooklm
    ├── [WorkspaceCreatePage]  <- /notebooklm/create
    └── [WorkspaceEditPage]    <- /notebooklm/:id/edit
```

Component relationships:

```text
[WorkspaceListPage]
  |- [WorkspaceFilters] emits: filter-change
  |- [WorkspaceTable] emits: edit, delete, open
```

#### [ListPage].vue

- Áp dụng cho `WorkspaceListPage.vue`.
- Tải danh sách workspace và bind filter.

**Flow - onMounted:**
1. Load workspace list
2. Render table/cards

**Flow - handleFilterChange(filters):**
1. Update query params
2. Reload list

#### [Table].vue

- Áp dụng cho `WorkspaceTable.vue`.
- Hiển thị dữ liệu và phát actions theo quyền.

#### [Filters].vue

- Áp dụng cho `WorkspaceFilters.vue`.
- Điều khiển search và role filter.

**Flow - handleSearchInput(value):**
1. Debounce input
2. Emit filter-change

#### [Form].vue

- Áp dụng cho `WorkspaceForm.vue`.

**Props:**
- `mode`: `'create' | 'edit'`
- `initialData?`: Workspace

**Emits:**
- `submit(formData)`
- `cancel`

**Flow - handleSubmit():**
1. Validate fields
2. Emit submit if valid

#### [CreatePage].vue

- Bọc `WorkspaceForm` với mode create.

#### [EditPage].vue

- Bọc `WorkspaceForm` với mode edit + member panel.

#### [OptionalViewer].vue

- Áp dụng cho `DocumentIngestionViewer.vue`.
- Hiển thị trạng thái ingest, tiến độ step, retry action.

### 5.3 Composable

#### use[Feature].ts
```typescript
// API calls
getItems(filters)
createItem(data)
getItem(id)
updateItem(id, data)
deleteItem(id)
getItemActivity(id)

// State management
items: Ref<Item[]>
loading: Ref<boolean>
error: Ref<string>
pagination: Ref<PaginationInfo>
```

### 5.4 Store Management

#### File: client/src/stores/notebooklm-workspace.store.ts

Use this state/getter/action pattern:

```typescript
interface WorkspaceIngestionState {
  items: Workspace[]
  currentItem: Workspace | null
  activityLogs: JobLog[]
  pagination: PaginationInfo
  filters: WorkspaceFilters
  loading: boolean
  error: string | null
}

// Actions
fetchItems(filters?: WorkspaceFilters): Promise<void>
fetchItem(id: number): Promise<void>
createItem(data: CreateWorkspaceDto): Promise<Workspace>
updateItem(id: number, data: UpdateWorkspaceDto): Promise<void>
deleteItem(id: number): Promise<void>
fetchItemActivity(id: number): Promise<void>
```

Store dependencies:

| Store | Role |
|-------|------|
| useNotebooklmWorkspaceStore | Manage workspace and ingestion state |
| useAuthStore | Provide auth token/context |
| useUiStore | Show success/error toasts |

---

## 6. Sequence Diagrams

### 6.1 Create Flow

```text
Actor        Frontend      Backend       Database      Worker
  |             |             |              |           |
  |-- Upload -->|             |              |           |
  |             |-- POST ---->|-- INSERT --> |           |
  |             |             |-- INSERT job->|           |
  |             |<-- 202 -----|              |           |
  |             |                             |-- poll -->|
  |             |                             |<-- done --|
```

### 6.2 Delete Flow

```text
Actor        Frontend      Backend       Database      Worker
  |             |             |              |           |
  |-- Delete -->|             |              |           |
  |             |-- DELETE -->|-- INSERT job->|          |
  |             |<-- 202 -----|              |           |
  |             |                             |-- poll -->|
  |             |                             |<-- done --|
```

---

## 7. Security Considerations

- Authentication: Bắt buộc JWT cho mọi endpoint.
- Authorization: RBAC theo `owner/editor/viewer`.
- Input Validation: Kiểm tra mime type, kích thước, tên file, workspace id.
- SQL Injection Prevention: Prepared statements/ORM query binding.
- Sensitive Data Protection: BLOB chỉ truy cập qua API có quyền.
- Audit Trail: Log hành động upload/xóa/chia sẻ workspace.

---

## 8. Error Scenarios & Handling

| Scenario | Status | Response |
|----------|--------|----------|
| Not authenticated | 401 | "Not authenticated" |
| Forbidden | 403 | "Forbidden" |
| Validation failed | 400 | "Validation error" |
| Conflict | 409 | "Already exists" |
| Not found | 404 | "Not found" |
| Database error | 500 | "Internal server error" |

---

## 9. Testing Strategy

### Backend Tests
- Unit: Validate workspace/member/document rules.
- Integration: Upload endpoint lưu BLOB + tạo job queue.
- Authorization: Kiểm tra quyền owner/editor/viewer.

### Frontend Tests
- Component: WorkspaceForm, WorkspaceTable, DocumentIngestionViewer.
- Integration: Upload flow + job progress polling/SSE.
- E2E: Tạo workspace -> upload tài liệu -> thấy trạng thái indexed.

---

## 10. Performance Considerations
- Pagination: Server-side cho workspace và document list.
- Filtering: Index cột workspace_id, owner_id, status.
- Search: Prefix search theo workspace name.
- Caching: Cache ngắn hạn metadata workspace.
- Lazy Loading: Tải chi tiết document/job khi user mở workspace.

---
