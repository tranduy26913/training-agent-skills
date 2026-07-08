---
title: Script Management - Backend
version: 1.0
author: Admin Team
date: 2026-06-25
---

# Script Management — Backend

> Related: [00-index.md](./00-index.md) | [02-frontend.md](./02-frontend.md) | [03-behavior.md](./03-behavior.md) | [04-quality.md](./04-quality.md)

---

## 1. Data Models

### 1.1 Database Schema (Prisma models)

#### `Script` (table `scripts`) — [NEW]

| Property | Type / Prisma Modifier | Notes |
|----------|------------------------|-------|
| `id` | `Int @id @default(autoincrement())` | UNSIGNED, auto-increment |
| `title` | `String` | VARCHAR(200), NOT NULL — tên kịch bản |
| `idea` | `String` | TEXT, NOT NULL — ý tưởng gốc |
| `characterCount` | `Int` (column `character_count`) | UNSIGNED, NOT NULL — số nhân vật |
| `minScenes` | `Int` (column `min_scenes`) | UNSIGNED, NOT NULL — số scenes tối thiểu |
| `vibe` | `Json` | NOT NULL — mảng tags vibe (preset + custom), lưu dạng JSON array |
| `content` | `String?` | TEXT, nullable — nội dung kịch bản dạng JSON string hợp lệ (null khi draft chưa gen) |
| `status` | `String` | VARCHAR(20), NOT NULL, default `'draft'` — enum: `'draft'` \| `'generated'` |
| `projectId` | `Int` (column `project_id`) | UNSIGNED, NOT NULL — FK → `Project.id` |
| `project` | `Project @relation(fields: [projectId], references: [id], onDelete: Cascade)` | Script bị xoá khi Project bị xoá |
| `ownerId` | `Int` (column `owner_id`) | UNSIGNED, NOT NULL — FK → `User.id` |
| `owner` | `User @relation(fields: [ownerId], references: [id], onDelete: Restrict)` | Không cho xoá User đang sở hữu Script |
| `isDeleted` | `Boolean @default(false)` (column `is_deleted`) | Soft delete flag |
| `createdAt` | `DateTime @default(now())` (column `created_at`) | |
| `updatedAt` | `DateTime @updatedAt` (column `updated_at`) | auto-updated |
| Indexes | `@@index([projectId])`, `@@index([ownerId])`, `@@index([isDeleted])`, `@@index([status])` | |
| `@@map` | `"scripts"` | |

#### `Project` (table `projects`) — [UPDATE - CR-SCRIPT-001]

| Property | Type / Prisma Modifier | Notes |
|----------|------------------------|-------|
| (existing fields) | — | Không thay đổi — xem spec Project v1.0 |
| `scripts` | `Script[]` | [NEW] Relation 1-N: Project có nhiều Scripts |

> **Lưu ý:** Chỉ thêm relation field `scripts` vào model `Project`. Các field khác không thay đổi. File Prisma: `server/prisma/schema/project.prisma`.

### 1.2 TypeScript Models

> **Quy ước:** Mô tả type chỉ liệt kê tên + property (không dùng code block). Trỏ file thực tế để tra cứu khi cần.

#### Server types — `server/src/modules/admin/scripts/scripts.model.ts`

Type `Script` - Kế thừa từ prisma client, thêm `ownerName: string`, `projectName: string` (để trả về API).

Interface `CreateScriptDto`
- `title: string`
- `idea: string`
- `characterCount: number`
- `minScenes: number`
- `vibe: string[]`
- `content?: string`
- `status: 'draft' | 'generated'`
- `projectId: number`

Interface `UpdateScriptDto`
- `title?: string`
- `idea?: string`
- `characterCount?: number`
- `minScenes?: number`
- `vibe?: string[]`
- `content?: string`
- `status?: 'draft' | 'generated'`

Interface `GenerateScriptDto`
- `title: string`
- `idea: string`
- `characterCount: number`
- `minScenes: number`
- `vibe: string[]`
- `aiModel: string`

Interface `GenerateScriptResponse`
- `content: string`
- `model: string`
- `provider: string`

Interface `AiModelInfo`
- `provider: string`
- `models: string[]`

---

## 2. API Endpoints

### 2.1 Authorization

All endpoints require:
1. Valid JWT token in `Authorization: Bearer <token>` header
2. Role: `admin`

---

### SV-001 — GET /api/admin/scripts?projectId=:projectId
**Danh sách Script theo Project (không phân trang, không filter)**

**Required Role:** `admin`

Request:
```http
GET /api/admin/scripts?projectId=1
Authorization: Bearer <token>
```

Query Parameters:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `projectId` | number | Yes | — | Lọc script theo project |

Flow:
1. Verify JWT token
2. Check role admin
3. Validate `projectId` query parameter (positive integer)
4. Query database: lấy tất cả scripts có `isDeleted = false` và `projectId = :projectId`, join với User để lấy `ownerName`, join với Project để lấy `projectName`
5. Sắp xếp theo `updatedAt` giảm dần
6. Trả về danh sách

Response (200 OK):
```json
{
  "data": ScriptResponse[]
}
```

Errors:
| Status | Code | Message |
|--------|------|---------|
| 400 | `VALIDATION_ERROR` | projectId is required |
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Insufficient permissions |

---

### SV-002 — POST /api/admin/scripts
**Tạo Script mới (lưu draft hoặc generated)**

**Required Role:** `admin`

Request:
```http
POST /api/admin/scripts
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Kịch bản video quảng cáo",
  "idea": "Giới thiệu sản phẩm mới",
  "characterCount": 3,
  "minScenes": 5,
  "vibe": ["hài hước", "năng động"],
  "content": "{\"scenes\":[...]}",
  "status": "generated",
  "projectId": 1
}
```

Flow:
1. Verify JWT token
2. Check role admin
3. Validate request body (Zod schema)
4. Kiểm tra Project tồn tại (isDeleted = false)
5. Set `ownerId` từ authenticated user
6. Server tự quyết định `status`: nếu `content` null/empty → `'draft'`; nếu có content → validate JSON hợp lệ và set `'generated'`. Giá trị `status` từ client chỉ là hint tương thích ngược, không được tin cậy.
7. Insert record to database
8. Ghi audit log (CREATE)
9. Return created entity

Response (201 Created):
```json
{
  "data": ScriptResponse
}
```

Errors:
| Status | Code | Message |
|--------|------|---------|
| 400 | `VALIDATION_ERROR` | Validation failed |
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Project not found |

---

### SV-003 — GET /api/admin/scripts/:id
**Lấy chi tiết Script theo ID**

**Required Role:** `admin`

Request:
```http
GET /api/admin/scripts/1
Authorization: Bearer <token>
```

Flow:
1. Verify JWT token
2. Check role admin
3. Validate `id` route parameter (positive integer)
4. Query by id, chỉ lấy script có `isDeleted = false`, join User + Project
5. Return entity hoặc 404

Response (200 OK):
```json
{
  "data": ScriptResponse
}
```

Errors:
| Status | Code | Message |
|--------|------|---------|
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Script not found |

---

### SV-004 — PUT /api/admin/scripts/:id
**Cập nhật Script (sửa input fields, edit JSON content, re-generate)**

**Required Role:** `admin`

Request:
```http
PUT /api/admin/scripts/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Kịch bản video quảng cáo (đã sửa)",
  "idea": "Giới thiệu sản phẩm mới - updated",
  "characterCount": 4,
  "minScenes": 6,
  "vibe": ["hài hước", "cảm động"],
  "content": "{\"scenes\":[...updated...]}",
  "status": "generated"
}
```

Flow:
1. Verify JWT token
2. Check role admin
3. Validate `id` route parameter và request body
4. Check record exists (isDeleted = false)
5. Update record
6. Ghi audit log (UPDATE)
7. Return updated entity

Response (200 OK):
```json
{
  "data": ScriptResponse
}
```

Errors:
| Status | Code | Message |
|--------|------|---------|
| 400 | `VALIDATION_ERROR` | Validation failed |
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Script not found |

---

### SV-005 — DELETE /api/admin/scripts/:id
**Xoá Script (soft delete)**

**Required Role:** `admin`

Request:
```http
DELETE /api/admin/scripts/1
Authorization: Bearer <token>
```

Flow:
1. Verify JWT token
2. Check role admin
3. Validate `id` route parameter
4. Check record exists (isDeleted = false)
5. Set `isDeleted = true`
6. Ghi audit log (DELETE)
7. Return success message

Response (200 OK):
```json
{
  "message": "Script deleted successfully"
}
```

Errors:
| Status | Code | Message |
|--------|------|---------|
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Script not found |

---

### SV-006 — POST /api/admin/scripts/generate
**Generate kịch bản bằng AI (không lưu DB)**

**Required Role:** `admin`

Request:
```http
POST /api/admin/scripts/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Kịch bản video quảng cáo",
  "idea": "Giới thiệu sản phẩm mới",
  "characterCount": 3,
  "minScenes": 5,
  "vibe": ["hài hước", "năng động"],
  "aiModel": "gemini-2.0-flash"
}
```

Flow:
1. Verify JWT token
2. Check role admin
3. Validate request body (Zod schema — GenerateScriptDto)
4. Build prompt từ input fields (server-side, không dùng projectPrompt):
   - Template: "Bạn là một biên kịch chuyên nghiệp. Hãy viết kịch bản với tiêu đề '{title}', ý tưởng: '{idea}'. Số nhân vật: {characterCount}. Số scenes tối thiểu: {minScenes}. Vibe/phong cách: {vibe.join(', ')}. Trả về kết quả dưới dạng JSON."
5. Parse `aiModel` để xác định provider (model prefix → provider type)
6. Gọi `ApiProviderService.getProvider(providerType).generate(prompt, { model: aiModel })`
7. Trả về content JSON string + model + provider info (không lưu DB). Backend validate/parse content trước khi trả về; nếu content không phải JSON hợp lệ thì trả lỗi `AI_PROVIDER_ERROR`.

Response (200 OK):
```json
{
  "data": GenerateScriptResponse
}
```

Errors:
| Status | Code | Message |
|--------|------|---------|
| 400 | `VALIDATION_ERROR` | Validation failed |
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 502 | `AI_PROVIDER_ERROR` | AI provider returned an error |
| 503 | `PROVIDER_NOT_REGISTERED` | AI provider not registered |

---

### SV-007 — GET /api/admin/ai-models
**Danh sách AI Model từ tất cả provider đã register**

**Required Role:** `admin`

Request:
```http
GET /api/admin/ai-models
Authorization: Bearer <token>
```

Flow:
1. Verify JWT token
2. Check role admin
3. Lấy danh sách provider đã register từ `ApiProviderService.getRegisteredProviders()`
4. Với mỗi provider, đọc static models property (VD: `GeminiProvider.AVAILABLE_MODELS`, `ZaiProvider.AVAILABLE_MODELS`)
5. Trả về danh sách provider + models

Response (200 OK):
```json
{
  "data": AiModelInfo[]
}
```

Example response:
```json
{
  "data": [
    {
      "provider": "gemini",
      "models": ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"]
    },
    {
      "provider": "zai",
      "models": ["zai-default", "zai-pro"]
    }
  ]
}
```

Errors:
| Status | Code | Message |
|--------|------|---------|
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Insufficient permissions |

---

## 3. Validation Rules

### 3.1 Create Script (Zod schema — `createScriptSchema`)

| Field | Rule | Error Message |
|-------|------|---------------|
| `title` | `string().min(2).max(200)` | "Tên kịch bản phải từ 2-200 ký tự" |
| `idea` | `string().min(10).max(5000)` | "Ý tưởng phải từ 10-5000 ký tự" |
| `characterCount` | `number().int().min(1).max(20)` | "Số nhân vật phải từ 1-20" |
| `minScenes` | `number().int().min(1).max(50)` | "Số scenes tối thiểu phải từ 1-50" |
| `vibe` | `array(string()).min(1)` | "Vibe phải có ít nhất 1 tag" |
| `content` | `string().max(100000).optional()` + nếu không rỗng phải parse JSON hợp lệ | "Content phải là JSON hợp lệ và không quá 100000 ký tự" |
| `status` | `enum(['draft', 'generated']).optional()` | "Status phải là 'draft' hoặc 'generated'" |
| `projectId` | `number().int().positive()` | "Project ID phải là số dương" |

### 3.2 Update Script (Zod schema — `updateScriptSchema`)

Tất cả fields optional (giống create nhưng bỏ `projectId` — không cho phép đổi project sau khi tạo). Không có `aiModel` — AI model chỉ chọn khi generate, không lưu vào DB. Nếu request có `content`, server tự tính lại `status` theo content giống create.

### 3.3 Generate Script (Zod schema — `generateScriptSchema`)

| Field | Rule | Error Message |
|-------|------|---------------|
| `title` | `string().min(2).max(200)` | "Tên kịch bản phải từ 2-200 ký tự" |
| `idea` | `string().min(10).max(5000)` | "Ý tưởng phải từ 10-5000 ký tự" |
| `characterCount` | `number().int().min(1).max(20)` | "Số nhân vật phải từ 1-20" |
| `minScenes` | `number().int().min(1).max(50)` | "Số scenes tối thiểu phải từ 1-50" |
| `vibe` | `array(string()).min(1)` | "Vibe phải có ít nhất 1 tag" |
| `aiModel` | `string().min(1).max(100)` | "AI Model là bắt buộc" |

> **Lưu ý:** `aiModel` chỉ có trong `generateScriptSchema` (generate request), KHÔNG có trong `createScriptSchema` hay `updateScriptSchema` — AI model không lưu vào DB.

---

## 4. AI Provider Integration

### 4.1 Static Models Property

Mỗi provider class phải expose static property `AVAILABLE_MODELS` để endpoint `GET /api/admin/ai-models` không phụ thuộc vào instance config:

- `GeminiProvider.AVAILABLE_MODELS`: `['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash']`
- `ZaiProvider.AVAILABLE_MODELS`: `['zai-default', 'zai-pro']`
- `ComfyProvider.AVAILABLE_MODELS`: `['comfy-default']` (nếu có register)

### 4.2 Model → Provider Mapping

Server logic để map `aiModel` string → `ProviderType`:

| Model prefix | Provider |
|--------------|----------|
| `gemini-*` | `gemini` |
| `zai-*` | `zai` |
| `comfy-*` | `comfy` |

Mapping logic: so sánh prefix của `aiModel` với registry keys. Nếu không match → throw `ServiceError('Unknown AI model', 400)`.

### 4.3 ApiProviderService Enhancement

Thêm method `generateWithModel(aiModel: string, prompt: string)` và `getAvailableModels()` vào `ApiProviderService`:
1. Parse `aiModel` → xác định `ProviderType` (dựa trên prefix)
2. Lấy provider instance: `this.getProvider(providerType)`
3. Gọi `provider.generate(prompt, { model: aiModel })`
4. Trả về `ProviderResponse`

`getAvailableModels()` chỉ trả model của provider đã register; response dạng `AiModelInfo[]`.

---

## 5. Error Handling

| Error Code | HTTP Status | When |
|-----------|-------------|------|
| `VALIDATION_ERROR` | 400 | Zod validation fail |
| `UNAUTHORIZED` | 401 | Missing/invalid JWT |
| `FORBIDDEN` | 403 | Non-admin role |
| `NOT_FOUND` | 404 | Script/Project not found or soft-deleted |
| `AI_PROVIDER_ERROR` | 502 | AI provider returned error (API failure, rate limit) |
| `PROVIDER_NOT_REGISTERED` | 503 | Provider type not registered in ApiProviderService |

---

## 6. Audit Log

Mỗi hành động CREATE/UPDATE/DELETE trên Script được ghi audit log:
- `action`: `'CREATE_SCRIPT'` | `'UPDATE_SCRIPT'` | `'DELETE_SCRIPT'`
- `adminId`: từ authenticated user
- `targetUserId`: `ownerId` của script
- `changedFields`: JSON diff của các field thay đổi (UPDATE) hoặc full data (CREATE)
