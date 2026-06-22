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

- **[Filters]**: Search input, Filter A dropdown, Filter B dropdown, Add button
- **[Table]**: Data grid with columns, Edit / Delete action buttons per row
- **[Pagination]**: Page navigation, items-per-page selector

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

- **[Form]**: All input fields, form labels, Save and Cancel buttons
- **[OptionalViewer]** _(EditPage only)_: Audit/activity history panel

---

## 3. Screen Item Specifications

> All items on each page are listed in a flat table. Rows with bold `ItemName` and empty `Control` indicate a **Component boundary** (group header). Labels displayed on screen are listed as `Label` control type.
> `DisplayText` column contains the i18n key for items that render visible text (Label, Button, placeholder text, etc.). Use `—` for controls with no display text.

### 3.1 [ListPage] (`/path`)

| # | ItemName | Control | Type | Required | Validation | Placeholder | DisplayText | Description | Notes |
|---|----------|---------|------|----------|-----------|-------------|-------------|-------------|-------|
| **—** | **[Filters]** | | | | | | | | **Component** |
| 1 | Page Title | Label | — | — | — | — | `[feature].list.pageTitle` | Title of the page | — |
| 2 | Add Button | Button | — | — | — | — | `[feature].list.addButton` | Opens create page | → `handleAddClick` · [03-behavior.md](./03-behavior.md) |
| 3 | Search | TextInput | `string` | No | — | `[feature].list.searchPlaceholder` | — | Search items by keyword | 300ms debounce |
| 4 | [Filter A] | Dropdown | `string` | No | — | `[feature].list.filterAPlaceholder` | — | Filter by [field A] | Triggers immediately |
| 5 | [Filter B] | Dropdown | `string` | No | — | `[feature].list.filterBPlaceholder` | — | Filter by [field B] | Triggers immediately |
| **—** | **[Table]** | | | | | | | | **Component** |
| 6 | [Column A] Header | Label | `string` | — | — | — | `[feature].list.colA` | Column header for fieldA | — |
| 7 | [Column A] Value | Label | `string` | — | — | — | — | Displays `fieldA` value per row | — |
| 8 | [Column B] Header | Label | `string\|number` | — | — | — | `[feature].list.colB` | Column header for fieldB | — |
| 9 | [Column B] Value | Label | `string\|number` | — | — | — | — | Displays `fieldB` value per row | — |
| 10 | Edit | Button | — | — | — | — | `common.button.edit` | Navigate to edit page | → `handleEditClick` · [03-behavior.md](./03-behavior.md) |
| 11 | Delete | Button | — | — | — | — | `common.button.delete` | Delete this row | → `handleDeleteClick` · [03-behavior.md](./03-behavior.md) |
| **—** | **[Pagination]** | | | | | | | | **Component** |
| 12 | Page Selector | Pagination | `number` | — | — | — | — | Navigate between pages | Default 10/page; options: 10, 25, 50 |

---

### 3.2 [CreatePage] (`/path/create`)

| # | ItemName | Control | Type | Required | Validation | Placeholder | DisplayText | Description | Notes |
|---|----------|---------|------|----------|-----------|-------------|-------------|-------------|-------|
| **—** | **[Form]** | | | | | | | | **Component** |
| 1 | Page Title | Label | — | — | — | — | `[feature].create.pageTitle` | Title of the create page | — |
| 2 | [Field A] Label | Label | — | — | — | — | `[feature].form.fieldALabel` | "[Field A]" | Marks field as required (*) |
| 3 | [Field A] | TextInput | `string` | Yes | Min 2, Max 100 chars | `[feature].form.fieldAPlaceholder` | — | Primary identifier field | — |
| 4 | [Field B] Label | Label | — | — | — | — | `[feature].form.fieldBLabel` | "[Field B]" | Marks field as required (*) |
| 5 | [Field B] | Dropdown | `string` | Yes | Must select one | `[feature].form.fieldBPlaceholder` | — | Category/type field | — |
| 6 | [Field C] Label | Label | — | — | — | — | `[feature].form.fieldCLabel` | "[Field C]" | — |
| 7 | [Field C] | Textarea | `string` | No | Max 500 chars | `[feature].form.fieldCPlaceholder` | — | Additional details | — |
| 8 | Cancel | Button | — | — | — | — | `common.button.cancel` | Cancel and go back | → `handleCancel()` · [03-behavior.md](./03-behavior.md) |
| 9 | Save | Button | — | — | — | — | `common.button.save` | Submit form | → `handleSubmit()` · [03-behavior.md](./03-behavior.md) |

---

### 3.3 [EditPage] (`/path/:id/edit`)

| # | ItemName | Control | Type | Required | Validation | Placeholder | DisplayText | Description | Notes |
|---|----------|---------|------|----------|-----------|-------------|-------------|-------------|-------|
| **—** | **[Form]** | | | | | | | | **Component** |
| 1 | Page Title | Label | — | — | — | — | `[feature].edit.pageTitle` | Title of the edit page | — |
| 2 | [Field A] Label | Label | — | — | — | — | `[feature].form.fieldALabel` | "[Field A]" | Marks field as required (*) |
| 3 | [Field A] | TextInput | `string` | Yes | Min 2, Max 100 chars | `[feature].form.fieldAPlaceholder` | — | Pre-filled from existing data | — |
| 4 | [Field B] Label | Label | — | — | — | — | `[feature].form.fieldBLabel` | "[Field B]" | Marks field as required (*) |
| 5 | [Field B] | Dropdown | `string` | Yes | Must select one | `[feature].form.fieldBPlaceholder` | — | Pre-selected from existing data | — |
| 6 | [Read-only Field] Label | Label | — | — | — | — | `[feature].form.readonlyFieldLabel` | "[Read-only Field]" | — |
| 7 | [Read-only Field] | Label | `string` | — | — | — | — | Displays value, not editable | Read-only display |
| 8 | Cancel | Button | — | — | — | — | `common.button.cancel` | Cancel and go back | → `handleCancel()` · [03-behavior.md](./03-behavior.md) |
| 9 | Save | Button | — | — | — | — | `common.button.save` | Submit update | → `handleSubmit()` · [03-behavior.md](./03-behavior.md) |
| **—** | **[OptionalViewer]** | | | | | | | | **Component** |
| 10 | Activity History Title | Label | — | — | — | — | `[feature].edit.activityTitle` | "Activity History" section header | — |
| 11 | Activity Log Entries | Label | — | — | — | — | — | Audit log items list | Loaded from activity API |

---

## 4. Component Details

### 4.1 [ListPage].vue

**Responsibilities:**
- Initialize filters and pagination state
- Fetch items on mount and on filter/page change
- Delegate table interactions (edit, delete) to router or child handlers

**Props:** _(none - this is a routed page)_

---

### 4.2 [Table].vue

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `items` | `Item[]` | Yes | Array of items to display |
| `loading` | `boolean` | Yes | Shows loading skeleton |

**Emits:**

| Event | Payload | Description |
|-------|---------|-------------|
| `edit` | `id: number` | Triggered when Edit button is clicked |
| `delete` | `id: number` | Triggered when Delete button is clicked |

---

### 4.3 [Filters].vue

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `modelValue` | `FilterState` | Yes | Current filter values (v-model) |

**Emits:**

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `FilterState` | Updated filter values |

---

### 4.4 [Form].vue

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `mode` | `'create' \| 'edit'` | Yes | Determines form behavior |
| `initialData` | `Item \| null` | No | Pre-fills form fields in edit mode |
| `loading` | `boolean` | No | Disables submit button during save |

**Emits:**

| Event | Payload | Description |
|-------|---------|-------------|
| `submit` | `FormData` | Validated form data |
| `cancel` | - | User cancelled the form |

---

### 4.5 [OptionalViewer].vue _(if applicable)_

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `itemId` | `number` | Yes | ID of the current item |
| `logs` | `ActivityLog[]` | Yes | Activity history entries |

---

## 5. Composable

### use[Feature].ts
Method:
- `fetchItems(filters: FilterState, pagination: PaginationInfo): Promise<void>` - Fetches items from API with given filters and pagination, updates state
---

## 6. Store

### File: `client/src/stores/[feature].store.ts`

State:
- items: Item[]
- currentItem: Item | null
- activityLogs: ActivityLog[]
- pagination: PaginationInfo
- filters: ItemFilters
- loading: boolean
- error: string | null

Actions:
- `setItems(items: Item[]): void` - Sets the list of items in the store

**Store Dependencies:**

| Store | Role |
|-------|------|
| `use[Feature]Store` | Manages feature data state |
| `useAuthStore` | Provides auth token and user context |
| `useUiStore` | Triggers success/error toast notifications |

---

## 7. TypeScript Types & Interfaces
```markdown
### File: `types/[feature].types.ts`
Types:
- `Item`: Main data model representing an item in this feature
- `ItemFilters`: Filter criteria for listing items

---


## 8. i18n Keys
| Key | VN Text | EN Text | JP Text | Description |
|-----|--------------|-------------|-------------|-------------|
| `[feature].list.pageTitle` | "Danh sách [Feature]" | "[Feature] List" | "[Feature] 一覧" | Title of the list page |
