---
title: Admin Vocabulary Management - Behavior Specification
version: 1.0
author: Admin Team
date: 2026-06-04
---

# Admin Vocabulary Management - Behavior Specification

> Related: [00-index.md](./00-index.md) | [01-backend.md](./01-backend.md) | [02-frontend.md](./02-frontend.md) | [04-quality.md](./04-quality.md)

---

## 1. Page Events & Handlers

### 1.1 VocabularyListPage Events

#### onMounted
- Fetch vocabularies with default filters (no filters, page 1, limit 20)
- Set loading state = true
- Load filter options (Status, Level, Tags, Users) for filter dropdowns
- On success: Set loading = false, display table
- On error: Set loading = false, show error toast

#### handleFilterChange(filters)
- Save filters to store
- Reset pagination to page 1
- Fetch vocabularies with new filters
- Update table display

#### handlePageChange(page)
- Keep current filters
- Fetch vocabularies with new page number
- Update table display

#### handleLimitChange(limit)
- Keep current filters
- Reset page to 1
- Fetch vocabularies with new limit
- Update table display

#### handleSortChange(field, order)
- Keep current filters
- Reset page to 1
- Fetch vocabularies with sort parameters
- Update table display

#### handleEdit(id)
- Navigate to `/vocabularies/${id}/edit`
- Fetch vocabulary detail (including audit/analytics)

#### handleView(id)
- Navigate to `/vocabularies/${id}/edit` with readonly mode flag
- Fetch vocabulary detail

#### handleDelete(id)
- Show ConfirmDialog (see section 3: Confirm Dialogs)
- On accept: Call deleteVocabulary API
- On success: Show success toast, re-fetch list
- On error: Show error toast

#### handleCreateNew()
- Navigate to `/vocabularies/create`
- Reset form to empty state

#### handleExportCsv()
- Get selected rows from table (or all if none selected)
- Call exportCsv API with current filters
- Trigger file download
- Show success toast

---

### 1.2 VocabularyFormPage Events

#### onMounted (Create mode)
- Initialize empty form
- Load all vocabularies for multiselect dropdowns (relatedWords, synonyms, antonyms)
- Set formDirty = false
- Set loading = false

#### onMounted (Edit mode)
- Extract id from route params
- Fetch vocabulary detail (with audit/analytics)
- Populate all form fields
- Set formDirty = false
- Set loading = false

#### handleFormInput()
- Set formDirty = true (when any field changes)
- Debounce field validation errors on change

#### handleSave()
- Validate all required fields (Information tab)
- Show validation errors if any
- If invalid: Do nothing
- If valid:
  - Call createVocabulary() or updateVocabulary() API
  - On success: Show success toast, navigate back to list
  - On error: Show error toast, keep form open

#### handleCancel()
- Check if formDirty = true
- If yes: Show ConfirmDialog "Discard unsaved changes?"
  - On accept: Navigate back to list
  - On reject: Stay on form
- If no: Navigate back to list immediately

#### handleDelete()
- Show ConfirmDialog "Are you sure you want to delete?"
- On accept: Call deleteVocabulary API
- On success: Show success toast, navigate to list
- On error: Show error toast, stay on form

#### handleTabChange(activeTabIndex)
- If switching to Audit tab from Information tab:
  - If formDirty and unsaved: Show warning notification
- Load tab-specific data if not already loaded

#### handleRelatedWordsSelect(vocabularies)
- Filter out self-references (vocabulary.id)
- Store selected IDs in form state

#### handleSynonymsSelect(vocabularies)
- Filter out self-references
- Store selected IDs in form state

#### handleAntonymsSelect(vocabularies)
- Filter out self-references
- Store selected IDs in form state

---

## 2. UI States

### 2.1 VocabularyListPage States

| State | Trigger | Display | Actions Available |
|-------|---------|---------|-------------------|
| **Loading** | onMounted, filter change | Skeleton loaders in table | None (disabled) |
| **Empty** | No results match filters | "No vocabularies found. Create one?" message | Create button |
| **Data Loaded** | Fetch success | Full table with data | Edit, Delete, Export, Filters, Pagination |
| **Error** | API call fails | Error toast + table hidden | Retry button, Create button |
| **No Selection** | Initial state or deselect all | Export button disabled | All actions except export |
| **With Selection** | Check rows | Export button enabled, shows count | Export selected, Select All/None |

### 2.2 VocabularyFormPage States

| State | Trigger | Display | Actions Available |
|-------|---------|---------|-------------------|
| **Loading** | onMounted (edit mode) | Form skeleton loaders | None (disabled) |
| **Create Mode** | Route `/vocabularies/create` | Empty form, no Audit/Analytics tabs | Fill fields, Save, Cancel |
| **Edit Mode** | Route `/vocabularies/:id/edit` | Populated form with data | Edit fields, Save, Cancel, Delete |
| **View Mode** | Query param `readonly=true` | All fields disabled, read-only | Cancel button only |
| **Form Dirty** | User changes field | Unsaved indicator (red dot on Save button) | Save, Cancel, Delete |
| **Form Pristine** | No changes or just saved | Normal state | Cancel button only |
| **Saving** | User clicks Save | Spinner on button, form disabled | None |
| **Save Success** | API success | Green toast + redirect to list | — |
| **Save Error** | API error | Red toast, form stays open | Retry (user clicks Save again) |
| **Delete Confirming** | User clicks Delete button | ConfirmDialog shown | Accept or Reject |
| **Deleting** | User confirms delete | Spinner, form disabled | None |
| **Delete Success** | API success | Green toast + redirect to list | — |
| **Delete Error** | API error | Red toast, form stays open | Retry |

### 2.3 Tab-Specific UI States

**Information Tab (Editable):**
- Loading state: Show field skeletons
- Pristine state: Normal form fields
- Dirty state: Show "Save your changes" indicator
- Validation error state: Show field error messages

**Audit Tab (Read-only):**
- Loading state: Show skeleton loaders for tables
- Loaded state: Display all audit info (created/updated by/at, version)
- Change Log table: Show all versions, sortable by date desc
- Reports table: Show all reports (pending highlighted), sortable by date desc

**Analytics Tab (Read-only):**
- Loading state: Show skeleton loaders
- Loaded state: Display Learn Count and Favorite Count as numbers

---

## 3. Confirm Dialogs

### 3.1 Delete Vocabulary Dialog

**Trigger:** User clicks Delete button on list or form

**Dialog Content:**
```
Title: "Delete Vocabulary"
Icon: pi-exclamation-triangle (warning)

Message: 
  "Are you sure you want to delete this vocabulary (にほん)? 
   This action will soft-delete the vocabulary and keep it in history."

Buttons:
  - [Cancel] (gray) - Close dialog, stay on page
  - [Delete] (red) - Confirm deletion
```

**Actions:**
- On Cancel: Close dialog, stay on current page
- On Delete: 
  - Show loading spinner
  - Call DELETE `/api/admin/vocabularies/:id`
  - On success: Show toast "Vocabulary deleted successfully", navigate to list
  - On error: Show toast "Failed to delete vocabulary", stay on page

---

### 3.2 Discard Unsaved Changes Dialog

**Trigger:** User clicks Cancel on form with unsaved changes (formDirty = true)

**Dialog Content:**
```
Title: "Discard Changes"
Icon: pi-question-circle (info)

Message:
  "You have unsaved changes. Do you want to discard them?"

Buttons:
  - [Keep Editing] (gray) - Close dialog, stay on form
  - [Discard] (orange/warning) - Discard and go back
```

**Actions:**
- On Keep Editing: Close dialog, stay on form
- On Discard: Navigate back to list without saving

---

### 3.3 Tab Switch Warning (Conditional)

**Trigger:** User switches away from Information tab when formDirty = true

**Dialog Content:**
```
Message (toast notification, not full dialog):
  "You have unsaved changes. Switch to another tab?"

Buttons:
  - [Cancel] (inline) - Stay on Information tab
  - [Switch] (inline) - Switch to selected tab (data may not persist)
```

**Actions:**
- On Cancel: Stay on Information tab
- On Switch: Switch tab (warning about unsaved data in Information tab)

---

## 4. Navigation Flows

### 4.1 Navigation Path Table

| Action | From | To | Condition | Preserve State |
|--------|------|----|-----------|----|
| Create New | List | Form (create) | Always | Reset form |
| Edit | List → 3-dot menu | Form (edit) | Always | Load vocabulary data |
| View | List → 3-dot menu | Form (view) | Always | Load vocabulary data, readonly |
| Delete List | List → 3-dot menu | List (after confirm) | Success | Refresh list |
| Delete Form | Form (edit) | List | Success | Refresh list |
| Cancel (pristine) | Form | List | formDirty = false | Keep list filters/page |
| Cancel (dirty) | Form | Form | formDirty = true → confirm → accept | Discard changes |
| Cancel (dirty reject) | Form | Form | formDirty = true → confirm → reject | Keep form open |
| Save (create) | Form (create) | List | Success | Show success toast, refresh list |
| Save (update) | Form (edit) | List | Success | Show success toast, refresh list |
| Save Error | Form | Form | Error | Show error, keep form |
| Export | List | Download | Selection or all | Keep list open |
| Filter Apply | List | List | Always | Update table, reset page to 1 |
| Clear Filters | List | List | Always | Reset all filters, fetch all |
| Pagination | List | List | Page/limit change | Keep filters, scroll to top |

---

## 5. Sequence Diagrams

### 5.1 Create Vocabulary Flow

```
User                FormPage           Store              API            Database
 │                    │                 │                │                │
 │ Click Create       │                 │                │                │
 ├─────────────────→  │                 │                │                │
 │                    │ Mount (create)  │                │                │
 │                    ├─────────────────→                │                │
 │                    │                 │ Fetch all      │                │
 │                    │                 │ vocabularies   │                │
 │                    │                 ├───────────────→│                │
 │                    │                 │                │ SELECT *       │
 │                    │                 │                │ FROM vocab... │
 │                    │                 │                └───────────────→
 │                    │                 │                │ vocabs[]       │
 │                    │                 │←───────────────┤                │
 │                    │←─────────────────┤                │                │
 │ Form ready         │                 │                │                │
 │←────────────────── │                 │                │                │
 │                    │                 │                │                │
 │ Fill fields        │                 │                │                │
 │ & click Save       │                 │                │                │
 ├─────────────────→  │                 │                │                │
 │                    │ handleSave()    │                │                │
 │                    ├─ Validate ─┐    │                │                │
 │                    │            │    │                │                │
 │                    │←───────────┘    │                │                │
 │                    │ Valid: proceed  │                │                │
 │                    ├─────────────────→                │                │
 │                    │                 │ POST /api/     │                │
 │                    │                 │ vocabularies   │                │
 │                    │                 ├───────────────→│                │
 │                    │                 │                │ INSERT INTO    │
 │                    │                 │                │ vocabularies   │
 │                    │                 │                │ INSERT INTO    │
 │                    │                 │                │ vocabulary_... │
 │                    │                 │                │ INSERT INTO    │
 │                    │                 │                │ vocabulary_... │
 │                    │                 │                └───────────────→
 │                    │                 │                │ { id: 100 }    │
 │                    │                 │←───────────────┤                │
 │ Success Toast      │←─────────────────┤ Success        │                │
 │ Redirect to List   │                 │                │                │
 └─────────────────→  │                 │                │                │
                      │                 │                │                │
                      │ navigate()      │                │                │
                      ├────────────────→ VocabularyList  │                │
                      │                 │                │                │
                      │                 │ Fetch list     │                │
                      │                 ├───────────────→│                │
                      │                 │                │ SELECT *       │
                      │                 │                │ FROM vocab...  │
                      │                 │                └───────────────→
                      │                 │                │ vocabs[100]    │
                      │                 │←───────────────┤                │
                      │                 │                │                │
                      │ Table updated   │                │                │
                      │←─────────────────┤                │                │
```

### 5.2 Update Vocabulary Flow

```
User                FormPage           Store              API            Database
 │                    │                 │                │                │
 │ Click Edit         │                 │                │                │
 ├─────────────────→  │                 │                │                │
 │                    │ Mount (edit)    │                │                │
 │                    ├─────────────────→                │                │
 │                    │                 │ GET /api/      │                │
 │                    │                 │ vocabularies/1 │                │
 │                    │                 ├───────────────→│                │
 │                    │                 │                │ SELECT * FROM  │
 │                    │                 │                │ vocabularies   │
 │                    │                 │                │ JOIN ...       │
 │                    │                 │                │ SELECT * FROM  │
 │                    │                 │                │ vocab_changelog
 │                    │                 │                │ SELECT * FROM  │
 │                    │                 │                │ vocab_reports  │
 │                    │                 │                └───────────────→
 │                    │                 │                │ detail {}      │
 │                    │                 │←───────────────┤                │
 │                    │←─────────────────┤                │                │
 │ Form populated     │                 │                │                │
 │←────────────────── │                 │                │                │
 │                    │                 │                │                │
 │ Edit & click Save  │                 │                │                │
 ├─────────────────→  │                 │                │                │
 │                    │ handleSave()    │                │                │
 │                    ├─ Validate ─┐    │                │                │
 │                    │ Detect diffs   │                │                │
 │                    ├─────────────────→                │                │
 │                    │                 │ PUT /api/      │                │
 │                    │                 │ vocabularies/1 │                │
 │                    │                 ├───────────────→│                │
 │                    │                 │                │ UPDATE vocab   │
 │                    │                 │                │ version = 3    │
 │                    │                 │                │ DELETE FROM    │
 │                    │                 │                │ vocab_tags     │
 │                    │                 │                │ INSERT INTO    │
 │                    │                 │                │ vocab_tags     │
 │                    │                 │                │ INSERT INTO    │
 │                    │                 │                │ vocab_changelog
 │                    │                 │                └───────────────→
 │                    │                 │                │ { success }    │
 │                    │                 │←───────────────┤                │
 │ Success Toast      │←─────────────────┤                │                │
 │ Redirect to List   │                 │                │                │
 └─────────────────→  │                 │                │                │
```

### 5.3 Delete Vocabulary Flow

```
User                ListPage           Store              API            Database
 │                    │                 │                │                │
 │ Click Delete       │                 │                │                │
 ├─────────────────→  │                 │                │                │
 │                    │ Show Confirm    │                │                │
 │                    │ Dialog          │                │                │
 │                    ├──────────────┐  │                │                │
 │                    │  Accept/      │  │                │                │
 │ Confirm Delete     │  Reject       │  │                │                │
 ├─────────────────→  │              └──┤                │                │
 │                    │ handleDelete()   │                │                │
 │                    ├─────────────────→                │                │
 │                    │                 │ DELETE /api/   │                │
 │                    │                 │ vocabularies/1 │                │
 │                    │                 ├───────────────→│                │
 │                    │                 │                │ UPDATE vocab   │
 │                    │                 │                │ status = 'del' │
 │                    │                 │                │ INSERT INTO    │
 │                    │                 │                │ vocab_changelog
 │                    │                 │                └───────────────→
 │                    │                 │                │ { success }    │
 │                    │                 │←───────────────┤                │
 │ Success Toast      │←─────────────────┤                │                │
 │                    │ Refresh list    │                │                │
 │                    ├─────────────────→                │                │
 │                    │                 │ GET /api/      │                │
 │                    │                 │ vocabularies   │                │
 │                    │                 ├───────────────→│                │
 │                    │                 │                │ SELECT * FROM  │
 │                    │                 │                │ vocab WHERE... │
 │                    │                 │                └───────────────→
 │                    │                 │                │ vocabs[]       │
 │                    │                 │←───────────────┤                │
 │ Updated list       │←─────────────────┤                │                │
 │ (without deleted)  │                 │                │                │
 └────────────────────┤                 │                │                │
                      │                 │                │                │
```

---

## 6. Special Behaviors

### 6.1 Form Dirty Detection

- `formDirty` is set to `true` when any field changes from its initial value
- Used to warn user before navigation away
- Reset to `false` after successful save
- Check before allowing cancel/tab switch

### 6.2 Validation Error Display

- **On blur:** Validate individual field
- **On submit:** Validate all required fields
- Show inline error messages below each field
- Highlight field border in red if invalid
- Prevent submit if any validation fails

### 6.3 Related Words/Synonyms/Antonyms Handling

- Load all available vocabularies on form mount (for create and edit)
- Display as MultiSelect dropdown with search capability
- Filter out self-references (current vocabulary ID cannot be selected)
- Allow clearing all selections
- Store selected vocabulary IDs (not full objects) in form state

### 6.4 Change Log Version Tracking

- Each update increments `version` counter
- Change Log shows: Version number, changed fields, description, changed_by user, timestamp
- Version 1 = initial creation
- Display in descending order (latest first) in Audit tab

### 6.5 Media URL Handling

- Accept URL string (HTTP/HTTPS)
- Validate format on blur
- Optional field
- Display as link in read-only display

### 6.6 Export CSV Behavior

- If rows selected: Export only selected rows
- If no rows selected: Prompt "Export all?" or export all by default
- Download as file: `vocabularies_YYYY-MM-DD.csv`
- Include all list columns + some additional data
- Charset: UTF-8 with BOM for Excel compatibility

---
