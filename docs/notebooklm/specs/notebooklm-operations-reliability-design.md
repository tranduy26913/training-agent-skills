---
title: NotebookLM Operations and Reliability Design
version: 1.0
author: Admin Team
date: 2026-05-07
status: Draft
---

# NotebookLM Operations and Reliability Design

## Executive Summary

Tài liệu này mô tả nhóm chức năng vận hành và độ tin cậy cho NotebookLM, tập trung vào quản trị queue jobs, retry policy, dead letter queue, giám sát tiến độ và xử lý sự cố. Mục tiêu là đảm bảo toàn hệ thống queue-driven hoạt động ổn định trong môi trường production nội bộ.

## Changelog

| Version | Date | Author | Summary |
|---------|------|--------|---------|
| 1.0 | 2026-05-07 | Admin Team | Initial design |

---

## 1. Objective & Scope

### Purpose

Thiết kế lớp vận hành đáng tin cậy cho pipeline xử lý nền, giúp theo dõi, kiểm soát và phục hồi job lỗi mà không làm mất dữ liệu hoặc làm sai lệch knowledge index.

### In Scope

- Trang monitor jobs cho admin.
- Theo dõi trạng thái `pending/processing/retrying/done/failed/dead_letter`.
- Retry thủ công cho job lỗi.
- Cơ chế DLQ và purge có kiểm soát.
- Chuẩn log lỗi và correlation id xuyên suốt request/job/worker.
- Cảnh báo vận hành cơ bản (queue backlog, tỷ lệ fail).

### Out of Scope

- Hệ thống quan sát tập trung quy mô enterprise (SIEM/APM đầy đủ).
- Auto-scaling hạ tầng theo tải realtime.
- Chaos engineering tự động.

---

## 2. Architecture

### 2.1 System Architecture

```text
[Admin UI]
  Job monitor, retry, DLQ actions
      |
   HTTP/REST
      |
[Express API Gateway]
  - Admin job endpoints
  - Metrics snapshot endpoints
  - Audit log writer
      |
    SQL queries
      |
[MySQL]
  - jobs
  - job_steps
  - dead_letter_jobs
  - audit_logs
      |
   consume / update
      |
[Python Worker Pool]
  - Lock job atomically
  - Heartbeat
  - Retry with backoff
  - Move to DLQ after max retries
```

### 2.2 Data Model

#### jobs/job_steps (Existing)
```sql
jobs {
  id: INT (PRIMARY KEY)
  type: ENUM('INGEST','QUERY','DELETE_DOC','DELETE_WORKSPACE')
  status: ENUM('pending','processing','retrying','done','failed','dead_letter')
  retry_count: INT
  max_retries: INT
  error_message: TEXT
  worker_id: VARCHAR(100)
  locked_at: TIMESTAMP
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
}
```

#### operations_tables (NEW)
```sql
dead_letter_jobs {
  id: INT (PRIMARY KEY)
  original_job_id: INT
  job_type: VARCHAR(50)
  payload: JSON
  failure_reason: TEXT
  moved_at: TIMESTAMP
}

job_metrics_daily {
  id: INT (PRIMARY KEY)
  metric_date: DATE
  job_type: VARCHAR(50)
  total_jobs: INT
  failed_jobs: INT
  avg_duration_ms: BIGINT
  created_at: TIMESTAMP
}

audit_logs {
  id: INT (PRIMARY KEY)
  actor_id: INT
  action: VARCHAR(100)
  target_type: VARCHAR(50)
  target_id: BIGINT
  detail: JSON
  created_at: TIMESTAMP
}
```

---

## 3. Feature Specifications

### 3.1 Job Monitor List Page (`/notebooklm/jobs`)

#### Display

- Bảng hiển thị job id, type, status, retry_count, worker_id, thời gian tạo/cập nhật.
- Cột progress tổng hợp từ `job_steps`.
- Badge màu theo status để nhận diện nhanh.

#### Filtering & Search

- Filter theo `type`, `status`, `workspace_id`, `date range`.
- Search theo `job id` hoặc `correlation id`.
- Option chỉ hiển thị job đang lỗi.

#### Pagination

- Server-side pagination.
- Mặc định 25 dòng/trang.
- Tùy chọn 25/50/100.

#### UX Interactions

- Mở chi tiết job để xem từng step.
- Retry job `failed`/`dead_letter`.
- Purge DLQ theo batch có confirm.

### 3.2 Create Retry Request Page (`/notebooklm/jobs/:id/retry`)

#### Form Fields

- **reason** (required): Lý do retry thủ công.
- **force** (optional): Cho phép retry bỏ qua một số kiểm tra an toàn đã định nghĩa.

#### Form Actions

- **Save**: Tạo lệnh retry.
- **Cancel**: Quay lại monitor.

#### Validation

- Chỉ admin mới được thực hiện.
- Chỉ cho retry khi status thuộc `failed` hoặc `dead_letter`.

### 3.3 Edit DLQ Item Page (`/notebooklm/jobs/dlq/:id/edit`)

#### Form Fields

- Payload hiển thị read-only.
- Trường `note` để ghi chú xử lý sự cố.

#### Form Actions

- **Save**: Lưu ghi chú vận hành.
- **Cancel**: Hủy chỉnh sửa.

#### Additional Panel (Optional)

- Panel lịch sử retry của job gốc.
- Panel liên kết tới logs worker.

#### Validations

- Chỉ admin có thể xem/sửa DLQ metadata.
- Không cho chỉnh payload gốc để tránh sai lệch lịch sử.

---

## 4. Backend API Specification

### 4.1 Endpoints

#### NBO-001 - GET /api/notebooklm/admin/jobs
**Lấy danh sách jobs cho admin monitor**

Flow:
1. Verify JWT token
2. Check admin permission
3. Validate query filters
4. Query jobs + pagination
5. Return result

Response (200 OK):
```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 0,
    "pages": 0
  }
}
```

Errors:
- 401: Not authenticated
- 403: Forbidden

---

#### NBO-002 - GET /api/notebooklm/admin/jobs/:id
**Chi tiết job và step logs**

Flow:
1. Verify JWT token
2. Check admin permission
3. Query job + job_steps
4. Return detail

Response (200 OK):
```json
{
  "data": {
    "id": 1,
    "steps": []
  }
}
```

---

#### NBO-003 - POST /api/notebooklm/admin/jobs/:id/retry
**Retry job lỗi thủ công**

Request Body:
```json
{
  "reason": "Vector DB restored"
}
```

Flow:
1. Verify JWT token
2. Check admin permission
3. Validate retry eligibility
4. Set status = pending, reset lock/worker pointer
5. Write audit log

Response (200 OK):
```json
{
  "data": {
    "jobId": 1,
    "status": "pending"
  }
}
```

Errors:
- 400: Invalid status for retry
- 404: Job not found

---

#### NBO-004 - GET /api/notebooklm/admin/dlq
**Lấy danh sách dead letter jobs**

Flow:
1. Verify JWT token
2. Check admin permission
3. Query DLQ items
4. Return list

Response (200 OK):
```json
{
  "data": []
}
```

---

#### NBO-005 - DELETE /api/notebooklm/admin/dlq
**Purge dead letter queue theo policy**

Flow:
1. Verify JWT token
2. Check admin permission
3. Validate purge scope
4. Delete selected DLQ items
5. Write audit log

Response (200 OK):
```json
{
  "message": "Deleted successfully"
}
```

### 4.2 Authorization

All endpoints require:
1. JWT verification
2. Role/permission validation

Special cases:
- Chỉ role `admin` mới có quyền monitor/retry/purge.
- `owner/editor/viewer` không truy cập endpoint admin operations.

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
client/src/pages/notebooklm/operations/
├── JobMonitorListPage.vue
├── RetryRequestCreatePage.vue
├── DlqItemEditPage.vue
├── components/
│   ├── JobMonitorTable.vue
│   ├── JobMonitorFilters.vue
│   ├── RetryRequestForm.vue
│   └── JobStepViewer.vue
├── composables/
│   └── useNotebooklmOperations.ts
└── operations.routes.ts
```

### 5.2 Component Details

#### Layout Overview

```text
[DefaultLayout]
├── [Topbar]
├── [Sidebar]
└── <router-view>
    ├── [JobMonitorListPage]      <- /notebooklm/jobs
    ├── [RetryRequestCreatePage]  <- /notebooklm/jobs/:id/retry
    └── [DlqItemEditPage]         <- /notebooklm/jobs/dlq/:id/edit
```

Component relationships:

```text
[JobMonitorListPage]
  |- [JobMonitorFilters] emits: filter-change
  |- [JobMonitorTable] emits: view, retry, purge
```

#### [ListPage].vue

- Áp dụng cho `JobMonitorListPage.vue`.
- Hiển thị backlog và tỷ lệ lỗi theo filter hiện tại.

**Flow - onMounted:**
1. Load jobs list
2. Render table and summary

**Flow - handleFilterChange(filters):**
1. Update filter state
2. Reload jobs

#### [Table].vue

- Áp dụng cho `JobMonitorTable.vue`.
- Cung cấp action retry và mở chi tiết.

#### [Filters].vue

- Áp dụng cho `JobMonitorFilters.vue`.
- Filter theo type/status/date range.

**Flow - handleSearchInput(value):**
1. Debounce
2. Emit filter-change

#### [Form].vue

- Áp dụng cho `RetryRequestForm.vue`.

**Props:**
- `mode`: `'create' | 'edit'`
- `initialData?`: RetryRequest

**Emits:**
- `submit(formData)`
- `cancel`

**Flow - handleSubmit():**
1. Validate fields
2. Emit submit if valid

#### [CreatePage].vue

- Áp dụng cho `RetryRequestCreatePage.vue`.
- Tạo yêu cầu retry có lý do.

#### [EditPage].vue

- Áp dụng cho `DlqItemEditPage.vue`.
- Cập nhật ghi chú xử lý vận hành.

#### [OptionalViewer].vue

- Áp dụng cho `JobStepViewer.vue`.
- Hiển thị timeline step của job.

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

#### File: client/src/stores/notebooklm-operations.store.ts

Use this state/getter/action pattern:

```typescript
interface NotebooklmOperationsState {
  items: JobItem[]
  currentItem: JobItem | null
  activityLogs: OperationAudit[]
  pagination: PaginationInfo
  filters: JobFilters
  loading: boolean
  error: string | null
}

// Actions
fetchItems(filters?: JobFilters): Promise<void>
fetchItem(id: number): Promise<void>
createItem(data: RetryRequestDto): Promise<JobItem>
updateItem(id: number, data: DlqNoteDto): Promise<void>
deleteItem(id: number): Promise<void>
fetchItemActivity(id: number): Promise<void>
```

Store dependencies:

| Store | Role |
|-------|------|
| useNotebooklmOperationsStore | Manage operations monitoring state |
| useAuthStore | Provide auth token/context |
| useUiStore | Show success/error toasts |

---

## 6. Sequence Diagrams

### 6.1 Create Flow

```text
Actor        Admin UI       Backend       Database      Worker
  |             |             |              |           |
  |-- Retry ---->|             |              |           |
  |             |-- POST ---->|-- UPDATE --->|           |
  |             |<-- 200 -----|              |           |
  |             |                             |-- poll -->|
  |             |                             |<-- done --|
```

### 6.2 Delete Flow

```text
Actor        Admin UI       Backend       Database
  |             |             |             |
  |-- Purge --->|             |             |
  |             |-- DELETE -->|-- DELETE -->|
  |             |<-- 200 -----|             |
```

---

## 7. Security Considerations

- Authentication: JWT bắt buộc và session timeout chuẩn.
- Authorization: Chỉ admin truy cập operations endpoints.
- Input Validation: Validate filter params, retry payload, purge scope.
- SQL Injection Prevention: Binding parameters.
- Sensitive Data Protection: Ẩn payload nhạy cảm khỏi UI thường, chỉ admin xem.
- Audit Trail: Bắt buộc log mọi thao tác retry/purge/manual override.

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
- Unit: retry eligibility, DLQ transition rules.
- Integration: failed job -> dead_letter -> manual retry.
- Authorization: admin-only endpoints.

### Frontend Tests
- Component: JobMonitorTable, JobStepViewer, RetryRequestForm.
- Integration: retry flow và cập nhật status realtime.
- E2E: Tạo lỗi ingest giả lập -> thấy trong DLQ -> retry thành công.

---

## 10. Performance Considerations
- Pagination: Bắt buộc cho jobs và DLQ lists.
- Filtering: Index theo status, type, created_at, updated_at.
- Search: Ưu tiên tìm theo job id/correlation id.
- Caching: Cache summary metrics ngắn hạn.
- Lazy Loading: Chỉ tải job_steps khi mở detail row.

---
