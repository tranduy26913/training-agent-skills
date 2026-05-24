# E2E Test Cases — Vocabulary Management

> ✅ Approved by user on 2026-05-23. Proceeding to Phase 5.

## Overview
- **Feature**: Vocabulary Management (CRUD)
- **Flows**: List & Search, Create, Edit/Update, Delete (soft)
- **Excluded**: Report resolve/reject flows (per user request)
- **Auth strategy**: storageState from `e2e/.auth/user.json` (admin login persisted via `auth.setup.ts`)
- **Total test cases**: 14

## Spec files

| File | Covers |
|------|--------|
| `e2e/vocabularies/vocabulary-list.spec.ts` | List page load, search, filter, navigate to create/edit |
| `e2e/vocabularies/vocabulary-create.spec.ts` | Create form: validation, success, cancel |
| `e2e/vocabularies/vocabulary-edit.spec.ts` | Edit form: prefill, update success, cancel |
| `e2e/vocabularies/vocabulary-delete.spec.ts` | Delete confirmation dialog, soft-delete removes from list |

---

## Test Cases

### TC-001: List page loads with vocabulary table
- **Suite**: `e2e/vocabularies/vocabulary-list.spec.ts`
- **Preconditions**: Authenticated as admin; existing vocabulary data in DB; navigate to `/vocabularies`
- **Steps**:
  1. Navigate to `/vocabularies`
  2. Wait for the table to finish loading (skeletons disappear)
  3. Verify the vocabulary list page container is visible
  4. Verify at least one table row is visible
- **Expected outcome**: The vocabulary list page is displayed with at least one row in the table
- **screenshotStep labels**: `List page loaded with data`
- [x] Written

---

### TC-002: Create Vocabulary button navigates to create form
- **Suite**: `e2e/vocabularies/vocabulary-list.spec.ts`
- **Preconditions**: Authenticated as admin; on the vocabulary list page
- **Steps**:
  1. Navigate to `/vocabularies`
  2. Click the "Tạo từ vựng" (Create) button
  3. Verify the URL changes to `/vocabularies/create`
- **Expected outcome**: Browser navigates to the vocabulary create page
- **screenshotStep labels**: `Click Create button`, `Create page navigated`
- [x] Written

---

### TC-003: Search filters table results
- **Suite**: `e2e/vocabularies/vocabulary-list.spec.ts`
- **Preconditions**: Authenticated as admin; a vocabulary seeded with a unique `meaning_vi`; on list page
- **Steps**:
  1. Seed a vocabulary via API with a unique `meaning_vi` containing a unique tag
  2. Navigate to `/vocabularies`
  3. Wait for the table to load
  4. Type the unique tag into the search input
  5. Wait for the API response to return filtered results
  6. Verify the seeded vocabulary row appears in the table
- **Expected outcome**: Only the matching vocabulary row is visible
- **screenshotStep labels**: `Search input filled`, `Search results showing seeded vocabulary`
- [x] Written

---

### TC-004: Search with no results shows empty state
- **Suite**: `e2e/vocabularies/vocabulary-list.spec.ts`
- **Preconditions**: Authenticated as admin; on list page
- **Steps**:
  1. Navigate to `/vocabularies`
  2. Type `__nonexistent_vocab_xyz_99999__` into the search input
  3. Wait for the API response
  4. Verify the empty state ("No records found.") message is visible
- **Expected outcome**: Empty state message is shown with no table rows
- **screenshotStep labels**: `Search with no results — empty state visible`
- [x] Written

---

### TC-005: Filter by level narrows results
- **Suite**: `e2e/vocabularies/vocabulary-list.spec.ts`
- **Preconditions**: Authenticated as admin; existing vocabularies with different levels in DB; on list page
- **Steps**:
  1. Navigate to `/vocabularies`
  2. Wait for the table to load
  3. Click the Level filter dropdown and select "N5"
  4. Wait for the API response
  5. Verify the table reloads and rows are visible (or empty state if none at N5)
- **Expected outcome**: Table filters to show only N5-level vocabularies (or empty state if none)
- **screenshotStep labels**: `Level N5 filter selected`, `Table filtered by level`
- [x] Written

---

### TC-006: Edit button navigates to edit form
- **Suite**: `e2e/vocabularies/vocabulary-list.spec.ts`
- **Preconditions**: Authenticated as admin; at least one vocabulary row in the table; on list page
- **Steps**:
  1. Navigate to `/vocabularies`
  2. Wait for the table to load
  3. Click the Edit button on the first row
  4. Verify the URL changes to `/vocabularies/:id/edit`
- **Expected outcome**: Browser navigates to the vocabulary edit page for the selected vocabulary
- **screenshotStep labels**: `Click Edit button on first row`, `Edit page navigated`
- [x] Written

---

### TC-007: Create form is accessible and shows required fields
- **Suite**: `e2e/vocabularies/vocabulary-create.spec.ts`
- **Preconditions**: Authenticated as admin; navigate to `/vocabularies/create`
- **Steps**:
  1. Navigate to `/vocabularies/create`
  2. Verify the create page container is visible
  3. Verify Meaning VI input is visible
  4. Verify Hiragana input is visible
  5. Verify Save button is visible
  6. Verify Cancel button is visible
- **Expected outcome**: All required form fields and action buttons are visible
- **screenshotStep labels**: `Create form loaded with all required fields`
- [x] Written

---

### TC-008: Create form — validation errors for missing required fields
- **Suite**: `e2e/vocabularies/vocabulary-create.spec.ts`
- **Preconditions**: Authenticated as admin; on create form at `/vocabularies/create`
- **Steps**:
  1. Navigate to `/vocabularies/create`
  2. Click the Save button without filling any fields
  3. Verify `meaning_vi` field error message is visible
  4. Verify `hiragana` field error message is visible
  5. Verify `level` field error message is visible
- **Expected outcome**: Validation errors for all three required fields are displayed; form does not submit
- **screenshotStep labels**: `Submit empty form → required field errors visible`
  - ⚠ `Submit empty form → required field errors visible` — error step (assert error elements inside the action)
- [x] Written

---

### TC-009: Create vocabulary — happy path
- **Suite**: `e2e/vocabularies/vocabulary-create.spec.ts`
- **Preconditions**: Authenticated as admin; on create form at `/vocabularies/create`
- **Steps**:
  1. Navigate to `/vocabularies/create`
  2. Fill Meaning VI with a unique value (e.g., `E2E テスト <uid>`)
  3. Fill Hiragana with `てすと`
  4. Select Level "N5" from the dropdown
  5. Click the Save button
  6. Verify the success toast appears
  7. Verify the browser redirects to `/vocabularies`
  8. Clean up: delete the created vocabulary via API
- **Expected outcome**: Vocabulary is created, success toast is shown, user is redirected to the list page
- **screenshotStep labels**: `Fill Meaning VI`, `Fill Hiragana`, `Select Level N5`, `Save → success toast`, `Redirected to vocabulary list`
  - ⚠ `Save → success toast` — toast step (use `captureImmediately: true`)
- [x] Written

---

### TC-010: Create form — cancel navigates back to list
- **Suite**: `e2e/vocabularies/vocabulary-create.spec.ts`
- **Preconditions**: Authenticated as admin; on create form at `/vocabularies/create`
- **Steps**:
  1. Navigate to `/vocabularies/create`
  2. Click the Cancel button
  3. Verify the browser navigates back to `/vocabularies`
- **Expected outcome**: User is returned to the vocabulary list without creating a record
- **screenshotStep labels**: `Click Cancel`, `Redirected back to vocabulary list`
- [x] Written

---

### TC-011: Edit form pre-fills with existing vocabulary data
- **Suite**: `e2e/vocabularies/vocabulary-edit.spec.ts`
- **Preconditions**: Authenticated as admin; a vocabulary seeded via API (beforeAll) with known `meaning_vi` and `hiragana`; navigate to `/vocabularies/:id/edit`
- **Steps**:
  1. Navigate to `/vocabularies/:seededId/edit`
  2. Wait for the edit page container to be visible
  3. Verify Meaning VI input has the seeded value
  4. Verify Hiragana input has the seeded value
- **Expected outcome**: Form fields are pre-filled with the existing vocabulary's data
- **screenshotStep labels**: `Edit page loaded — form pre-filled with existing data`
- [x] Written

---

### TC-012: Update vocabulary — happy path (stay on edit page)
- **Suite**: `e2e/vocabularies/vocabulary-edit.spec.ts`
- **Preconditions**: Authenticated as admin; seeded vocabulary (beforeAll); on edit page for seeded vocab
- **Steps**:
  1. Navigate to `/vocabularies/:seededId/edit`
  2. Clear the Meaning VI input and type a new unique value
  3. Click the Save button
  4. Verify the success toast appears
  5. Verify the URL remains `/vocabularies/:seededId/edit` (no redirect)
- **Expected outcome**: Vocabulary is updated, success toast is shown, user stays on the edit page
- **screenshotStep labels**: `Update Meaning VI field`, `Save → success toast`, `Stay on edit page after update`
  - ⚠ `Save → success toast` — toast step (use `captureImmediately: true`)
- [x] Written

---

### TC-013: Edit form — cancel navigates back to list
- **Suite**: `e2e/vocabularies/vocabulary-edit.spec.ts`
- **Preconditions**: Authenticated as admin; seeded vocabulary (beforeAll); on edit page for seeded vocab
- **Steps**:
  1. Navigate to `/vocabularies/:seededId/edit`
  2. Click the Cancel button
  3. Verify the browser navigates to `/vocabularies`
- **Expected outcome**: User is returned to the vocabulary list without saving changes
- **screenshotStep labels**: `Click Cancel on edit page`, `Redirected to vocabulary list`
- [x] Written

---

### TC-014: Delete vocabulary — confirmation dialog and soft delete
- **Suite**: `e2e/vocabularies/vocabulary-delete.spec.ts`
- **Preconditions**: Authenticated as admin; a vocabulary seeded via API (beforeEach) with a unique `meaning_vi`; on the vocabulary list page with the seeded vocab found via search
- **Steps**:
  1. Seed a vocabulary via API with unique `meaning_vi` containing a unique tag
  2. Navigate to `/vocabularies`
  3. Wait for the table to load
  4. Search for the unique tag to isolate the seeded row
  5. Click the Delete button on the first row
  6. Verify the confirmation dialog appears with a delete confirmation message
  7. Click the confirm ("Yes") button in the dialog
  8. Wait for the table to reload
  9. Verify the deleted vocabulary is no longer in the table (soft-deleted)
- **Expected outcome**: Confirmation dialog is shown; after confirming, the vocabulary is removed from the visible list (soft delete sets status to 'deleted')
- **screenshotStep labels**: `Search for vocabulary to delete`, `Click Delete button`, `Confirmation dialog visible`, `Confirm delete`, `Vocabulary removed from list`
  - ⚠ `Confirmation dialog visible` — assert dialog is visible before screenshot
- [x] Written
