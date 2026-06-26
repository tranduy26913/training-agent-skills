---
title: Project Management - Frontend
version: 1.01
author: Admin Team
date: 2026-06-25
---

# Project Management — Frontend

> Related: [00-index.md](./00-index.md) | [01-backend.md](./01-backend.md) | [03-behavior.md](./03-behavior.md) | [04-quality.md](./04-quality.md)

---

## 1. File Structure

```
client/src/
├── pages/projects/
│   ├── ProjectListPage.vue              # Trang danh sách Project dạng Card grid
│   ├── ProjectDetailPage.vue            # Trang chi tiết Project (read-only)
│   ├── projects.routes.ts               # Route definitions
│   ├── components/
│   │   ├── ProjectCard.vue              # Card component cho mỗi Project
│   │   ├── ProjectFormDialog.vue        # Modal Dialog cho Create/Edit
│   │   ├── ProjectDeleteDialog.vue      # Confirm Dialog cho Delete
│   │   └── ProjectScriptCard.vue        # [NEW - CR-SCRIPT-001] Card Script trên Project Detail
│   └── composables/
│       └── useProjects.ts               # API call wrappers
├── stores/
│   └── projects.store.ts                # Pinia store quản lý project state
├── services/
│   └── projects.service.ts              # ProjectsApiClient extends BaseApiClient
└── types/
    └── projects.types.ts                # Project, CreateProjectDto, UpdateProjectDto
```

---

## 2. Layout & Wireframes

### Application Layout

```
DefaultLayout
├── AppTopbar
├── AppSidebar (mục "Quản lý Project" được highlight)
└── <router-view>
    ├── ProjectListPage       ← /projects
    └── ProjectDetailPage     ← /projects/:id
```

### Component Tree

```
ProjectListPage
  ├── PageHeader (title + Create button)
  ├── ProjectCard[]           (emits: click, edit, delete)
  ├── ProjectFormDialog      (emits: saved, closed)
  └── ProjectDeleteDialog    (emits: confirmed, cancelled)

ProjectDetailPage
  └── ProjectDetail (read-only form)
```

### Route Definitions (`projects.routes.ts`)

```typescript
export const projectRoutes: RouteRecordRaw[] = [
  {
    path: '/projects',
    component: () => import('@layouts/DefaultLayout.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
    children: [
      {
        path: '',
        name: 'ProjectList',
        component: () => import('./ProjectListPage.vue'),
        meta: { title: 'Quản lý Project', titleKey: 'projects.title', breadcrumb: 'Projects' },
      },
      {
        path: ':id',
        name: 'ProjectDetail',
        component: () => import('./ProjectDetailPage.vue'),
        meta: { title: 'Chi tiết Project', titleKey: 'projects.detail' },
      },
    ],
  },
];
```

**Route meta:** `requiresAuth: true`, `roles: ['admin']` (router guard check), `title`, `titleKey` (i18n), `breadcrumb`.

---

## 3. Screen Item Specifications

### 3.1 ProjectListPage (`/projects`)

| # | ItemName | Control | Type | Required | Validation | Placeholder | DisplayText | Description | Notes |
|---|----------|---------|------|----------|------------|-------------|-------------|-------------|-------|
| **—** | **PageHeader** | | | | | | | **Section** | |
| 1 | pageTitle | Label | — | — | — | — | `projects.list.pageTitle` | "Quản lý Project" | — |
| 2 | createButton | Button | — | — | — | — | `projects.list.createButton` | Mở modal tạo Project | Icon: PiPlus; severity: primary |
| **—** | **ProjectCard[]** | | | | | | | **Card Grid** | |
| 3 | projectCard | Card | Project | — | — | — | — | Card hiển thị thông tin Project | Grid layout, responsive (1→2→3 columns) |
| 4 | cardName | Label | string | — | — | — | — | Tên Project (bold, truncate 2 dòng) | — |
| 5 | cardDescription | Label | string | — | — | — | — | Mô tả Project (truncate 3 dòng) | Nếu null/empty thì ẩn |
| 6 | cardPromptPreview | Label | string | — | — | — | — | Xem trước prompt (truncate 2 dòng, italic) | Nếu null/empty thì ẩn |
| 7 | cardUpdatedAt | Label | string | — | — | — | — | "Cập nhật: DD/MM/YYYY" | — |
| 8 | cardActionMenu | SpeedDial / Button | — | — | — | — | — | Menu action: "Chỉnh sửa", "Xoá" | Icon: PiDotsThreeVertical; emits edit/delete |
| **—** | **Empty State** | | | | | | | **Section** | |
| 9 | emptyIcon | Icon | — | — | — | — | — | Icon empty state (PiFolderOpen) | — |
| 10 | emptyMessage | Label | — | — | — | — | `projects.list.empty` | "Chưa có Project nào" | — |
| 11 | emptyCreateButton | Button | — | — | — | — | `projects.list.createButton` | Nút tạo Project đầu tiên | Chỉ hiển thị khi empty |
| **—** | **Loading State** | | | | | | | **Section** | |
| 12 | skeletonCard | Skeleton | — | — | — | — | — | Skeleton card khi loading | 3 skeleton cards |

### 3.2 ProjectDetailPage (`/projects/:id`)

| # | ItemName | Control | Type | Required | Validation | Placeholder | DisplayText | Description | Notes |
|---|----------|---------|------|----------|------------|-------------|-------------|-------------|-------|
| **—** | **PageHeader** | | | | | | | **Section** | |
| 1 | backButton | Button | — | — | — | — | `common.back` | Quay lại danh sách | Icon: PiArrowLeft; text |
| 2 | pageTitle | Label | — | — | — | — | `projects.detail.pageTitle` | "Chi tiết Project" | — |
| **—** | **ProjectDetail** | | | | | | | **Section** | |
| 3 | nameLabel | Label | — | — | — | — | `projects.form.name` | "Tên Project" | Bold label |
| 4 | nameValue | Label | string | — | — | — | — | Giá trị tên Project | — |
| 5 | descriptionLabel | Label | — | — | — | — | `projects.form.description` | "Mô tả" | Bold label |
| 6 | descriptionValue | Label | string | — | — | — | — | Giá trị mô tả Project | Nếu null hiển thị "—" |
| 7 | projectPromptLabel | Label | — | — | — | — | `projects.form.projectPrompt` | "Project Prompt" | Bold label |
| 8 | projectPromptValue | Label | string | — | — | — | — | Giá trị prompt | Nếu null hiển thị "—" |
| 9 | ownerLabel | Label | — | — | — | — | `projects.form.owner` | "Người tạo" | Bold label |
| 10 | ownerValue | Label | string | — | — | — | — | Tên người tạo | — |
| 11 | createdAtLabel | Label | — | — | — | — | `projects.form.createdAt` | "Ngày tạo" | Bold label |
| 12 | createdAtValue | Label | string | — | — | — | — | DD/MM/YYYY HH:mm | — |
| 13 | updatedAtLabel | Label | — | — | — | — | `projects.form.updatedAt` | "Cập nhật lần cuối" | Bold label |
| 14 | updatedAtValue | Label | string | — | — | — | — | DD/MM/YYYY HH:mm | — |
| **—** | **ProjectScriptCard** | | | | | | | **Component** | [NEW - CR-SCRIPT-001] |
| 15 | scriptCardTitle | Label | — | — | — | — | `scripts.card.title` | "Kịch bản" | Bold label |
| 16 | scriptCount | Label | number | — | — | — | — | Số lượng kịch bản (VD: "5 kịch bản") | Lấy từ scriptsStore |
| 17 | scriptCardClick | Button | — | — | — | — | `scripts.card.viewAll` | "Xem tất cả" | Click → ScriptListPage. Xem `docs/scripts/specs/scripts-design/02-frontend.md` |

### 3.3 ProjectFormDialog (Modal)

| # | ItemName | Control | Type | Required | Validation | Placeholder | DisplayText | Description | Notes |
|---|----------|---------|------|----------|------------|-------------|-------------|-------------|-------|
| **—** | **Dialog** | | | | | | | **Modal** | |
| 1 | dialogHeader | Label | — | — | — | — | `projects.form.createTitle` / `projects.form.editTitle` | "Tạo Project" hoặc "Chỉnh sửa Project" | Dynamic theo mode |
| **—** | **Form Fields** | | | | | | | **Section** | |
| 2 | nameLabel | Label | — | — | — | — | `projects.form.name` | "Tên Project" | Marks field as required (*) |
| 3 | nameInput | InputText | string | Yes | min 2, max 200 | `projects.form.namePlaceholder` | — | Nhập tên Project | Inline error bên dưới |
| 4 | descriptionLabel | Label | — | — | — | — | `projects.form.description` | "Mô tả" | — |
| 5 | descriptionInput | Textarea | string | No | max 2000 | `projects.form.descriptionPlaceholder` | — | Mô tả Project | Character counter `n/2000` |
| 6 | projectPromptLabel | Label | — | — | — | — | `projects.form.projectPrompt` | "Project Prompt" | — |
| 7 | projectPromptInput | Textarea | string | No | max 10000 | `projects.form.promptPlaceholder` | — | System prompt cho AI | Character counter `n/10000` |
| **—** | **Actions** | | | | | | | **Section** | |
| 8 | cancelButton | Button | — | — | — | — | `common.cancel` | Đóng modal | — |
| 9 | saveButton | Button | — | — | — | — | `common.save` | Lưu Project | Disabled khi loading; hiển thị spinner |

### 3.4 ProjectDeleteDialog (Confirm Dialog)

| # | ItemName | Control | Type | Required | Validation | Placeholder | DisplayText | Description | Notes |
|---|----------|---------|------|----------|------------|-------------|-------------|-------------|-------|
| **—** | **Dialog** | | | | | | | **Modal** | |
| 1 | dialogHeader | Label | — | — | — | — | `projects.delete.header` | "Xoá Project" | — |
| 2 | confirmMessage | Label | — | — | — | — | `projects.delete.confirm` | "Bạn có chắc muốn xoá Project **{name}**?" | Dynamic tên Project |
| 3 | cancelButton | Button | — | — | — | — | `common.no` | "Không" | — |
| 4 | deleteButton | Button | — | — | — | — | `common.yes` | "Xoá" | severity: danger |

---

## 4. Component Details

### ProjectCard.vue

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `project` | `Project` | Yes | Dữ liệu Project để hiển thị |

**Emits:**

| Event | Payload | Description |
|-------|---------|-------------|
| `click` | `id: number` | Click vào card → mở ProjectDetailPage |
| `edit` | `id: number` | Click "Chỉnh sửa" trong action menu |
| `delete` | `id: number` | Click "Xoá" trong action menu |

**Layout:**
- Card với `p-4`, shadow, border, hover effect
- Header: Tên Project (bold, text-lg, truncate 2 dòng)
- Body: Mô tả (text-sm, text-gray-600, truncate 3 dòng)
- Body: Prompt preview (text-xs, italic, text-gray-400, truncate 2 dòng)
- Footer: UpdatedAt + Action menu (góc phải)
- Action menu: SpeedDial hoặc Button + OverlayPanel với 2 actions

### ProjectFormDialog.vue

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `visible` | `boolean` | Yes | Hiển thị/ẩn dialog |
| `mode` | `'create' \| 'edit'` | Yes | Chế độ tạo hoặc sửa |
| `project` | `Project \| null` | No | Dữ liệu Project khi edit mode |

**Emits:**

| Event | Payload | Description |
|-------|---------|-------------|
| `saved` | `CreateProjectDto \| UpdateProjectDto` | Form submit thành công |
| `closed` | — | Đóng dialog (cancel hoặc click outside) |

**Internal state:**
- `formData`: reactive form state (name, description, projectPrompt)
- `loading`: boolean — disable save button khi đang submit
- `submitted`: boolean — đã submit ít nhất 1 lần (hiển thị validation errors)

**Validation:** VeeValidate + Zod schema:
- `name`: z.string().min(2, "Tên phải từ 2 ký tự").max(200, "Tên không quá 200 ký tự")
- `description`: z.string().max(2000, "Mô tả không quá 2000 ký tự").optional()
- `projectPrompt`: z.string().max(10000, "Prompt không quá 10000 ký tự").optional()

### ProjectDeleteDialog.vue

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `visible` | `boolean` | Yes | Hiển thị/ẩn dialog |
| `projectName` | `string` | Yes | Tên Project để hiển thị trong message |

**Emits:**

| Event | Payload | Description |
|-------|---------|-------------|
| `confirmed` | — | User xác nhận xoá |
| `cancelled` | — | User huỷ |

---

## 5. Composable — `useProjects.ts`

**Location:** `client/src/pages/projects/composables/useProjects.ts`

**Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getProjects()` | — | `Promise<Project[]>` | Lấy danh sách projects |
| `getProject(id)` | `id: number` | `Promise<Project>` | Lấy chi tiết project |
| `createProject(data)` | `data: CreateProjectDto` | `Promise<Project>` | Tạo project mới |
| `updateProject(id, data)` | `id: number, data: UpdateProjectDto` | `Promise<Project>` | Cập nhật project |
| `deleteProject(id)` | `id: number` | `Promise<void>` | Xoá project (soft delete) |

---

## 6. Store — `projects.store.ts`

**Location:** `client/src/stores/projects.store.ts`

**State:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `projects` | `Project[]` | `[]` | Danh sách projects |
| `currentProject` | `Project \| null` | `null` | Project đang xem chi tiết |
| `loading` | `boolean` | `false` | Trạng thái loading |
| `error` | `string \| null` | `null` | Thông báo lỗi |

**Actions:**

| Action | Parameters | Description |
|--------|------------|-------------|
| `fetchProjects()` | — | Lấy danh sách projects, set `loading`/`error` |
| `fetchProject(id)` | `id: number` | Lấy chi tiết project, set `currentProject` |
| `createProject(data)` | `data: CreateProjectDto` | Tạo project, KHÔNG tự động reload list |
| `updateProject(id, data)` | `id: number, data: UpdateProjectDto` | Cập nhật project, KHÔNG tự động reload list |
| `deleteProject(id)` | `id: number` | Xoá project, tự động reload list |
| `clearCurrentProject()` | — | Reset `currentProject` về `null` |

---

## 7. TypeScript Types (Client)

> **Quy ước:** Mô tả type chỉ liệt kê tên + property (không dùng code block). Trỏ file thực tế để tra cứu khi cần.

#### `client/src/types/projects.types.ts`

Interface `Project`
- `id: number`
- `name: string`
- `description: string | null`
- `projectPrompt: string | null`
- `headline: string | null`
- `caption: string | null`
- `subtext: string | null`
- `ownerId: number`
- `ownerName: string`
- `isDeleted: boolean`
- `createdAt: string`
- `updatedAt: string`

Interface `CreateProjectDto`
- `name: string`
- `description?: string`
- `projectPrompt?: string`

Type `UpdateProjectDto`
- alias của `CreateProjectDto` (tất cả fields optional)
