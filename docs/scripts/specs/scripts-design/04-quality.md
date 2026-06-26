---
title: Script Management - Quality & Operations
version: 1.0
author: Admin Team
date: 2026-06-25
---

# Script Management — Quality & Operations

> Related: [00-index.md](./00-index.md) | [01-backend.md](./01-backend.md) | [02-frontend.md](./02-frontend.md) | [03-behavior.md](./03-behavior.md)

---

## 1. Testing Strategy

### 1.1 Backend Tests

> **Rule:** Tất cả backend tests trong 1 file: `server/src/modules/admin/scripts/scripts.controller.test.ts`
> Sử dụng database test, chạy migrations trước tests.

#### Unit Tests (service layer)

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Create script - success (draft) | Valid input, content=null, status=draft | Call create method | Returns entity with id, ownerId, status='draft' |
| 2 | Create script - success (generated) | Valid input, content=JSON string, status=generated | Call create method | Returns entity with status='generated' |
| 3 | Create script - validation error (title too short) | title = "A" | Call create method | Throws validation error |
| 4 | Create script - validation error (idea too short) | idea = "Short" | Call create method | Throws validation error |
| 5 | Create script - validation error (characterCount 0) | characterCount = 0 | Call create method | Throws validation error |
| 6 | Create script - validation error (vibe empty) | vibe = [] | Call create method | Throws validation error |
| 7 | Create script - project not found | projectId = 999 | Call create method | Throws 404 error |
| 8 | Get script by ID - found | Existing script ID | Call getById method | Returns correct script with projectName, ownerName |
| 9 | Get script by ID - not found | Non-existing ID | Call getById method | Throws 404 error |
| 10 | Get script by ID - soft deleted | Deleted script ID | Call getById method | Throws 404 error |
| 11 | List scripts by project - returns only non-deleted | 3 scripts (1 deleted) for projectId=1 | Call list method | Returns 2 scripts, sorted by updatedAt desc |
| 12 | List scripts by project - filter by projectId | Scripts for projectId=1 and projectId=2 | Call list(1) | Returns only scripts for projectId=1 |
| 13 | Update script - success | Valid update data | Call update method | Modifies and returns entity |
| 14 | Update script - not found | Non-existing ID | Call update method | Throws 404 error |
| 15 | Update script - partial update | Only update title | Call update method | Only title changed, other fields unchanged |
| 16 | Update script - status changes with content | Update content from null to JSON | Call update method | status changes from 'draft' to 'generated' |
| 17 | Delete script - success (soft delete) | Existing script ID | Call delete method | Sets isDeleted = true |
| 18 | Delete script - already deleted | Deleted script ID | Call delete method | Throws 404 error |
| 19 | Generate script - success | Valid GenerateScriptDto, provider registered | Call generate method | Returns content string + model + provider |
| 20 | Generate script - provider not registered | aiModel with unregistered provider | Call generate method | Throws 503 error |
| 21 | Generate script - AI provider error | Provider API returns error | Call generate method | Throws 502 error |
| 22 | Generate script - unknown model prefix | aiModel = "unknown-model" | Call generate method | Throws 400 error |
| 23 | Get AI models - returns list | 2 providers registered | Call getAiModels method | Returns array of AiModelInfo with provider + models |

#### Integration Tests (HTTP endpoints)

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | GET list — authenticated, returns data | Mock admin, existing scripts | GET `/api/admin/scripts?projectId=1` | 200 with data[] |
| 2 | GET list — missing projectId, 400 | Mock admin, no projectId | GET `/api/admin/scripts` | 400 |
| 3 | GET list — unauthenticated, 401 | No auth header | GET `/api/admin/scripts?projectId=1` | 401 |
| 4 | GET list — non-admin, 403 | Mock user role | GET `/api/admin/scripts?projectId=1` | 403 |
| 5 | POST create — valid body (draft), 201 | Mock admin, content=null | POST `/api/admin/scripts` | 201 with status='draft' |
| 6 | POST create — valid body (generated), 201 | Mock admin, content=JSON | POST `/api/admin/scripts` | 201 with status='generated' |
| 7 | POST create — invalid body (short title), 400 | Mock admin, title="A" | POST `/api/admin/scripts` | 400 |
| 8 | POST create — project not found, 404 | Mock admin, projectId=999 | POST `/api/admin/scripts` | 404 |
| 9 | GET by id — existing, 200 | Mock admin, existing script | GET `/api/admin/scripts/1` | 200 with script data |
| 10 | GET by id — non-existing, 404 | Mock admin, unknown ID | GET `/api/admin/scripts/999` | 404 |
| 11 | PUT update — existing, 200 | Mock admin, valid update | PUT `/api/admin/scripts/1` | 200 with updated script |
| 12 | PUT update — non-existing, 404 | Mock admin, unknown ID | PUT `/api/admin/scripts/999` | 404 |
| 13 | PUT update — invalid body, 400 | Mock admin, title too long | PUT `/api/admin/scripts/1` | 400 |
| 14 | DELETE — existing, 200 | Mock admin, existing script | DELETE `/api/admin/scripts/1` | 200 with success |
| 15 | DELETE — non-existing, 404 | Mock admin, unknown ID | DELETE `/api/admin/scripts/999` | 404 |
| 16 | POST generate — valid, 200 | Mock admin, valid GenerateScriptDto, provider registered | POST `/api/admin/scripts/generate` | 200 with content |
| 17 | POST generate — invalid body, 400 | Mock admin, missing aiModel | POST `/api/admin/scripts/generate` | 400 |
| 18 | POST generate — provider error, 502 | Mock admin, provider throws | POST `/api/admin/scripts/generate` | 502 |
| 19 | GET ai-models — authenticated, 200 | Mock admin, providers registered | GET `/api/admin/ai-models` | 200 with AiModelInfo[] |
| 20 | GET ai-models — non-admin, 403 | Mock user role | GET `/api/admin/ai-models` | 403 |

#### Authorization Tests

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Admin can access list | Mock user with role "admin" | GET `/api/admin/scripts?projectId=1` | 200 |
| 2 | User cannot access list | Mock user with role "user" | GET `/api/admin/scripts?projectId=1` | 403 |
| 3 | Admin can create | Mock user with role "admin" | POST `/api/admin/scripts` | 201 |
| 4 | User cannot create | Mock user with role "user" | POST `/api/admin/scripts` | 403 |
| 5 | Admin can generate | Mock user with role "admin" | POST `/api/admin/scripts/generate` | 200 |
| 6 | User cannot generate | Mock user with role "user" | POST `/api/admin/scripts/generate` | 403 |
| 7 | Admin can access ai-models | Mock user with role "admin" | GET `/api/admin/ai-models` | 200 |
| 8 | User cannot access ai-models | Mock user with role "user" | GET `/api/admin/ai-models` | 403 |

---

### 1.2 Frontend Tests

#### ScriptListPage (`ScriptListPage.test.ts`)

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Hiển thị skeleton khi loading | `scriptsStore.loading = true` | render | Skeleton cards visible |
| 2 | Hiển thị danh sách cards khi loaded | `scriptsStore.scripts = [mockScript1, mockScript2]` | render | 2 ScriptCard components rendered |
| 3 | Hiển thị empty state khi không có scripts | `scriptsStore.scripts = []` | render | Empty state message + create button visible |
| 4 | Mở create page khi click "Tạo kịch bản" | — | Click create button | `router.push({ name: 'ScriptCreate', params: { projectId } })` |
| 5 | Mở edit page khi click ScriptCard | scripts có 1 item | Click ScriptCard | `router.push({ name: 'ScriptEdit', params: { projectId, scriptId } })` |
| 6 | Mở delete dialog khi click "Xoá" | scripts có 1 item | Click delete action | ScriptDeleteDialog visible với scriptTitle |
| 7 | handleBackClick quay về Project Detail | — | Click Back button | `router.push({ name: 'ProjectDetail', params: { id: projectId } })` |
| 8 | handleDeleteConfirmed gọi deleteScript | mock store | ScriptDeleteDialog emit confirmed | `scriptsStore.deleteScript(id)` được gọi |
| 9 | Fetch scripts với projectId từ route | mock store | mount | `scriptsStore.fetchScripts(projectId)` được gọi |
| 10 | Hiển thị status badge trên card | `script.status = 'generated'` | render | Tag "Generated" hiển thị |

#### ScriptFormPage (`ScriptFormPage.test.ts`)

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Hiển thị form rỗng ở create mode | route không có scriptId | mount | Tất cả fields rỗng; ScriptContentViewer hiển thị empty state |
| 2 | Pre-fill form ở edit mode | route có scriptId, mock fetchScript | mount | Fields populated với script data; content hiển thị |
| 3 | Fetch AI models on mount | mock fetchAiModels | mount | `scriptsStore.fetchAiModels()` được gọi; dropdown populated |
| 4 | Validation: title required | title = '' | Click Save | Inline error "Tên kịch bản phải từ 2-200 ký tự" |
| 5 | Validation: idea min 10 | idea = 'Short' | Click Save | Inline error "Ý tưởng phải từ 10-5000 ký tự" |
| 6 | Validation: characterCount min 1 | characterCount = 0 | Click Save | Inline error "Số nhân vật phải từ 1-20" |
| 7 | Validation: vibe min 1 tag | vibe = [] | Click Save | Inline error "Vibe phải có ít nhất 1 tag" |
| 8 | Generate gọi API với đúng data | mock generateScript resolves | Fill form, click Generate | `scriptsStore.generateScript(data)` được gọi |
| 9 | Generate success hiển thị content | mock generateScript returns content | Click Generate | ScriptContentViewer hiển thị content |
| 10 | Generate error hiển thị toast | mock generateScript rejects | Click Generate | Error toast hiển thị |
| 11 | Save (create) gọi createScript | mock createScript resolves | Fill form, click Save | `scriptsStore.createScript` được gọi với status='draft' (nếu content null) |
| 12 | Save (edit) gọi updateScript | mock updateScript resolves, edit mode | Fill form, click Save | `scriptsStore.updateScript` được gọi |
| 13 | Save success redirect to list | mock createScript resolves | Fill form, click Save | `router.push({ name: 'ScriptList' })` |
| 14 | Disable generate button khi generating | `generating=true` | render | Generate button disabled |
| 15 | Disable save button khi loading | `loading=true` | render | Save button disabled |
| 16 | HandleCancel quay về list (clean form) | — | Click Cancel | `router.push({ name: 'ScriptList' })` |
| 17 | HandleCancel dirty form show confirm | form dirty | Click Cancel | Confirm dialog hiển thị |
| 18 | clearCurrentScript on unmount | — | unmount | `scriptsStore.clearCurrentScript()` được gọi |

#### ScriptCard.vue (`ScriptCard.test.ts`)

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Hiển thị tiêu đề Script | `script = { title: 'Test' }` | render | Tiêu đề "Test" hiển thị |
| 2 | Hiển thị ý tưởng | `script = { idea: 'Test idea' }` | render | Ý tưởng hiển thị |
| 3 | Hiển thị status Tag 'Draft' | `script = { status: 'draft' }` | render | Tag "Draft" hiển thị (gray) |
| 4 | Hiển thị status Tag 'Generated' | `script = { status: 'generated' }` | render | Tag "Generated" hiển thị (green) |
| 5 | Hiển thị vibe tags | `script = { vibe: ['hài hước', 'cảm động'] }` | render | 2 vibe tags hiển thị |
| 6 | Hiển thị "+N" khi vibe > 3 tags | `script = { vibe: ['a','b','c','d','e'] }` | render | 3 tags + "+2" hiển thị |
| 9 | Emit click khi click card | — | Click card | emit `click` với script id |
| 10 | Emit edit khi click "Chỉnh sửa" | — | Click edit action | emit `edit` với script id |
| 11 | Emit delete khi click "Xoá" | — | Click delete action | emit `delete` với script id |

#### ScriptForm.vue (`ScriptForm.test.ts`)

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Hiển thị form rỗng ở create mode | `mode="create", script=null` | render | Tất cả fields rỗng |
| 2 | Pre-fill fields ở edit mode | `mode="edit", script=mockScript` | render | Fields populated với script data |
| 3 | Validation: title required | title = '' | Click Save | Validation error shown |
| 4 | Validation: title min 2 | title = 'A' | Click Save | Validation error "Min 2 characters" |
| 5 | Validation: idea min 10 | idea = 'Short' | Click Save | Validation error shown |
| 6 | Validation: characterCount min 1 | characterCount = 0 | Click Save | Validation error shown |
| 7 | Validation: minScenes min 1 | minScenes = 0 | Click Save | Validation error shown |
| 8 | Validation: vibe min 1 tag | vibe = [] | Click Save | Validation error shown |
| 9 | Emit generate với data hợp lệ | Form filled valid (incl. aiModel) | Click Generate | emit `generate` với GenerateScriptDto |
| 10 | Không emit generate khi form invalid | Form có field invalid | Click Generate | emit `generate` NOT called |
| 11 | Validation: aiModel required for Generate | aiModel = '' | Click Generate | Validation error shown |
| 12 | Emit save với data hợp lệ | Form filled valid (aiModel not required for Save) | Click Save | emit `save` với form payload |
| 13 | Không emit save khi form invalid | Form có field invalid (except aiModel) | Click Save | emit `save` NOT called |
| 14 | Disable generate button khi generating | `generating=true` | render | Generate button disabled |
| 15 | Disable save button khi loading | `loading=true` | render | Save button disabled |
| 16 | Emit cancel khi click Cancel | — | Click Cancel | emit `cancel` |
| 17 | Character counter cho idea | idea = 'Hello world test' | render | Hiển thị '15/5000' |
| 18 | AI Model dropdown populated | `aiModels = [{ provider: 'gemini', models: ['gemini-2.0-flash'] }]` | render | Dropdown có option 'gemini-2.0-flash' |
| 19 | Vibe Chips cho phép thêm tag mới | — | Type new tag + Enter | Tag mới được thêm vào vibe |
| 20 | Pre-fill vibe ở edit mode | `script.vibe = ['hài hước']` | render | Chips hiển thị 'hài hước' |

#### ScriptContentViewer.vue (`ScriptContentViewer.test.ts`)

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Hiển thị content khi có giá trị | `content = '{"scenes":[]}'` | render | Content hiển thị trong textarea |
| 2 | Hiển thị empty state khi content null | `content = null` | render | "Chưa có nội dung" message hiển thị |
| 3 | Hiển thị skeleton khi loading | `loading = true` | render | Skeleton visible |
| 4 | Emit contentChange khi edit | `content = '{}'` | Type in textarea | emit `contentChange` với new value |
| 5 | Auto-format JSON | `content = '{"a":1}'` | render | JSON pretty-printed |

#### ScriptDeleteDialog.vue (`ScriptDeleteDialog.test.ts`)

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Hiển thị tên Script trong message | `scriptTitle = "Test Script"` | render | Message chứa "Test Script" |
| 2 | Emit confirmed khi click "Xoá" | — | Click Delete button | emit `confirmed` |
| 3 | Emit cancelled khi click "Không" | — | Click Cancel button | emit `cancelled` |

#### ProjectScriptCard.vue (`ProjectScriptCard.test.ts`)

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Hiển thị số lượng kịch bản | `scriptCount = 5` | render | "5 kịch bản" hiển thị |
| 2 | Hiển thị "0 kịch bản" khi empty | `scriptCount = 0` | render | "0 kịch bản" hiển thị |
| 3 | Emit click khi click card | — | Click card | emit `click` với projectId |

#### useScripts.ts (`useScripts.test.ts`)

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | getScripts gọi API với projectId | mock scriptsApiService | Call `getScripts(1)` | `scriptsApiService.getList(1)` được gọi |
| 2 | createScript gọi API với data | mock scriptsApiService | Call `createScript(data)` | `scriptsApiService.create(data)` được gọi |
| 3 | updateScript gọi API với id và data | mock scriptsApiService | Call `updateScript(1, data)` | `scriptsApiService.update(1, data)` được gọi |
| 4 | deleteScript gọi API với id | mock scriptsApiService | Call `deleteScript(1)` | `scriptsApiService.delete(1)` được gọi |
| 5 | generateScript gọi API với data | mock scriptsApiService | Call `generateScript(data)` | `scriptsApiService.generate(data)` được gọi |
| 6 | getAiModels gọi API | mock scriptsApiService | Call `getAiModels()` | `scriptsApiService.getAiModels()` được gọi |

#### scripts.store.ts (`scripts.store.test.ts`)

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | fetchScripts: cập nhật scripts | mock useScripts.getScripts | Call `fetchScripts(1)` | `scripts` được set |
| 2 | fetchScripts: loading flag | — | Trong khi fetch | `loading=true`; sau đó `loading=false` |
| 3 | fetchScripts: set error khi fail | mock getScripts throw | Call `fetchScripts(1)` | `error` được set |
| 4 | fetchAiModels: cập nhật aiModels | mock useScripts.getAiModels | Call `fetchAiModels()` | `aiModels` được set |
| 5 | createScript: gọi composable, KHÔNG reload list | mock createScript | Call `createScript(data)` | Composable được gọi; `fetchScripts` KHÔNG được gọi |
| 6 | updateScript: gọi composable, KHÔNG reload list | mock updateScript | Call `updateScript(1, data)` | Composable được gọi; `fetchScripts` KHÔNG được gọi |
| 7 | deleteScript: tự động reload fetchScripts | mock deleteScript resolve | Call `deleteScript(1)` | `fetchScripts` được gọi lại |
| 8 | generateScript: set generating flag | mock generateScript | Call `generateScript(data)` | `generating=true` during call, `false` after |
| 9 | generateScript: trả về content | mock generateScript returns content | Call `generateScript(data)` | Returns content string |
| 10 | clearCurrentScript: clear state | `currentScript = mockScript` | Call `clearCurrentScript()` | `currentScript = null` |
| 11 | fetchScript: set currentScript | mock getScript | Call `fetchScript(1)` | `currentScript` được set |

---

## 2. Performance Considerations

| Concern | Strategy |
|---------|----------|
| List query | Không phân trang (danh sách Script dự kiến nhỏ, < 100 items per project) |
| Database indexes | Index on `projectId`, `ownerId`, `isDeleted`, `status` |
| Soft delete filter | Mọi query đều filter `isDeleted = false` |
| AI Model list | Cache ở client sau khi fetch lần đầu (không thay đổi trong session) |
| Generate timeout | Server timeout 60s cho AI provider call; client timeout 90s |
| Content size | Giới hạn content 100000 ký tự (TEXT column) |
| Lazy loading | Dynamic import cho ScriptListPage và ScriptFormPage |

---

## 3. Security Considerations

| Concern | Control |
|---------|---------|
| Authentication | All endpoints require valid JWT token |
| Authorization | Role-based: chỉ admin mới được truy cập |
| Input Validation | Server-side validation trên tất cả request body fields (Zod) |
| SQL Injection | Sử dụng Prisma ORM (parameterized queries) |
| Soft Delete | Dữ liệu không bao giờ bị xoá vật lý qua API |
| Audit Trail | Ghi audit log cho tất cả CREATE/UPDATE/DELETE actions |
| Owner tracking | `ownerId` tự động gán từ authenticated user, không nhận từ client |
| AI Provider keys | API keys của provider chỉ lưu ở server, không bao giờ expose ra client |
| Content validation | Content JSON được validate max length (100000 chars) để tránh oversized payload |
| Project ownership | Kiểm tra Project tồn tại (isDeleted=false) trước khi tạo Script |