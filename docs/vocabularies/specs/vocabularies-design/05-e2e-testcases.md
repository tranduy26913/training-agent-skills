# E2E Test Cases — Vocabulary Management

**Feature**: Vocabulary Management  
**Auth strategy**: UI login in `beforeEach` (isolated per test)  
**Data strategy**: Use existing DB data (no seeding/cleanup)  
**Base URL**: `http://localhost:5174`  
**Spec file**: `client/e2e/vocabularies.spec.ts`  
**Page Object**: `client/e2e/pages/vocabulary-page.ts`

---

## TC-001 — Vocabulary List: page loads and displays data

| Field       | Value |
|-------------|-------|
| **Suite**   | Vocabulary List |
| **Steps**   | 1. Login as admin → 2. Navigate to `/vocabularies` |
| **Assert**  | Page with `data-testid="vocab-list-page"` is visible; vocabulary table renders rows; heading "Từ vựng" visible |

---

## TC-002 — Vocabulary List: "Tạo từ vựng" button navigates to create page

| Field       | Value |
|-------------|-------|
| **Suite**   | Vocabulary List |
| **Steps**   | 1. Login → 2. Go to `/vocabularies` → 3. Click "Tạo từ vựng" button |
| **Assert**  | URL is `/vocabularies/create`; `data-testid="vocab-create-page"` visible |

---

## TC-003 — Vocabulary Filter: search by keyword

| Field       | Value |
|-------------|-------|
| **Suite**   | Vocabulary Filter |
| **Precondition** | At least one vocabulary exists in DB with known `meaning_vi` (e.g., search for partial text) |
| **Steps**   | 1. Login → 2. Go to `/vocabularies` → 3. Type search keyword in `data-testid="vocab-search-input"` → 4. Wait for debounce + API response |
| **Assert**  | Table rows are updated (matching records visible or "Không tìm thấy" shown for non-match) |

---

## TC-004 — Vocabulary Filter: search with no results shows empty state

| Field       | Value |
|-------------|-------|
| **Suite**   | Vocabulary Filter |
| **Steps**   | 1. Login → 2. Go to `/vocabularies` → 3. Type `__nonexistent_xyz_99999__` in search input |
| **Assert**  | Empty state message is visible (e.g., "Không tìm thấy kết quả") |

---

## TC-005 — Vocabulary Filter: filter by level

| Field       | Value |
|-------------|-------|
| **Suite**   | Vocabulary Filter |
| **Steps**   | 1. Login → 2. Go to `/vocabularies` → 3. Click `data-testid="vocab-level-select"` → 4. Select "N5" → 5. Wait for API response |
| **Assert**  | All visible rows show level badge "N5" (or empty state if no N5 data) |

---

## TC-006 — Vocabulary Filter: clear filters restores full list

| Field       | Value |
|-------------|-------|
| **Suite**   | Vocabulary Filter |
| **Steps**   | 1. Login → 2. Go to `/vocabularies` → 3. Enter search text → 4. Click "Xóa bộ lọc" (Clear All) button |
| **Assert**  | Search input is cleared; table reloads with unfiltered data |

---

## TC-007 — Vocabulary Create: navigate to create page

| Field       | Value |
|-------------|-------|
| **Suite**   | Vocabulary Create |
| **Steps**   | 1. Login → 2. Navigate to `/vocabularies/create` directly |
| **Assert**  | `data-testid="vocab-create-page"` visible; form fields visible (meaning_vi, hiragana, level, status) |

---

## TC-008 — Vocabulary Create: submit with only required fields (happy path)

| Field       | Value |
|-------------|-------|
| **Suite**   | Vocabulary Create |
| **Steps**   | 1. Login → 2. Go to `/vocabularies/create` → 3. Fill `meaning_vi` = "E2E Test Nghĩa" → 4. Fill `hiragana` = "てすと" → 5. Select `level` = "N5" → 6. Click submit button |
| **Assert**  | Toast success visible; URL redirects to `/vocabularies` |
| **Note**    | `status` defaults to "publish" (no selection needed) |

---

## TC-009 — Vocabulary Create: validation error — missing required fields

| Field       | Value |
|-------------|-------|
| **Suite**   | Vocabulary Create |
| **Steps**   | 1. Login → 2. Go to `/vocabularies/create` → 3. Click submit immediately (empty form) |
| **Assert**  | Validation error messages visible for `meaning_vi`, `hiragana`, `level` |

---

## TC-010 — Vocabulary Create: cancel navigates back to list

| Field       | Value |
|-------------|-------|
| **Suite**   | Vocabulary Create |
| **Steps**   | 1. Login → 2. Go to `/vocabularies/create` → 3. Click "Hủy" button |
| **Assert**  | URL is `/vocabularies` |

---

## TC-011 — Vocabulary Edit: navigate to edit page

| Field       | Value |
|-------------|-------|
| **Suite**   | Vocabulary Edit |
| **Precondition** | At least one vocabulary exists in DB |
| **Steps**   | 1. Login → 2. Go to `/vocabularies` → 3. Click edit button on first row |
| **Assert**  | URL matches `/vocabularies/:id/edit`; form is pre-filled with vocabulary data; `hiragana` field not empty |

---

## TC-012 — Vocabulary Edit: update meaning_vi and save

| Field       | Value |
|-------------|-------|
| **Suite**   | Vocabulary Edit |
| **Precondition** | At least one vocabulary exists in DB |
| **Steps**   | 1. Login → 2. Navigate to list → 3. Click edit on first row → 4. Clear `meaning_vi` field → 5. Type new value → 6. Click save button |
| **Assert**  | Toast success visible; still on same edit URL (no redirect) |

---

## TC-013 — Vocabulary Edit: cancel navigates back to list

| Field       | Value |
|-------------|-------|
| **Suite**   | Vocabulary Edit |
| **Precondition** | At least one vocabulary exists in DB |
| **Steps**   | 1. Login → 2. Go to list → 3. Click edit on first row → 4. Click "Hủy" button |
| **Assert**  | URL is `/vocabularies` |

---

## TC-014 — Vocabulary Edit: tabs are visible on edit page

| Field       | Value |
|-------------|-------|
| **Suite**   | Vocabulary Edit |
| **Precondition** | At least one vocabulary exists |
| **Steps**   | 1. Login → 2. Navigate to an edit page |
| **Assert**  | Tabs "Thông tin", "Lịch sử thay đổi", "Phân tích" are visible |

---

## TC-015 — Vocabulary Delete: confirm dialog appears on delete click

| Field       | Value |
|-------------|-------|
| **Suite**   | Vocabulary Delete |
| **Precondition** | At least one vocabulary with `status != deleted` exists in list |
| **Steps**   | 1. Login → 2. Go to `/vocabularies` → 3. Click delete button on a row |
| **Assert**  | PrimeVue ConfirmDialog appears with confirm/cancel buttons |

---

## TC-016 — Vocabulary Delete: cancel delete — row remains in table

| Field       | Value |
|-------------|-------|
| **Suite**   | Vocabulary Delete |
| **Precondition** | At least one vocabulary exists |
| **Steps**   | 1. Login → 2. Go to `/vocabularies` → 3. Click delete on first row → 4. Click "Không" (Cancel) in ConfirmDialog |
| **Assert**  | Dialog closes; row still visible in table; no toast |

---

## TC-017 — Vocabulary Delete: confirm delete — row removed from list

| Field       | Value |
|-------------|-------|
| **Suite**   | Vocabulary Delete |
| **Precondition** | At least one vocabulary exists |
| **Steps**   | 1. Login → 2. Go to `/vocabularies` → 3. Note the first row's kanji/hiragana → 4. Click delete on that row → 5. Click "Có" (Confirm) in ConfirmDialog |
| **Assert**  | Toast success visible; row is no longer visible in the table (soft-deleted) |

---

## Page Object Design

### `VocabularyListPage`

| Property/Method           | Locator/Action |
|---------------------------|----------------|
| `page`                    | `data-testid="vocab-list-page"` |
| `createButton`            | `role=button { name: /Tạo từ vựng/ }` |
| `searchInput`             | `data-testid="vocab-search-input"` |
| `levelSelect`             | `data-testid="vocab-level-select"` |
| `tableRows`               | `tbody tr` |
| `clearFiltersButton`      | `role=button { name: /Xóa bộ lọc/ }` |
| `goto()`                  | navigate to `/vocabularies` |
| `waitForTableLoad()`      | wait for `.p-skeleton` to disappear |
| `clickCreate()`           | click `createButton` |
| `searchFor(query)`        | fill `searchInput` + wait for API response |
| `filterByLevel(level)`    | click `levelSelect` + select option |
| `clickEditForRow(n)`      | click `.pi-pencil` button in row n |
| `clickDeleteForRow(n)`    | click `.pi-trash` button in row n |

### `VocabularyFormPage`

| Property/Method           | Locator/Action |
|---------------------------|----------------|
| `meaningViInput`          | `label:has-text("Nghĩa tiếng Việt") ~ * input` or by placeholder |
| `hiraganaInput`           | `label:has-text("Hiragana") ~ * input` |
| `levelSelect`             | `label:has-text("Cấp độ") ~ *` (PrimeVue Select) |
| `saveButton`              | `role=button { name: /Lưu|Tạo/ }` |
| `cancelButton`            | `role=button { name: /Hủy/ }` |
| `goto(mode, id?)`         | navigate to `/vocabularies/create` or `/vocabularies/:id/edit` |
| `fillRequired(data)`      | fill meaning_vi, hiragana, select level |
| `submit()`                | click saveButton + wait for response |

---

## Files to Create

| File | Description |
|------|-------------|
| `client/e2e/pages/vocabulary-page.ts` | Page Objects: VocabularyListPage + VocabularyFormPage |
| `client/e2e/vocabularies.spec.ts` | Test suites (TC-001 to TC-017) |
