---
title: Script Management - Frontend
version: 1.0
author: Admin Team
date: 2026-06-25
---

# Script Management — Frontend

> Related: [00-index.md](./00-index.md) | [01-backend.md](./01-backend.md) | [03-behavior.md](./03-behavior.md) | [04-quality.md](./04-quality.md)

---

## 1. File Structure

```text
client/src/
├── pages/scripts/
│   ├── ScriptListPage.vue                 # Trang danh sách Script dạng Card grid (theo projectId)
│   ├── ScriptFormPage.vue                 # Trang Create/Edit Script (2 phần: form trái, JSON phải)
│   ├── scripts.routes.ts                  # Route definitions
│   ├── components/
│   │   ├── ScriptCard.vue                 # Card component cho mỗi Script
│   │   ├── ScriptForm.vue                 # Form input fields (bên trái)
│   │   ├── ScriptContentViewer.vue         # JSON content viewer/editor (bên phải)
│   │   └── ScriptDeleteDialog.vue         # Confirm Dialog cho Delete
│   └── composables/
│       └── useScripts.ts                  # API call wrappers (CRUD + generate)
├── pages/projects/
│   ├── ProjectDetailPage.vue               # [UPDATE] Thêm Card Script
│   └── components/
│       └── ProjectScriptCard.vue           # [NEW] Card Script trên Project Detail
├── stores/
│   └── scripts.store.ts                    # Pinia store quản lý script state
├── services/
│   └── scripts.service.ts                  # ScriptsApiClient extends BaseApiClient
└── types/
    └── scripts.types.ts                    # Script, CreateScriptDto, UpdateScriptDto, GenerateScriptDto
```

---

## 2. Layout & Wireframes

### 2.1 Application Layout

```text
DefaultLayout
├── AppTopbar
├── AppSidebar
└── <router-view>
    ├── ProjectDetailPage       ← /projects/:id (+ Card Script)
    ├── ScriptListPage          ← /projects/:projectId/scripts
    ├── ScriptFormPage (create) ← /projects/:projectId/scripts/create
    └── ScriptFormPage (edit)   ← /projects/:projectId/scripts/:scriptId/edit
```

### 2.2 Component Tree

```text
ProjectDetailPage
  ├── (existing detail fields)
  └── ProjectScriptCard        (emits: click)

ScriptListPage
  ├── PageHeader (title + Back button + Create button)
  ├── ScriptCard[]             (emits: click, edit, delete)
  └── ScriptDeleteDialog       (emits: confirmed, cancelled)

ScriptFormPage
  ├── PageHeader (title + Back button)
  ├── ScriptForm               (emits: generate, save, cancel)
  └── ScriptContentViewer      (emits: contentChange)
```

### 2.3 Route Definitions (`scripts.routes.ts`)

Route meta: `requiresAuth: true`, `roles: ['admin']`, `title`, `titleKey` (i18n), `breadcrumb`.

Routes lồng dưới `/projects/:projectId/scripts` để giữ context projectId trong URL:

```text
/projects/:projectId/scripts          → ScriptListPage (name: ScriptList)
/projects/:projectId/scripts/create   → ScriptFormPage mode=create (name: ScriptCreate)
/projects/:projectId/scripts/:scriptId/edit → ScriptFormPage mode=edit (name: ScriptEdit)
```

---

## 3. Screen Item Specifications

### 3.1 ProjectDetailPage — Card Script section (`/projects/:id`) — [UPDATE - CR-SCRIPT-001]

| # | ItemName | Control | Type | Required | Validation | Placeholder | DisplayText | Description | Notes |
|---|----------|---------|------|----------|------------|-------------|-------------|-------------|-------|
| **—** | **ProjectScriptCard** | | | | | | | **Component** | [NEW] |
| 1 | scriptCardTitle | Label | — | — | — | — | `scripts.card.title` | "Kịch bản" | Bold label |
| 2 | scriptCount | Label | number | — | — | — | — | Số lượng kịch bản (VD: "5 kịch bản") | Lấy từ API count hoặc tính từ list |
| 3 | scriptCardIcon | Icon | — | — | — | — | — | Icon kịch bản (PiFile) | — |
| 4 | scriptCardClick | Button | — | — | — | — | `scripts.card.viewAll` | "Xem tất cả" | Click → điều hướng ScriptListPage |

---

### 3.2 ScriptListPage (`/projects/:projectId/scripts`)

| # | ItemName | Control | Type | Required | Validation | Placeholder | DisplayText | Description | Notes |
|---|----------|---------|------|----------|------------|-------------|-------------|-------------|-------|
| **—** | **PageHeader** | | | | | | | **Section** | |
| 1 | backButton | Button | — | — | — | — | `common.back` | Quay lại Project Detail | Icon: PiArrowLeft |
| 2 | pageTitle | Label | — | — | — | — | `scripts.list.pageTitle` | "Kịch bản" | — |
| 3 | createButton | Button | — | — | — | — | `scripts.list.createButton` | Tạo kịch bản mới | Icon: PiPlus; severity: primary |
| **—** | **ScriptCard[]** | | | | | | | **Card Grid** | |
| 4 | scriptCard | Card | Script | — | — | — | — | Card hiển thị thông tin Script | Grid layout, responsive (1→2→3 columns) |
| 5 | cardTitle | Label | string | — | — | — | — | Tiêu đề kịch bản (bold, truncate 2 dòng) | — |
| 6 | cardIdea | Label | string | — | — | — | — | Ý tưởng (truncate 3 dòng) | — |
| 7 | cardStatus | Tag | string | — | — | — | — | Status badge: "Draft" (gray) hoặc "Generated" (green) | — |
| 9 | cardVibe | Label | string[] | — | — | — | — | Vibe tags (truncate, hiển thị 3 tags + "+N") | — |
| 10 | cardUpdatedAt | Label | string | — | — | — | — | "Cập nhật: DD/MM/YYYY" | — |
| 11 | cardActionMenu | SpeedDial / Button | — | — | — | — | — | Menu action: "Chỉnh sửa", "Xoá" | Icon: PiDotsThreeVertical; emits edit/delete |
| **—** | **Empty State** | | | | | | | **Section** | |
| 12 | emptyIcon | Icon | — | — | — | — | — | Icon empty state (PiFile) | — |
| 13 | emptyMessage | Label | — | — | — | — | `scripts.list.empty` | "Chưa có kịch bản nào" | — |
| 14 | emptyCreateButton | Button | — | — | — | — | `scripts.list.createButton` | Nút tạo kịch bản đầu tiên | Chỉ hiển thị khi empty |
| **—** | **Loading State** | | | | | | | **Section** | |
| 15 | skeletonCard | Skeleton | — | — | — | — | — | Skeleton card khi loading | 3 skeleton cards |

---

### 3.3 ScriptFormPage (`/projects/:projectId/scripts/create`, `/projects/:projectId/scripts/:scriptId/edit`)

Layout 2 cột: form bên trái (40%), JSON content bên phải (60%).

| # | ItemName | Control | Type | Required | Validation | Placeholder | DisplayText | Description | Notes |
|---|----------|---------|------|----------|------------|-------------|-------------|-------------|-------|
| **—** | **PageHeader** | | | | | | | **Section** | |
| 1 | backButton | Button | — | — | — | — | `common.back` | Quay lại danh sách | Icon: PiArrowLeft |
| 2 | pageTitle | Label | — | — | — | — | `scripts.form.createTitle` / `scripts.form.editTitle` | "Tạo kịch bản" hoặc "Chỉnh sửa kịch bản" | Dynamic theo mode |
| **—** | **ScriptForm (left panel)** | | | | | | | **Component** | |
| 3 | titleLabel | Label | — | — | — | — | `scripts.form.title` | "Tên kịch bản" | Marks required (*) |
| 4 | titleInput | InputText | string | Yes | min 2, max 200 | `scripts.form.titlePlaceholder` | — | Nhập tên kịch bản | Inline error bên dưới |
| 5 | ideaLabel | Label | — | — | — | — | `scripts.form.idea` | "Ý tưởng gốc" | Marks required (*) |
| 6 | ideaInput | Textarea | string | Yes | min 10, max 5000 | `scripts.form.ideaPlaceholder` | — | Nhập ý tưởng gốc | Character counter `n/5000` |
| 7 | characterCountLabel | Label | — | — | — | — | `scripts.form.characterCount` | "Số nhân vật" | Marks required (*) |
| 8 | characterCountInput | InputNumber | number | Yes | min 1, max 20 | — | — | Nhập số nhân vật | Min 1, max 20 |
| 9 | minScenesLabel | Label | — | — | — | — | `scripts.form.minScenes` | "Số scenes tối thiểu" | Marks required (*) |
| 10 | minScenesInput | InputNumber | number | Yes | min 1, max 50 | — | — | Nhập số scenes tối thiểu | Min 1, max 50 |
| 11 | vibeLabel | Label | — | — | — | — | `scripts.form.vibe` | "Vibe" | Marks required (*) |
| 12 | vibeInput | Chips | string[] | Yes | min 1 tag | `scripts.form.vibePlaceholder` | — | Tags vibe (preset + custom) | Cho phép thêm tag mới; preset suggestions |
| 13 | aiModelLabel | Label | — | — | — | — | `scripts.form.aiModel` | "AI Model" | Marks required (*) |
| 14 | aiModelInput | Select | string | Yes | must select | `scripts.form.aiModelPlaceholder` | — | Dropdown AI Model | Lấy từ GET /api/admin/ai-models; group by provider |
| 15 | generateButton | Button | — | — | — | — | `scripts.form.generate` | "Generate" | Gọi API generate; disabled khi loading; icon PiSparkles |
| 16 | saveButton | Button | — | — | — | — | `common.save` | "Lưu" | Lưu script (draft hoặc generated); disabled khi loading |
| 17 | cancelButton | Button | — | — | — | — | `common.cancel` | "Huỷ" | Quay lại danh sách | — |
| **—** | **ScriptContentViewer (right panel)** | | | | | | | **Component** | |
| 18 | contentHeader | Label | — | — | — | — | `scripts.form.contentTitle` | "Nội dung kịch bản" | — |
| 19 | contentEditor | Textarea | string | No | max 100000 | — | — | JSON content editor (editable) | Monospace font; auto-format JSON |
| 20 | contentEmpty | Label | — | — | — | — | `scripts.form.contentEmpty` | "Chưa có nội dung. Click Generate để tạo." | Hiển thị khi content null/empty |
| 21 | contentLoading | Skeleton | — | — | — | — | — | Skeleton khi đang generate | Hiển thị khi generate in progress |

---

### 3.4 ScriptDeleteDialog (Confirm Dialog)

| # | ItemName | Control | Type | Required | Validation | Placeholder | DisplayText | Description | Notes |
|---|----------|---------|------|----------|------------|-------------|-------------|-------------|-------|
| **—** | **Dialog** | | | | | | | **Modal** | |
| 1 | dialogHeader | Label | — | — | — | — | `scripts.delete.header` | "Xoá kịch bản" | — |
| 2 | confirmMessage | Label | — | — | — | — | `scripts.delete.confirm` | "Bạn có chắc muốn xoá kịch bản **{title}**?" | Dynamic title |
| 3 | cancelButton | Button | — | — | — | — | `common.no` | "Không" | — |
| 4 | deleteButton | Button | — | — | — | — | `common.yes` | "Xoá" | severity: danger |

---

## 4. Component Details

### 4.1 ScriptCard.vue

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `script` | `Script` | Yes | Dữ liệu Script để hiển thị |

**Emits:**

| Event | Payload | Description |
|-------|---------|-------------|
| `click` | `id: number` | Click vào card → mở ScriptFormPage edit |
| `edit` | `id: number` | Click "Chỉnh sửa" trong action menu |
| `delete` | `id: number` | Click "Xoá" trong action menu |

**Layout:**
- Card với `p-4`, shadow, border, hover effect
- Header: Tiêu đề (bold, text-lg, truncate 2 dòng) + Status Tag
- Body: Ý tưởng (text-sm, truncate 3 dòng)
- Body: Vibe tags (text-xs, hiển thị 3 tags + "+N" nếu nhiều hơn)
- Footer: UpdatedAt + Action menu (góc phải)

### 4.2 ScriptForm.vue

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `mode` | `'create' \| 'edit'` | Yes | Chế độ tạo hoặc sửa |
| `script` | `Script \| null` | No | Dữ liệu Script khi edit mode |
| `aiModels` | `AiModelInfo[]` | Yes | Danh sách AI Model từ API |
| `loading` | `boolean` | Yes | Disable form khi đang submit/generate |
| `generating` | `boolean` | Yes | Disable Generate button khi đang generate |

**Emits:**

| Event | Payload | Description |
|-------|---------|-------------|
| `generate` | `GenerateScriptDto` | Click Generate — gọi API generate |
| `save` | `{ data: CreateScriptDto \| UpdateScriptDto, content: string \| null }` | Click Lưu |
| `cancel` | — | Click Huỷ |

**Internal state:**
- `formData`: reactive form state (title, idea, characterCount, minScenes, vibe, aiModel)
- `submitted`: boolean — đã submit ít nhất 1 lần (hiển thị validation errors)

**Validation:** VeeValidate + Zod schema:
- `title`: `z.string().min(2).max(200)`
- `idea`: `z.string().min(10).max(5000)`
- `characterCount`: `z.number().int().min(1).max(20)`
- `minScenes`: `z.number().int().min(1).max(50)`
- `vibe`: `z.array(z.string()).min(1)`
- `aiModel`: `z.string().min(1)` (chỉ required khi click Generate, không required khi Save draft)

### 4.3 ScriptContentViewer.vue

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `content` | `string \| null` | Yes | Nội dung JSON string |
| `loading` | `boolean` | Yes | Hiển thị skeleton khi generate |

**Emits:**

| Event | Payload | Description |
|-------|---------|-------------|
| `contentChange` | `string` | Content bị edit bởi user |

**Layout:**
- Panel chiếm 60% chiều rộng (bên phải)
- Header: "Nội dung kịch bản"
- Body: Textarea monospace, auto-format JSON (pretty print)
- Empty state: "Chưa có nội dung. Click Generate để tạo."
- Loading: Skeleton khi đang generate

### 4.4 ProjectScriptCard.vue — [NEW]

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `projectId` | `number` | Yes | ID của Project |
| `scriptCount` | `number` | Yes | Số lượng kịch bản |

**Emits:**

| Event | Payload | Description |
|-------|---------|-------------|
| `click` | `projectId: number` | Click → điều hướng ScriptListPage |

**Layout:**
- Card nhỏ, clickable, hover effect
- Icon PiFile + Title "Kịch bản"
- Count: "N kịch bản"
- Footer: "Xem tất cả" link

### 4.5 ScriptDeleteDialog.vue

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `visible` | `boolean` | Yes | Hiển thị/ẩn dialog |
| `scriptTitle` | `string` | Yes | Tên Script để hiển thị trong message |

**Emits:**

| Event | Payload | Description |
|-------|---------|-------------|
| `confirmed` | — | User xác nhận xoá |
| `cancelled` | — | User huỷ |

---

## 5. Composable — `useScripts.ts`

**Location:** `client/src/pages/scripts/composables/useScripts.ts`

**Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getScripts(projectId)` | `projectId: number` | `Promise<Script[]>` | Lấy danh sách scripts theo project |
| `getScript(id)` | `id: number` | `Promise<Script>` | Lấy chi tiết script |
| `createScript(data)` | `data: CreateScriptDto` | `Promise<Script>` | Tạo script mới |
| `updateScript(id, data)` | `id: number, data: UpdateScriptDto` | `Promise<Script>` | Cập nhật script |
| `deleteScript(id)` | `id: number` | `Promise<void>` | Xoá script (soft delete) |
| `generateScript(data)` | `data: GenerateScriptDto` | `Promise<GenerateScriptResponse>` | Generate kịch bản bằng AI |
| `getAiModels()` | — | `Promise<AiModelInfo[]>` | Lấy danh sách AI Model |

---

## 6. Store — `scripts.store.ts`

**Location:** `client/src/stores/scripts.store.ts`

**State:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `scripts` | `Script[]` | `[]` | Danh sách scripts |
| `currentScript` | `Script \| null` | `null` | Script đang edit |
| `aiModels` | `AiModelInfo[]` | `[]` | Danh sách AI Model |
| `loading` | `boolean` | `false` | Trạng thái loading (CRUD) |
| `generating` | `boolean` | `false` | Trạng thái generating |
| `error` | `string \| null` | `null` | Thông báo lỗi |

**Actions:**

| Action | Parameters | Description |
|--------|------------|-------------|
| `fetchScripts(projectId)` | `projectId: number` | Lấy danh sách scripts theo project |
| `fetchScript(id)` | `id: number` | Lấy chi tiết script, set `currentScript` |
| `fetchAiModels()` | — | Lấy danh sách AI Model, set `aiModels` |
| `createScript(data)` | `data: CreateScriptDto` | Tạo script mới, KHÔNG tự động reload list |
| `updateScript(id, data)` | `id: number, data: UpdateScriptDto` | Cập nhật script, KHÔNG tự động reload list |
| `deleteScript(id)` | `id: number` | Xoá script, KHÔNG tự động reload list; page gọi `fetchScripts(projectId)` sau khi xoá thành công |
| `generateScript(data)` | `data: GenerateScriptDto` | Generate kịch bản, set `generating` flag, trả về content |
| `clearCurrentScript()` | — | Reset `currentScript` về `null` |

---

## 7. TypeScript Types (Client)

> **Quy ước:** Mô tả type chỉ liệt kê tên + property (không dùng code block). Trỏ file thực tế để tra cứu khi cần.

#### `client/src/types/scripts.types.ts`

Interface `Script`
- `id: number`
- `title: string`
- `idea: string`
- `characterCount: number`
- `minScenes: number`
- `vibe: string[]`
- `content: string | null`
- `status: 'draft' | 'generated'`
- `projectId: number`
- `projectName: string`
- `ownerId: number`
- `ownerName: string`
- `isDeleted: boolean`
- `createdAt: string`
- `updatedAt: string`

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

## 8. Project Spec v1.01 Update — [UPDATE - CR-SCRIPT-001]

### 8.1 ProjectDetailPage — Thêm Card Script

ProjectDetailPage (`/projects/:id`) thêm section Card Script ở cuối trang:

- Hiển thị `ProjectScriptCard` component
- Props: `projectId` từ route params, `scriptCount` — cần fetch count hoặc lấy từ API
- Click Card → điều hướng `router.push({ name: 'ScriptList', params: { projectId } })`

### 8.2 Project Route — Không thay đổi

Route Project không thay đổi. Route Script lồng dưới `/projects/:projectId/scripts` nhưng là module riêng.

### 8.3 Project Store — Không thay đổi

`projects.store.ts` không thay đổi. Script có store riêng (`scripts.store.ts`).

### 8.4 Project API — Không thay đổi

Project API endpoints không thay đổi. Script count có thể lấy từ `GET /api/admin/scripts?projectId=:projectId` (đếm length) hoặc thêm field `scriptCount` vào ProjectResponse (tùy chọn — mặc định dùng API Script list).
