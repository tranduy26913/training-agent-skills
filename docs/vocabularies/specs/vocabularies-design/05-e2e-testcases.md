# E2E Test Cases — Vocabulary Management

## Source
- Quality spec: `docs/vocabularies/specs/vocabularies-design/04-quality.md`
- Generated from: Phase 6 of playwright-e2e skill

## Overview
- **Feature**: Vocabulary Management (List, Create, Edit)
- **Auth strategy**: storageState from `e2e/.auth/user.json` (admin role)
- **Total test cases**: 14

## Spec files

| File | Covers |
|------|--------|
| `e2e/vocabularies/vocabulary-list.spec.ts` | List, search, filter, navigate to create/edit, delete |
| `e2e/vocabularies/vocabulary-create.spec.ts` | Create happy path, validation errors, cancel flows |
| `e2e/vocabularies/vocabulary-edit.spec.ts` | Edit pre-fill, update happy path, validation error |

---

## Test Cases

### TC-001: Vocabulary List — displays table with existing vocabulary data
- **Spec file**: `e2e/vocabularies/vocabulary-list.spec.ts`
- **Preconditions**: Authenticated admin; pre-existing vocabulary data in DB
- **Steps**:
  1. Navigate to `/vocabularies`
  2. Wait for the table to finish loading (skeletons disappear)
  3. Observe the vocabulary table
- **Expected outcome**: The vocabulary table is visible with at least one row
- **screenshotStep labels**: `List page loaded`, `Table rows visible`
- [ ] Written

---

### TC-002: Vocabulary List — search filters table results
- **Spec file**: `e2e/vocabularies/vocabulary-list.spec.ts`
- **Preconditions**: Authenticated admin; one vocabulary seeded via API with unique meaning_vi
- **Steps**:
  1. Navigate to `/vocabularies`
  2. Wait for the table to load
  3. Type the unique meaning_vi value into the search input
  4. Wait for the API response and table to reload
  5. Observe the table results
- **Expected outcome**: Only the seeded vocabulary row is visible in the table
- **screenshotStep labels**: `Search input filled`, `Search results show only seeded vocab`
- [ ] Written

---

### TC-003: Vocabulary List — shows empty-filter state when search returns no results
- **Spec file**: `e2e/vocabularies/vocabulary-list.spec.ts`
- **Preconditions**: Authenticated admin
- **Steps**:
  1. Navigate to `/vocabularies`
  2. Type a nonsense string into the search input that matches nothing
  3. Wait for the API response
  4. Observe the page
- **Expected outcome**: The empty-filter state element (`vocab-empty-filter`) is visible; the table is not visible
- **screenshotStep labels**: `Search with no results`, `Empty filter state visible`
- [ ] Written

---

### TC-004: Vocabulary List — Create button navigates to create page
- **Spec file**: `e2e/vocabularies/vocabulary-list.spec.ts`
- **Preconditions**: Authenticated admin
- **Steps**:
  1. Navigate to `/vocabularies`
  2. Click the "Tạo từ vựng" (Create) button
  3. Observe the URL
- **Expected outcome**: The URL changes to `/vocabularies/create`
- **screenshotStep labels**: `Create button clicked`, `Create page loaded`
- [ ] Written

---

### TC-005: Vocabulary List — Edit button navigates to the vocabulary edit page
- **Spec file**: `e2e/vocabularies/vocabulary-list.spec.ts`
- **Preconditions**: Authenticated admin; at least one vocabulary in the table
- **Steps**:
  1. Navigate to `/vocabularies`
  2. Wait for table to load with rows
  3. Click the edit (pencil) button on the first table row
  4. Observe the URL
- **Expected outcome**: The URL matches the pattern `/vocabularies/:id/edit`
- **screenshotStep labels**: `Edit button clicked`, `Edit page loaded`
- [ ] Written

---

### TC-006: Vocabulary List — Delete shows confirm dialog, removes vocabulary, shows success toast
- **Spec file**: `e2e/vocabularies/vocabulary-list.spec.ts`
- **Preconditions**: Authenticated admin; one vocabulary seeded via API (will be deleted)
- **Steps**:
  1. Seed a vocabulary via API
  2. Navigate to `/vocabularies`
  3. Search for the seeded vocabulary to locate it in the table
  4. Click the delete (trash) button on the matching row
  5. Observe the confirmation dialog
  6. Click the confirm button in the dialog
  7. Observe the success toast notification
- **Expected outcome**: Confirm dialog appears; after confirmation, success toast is shown and the vocabulary is no longer in the table
- **screenshotStep labels**: `Delete button clicked`, `Confirm dialog visible`, `Confirm button clicked`, `⚠ Success toast shown`
  - ⚠ `⚠ Success toast shown` — toast step (use `captureImmediately: true`)
- [ ] Written

---

### TC-007: Vocabulary Create — happy path creates a vocabulary and redirects to list
- **Spec file**: `e2e/vocabularies/vocabulary-create.spec.ts`
- **Preconditions**: Authenticated admin
- **Steps**:
  1. Navigate to `/vocabularies/create`
  2. Observe the create page is visible with the form
  3. Fill in the meaning_vi field with a unique value
  4. Select "N5" from the level dropdown
  5. Select "Publish" from the status dropdown
  6. Click the Save button
  7. Observe the success toast notification
  8. Observe the redirect
- **Expected outcome**: Success toast appears; URL changes to `/vocabularies`; the new vocabulary is visible in the list
- **screenshotStep labels**: `Create page loaded`, `Required fields filled`, `⚠ Save → success toast`, `Redirected to list — new item visible`
  - ⚠ `⚠ Save → success toast` — toast step (use `captureImmediately: true`)
- [ ] Written

---

### TC-008: Vocabulary Create — submitting empty form shows required field errors
- **Spec file**: `e2e/vocabularies/vocabulary-create.spec.ts`
- **Preconditions**: Authenticated admin; create page opened
- **Steps**:
  1. Navigate to `/vocabularies/create`
  2. Click the Save button without filling any field
  3. Observe the form for error messages
- **Expected outcome**: Error messages appear below the meaning_vi field, level field, and status field (all required)
- **screenshotStep labels**: `Submit empty form → required field errors`
  - ⚠ `Submit empty form → required field errors` — field error step (wait for error elements before screenshot)
- [ ] Written

---

### TC-009: Vocabulary Create — cancel with clean form navigates back without confirm dialog
- **Spec file**: `e2e/vocabularies/vocabulary-create.spec.ts`
- **Preconditions**: Authenticated admin; create page opened; no fields filled
- **Steps**:
  1. Navigate to `/vocabularies/create`
  2. Click the Cancel button without filling any field
  3. Observe the URL and whether a dialog appears
- **Expected outcome**: No confirmation dialog appears; URL immediately changes to `/vocabularies`
- **screenshotStep labels**: `Cancel button clicked`, `Navigated back to list`
- [ ] Written

---

### TC-010: Vocabulary Create — cancel with dirty form shows confirm dialog
- **Spec file**: `e2e/vocabularies/vocabulary-create.spec.ts`
- **Preconditions**: Authenticated admin; create page opened
- **Steps**:
  1. Navigate to `/vocabularies/create`
  2. Fill the meaning_vi field with any value
  3. Click the Cancel button
  4. Observe the dialog
- **Expected outcome**: A confirmation dialog (ConfirmDialog) appears asking whether to discard changes
- **screenshotStep labels**: `Meaning-vi filled`, `Cancel clicked → confirm dialog visible`
- [ ] Written

---

### TC-011: Vocabulary Create — discard changes from confirm dialog navigates to list
- **Spec file**: `e2e/vocabularies/vocabulary-create.spec.ts`
- **Preconditions**: Authenticated admin; create page opened; meaning_vi filled; cancel clicked; confirm dialog visible
- **Steps**:
  1. Navigate to `/vocabularies/create`
  2. Fill the meaning_vi field with any value
  3. Click the Cancel button
  4. In the confirm dialog, click the "Bỏ thay đổi" (Discard) button
  5. Observe the URL
- **Expected outcome**: URL changes to `/vocabularies`
- **screenshotStep labels**: `Meaning-vi filled`, `Cancel clicked → confirm dialog visible`, `Discard button clicked → navigated to list`
- [ ] Written

---

### TC-012: Vocabulary Edit — edit page pre-fills existing vocabulary data
- **Spec file**: `e2e/vocabularies/vocabulary-edit.spec.ts`
- **Preconditions**: Authenticated admin; one vocabulary seeded via API in beforeAll (reused for TC-012 and TC-013)
- **Steps**:
  1. Navigate to `/vocabularies/:id/edit` (seeded vocabulary's ID)
  2. Wait for the form to load
  3. Observe the meaning_vi input value
- **Expected outcome**: The meaning_vi field is pre-filled with the seeded vocabulary's meaning_vi value; the level field shows the seeded level
- **screenshotStep labels**: `Edit page loaded with pre-filled data`
- [ ] Written

---

### TC-013: Vocabulary Edit — update vocabulary happy path and redirect to list
- **Spec file**: `e2e/vocabularies/vocabulary-edit.spec.ts`
- **Preconditions**: Authenticated admin; seeded vocabulary from beforeAll
- **Steps**:
  1. Navigate to `/vocabularies/:id/edit` (seeded vocabulary's ID)
  2. Wait for the form to load
  3. Clear the meaning_vi field and type a new unique value
  4. Click the Save button
  5. Observe the success toast notification
  6. Observe the redirect
- **Expected outcome**: Success toast appears; URL changes to `/vocabularies`
- **screenshotStep labels**: `Meaning-vi updated`, `⚠ Save → success toast`, `Redirected to list`
  - ⚠ `⚠ Save → success toast` — toast step (use `captureImmediately: true`)
- [ ] Written

---

### TC-014: Vocabulary Edit — submit without meaning_vi shows validation error
- **Spec file**: `e2e/vocabularies/vocabulary-edit.spec.ts`
- **Preconditions**: Authenticated admin; seeded vocabulary from beforeAll
- **Steps**:
  1. Navigate to `/vocabularies/:id/edit` (seeded vocabulary's ID)
  2. Wait for the form to load
  3. Clear the meaning_vi field completely
  4. Click the Save button
  5. Observe the form
- **Expected outcome**: Error message appears below the meaning_vi field; URL remains unchanged
- **screenshotStep labels**: `Meaning-vi cleared`, `Submit → meaning-vi required error`
  - ⚠ `Submit → meaning-vi required error` — field error step (wait for error element before screenshot)
- [ ] Written
