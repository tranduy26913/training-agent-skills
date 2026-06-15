# Vocabulary Management — Behavior Specification

> Related: [00-index.md](./00-index.md) | [01-backend.md](./01-backend.md) | [02-frontend.md](./02-frontend.md) | [04-quality.md](./04-quality.md)

---

## 1. Page Events & Handlers

### 1.1 VocabularyListPage

| Event | Handler | Description |
|-------|---------|-------------|
| `onMounted` | `loadVocabularies()` | Load danh sách từ vựng với filters mặc định |
| Click "Create New" | `handleCreate()` | Navigate to `/vocabularies/create` |
| Click "Edit" | `handleEdit(id)` | Navigate to `/vocabularies/:id/edit` |
| Click "Delete" | `handleDelete(id)` | Show confirm dialog → call API → refresh list |
| Filter change | `handleFilterChange()` | Debounce 300ms → call `loadVocabularies()` |
| Click "Search" | `handleSearch()` | Apply filters |
| Click "Reset" | `handleReset()` | Clear filters → call `loadVocabularies()` |
| Pagination change | `handlePageChange(page)` | Load page mới |
| Sort change | `handleSort(field, order)` | Load sorted data |

**onMounted flow:**

1. Load filters từ URL query params (nếu có)
2. Call `fetchVocabularies(filters)`
3. Hiển thị data vào table

---

### 1.2 VocabularyFormPage — Tab Thông tin

| Event | Handler | Description |
|-------|---------|-------------|
| `onMounted` | `initializeForm()` | Load vocabulary data (nếu edit) hoặc init empty form |
| Form submit | `handleSubmit()` | Validate → call API → show success → navigate back |
| Click "Cancel" | `handleCancel()` | Show confirm dialog nếu form có changes → navigate back |
| Relation MultiSelect change | `handleRelationChange(type, ids)` | Update form state |
| Tags input change | `handleTagsChange(tags)` | Update tags array |
| Media URL blur | `validateMediaUrl()` | Validate URL format |

**onMounted flow (Create):**

1. Init empty form với default values (status = 'Publish')
2. Load relation options từ API
3. Switch to Tab "Thông tin"

**onMounted flow (Edit):**

1. Load vocabulary detail từ API `/api/vocabularies/:id`
2. Pre-fill form với data từ API
3. Load relations, change logs, reports
4. Switch to Tab "Thông tin"

---

### 1.3 VocabularyFormPage — Tab Audit

| Event | Handler | Description |
|-------|---------|-------------|
| Click "Resolve Report" | `handleResolveReport(reportId)` | Show confirm dialog → update report status → refresh data |

---

## 2. UI States

### 2.1 VocabularyListPage

| State | Condition | UI Behavior |
|-------|-----------|-------------|
| **Loading** | API call in progress | Show DataTable skeleton/spinner |
| **Empty** | No data returned | Show "No vocabulary found" message + "Create New" button |
| **Error** | API returns error | Show error message + "Retry" button |
| **Success** | Data loaded | Show table with data + pagination |

### 2.2 VocabularyFormPage

| State | Condition | UI Behavior |
|-------|-----------|-------------|
| **Loading** | API call in progress (edit mode) | Show full-page spinner |
| **Not Found** | Vocabulary 404 | Show error message + "Back to List" button |
| **Form Valid** | All required fields valid | Enable "Save" button |
| **Form Invalid** | Validation errors exist | Disable "Save" button + show error messages |
| **Saving** | API call in progress | Disable form + show spinner on Save button |
| **Success** | API returns 201/200 | Show success toast → navigate back |
| **Error** | API returns error | Show error toast with message |

### 2.3 Tab Analytics

| State | Condition | UI Behavior |
|-------|-----------|-------------|
| **Loading** | Analytics API call in progress | Show stat cards skeleton |
| **Success** | Data loaded | Show stat cards với số liệu |

---

## 3. Confirm Dialogs

| Dialog | Trigger | Title | Message | Buttons | Outcomes |
|--------|---------|-------|---------|---------|----------|
| Delete Confirm | Click "Delete" on list | `vocab.dialog.delete.title` | `vocab.dialog.delete.message` | "Hủy", "Xóa" | Hủy: đóng dialog | Xóa: call API → refresh list |
| Cancel Unsaved | Click "Cancel" với form có changes | `vocab.dialog.cancel.title` | `vocab.dialog.cancel.message` | "Hủy", "Đóng" | Hủy: ở lại form | Đóng: navigate back |
| Resolve Report | Click "Resolve" trên report | `vocab.dialog.resolve.title` | `vocab.dialog.resolve.message` | "Hủy", "Xử lý" | Hủy: đóng dialog | Xử lý: update status → refresh |

---

## 4. Navigation Flows

| Action | From | To | Condition |
|--------|------|----|-----------|
| Click "Create New" | VocabularyListPage | VocabularyFormPage (create) | Always |
| Click "Edit" | VocabularyListPage | VocabularyFormPage (edit) | Vocabulary exists |
| Click Kanji | VocabularyListPage | VocabularyFormPage (edit) | Always |
| Submit form success | VocabularyFormPage | VocabularyListPage | API 201/200 |
| Submit form error | VocabularyFormPage | VocabularyFormPage | API error — stay on page |
| Click Cancel | VocabularyFormPage | VocabularyListPage | No changes OR user confirms |
| Click "Back" | VocabularyFormPage | VocabularyListPage | Always |
| Click "Resolve Report" | TabAudit | TabAudit (same) | Report status updated |

---

## 5. Mermaid Diagrams

### 5.1 Create Vocabulary Flow

```mermaid
sequenceDiagram
    participant U as User
    participant P as VocabularyFormPage
    participant C as useVocabularies
    participant A as API

    U->>P: Click "Create New"
    P->>P: Navigate to /vocabularies/create
    P->>P: Initialize empty form
    P->>C: Load relation options
    C->>A: GET /api/vocabularies?limit=1000
    A-->>C: Return vocab list
    C-->>P: Return options
    U->>P: Fill form
    U->>P: Click "Save"
    P->>P: Validate form
    alt Form invalid
        P-->>U: Show validation errors
    else Form valid
        P->>C: createVocabulary(data)
        C->>A: POST /api/vocabularies
        alt Duplicate
            A-->>C: 409 Conflict
            C-->>P: Show error
            P-->>U: Show error toast
        else Success
            A-->>C: 201 Created
            C-->>P: Return created vocab
            P-->>U: Show success toast
            P->>P: Navigate to list
        end
    end
```

### 5.2 Edit Vocabulary Flow

```mermaid
sequenceDiagram
    participant U as User
    participant P as VocabularyFormPage
    participant C as useVocabularies
    participant A as API

    U->>P: Click "Edit"
    P->>P: Navigate to /vocabularies/:id/edit
    P->>C: fetchVocabulary(id)
    C->>A: GET /api/vocabularies/:id
    alt Not Found
        A-->>C: 404 Not Found
        C-->>P: Show error
        P->>P: Navigate to list
    else Success
        A-->>C: 200 OK + detail
        C-->>P: Pre-fill form
        U->>P: Modify form
        U->>P: Click "Save"
        P->>C: updateVocabulary(id, data)
        C->>A: PUT /api/vocabularies/:id
        alt Success
            A-->>C: 200 OK + version
            C-->>P: Return updated vocab
            P-->>U: Show success toast
            P->>P: Refresh tab data
        end
    end
```

### 5.3 Delete Vocabulary Flow

```mermaid
sequenceDiagram
    participant U as User
    participant P as VocabularyListPage
    participant C as useVocabularies
    participant A as API

    U->>P: Click "Delete"
    P->>P: Show confirm dialog
    U->>P: Confirm delete
    P->>C: deleteVocabulary(id)
    C->>A: DELETE /api/vocabularies/:id
    alt Success
        A-->>C: 200 OK
        C-->>P: Delete successful
        P->>P: Refresh list
        P-->>U: Show success toast
    else Error
        A-->>C: Error
        C-->>P: Show error toast
    end
```

### 5.4 Tab Navigation Flow

```mermaid
flowchart TD
    A[Form Page Load] --> B{Create or Edit?}
    B -->|Create| C[Tab: Thông tin]
    B -->|Edit| D[Load vocabulary detail]
    D --> E[Tab: Thông tin]
    
    C --> F[User clicks Tab]
    E --> F
    
    F --> G{Tab selected?}
    G -->|Thông tin| H[Show TabInfo]
    G -->|Audit| I[Show TabAudit]
    G -->|Analytics| J[Show TabAnalytics]
    
    H --> K[User clicks Save]
    K --> L{Valid?}
    L -->|No| M[Show validation errors]
    M --> H
    L -->|Yes| N[Call API]
    N --> O{Success?}
    O -->|No| P[Show error toast]
    P --> H
    O -->|Yes| Q[Show success toast]
    Q --> R[Navigate to list]
```
