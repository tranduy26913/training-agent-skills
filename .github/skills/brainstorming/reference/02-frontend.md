```markdown
---
title: [Feature] - Frontend Specification
version: [e.g., 1.0]
author: [Team or Owner]
date: [YYYY-MM-DD]
---

# [Feature] - Frontend Specification

> Related: [00-index.md](./00-index.md) | [01-backend.md](./01-backend.md) | [03-behavior.md](./03-behavior.md) | [04-quality.md](./04-quality.md)

---

## 1. File Structure

```text
client/src/pages/[feature]/
├── [ListPage].vue
├── [CreatePage].vue
├── [EditPage].vue
├── components/
│   ├── [Table].vue
│   ├── [Filters].vue
│   ├── [Form].vue
│   └── [OptionalViewer].vue
├── composables/
│   └── use[Feature].ts
└── [feature].routes.ts
```

---

## 2. Layout & Wireframes

### 2.1 Application Layout

```text
[DefaultLayout]
├── [Topbar]
├── [Sidebar]
└── <router-view>
    ├── [ListPage]      <- /path
    ├── [CreatePage]    <- /path/create
    └── [EditPage]      <- /path/:id/edit
```

### 2.2 Component Tree

```text
[ListPage]
  ├── [Filters]       emits: filter-change
  ├── [Table]         emits: edit, delete, view
  └── [Pagination]    emits: page-change

[CreatePage]
  └── [Form]          emits: submit, cancel

[EditPage]
  ├── [Form]          emits: submit, cancel
  └── [OptionalViewer] (e.g., audit/history panel)
```

### 2.3 [ListPage] Wireframe (`/path`)

```text
┌─────────────────────────────────────────────────────┐
│  [Page Title]                          [+ Add Button]│
├─────────────────────────────────────────────────────┤
│  [Search Input]          [Filter A ▼] [Filter B ▼]  │
├─────────────────────────────────────────────────────┤
│  Col A     │  Col B     │  Col C     │  Actions      │
│────────────┼────────────┼────────────┼───────────────│
│  value     │  value     │  value     │  [Edit][Del]  │
│  ...       │  ...       │  ...       │  ...          │
├─────────────────────────────────────────────────────┤
│                   [Pagination]                       │
└─────────────────────────────────────────────────────┘
```

#### Components

- **[Filters]**: Ô tìm kiếm, dropdown Filter A, dropdown Filter B, nút Add
- **[Table]**: Lưới dữ liệu với các cột, nút hành động Edit / Delete cho mỗi dòng
- **[Pagination]**: Điều hướng trang, bộ chọn số items mỗi trang

### 2.4 [CreatePage] / [EditPage] Wireframe (`/path/create`, `/path/:id/edit`)

```text
┌─────────────────────────────────────────────────────┐
│  [Page Title]                                        │
├─────────────────────────────────────────────────────┤
│  [Field A Label] *                                   │
│  ┌───────────────────────────────────────────────┐  │
│  │ [Input / Dropdown / ...]                      │  │
│  └───────────────────────────────────────────────┘  │
│  [Field B Label]                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │ [Input / Dropdown / ...]                      │  │
│  └───────────────────────────────────────────────┘  │
│                          [Cancel]  [Save]            │
└─────────────────────────────────────────────────────┘
```

#### Components

- **[Form]**: Tất cả các ô input, labels của form, nút Save và Cancel
- **[OptionalViewer]** _(chỉ EditPage)_: Panel lịch sử audit/activity

---

## 3. Screen Item Specifications

> Tất cả items trên mỗi page được liệt kê trong một bảng flat. Các rows với `ItemName` **bold** và `Control` trống biểu thị một **Component boundary** (group header). Labels hiển thị trên screen được liệt kê là `Label` control type.
> Cột `DisplayText` chứa i18n key cho các items render visible text (Label, Button, placeholder text, v.v.). Sử dụng `—` cho controls không có display text.

### 3.1 [ListPage] (`/path`)

| # | ItemName | Control | Type | Required | Validation | Placeholder | DisplayText | Description | Notes |
|---|----------|---------|------|----------|-----------|-------------|-------------|-------------|-------|
| **—** | **[Filters]** | | | | | | | | **Component** |
| 1 | Page Title | Label | — | — | — | — | `[feature].list.pageTitle` | Tiêu đề của trang | — |
| 2 | Add Button | Button | — | — | — | — | `[feature].list.addButton` | Mở trang tạo mới | → `handleAddClick` · [03-behavior.md](./03-behavior.md) |
| 3 | Search | TextInput | `string` | No | — | `[feature].list.searchPlaceholder` | — | Tìm kiếm items theo từ khóa | debounce 300ms |
| 4 | [Filter A] | Dropdown | `string` | No | — | `[feature].list.filterAPlaceholder` | — | Lọc theo [field A] | Kích hoạt ngay lập tức |
| 5 | [Filter B] | Dropdown | `string` | No | — | `[feature].list.filterBPlaceholder` | — | Lọc theo [field B] | Kích hoạt ngay lập tức |
| **—** | **[Table]** | | | | | | | | **Component** |
| 6 | [Column A] Header | Label | `string` | — | — | — | `[feature].list.colA` | Header cột cho fieldA | — |
| 7 | [Column A] Value | Label | `string` | — | — | — | — | Hiển thị giá trị `fieldA` mỗi dòng | — |
| 8 | [Column B] Header | Label | `string\|number` | — | — | — | `[feature].list.colB` | Header cột cho fieldB | — |
| 9 | [Column B] Value | Label | `string\|number` | — | — | — | — | Hiển thị giá trị `fieldB` mỗi dòng | — |
| 10 | Edit | Button | — | — | — | — | `common.button.edit` | Điều hướng đến trang edit | → `handleEditClick` · [03-behavior.md](./03-behavior.md) |
| 11 | Delete | Button | — | — | — | — | `common.button.delete` | Xóa dòng này | → `handleDeleteClick` · [03-behavior.md](./03-behavior.md) |
| **—** | **[Pagination]** | | | | | | | | **Component** |
| 12 | Page Selector | Pagination | `number` | — | — | — | — | Điều hướng giữa các trang | Mặc định 10/trang; tùy chọn: 10, 25, 50 |

---

### 3.2 [CreatePage] (`/path/create`)

| # | ItemName | Control | Type | Required | Validation | Placeholder | DisplayText | Description | Notes |
|---|----------|---------|------|----------|-----------|-------------|-------------|-------------|-------|
| **—** | **[Form]** | | | | | | | | **Component** |
| 1 | Page Title | Label | — | — | — | — | `[feature].create.pageTitle` | Title of the create page | — |
| 2 | [Field A] Label | Label | — | — | — | — | `[feature].form.fieldALabel` | "[Field A]" | Đánh dấu field bắt buộc (*) |
| 3 | [Field A] | TextInput | `string` | Yes | Min 2, Max 100 chars | `[feature].form.fieldAPlaceholder` | — | Field định danh chính | — |
| 4 | [Field B] Label | Label | — | — | — | — | `[feature].form.fieldBLabel` | "[Field B]" | Đánh dấu field bắt buộc (*) |
| 5 | [Field B] | Dropdown | `string` | Yes | Must select one | `[feature].form.fieldBPlaceholder` | — | Field category/type | — |
| 6 | [Field C] Label | Label | — | — | — | — | `[feature].form.fieldCLabel` | "[Field C]" | — |
| 7 | [Field C] | Textarea | `string` | No | Max 500 chars | `[feature].form.fieldCPlaceholder` | — | Chi tiết bổ sung | — |
| 8 | Cancel | Button | — | — | — | — | `common.button.cancel` | Hủy và quay lại | → `handleCancel()` · [03-behavior.md](./03-behavior.md) |
| 9 | Save | Button | — | — | — | — | `common.button.save` | Gửi form | → `handleSubmit()` · [03-behavior.md](./03-behavior.md) |

---

### 3.3 [EditPage] (`/path/:id/edit`)

| # | ItemName | Control | Type | Required | Validation | Placeholder | DisplayText | Description | Notes |
|---|----------|---------|------|----------|-----------|-------------|-------------|-------------|-------|
| **—** | **[Form]** | | | | | | | | **Component** |
| 1 | Page Title | Label | — | — | — | — | `[feature].edit.pageTitle` | Tiêu đề của trang edit | — |
| 2 | [Field A] Label | Label | — | — | — | — | `[feature].form.fieldALabel` | "[Field A]" | Đánh dấu field bắt buộc (*) |
| 3 | [Field A] | TextInput | `string` | Yes | Min 2, Max 100 chars | `[feature].form.fieldAPlaceholder` | — | Được điền sẵn từ dữ liệu hiện có | — |
| 4 | [Field B] Label | Label | — | — | — | — | `[feature].form.fieldBLabel` | "[Field B]" | Đánh dấu field bắt buộc (*) |
| 5 | [Field B] | Dropdown | `string` | Yes | Must select one | `[feature].form.fieldBPlaceholder` | — | Được chọn sẵn từ dữ liệu hiện có | — |
| 6 | [Read-only Field] Label | Label | — | — | — | — | `[feature].form.readonlyFieldLabel` | "[Read-only Field]" | — |
| 7 | [Read-only Field] | Label | `string` | — | — | — | — | Hiển thị giá trị, không chỉnh sửa | Hiển thị read-only |
| 8 | Cancel | Button | — | — | — | — | `common.button.cancel` | Hủy và quay lại | → `handleCancel()` · [03-behavior.md](./03-behavior.md) |
| 9 | Save | Button | — | — | — | — | `common.button.save` | Gửi cập nhật | → `handleSubmit()` · [03-behavior.md](./03-behavior.md) |
| **—** | **[OptionalViewer]** | | | | | | | | **Component** |
| 10 | Activity History Title | Label | — | — | — | — | `[feature].edit.activityTitle` | Header section "Activity History" | — |
| 11 | Activity Log Entries | Label | — | — | — | — | — | Danh sách các mục audit log | Được tải từ activity API |

---

## 4. Component Details

### 4.1 [ListPage].vue

**Responsibilities:**
- Khởi tạo trạng thái filters và pagination
- Fetch items khi mount và khi filter/page thay đổi
- Ủy quyền các tương tác table (edit, delete) cho router hoặc child handlers

**Props:** _(none - đây là routed page)_

---

### 4.2 [Table].vue

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `items` | `Item[]` | Yes | Mảng các items để hiển thị |
| `loading` | `boolean` | Yes | Hiển thị loading skeleton |

**Emits:**

| Event | Payload | Description |
|-------|---------|-------------|
| `edit` | `id: number` | Được kích hoạt khi click nút Edit |
| `delete` | `id: number` | Được kích hoạt khi click nút Delete |

---

### 4.3 [Filters].vue

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `modelValue` | `FilterState` | Yes | Giá trị filter hiện tại (v-model) |

**Emits:**

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `FilterState` | Giá trị filter đã cập nhật |

---

### 4.4 [Form].vue

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `mode` | `'create' \| 'edit'` | Yes | Xác định hành vi của form |
| `initialData` | `Item \| null` | No | Điền sẵn các fields trong edit mode |
| `loading` | `boolean` | No | Vô hiệu hóa nút submit khi đang lưu |

**Emits:**

| Event | Payload | Description |
|-------|---------|-------------|
| `submit` | `FormData` | Dữ liệu form đã validate |
| `cancel` | - | Người dùng hủy form |

---

### 4.5 [OptionalViewer].vue _(nếu có)_

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `itemId` | `number` | Yes | ID của item hiện tại |
| `logs` | `ActivityLog[]` | Yes | Các entry lịch sử hoạt động |

---

## 5. Composable

### use[Feature].ts
Method:
- `fetchItems(filters: FilterState, pagination: PaginationInfo): Promise<void>` - Lấy danh sách items từ API với bộ lọc và phân trang đã cho, cập nhật state
---

## 6. Store

### File: `client/src/stores/[feature].store.ts`

State:
- items: Item[] - Danh sách các items
- currentItem: Item | null - Item hiện tại đang xem/chỉnh sửa
- activityLogs: ActivityLog[] - Lịch sử hoạt động
- pagination: PaginationInfo - Thông tin phân trang
- filters: ItemFilters - Bộ lọc hiện tại
- loading: boolean - Trạng thái đang tải
- error: string | null - Lỗi (nếu có)

Actions:
- `setItems(items: Item[]): void` - Thiết lập danh sách items vào store

**Store Dependencies:**

| Store | Role |
|-------|------|
| `use[Feature]Store` | Quản lý state dữ liệu của feature |
| `useAuthStore` | Cung cấp auth token và ngữ cảnh người dùng |
| `useUiStore` | Hiển thị thông báo thành công/lỗi (toast notifications) |
| `useAuthStore` | Provides auth token và user context |
| `useUiStore` | Triggers success/error toast notifications |

---

## 7. TypeScript Types & Interfaces
```markdown
### File: `types/[feature].types.ts`
Types:
- `Item`: Model dữ liệu chính đại diện cho một item trong feature này
- `ItemFilters`: Tiêu chí lọc cho danh sách items

---

```
