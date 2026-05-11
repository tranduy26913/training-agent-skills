---
title: NotebookLM Chat and Retrieval Design
version: 1.0
author: Admin Team
date: 2026-05-07
status: Draft
---

# NotebookLM Chat and Retrieval Design

## Executive Summary

Tài liệu này mô tả nhóm chức năng chat hỏi đáp dựa trên tri thức đã ingest. Mọi truy vấn chat đều được đưa vào queue để Python worker xử lý nền: tạo embedding câu hỏi, truy hồi vector theo workspace, tạo câu trả lời qua Ollama nội bộ, và trả về kèm nguồn trích dẫn.

## Changelog

| Version | Date | Author | Summary |
|---------|------|--------|---------|
| 1.0 | 2026-05-07 | Admin Team | Initial design |
| 1.1 | 2026-05-11 | Admin Team | Add ChatPanel user-message display, optimistic update, Ollama model config, mock server |

---

## 1. Objective & Scope

### Purpose

Cung cấp trải nghiệm chat theo workspace cho người dùng cá nhân và nhóm dự án, với câu trả lời có dẫn nguồn và đảm bảo tách biệt dữ liệu giữa các workspace.

### In Scope

- Quản lý chat session theo workspace.
- Gửi câu hỏi tạo job `QUERY` vào MySQL queue.
- Python worker xử lý retrieval và generation bằng Ollama nội bộ.
- Trả câu trả lời kèm danh sách nguồn trích dẫn.
- Hỗ trợ multi-language prompt/context (VN/EN/JP).
- Lưu lịch sử chat để truy xuất lại.

### Out of Scope

- Streaming token theo từng chữ từ model.
- Agentic tool-calling hoặc workflow đa bước phức tạp.
- Tùy chọn nhiều model theo workspace.

---

## 2. Architecture

### 2.1 System Architecture

```text
[Frontend Chat UI]
  - Sessions list
  - Messages thread
  - Source citations
      |
   HTTP/REST + SSE
      |
[Express API Gateway]
  - Create session/message
  - Enqueue QUERY job
  - Expose job stream
      |
     MySQL jobs
      |
[Python Worker]
  1) Embed question
  2) Retrieve top-k vectors by workspace filter
  3) Build grounded prompt
  4) Generate answer by Ollama
  5) Persist assistant message + sources
      |
[Vector DB] + [MySQL chunks/messages]
```

### 2.2 Data Model

#### documents/chunks (Existing)
```sql
documents {
  id: INT (PRIMARY KEY)
  workspace_id: INT
  status: ENUM('pending','processing','indexed','failed','deleted')
}

chunks {
  id: INT (PRIMARY KEY)
  document_id: INT
  workspace_id: INT
  chunk_text: TEXT
  vector_id: VARCHAR(255)
}
```

#### chat_tables (NEW)
```sql
chat_sessions {
  id: INT (PRIMARY KEY)
  workspace_id: INT
  user_id: INT
  title: VARCHAR(255)
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}

chat_messages {
  id: INT (PRIMARY KEY)
  session_id: INT
  role: ENUM('user','assistant')
  content: LONGTEXT
  sources: JSON
  job_id: INT
  created_at: TIMESTAMP
}

jobs {
  id: INT (PRIMARY KEY)
  type: ENUM('QUERY')
  status: ENUM('pending','processing','retrying','done','failed','dead_letter')
  payload: JSON
  result: JSON
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
}
```

---

## 3. Feature Specifications

### 3.1 Chat Session List Page (`/notebooklm/:workspaceId/chat`)

#### Display

- Sidebar hiển thị danh sách session theo workspace.
- Mỗi session gồm tiêu đề, thời gian cập nhật cuối, số tin nhắn.
- Session hiện tại được highlight rõ.

#### Filtering & Search

- Tìm theo tiêu đề session.
- Lọc theo khoảng thời gian tạo/cập nhật.
- Có thể sắp xếp theo `updated_at` giảm dần.

#### Pagination

- Server-side pagination cho danh sách session.
- Mặc định 20 session/trang.
- Tùy chọn 20/50.

#### UX Interactions

- Nút tạo session mới.
- Chọn session để tải message history.
- Đổi tiêu đề session trực tiếp.

### 3.2 Create Session Page (`/notebooklm/:workspaceId/chat/create`)

#### Form Fields

- **title** (optional): Tối đa 255 ký tự.
- Nếu bỏ trống, backend sinh tiêu đề mặc định theo timestamp.

#### Form Actions

- **Save**: Tạo session và chuyển tới màn chat.
- **Cancel**: Quay lại danh sách session.

#### Validation

- Client-side: max length.
- Server-side: workspace access + sanitize text.

### 3.3 Edit Session Page (`/notebooklm/:workspaceId/chat/:sessionId/edit`)

#### Form Fields

- **title** (required): 1-255 ký tự.
- Thông tin owner session hiển thị read-only.

#### Form Actions

- **Save**: Cập nhật tiêu đề.
- **Cancel**: Hủy thay đổi.

#### Additional Panel (Optional)

- Panel message thread để xem lịch sử hội thoại.
- Panel source viewer để xem đoạn trích nguồn đã dùng.

#### Validations

- User chỉ được chỉnh session thuộc workspace có quyền truy cập.
- Session đã bị archive thì không cho sửa (nếu có cờ archive).

---

## 4. Backend API Specification

### 4.1 Endpoints

#### NBC-001 - GET /api/notebooklm/workspaces/:id/sessions
**Lấy danh sách chat session**

Flow:
1. Verify JWT token
2. Check workspace access
3. Query sessions
4. Return pagination

Response (200 OK):
```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "pages": 0
  }
}
```

Errors:
- 401: Not authenticated
- 403: Forbidden

---

#### NBC-002 - POST /api/notebooklm/workspaces/:id/sessions
**Tạo chat session mới**

Request Body:
```json
{
  "title": "Phân tích tài liệu dự án A"
}
```

Flow:
1. Verify JWT token
2. Check workspace access
3. Validate body
4. Insert chat_sessions row
5. Return session

Response (201 Created):
```json
{
  "data": {
    "id": 701
  }
}
```

---

#### NBC-003 - POST /api/notebooklm/sessions/:id/messages
**Gửi câu hỏi và enqueue QUERY job**

Request Body:
```json
{
  "content": "Tóm tắt điểm chính trong các tài liệu đã upload"
}
```

Flow:
1. Verify JWT token
2. Check session/workspace access
3. Insert user message
4. Insert job type `QUERY`
5. Return job id

Response (202 Accepted):
```json
{
  "data": {
    "jobId": 9101
  }
}
```

Errors:
- 400: Validation error
- 404: Session not found

---

#### NBC-004 - GET /api/notebooklm/sessions/:id/messages
**Lấy lịch sử message của session**

Flow:
1. Verify JWT token
2. Check workspace access
3. Query messages sorted by created_at
4. Return list

Response (200 OK):
```json
{
  "data": []
}
```

---

#### NBC-005 - GET /api/notebooklm/jobs/:jobId/stream
**Theo dõi tiến độ QUERY job qua SSE**

Flow:
1. Verify JWT token
2. Check job ownership via workspace membership
3. Stream progress events
4. Emit done/failed event

Response (200 OK):
```json
{
  "data": {}
}
```

### 4.2 Authorization

All endpoints require:
1. JWT verification
2. Role/permission validation

Special cases:
- `viewer` được phép chat và xem lịch sử.
- User không được truy cập session của workspace ngoài quyền được chia sẻ.

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
client/src/pages/notebooklm/chat/
├── ChatSessionListPage.vue
├── ChatSessionCreatePage.vue
├── ChatSessionEditPage.vue        ← chứa ChatPanel, xử lý gửi/nhận tin
├── components/
│   ├── ChatPanel.vue               ← khung chat chính (message list + input)
│   ├── ChatMessageBubble.vue       ← bong bóng tin nhắn (user: phải, assistant: trái)
│   ├── ChatSessionTable.vue
│   ├── ChatSessionFilters.vue
│   ├── ChatSessionForm.vue
│   └── RetrievalSourceViewer.vue
├── composables/
│   └── useChatRetrieval.ts
└── chat.routes.ts
```

### 5.2 Component Details

#### Layout Overview

```text
[DefaultLayout]
├── [Topbar]
├── [Sidebar]
└── <router-view>
    ├── [ChatSessionListPage]    <- /notebooklm/:workspaceId/chat
    ├── [ChatSessionCreatePage]  <- /notebooklm/:workspaceId/chat/create
    └── [ChatSessionEditPage]    <- /notebooklm/:workspaceId/chat/:sessionId/edit
```

Component relationships:

```text
[ChatSessionEditPage]
  |- [ChatSessionForm] emits: submit, cancel
  |- [RetrievalSourceViewer] emits: select-source
```

#### [ListPage].vue

- Áp dụng cho `ChatSessionListPage.vue`.
- Hiển thị session list và thao tác mở session.

**Flow - onMounted:**
1. Load sessions
2. Render list

**Flow - handleFilterChange(filters):**
1. Update filters
2. Reload sessions

#### [Table].vue

- Áp dụng cho `ChatSessionTable.vue`.
- Hiển thị các session và nút mở/chỉnh sửa.

#### [Filters].vue

- Áp dụng cho `ChatSessionFilters.vue`.
- Tìm kiếm session theo title.

**Flow - handleSearchInput(value):**
1. Debounce
2. Emit filter-change

#### [Form].vue

- Áp dụng cho `ChatSessionForm.vue`.

**Props:**
- `mode`: `'create' | 'edit'`
- `initialData?`: ChatSession

**Emits:**
- `submit(formData)`
- `cancel`

**Flow - handleSubmit():**
1. Validate title
2. Emit submit if valid

#### [CreatePage].vue

- Tạo session mới trước khi vào màn hội thoại.

#### [EditPage].vue

- Quản lý message thread, gửi câu hỏi, theo dõi tiến độ job.

#### [ChatPanel].vue

- Áp dụng cho `ChatPanel.vue`.
- Hiển thị toàn bộ lịch sử message của session hiện tại.
- Chứa textarea nhập câu hỏi và nút Send.
- **Tin nhắn người dùng hiển thị bên phải** (via `ChatMessageBubble` với class `justify-end`).
- **Tin nhắn assistant hiển thị bên trái** (class `justify-start`).
- Spinner loading hiển thị khi đang chờ phản hồi từ worker.
- Send button bị disabled khi input rỗng hoặc đang loading.
- Phím `Enter` gửi tin; `Shift+Enter` xuống dòng.

**Props:**
- `messages: ChatMessage[]` — danh sách tin nhắn hiện tại.
- `loading: boolean` — trạng thái chờ phản hồi.

**Emits:**
- `send(content: string)` — khi người dùng bấm Send hoặc nhấn Enter.

**data-testid:**
- `chat-panel` — wrapper Card.
- `chat-message-input` — Textarea nhập câu hỏi.
- `chat-send-btn` — Button gửi.

#### [ChatMessageBubble].vue

- Áp dụng cho `ChatMessageBubble.vue`.
- Nhận một `message: ChatMessage` và render bong bóng chat.
- `role === 'user'` → `justify-end` (phải), nền `bg-primary text-white`.
- `role === 'assistant'` → `justify-start` (trái), nền `bg-surface-100`.
- Nếu assistant có `sources`, render `RetrievalSourceViewer` bên dưới nội dung.
- `isUser` được tính bằng `computed(() => props.message.role === 'user')` để đảm bảo reactivity.

**Props:**
- `message: ChatMessage`.

#### [OptionalViewer].vue

- Áp dụng cho `RetrievalSourceViewer.vue`.
- Hiển thị các đoạn trích dẫn theo từng câu trả lời.

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

#### File: client/src/stores/notebooklm-chat.store.ts

Use this state/getter/action pattern:

```typescript
interface ChatRetrievalState {
  sessions: ChatSession[]
  currentSession: ChatSession | null
  messages: ChatMessage[]          // messages của session hiện tại
  currentWorkspaceId: number | null
  pagination: PaginationInfo
  loading: boolean                 // loading danh sách session
  loadingMessages: boolean         // loading khi gửi/nhận tin
  error: string | null
}

// Actions
fetchSessions(workspaceId: number, filters?: ChatSessionFilters): Promise<void>
createSession(workspaceId: number, dto: CreateChatSessionDto): Promise<ChatSession>
updateSession(sessionId: number, dto: UpdateChatSessionDto): Promise<void>
fetchMessages(sessionId: number): Promise<void>
sendMessage(sessionId: number, dto: SendMessageDto): Promise<void>
clearCurrentSession(): void
```

#### sendMessage — Optimistic Update Pattern

Để tin nhắn người dùng hiển thị ngay lập tức (không đợi polling):

```text
1. loadingMessages = true
2. Tạo optimisticMessage { id: -(Date.now()), role: 'user', ... }
3. messages = [...messages, optimisticMessage]   ← UI cập nhật ngay!
4. Gọi API POST /sessions/:id/messages  → nhận { jobId }
5. Poll getJobProgress(jobId) tối đa 60 lần (mỗi 1.5s)
6. Sau khi job done/failed: messages = await getMessages(sessionId)
   ↑ dữ liệu thực từ DB thay thế bản optimistic
7. Nếu lỗi: lọc bỏ optimisticMessage khỏi messages (rollback)
```

Kết quả:
- Tin nhắn người dùng xuất hiện **ngay** khi nhấn Send (không đợi ~90s polling).
- Sau khi worker xử lý xong, cả user message + assistant reply đều thay thế từ DB.

Store dependencies:

| Store | Role |
|-------|------|
| useNotebooklmChatStore | Manage chat and retrieval state |
| useAuthStore | Provide auth token/context |
| useUiStore | Show success/error toasts |

---

## 6. Sequence Diagrams

### 6.1 Send Message Flow (với Optimistic Update)

```text
Actor        Frontend (UI)    Frontend (Store)   Backend       Queue/DB      Worker       Ollama
  |               |                 |               |             |             |            |
  |-- Type Q ---->|                 |               |             |             |            |
  |-- Send ------->handleSend()     |               |             |             |            |
  |               |--sendMessage()-->               |             |             |            |
  |               |                 |               |             |             |            |
  |               |  [OPTIMISTIC]   |               |             |             |            |
  |               |  messages=[     |               |             |             |            |
  |               |   {role:user}   |               |             |             |            |
  |               |  ]              |               |             |             |            |
  |<-- Show Q RIGHT (instant) ------+               |             |             |            |
  |               |                 |--POST-------->|--INSERT msg->|            |            |
  |               |                 |               |--job QUERY-->|            |            |
  |               |                 |<--- 202 jobId-|             |            |            |
  |               |                 |  poll status  |             |            |            |
  |               |                 |  (1.5s×60)    |             |-- consume-->|-- infer -->|
  |               |                 |               |             |<-- result--|<-- text ---|
  |               |                 |               |<-- job done-|            |            |
  |               |                 |--GET messages->             |            |            |
  |<-- Show A LEFT (from DB) --------+               |            |            |            |
```

**Optimistic Update:**
- Bước `[OPTIMISTIC]`: tin nhắn người dùng được thêm vào `messages` **ngay lập tức** với `id` âm tạm thời.
- Sau khi polling xong, toàn bộ `messages` được thay thế bằng dữ liệu từ DB.
- Nếu API call lỗi: `filter` loại bỏ message optimistic (rollback).

### 6.2 Delete Flow

```text
Actor        Frontend      Backend       Database
  |             |             |             |
  |-- Delete -->|             |             |
  |             |-- DELETE -->|-- DELETE -->|
  |             |<-- 200 -----|             |
```

---

## 7. Security Considerations

- Authentication: JWT bắt buộc.
- Authorization: Ràng buộc workspace membership cho từng session/message.
- Input Validation: Giới hạn độ dài câu hỏi, chống prompt injection cơ bản bằng policy layer.
- SQL Injection Prevention: Parameterized queries.
- Sensitive Data Protection: Không trả chunks ngoài phạm vi workspace.
- Audit Trail: Ghi nhận truy vấn chat và nguồn dữ liệu sử dụng.

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
- Unit: Prompt builder, source ranking, citation formatting.
- Integration: QUERY job end-to-end từ enqueue tới lưu assistant message.
- Authorization: Session/workspace access boundary.

### Frontend Tests
- Component: Chat panel, message bubble, source viewer.
- Integration: Send message -> job progress -> render answer.
- E2E: Hỏi đáp trong workspace có tài liệu indexed.

---

## 10. Performance Considerations
- Pagination: Sessions và messages cần pagination/infinite scroll.
- Filtering: Index theo workspace_id, session_id, created_at.
- Search: Full-text search session title nếu cần.
- Caching: Cache ngắn hạn top-k retrieval metadata.
- Lazy Loading: Chỉ tải messages khi mở session cụ thể.

---

## 11. LLM Integration — Ollama Model

### 11.1 Overview

Python Query Worker gọi Ollama HTTP API để sinh câu trả lời dựa trên context đã retrieval.

### 11.2 Configuration

| Biến môi trường | Mặc định | Mô tả |
|-----------------|----------|-------|
| `LLM_API_URL` | `http://localhost:11434` | Base URL của Ollama server |
| `LLM_MODEL` | `llama3` | Tên model sử dụng để generate |

### 11.3 API Call

```http
POST {LLM_API_URL}/api/generate
Content-Type: application/json

{
  "model": "{LLM_MODEL}",
  "prompt": "Context:\n{retrieved_chunks}\n---\nQuestion: {user_question}\nAnswer:",
  "stream": false
}
```

Response:
```json
{
  "model": "llama3",
  "response": "Câu trả lời được sinh...",
  "done": true
}
```

### 11.4 Prompt Structure

```text
Context:
{chunk_1_text}
{chunk_2_text}
...
---
Question: {user_question}
Answer:
```

- Tối đa `top_k=5` chunks được đưa vào context.
- Chunks được lọc theo `workspace_id` để đảm bảo data isolation.
- Nếu không có chunks phù hợp, worker vẫn gọi LLM với context rỗng.

### 11.5 Retry & Error Handling

- `OllamaClient` sử dụng `urllib` (không cần dependency ngoài).
- Timeout: 30s per request.
- Nếu Ollama không khả dụng: job `failed`, assistant message không được tạo.
- Error được ghi vào `jobs.error_message` và `job_steps`.

---

## 12. Mock Ollama Server (Dev & Test)

### 12.1 Mục đích

Server giả lập Ollama để phát triển và kiểm thử mà không cần cài model LLM thực.

### 12.2 Vị trí file

```text
python-services/mock_ollama_server.py
```

### 12.3 Khởi động

```bash
# Mặc định port 11434
python python-services/mock_ollama_server.py

# Tùy chỉnh port và delay
python python-services/mock_ollama_server.py --port 11434 --delay 0.2
```

Hoặc qua biến môi trường:
```bash
MOCK_OLLAMA_PORT=11434 MOCK_OLLAMA_DELAY=0.5 python python-services/mock_ollama_server.py
```

### 12.4 Endpoints

#### GET /api/tags
Trả về danh sách model giả:
```json
{
  "models": [
    { "name": "llama3:latest", "size": 4200000000 }
  ]
}
```

#### POST /api/generate
Trích xuất dòng `Question:` từ prompt và trả về câu trả lời mock:
```json
{
  "model": "llama3",
  "response": "[Mock Ollama] This is a mock response for question: {extracted_question}.",
  "done": true,
  "total_duration": 123456789
}
```

### 12.5 Cấu hình chạy toàn bộ pipeline với Mock

```bash
# Terminal 1 — Start mock Ollama
python python-services/mock_ollama_server.py --port 11434

# Terminal 2 — Start query worker trỏ tới mock
LLM_API_URL=http://localhost:11434 python python-services/run_worker.py

# Terminal 3 — Start API server
npm run dev:debug --prefix server

# Terminal 4 — Start frontend
npm run dev --prefix client
```

### 12.6 Sử dụng trong E2E Tests

E2E spec tại `client/e2e/notebooklm-chat-retrieval.spec.ts` (Section 6) tự động:
1. Kiểm tra mock server có đang chạy qua `GET /api/tags`.
2. Bỏ qua (`test.skip`) nếu không tìm thấy mock server.
3. Kiểm tra phản hồi chứa `"mock ollama"` để xác nhận tích hợp đúng.

---
