```markdown
---
title: [Feature] - Behavior Specification
version: [e.g., 1.0]
author: [Team or Owner]
date: [YYYY-MM-DD]
status: [Draft | Review | Approved]
---

# [Feature] - Behavior Specification

> Related: [00-index.md](./00-index.md) | [01-backend.md](./01-backend.md) | [02-frontend.md](./02-frontend.md) | [04-quality.md](./04-quality.md)

---

## 1. Page Events & Handlers

### 1.1 [ListPage]

#### onMounted
1. Initialize default filter state
2. Call `fetchItems()` with default pagination
3. Render table with loaded items or empty state

#### handleFilterChange(filters)
1. Reset `page` to 1
2. Update filter state
3. Call `fetchItems()` with new filters
4. Update URL query params (optional)

#### handlePageChange(page)
1. Update current page in pagination state
2. Call `fetchItems()` with updated page

#### handleEditClick(id)
1. Navigate to `[EditPage]` route: `/path/:id/edit`

#### handleDeleteClick(id)
1. Show confirm dialog (see [Confirm Dialogs](#3-confirm-dialogs))
2. On confirm: call `deleteItem(id)`
3. On success: show success toast, refresh list
4. On error: show error toast

---

### 1.2 [CreatePage]

#### onMounted
1. Initialize empty form state
2. Focus first input field

#### handleSubmit(formData)
1. Validate all form fields client-side
2. If invalid: highlight error fields, stop
3. If valid: call `createItem(formData)`
4. On success: show success toast -> navigate to list
5. On error: show error toast, stay on page

#### handleCancel()
1. Check if form has unsaved changes (dirty state)
2. If dirty: show confirm dialog (see [Confirm Dialogs](#3-confirm-dialogs))
3. On confirm (or not dirty): navigate back to list

---

### 1.3 [EditPage]

#### onMounted
1. Extract `id` from route params
2. Call `fetchItem(id)`
3. Populate form with existing data
4. If item not found: redirect to 404 or list page

#### handleSubmit(formData)
1. Validate all form fields client-side
2. If invalid: highlight error fields, stop
3. If valid: call `updateItem(id, formData)`
4. On success: show success toast, stay on edit page
5. On error: show error toast, stay on page

#### handleCancel()
1. Check if form has unsaved changes (dirty state)
2. If dirty: show confirm dialog (see [Confirm Dialogs](#3-confirm-dialogs))
3. On confirm (or not dirty): navigate back to list

---

## 2. UI States

### 2.1 Loading States

| Page / Component | Trigger | UI Behavior |
|-----------------|---------|-------------|
| [ListPage] | Fetching items | Show skeleton rows in table |
| [CreatePage] / [EditPage] | Submitting form | Disable submit button, show spinner |
| [EditPage] | Loading item data | Show form skeleton / spinner |
| [OptionalViewer] | Loading activity | Show spinner in panel |

### 2.2 Empty States

| Page / Component | Condition | UI Behavior |
|-----------------|-----------|-------------|
| [ListPage] - Table | No items found (0 results) | Show "No [resource] found" message with optional CTA |
| [ListPage] - Table | Search/filter returns 0 results | Show "No results match your filter" message |
| [OptionalViewer] | No activity history | Show "No activity recorded yet" |

### 2.3 Error States

| Page / Component | Condition | UI Behavior |
|-----------------|-----------|-------------|
| [ListPage] | Fetch items fails | Show error banner: "Failed to load [resource]. Try again." |
| [CreatePage] / [EditPage] | Submit fails (server error) | Show error toast: "An error occurred. Please try again." |
| [EditPage] | Item not found (404) | Redirect to list + show warning toast: "[Resource] not found" |
| Form field | Client validation fails | Highlight field red + show inline error message |

### 2.4 Success States

| Action | UI Behavior |
|--------|-------------|
| Create successful | Toast: "[Resource] created successfully" -> redirect to list |
| Update successful | Toast: "[Resource] updated successfully" -> stay on edit page |
| Delete successful | Toast: "[Resource] deleted successfully" -> refresh list |

---

## 3. Confirm Dialogs

### 3.1 Delete Confirmation

| Property | Value |
|----------|-------|
| Trigger | Click Delete button on list row |
| Title | "Delete [Resource]" |
| Message | "Are you sure you want to delete **[item name]**? This action cannot be undone." |
| Confirm button | "Delete" (destructive / red) |
| Cancel button | "Cancel" |
| On confirm | Execute delete flow |
| On cancel | Close dialog, no action |

### 3.2 Unsaved Changes Confirmation

| Property | Value |
|----------|-------|
| Trigger | Click Cancel / navigate away when form is dirty |
| Title | "Unsaved Changes" |
| Message | "You have unsaved changes. Are you sure you want to leave?" |
| Confirm button | "Leave" |
| Cancel button | "Stay" |
| On confirm | Navigate away without saving |
| On cancel | Close dialog, stay on page |

---

## 4. Navigation Flows

| Action | From | To | Condition |
|--------|------|----|-----------|
| Click "Add" button | [ListPage] | [CreatePage] | Always |
| Click "Edit" on row | [ListPage] | [EditPage] `/:id/edit` | Always |
| Create success | [CreatePage] | [ListPage] | After successful save |
| Update success | [EditPage] | [EditPage] (stay) | After successful save |
| Cancel (clean form) | [CreatePage] / [EditPage] | [ListPage] | No dirty state |
| Cancel (dirty form) | [CreatePage] / [EditPage] | [ListPage] | After confirm dialog |
| Item not found | [EditPage] | [ListPage] | API returns 404 |
| Unauthorized | Any page | Login page | 401 response |

---

## 5. Sequence Diagrams

### 5.1 Create Flow

```text
User         [CreatePage]    use[Feature].ts    Backend       Database
  |               |                |               |              |
  |-- Fill form ->|                |               |              |
  |-- Submit ---->|                |               |              |
  |               |-- validate --->|               |              |
  |               |   (invalid) <--|               |              |
  |<-- show err --|                |               |              |
  |               |   (valid)      |               |              |
  |               |-- createItem ->|               |              |
  |               |                |-- POST ------>|              |
  |               |                |               |-- INSERT --->|
  |               |                |               |<-- result ---|
  |               |                |<-- 201 -------|              |
  |               |<-- success ----|               |              |
  |<-- toast -----|                |               |              |
  |<-- redirect ->|                |               |              |
```

### 5.2 Update Flow

```text
User         [EditPage]      use[Feature].ts    Backend       Database
  |               |                |               |              |
  |-- onMounted ->|                |               |              |
  |               |-- fetchItem -->|               |              |
  |               |                |-- GET ------->|              |
  |               |                |               |-- SELECT --->|
  |               |                |<-- data ------|              |
  |               |<-- item data --|               |              |
  |-- Edit form ->|                |               |              |
  |-- Submit ---->|                |               |              |
  |               |-- updateItem ->|               |              |
  |               |                |-- PUT ------->|              |
  |               |                |               |-- UPDATE --->|
  |               |                |<-- 200 -------|              |
  |               |<-- success ----|               |              |
  |<-- toast -----|                |               |              |
```

### 5.3 Delete Flow

```text
User         [ListPage]      use[Feature].ts    Backend       Database
  |               |                |               |              |
  |-- Delete ---->|                |               |              |
  |<-- confirm ---|                |               |              |
  |-- Confirm --->|                |               |              |
  |               |-- deleteItem ->|               |              |
  |               |                |-- DELETE ---->|              |
  |               |                |               |-- DELETE --->|
  |               |                |<-- 200 -------|              |
  |               |<-- success ----|               |              |
  |<-- toast -----|                |               |              |
  |               |-- fetchItems ->|               |              |
```

---
```
