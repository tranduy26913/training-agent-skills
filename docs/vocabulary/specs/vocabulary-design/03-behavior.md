---
title: Vocabulary Management - Behavior
version: 1.0
author: Admin Team
date: 2026-05-19
status: Draft
---

# Vocabulary Management — Behavior

> Related: [00-index.md](./00-index.md) | [01-backend.md](./01-backend.md) | [02-frontend.md](./02-frontend.md) | [04-quality.md](./04-quality.md)

---

## 1. Page Events & Handlers

### 1.1 VocabularyListPage

**onMounted:**
1. Khởi tạo filters mặc định `page=1`, `limit=10`, `sortBy='updated_at'`, `sortOrder='desc'`.
2. Gọi `vocabularyStore.fetchVocabularies(defaultFilters)`.

**handleFilterChange(filters):**
1. Merge filters mới và reset `page=1`.
2. Gọi `fetchVocabularies(mergedFilters)`.

**handlePageChange(page):**
1. Gọi `fetchVocabularies({ ...activeFilters, page })`.

**handleSortChange({ sortBy, sortOrder }):**
1. Gọi `fetchVocabularies({ ...activeFilters, sortBy, sortOrder, page: 1 })`.

**handleEdit(id):**
1. `router.push({ name: 'VocabularyEdit', params: { id } })`.

**handleDelete(id):**
1. Hiển thị confirm dialog.
2. Nếu accept, gọi update status sang `delete`.
3. Toast success và reload list.

---

### 1.2 VocabularyCreatePage

**onMounted:**
1. Load lookup options cho 3 multiSelect từ database.
2. Tab Audit và Analytics hiển thị empty state vì record chưa tồn tại.

**handleSubmit(formData):**
1. Gọi `createVocabulary(formData)`.
2. Thành công → toast success.
3. Điều hướng sang `VocabularyEdit` của record vừa tạo để người dùng xem audit/analytics thực tế.

**handleCancel():**
1. `router.push({ name: 'VocabularyList' })`.

---

### 1.3 VocabularyEditPage

**onMounted:**
1. Parse `route.params.id`.
2. Gọi song song:
   - `getVocabulary(id)`
   - `getVocabularyAudit(id)`
   - `getVocabularyAnalytics(id)`
   - `getLookupVocabulary({ excludeId: id })`
3. Populate form và 2 tab read-only khi data sẵn sàng.

**onUnmounted:**
1. Clear current detail state trong store.

**handleSubmit(formData):**
1. Gọi `updateVocabulary(id, formData)`.
2. Thành công → toast success.
3. Reload detail/audit/analytics để reflect version mới.

**handleCancel():**
1. `router.push({ name: 'VocabularyList' })`.

---

## 2. UI States

### VocabularyListPage

| State | Trigger | Behavior |
|-------|---------|----------|
| Loading | `loading=true` | Table hiển thị skeleton |
| Empty | Không có dữ liệu | Hiển thị empty state |
| Error | API fail | Toast error hiển thị message |

### VocabularyCreatePage / VocabularyEditPage

| State | Trigger | Behavior |
|-------|---------|----------|
| Loading detail | `loadingDetail=true` | Skeleton trên form |
| Loading lookup | `loadingLookup=true` | MultiSelect hiển thị loading trong dropdown |
| Loading audit | `loadingAudit=true` | Audit tab skeleton |
| Loading analytics | `loadingAnalytics=true` | Analytics tab skeleton |
| Validation error | Submit invalid | Inline error dưới từng field |
| Submitting | Click Save | Disable button, tránh double submit |
| Create empty tabs | mode=create | Audit/Analytics tabs show empty-state hint |

### Audit Tab

| State | Trigger | Behavior |
|-------|---------|----------|
| Empty | Chưa có record hoặc chưa lưu lần đầu | Hiển thị message giải thích |
| Populated | Có data | Hiển thị metadata, change log, report info |

### Analytics Tab

| State | Trigger | Behavior |
|-------|---------|----------|
| Empty | Chưa có record | Hiển thị message giải thích |
| Populated | Có data | Hiển thị learn count và favorite count |

---

## 3. Confirm Dialogs

### Soft Delete Dialog

| Thuộc tính | Giá trị |
|-----------|---------|
| Trigger | Click Delete trong list hoặc action chuyển status `delete` |
| Title | `vocabulary.deleteConfirmTitle` |
| Message | Xác nhận chuyển trạng thái từ hiện tại sang `Delete`; record vẫn còn trong hệ thống |
| Confirm button | Danger style |
| Cancel button | `common.cancel` |
| On confirm | Update status `delete`, ghi audit, reload list/detail |

---

## 4. Navigation Flows

| Action | From | To | Condition |
|--------|------|----|-----------|
| Click Create | VocabularyListPage | VocabularyCreatePage | Always |
| Click Edit | VocabularyListPage | VocabularyEditPage | Always |
| Submit create success | VocabularyCreatePage | VocabularyEditPage | After create trả về id |
| Submit edit success | VocabularyEditPage | VocabularyEditPage | Stay on page and refresh tabs |
| Click Cancel (create/edit) | Create/Edit | VocabularyListPage | Always |
| Click Delete confirm | List | Reload current list page | After status update |
| Click Delete confirm | Edit | Stay on edit page và refresh detail/audit/analytics | After status update |
| Access admin route non-admin | Any | 403 / redirect | Guard role admin |

---

## 5. Sequence Diagrams

### 5.1 Create Vocabulary Flow

```text
Admin          Frontend              Backend               Database
  │               │                    │                     │
  │── nhập form ─►│                    │                     │
  │               │── validate client ─►│                     │
  │── Save ──────►│                    │                     │
  │               │── POST /vocabularies────────────────────►│
  │               │                    │── auth/admin check   │
  │               │                    │── validate body      │
  │               │                    │── INSERT vocabulary ─►
  │               │                    │── INSERT relations ──►
  │               │                    │── INSERT audit log ──►
  │               │◄── 201 + id ───────│                     │
  │◄── toast OK ──│                    │                     │
  │── redirect ───► VocabularyEditPage │                     │
```

### 5.2 Edit Vocabulary Flow

```text
Admin          Frontend              Backend               Database
  │               │                    │                     │
  │── mở edit ───►│                    │                     │
  │               │── GET detail ───────────────────────────►│
  │               │── GET audit ─────────────────────────────►│
  │               │── GET analytics ────────────────────────►│
  │               │── GET lookup (excludeId) ───────────────►│
  │               │◄── data đủ ────────│                     │
  │── Save ──────►│                    │                     │
  │               │── PUT /vocabularies/:id─────────────────►│
  │               │                    │── validate/diff      │
  │               │                    │── UPDATE + relations ►
  │               │                    │── INSERT audit log ─►│
  │               │◄── 200 ────────────│                     │
  │◄── toast OK ──│                    │                     │
```

### 5.3 Lookup MultiSelect Flow

```text
Admin          Frontend                Backend               Database
  │               │                      │                     │
  │── type search │                      │                     │
  │               │── debounce ──────────►│                     │
  │               │── GET /lookup?search │────────────────────►│
  │               │                      │── query vocabularies │
  │               │◄── options ──────────│                     │
  │── select ids ─►│                      │                     │
```
