# Vocabulary Management — Frontend Implementation Plan
> **For agentic workers:** REQUIRED SKILL: Use skill `executing-plans` to implement this plan.
> **Execution mode:** Phases are sequential. Tasks within a phase are executed sequentially.

## Plan Structure

## Phase 1 — Frontend Types & Services

### Task 1: Create TypeScript Types

**Spec Reference:** `docs/vocabularies/specs/vocabularies-design/02-frontend.md — Section 7`

**Files:**
- Create: `client/src/types/vocabularies.types.ts`

- **Step 1:** Define all frontend types
  - Run: Create interfaces for:
    - `VocabularyResponse`, `VocabularyDetail`
    - `VocabRelationDto`, `VocabChangeLogDto`, `VocabReportDto`
    - `CreateVocabularyDto`, `UpdateVocabularyDto`
    - `VocabularyFilters`, `PaginationInfo`
  - Expected: Type file matching backend DTOs

- **Step 2: Commit**
  - `git add client/src/types/vocabularies.types.ts`
  - `git commit -m "feat(types): add vocabulary frontend TypeScript types"`

### Task 2: Create API Service

**Spec Reference:** `docs/vocabularies/specs/vocabularies-design/02-frontend.md — Section 5`

**Files:**
- Create: `client/src/services/vocabularies.service.ts`

- **Step 1:** Implement API client
  - Run: Create service extending base API service with methods:
    - `getVocabularies(params)` — GET /api/vocabularies
    - `getVocabulary(id)` — GET /api/vocabularies/:id
    - `createVocabulary(data)` — POST /api/vocabularies
    - `updateVocabulary(id, data)` — PUT /api/vocabularies/:id
    - `deleteVocabulary(id)` — DELETE /api/vocabularies/:id
    - `resolveReport(vocabId, reportId, status)` — PATCH endpoint
    - `getAnalytics(id)` — GET analytics
  - Expected: Service with proper error handling, typed responses

- **Step 2: Commit**
  - `git add client/src/services/vocabularies.service.ts`
  - `git commit -m "feat(service): add vocabularies API client"`

## Phase 2 — Frontend Composable

### Task 3: Create Composable

**Spec Reference:** `docs/vocabularies/specs/vocabularies-design/02-frontend.md — Section 5`

**Files:**
- Create: `client/src/pages/vocabularies/composables/useVocabularies.ts`

- **Step 1:** Implement composable functions
  - Run: Create composable with:
    - `fetchVocabularies(filters)` — with loading state
    - `fetchVocabulary(id)` — with error handling
    - `createVocabulary(data)` — with validation
    - `updateVocabulary(id, data)` — with validation
    - `deleteVocabulary(id)` — with confirmation
    - `fetchRelationOptions(excludeIds)` — for MultiSelect
    - `fetchAnalytics(id)` — for analytics tab
    - Form validation using Zod schemas
  - Expected: Composable with reactive state, error handling

- **Step 2: Commit**
  - `git add client/src/pages/vocabularies/composables/useVocabularies.ts`
  - `git commit -m "feat(composable): add useVocabularies composable"`

## Phase 3 — Frontend Routes

### Task 4: Create Vue Router Configuration

**Spec Reference:** `docs/vocabularies/specs/vocabularies-design/02-frontend.md — Section 1`

**Files:**
- Create: `client/src/pages/vocabularies/vocabularies.routes.ts`

- **Step 1:** Define routes
  - Run: Create route config with:
    - `/vocabularies` — VocabularyListPage
    - `/vocabularies/create` — VocabularyFormPage (create mode)
    - `/vocabularies/:id/edit` — VocabularyFormPage (edit mode)
  - Expected: Routes with proper names and meta

- **Step 2:** Register routes in main router
  - Run: Modify `client/src/router/index.ts` to import vocabulary routes
  - Expected: Routes registered in Vue Router

- **Step 3: Commit**
  - `git add client/src/pages/vocabularies/vocabularies.routes.ts client/src/router/index.ts`
  - `git commit -m "feat(router): add vocabulary routes"`

## Phase 4 — List Page Components

### Task 5: Create VocabularyListPage

**Spec Reference:** `docs/vocabularies/specs/vocabularies-design/02-frontend.md — Section 3.1`

**Files:**
- Create: `client/src/pages/vocabularies/VocabularyListPage.vue`
- Create: `client/src/pages/vocabularies/components/VocabularyTable.vue`
- Create: `client/src/pages/vocabularies/components/VocabularyFilter.vue`

- **Step 1:** Implement VocabularyFilter component
  - Run: Create filter component with:
    - Kanji text input (debounced 300ms)
    - Level dropdown (N5-N1)
    - Status dropdown (Publish/Hide/Delete)
    - Search and Reset buttons
  - Expected: Filter emits search/reset events

- **Step 2:** Implement VocabularyTable component
  - Run: Create table component with:
    - PrimeVue DataTable with columns: #, Kanji, Hiragana, Level, Status, Actions
    - Pagination controls
    - Sort functionality
    - Edit/Delete action buttons
  - Expected: Table displays data, emits edit/delete/page-change events

- **Step 3:** Implement VocabularyListPage
  - Run: Create main page with:
    - Create New button
    - VocabularyFilter component
    - VocabularyTable component
    - ConfirmDialog for delete
    - Toast notifications
  - Expected: List page fully functional with filters, pagination, CRUD actions

- **Step 4: Commit**
  - `git add client/src/pages/vocabularies/VocabularyListPage.vue client/src/pages/vocabularies/components/VocabularyTable.vue client/src/pages/vocabularies/components/VocabularyFilter.vue`
  - `git commit -m "feat(ui): add vocabulary list page with table and filters"`

## Phase 5 — Form Page Components

### Task 6: Create VocabularyFormPage

**Spec Reference:** `docs/vocabularies/specs/vocabularies-design/02-frontend.md — Section 3.2`

**Files:**
- Create: `client/src/pages/vocabularies/VocabularyFormPage.vue`
- Create: `client/src/pages/vocabularies/components/VocabularyForm.vue`
- Create: `client/src/pages/vocabularies/components/TabInfo.vue`
- Create: `client/src/pages/vocabularies/components/TabAudit.vue`
- Create: `client/src/pages/vocabularies/components/TabAnalytics.vue`

- **Step 1:** Implement TabInfo component
  - Run: Create form with:
    - Input fields: Kanji*, Hiragana, Romaji, Meaning_Vi*, On_yomi, Level, Media_url, Note, Tags, Status
    - VocabRelationSelect for related/synonyms/antonyms
    - Form validation with error display
  - Expected: Form with all fields, validation, emits submit event

- **Step 2:** Implement TabAudit component
  - Run: Create read-only component with:
    - Created by, Updated by, Version, Created at, Updated at
    - ChangeLogTable showing change history
    - ReportTable showing user reports
    - Resolve Report button (admin only)
  - Expected: Audit tab displays read-only information

- **Step 3:** Implement TabAnalytics component
  - Run: Create analytics component with:
    - StatCards for: Learn Count, Favorite Count, Report Count, Relation Count
  - Expected: Analytics tab displays statistics

- **Step 4:** Implement VocabularyForm component
  - Run: Create wrapper with:
    - TabView with TabInfo, TabAudit, TabAnalytics
    - Save and Cancel buttons
    - Form state management
  - Expected: Form component with tabs

- **Step 5:** Implement VocabularyFormPage
  - Run: Create page with:
    - Back button
    - Create/Edit mode detection
    - VocabularyForm component
    - ConfirmDialog for cancel with unsaved changes
    - Success/Error toast notifications
  - Expected: Form page fully functional

- **Step 6: Commit**
  - `git add client/src/pages/vocabularies/VocabularyFormPage.vue client/src/pages/vocabularies/components/VocabularyForm.vue client/src/pages/vocabularies/components/TabInfo.vue client/src/pages/vocabularies/components/TabAudit.vue client/src/pages/vocabularies/components/TabAnalytics.vue`
  - `git commit -m "feat(ui): add vocabulary form page with 3 tabs"`

### Task 7: Create VocabRelationSelect Component

**Spec Reference:** `docs/vocabularies/specs/vocabularies-design/02-frontend.md — Section 4.1`

**Files:**
- Create: `client/src/pages/vocabularies/components/VocabRelationSelect.vue`

- **Step 1:** Implement MultiSelect component
  - Run: Create component with:
    - PrimeVue MultiSelect for relation selection
    - Props: modelValue, relationType, label, excludeIds
    - Load options from API
    - Emit update:modelValue
  - Expected: Reusable MultiSelect for relations

- **Step 2: Commit**
  - `git add client/src/pages/vocabularies/components/VocabRelationSelect.vue`
  - `git commit -m "feat(ui): add VocabRelationSelect MultiSelect component"`

## Phase 6 — Frontend Tests

### Task 8: Write Unit Tests

**Spec Reference:** `docs/vocabularies/specs/vocabularies-design/04-quality.md — Section 1.2`

**Files:**
- Create: `client/src/pages/vocabularies/VocabularyListPage.test.ts`
- Create: `client/src/pages/vocabularies/VocabularyFormPage.test.ts`
- Create: `client/src/pages/vocabularies/composables/useVocabularies.test.ts`

- **Step 1:** Implement VocabularyListPage tests
  - Run: Create test file with tests FE-UT-001 to FE-UT-012
  - Expected: 12 tests covering list rendering, filters, pagination, actions

- **Step 2:** Implement VocabularyFormPage tests
  - Run: Create test file with tests FE-UT-013 to FE-UT-075
  - Expected: 63 tests covering form validation, submission, tab navigation

- **Step 3:** Implement useVocabularies tests
  - Run: Create test file with tests COMP-UT-001 to COMP-UT-008
  - Expected: 8 tests for composable functions

- **Step 4:** Run frontend tests
  - Run: `cd client && npm run test:unit vocabularies`
  - Expected: All 83 tests pass

- **Step 5: Commit**
  - `git add client/src/pages/vocabularies/VocabularyListPage.test.ts client/src/pages/vocabularies/VocabularyFormPage.test.ts client/src/pages/vocabularies/composables/useVocabularies.test.ts`
  - `git commit -m "test(frontend): add vocabulary unit tests"`

## Phase 7 — Build & Integration Verification

### Task 9: Verify Frontend Build & UI

**Spec Reference:** `docs/vocabularies/specs/vocabularies-design/02-frontend.md — Section 2`

**Files:**
- No file changes

- **Step 1:** Build client
  - Run: `cd client && npm run build`
  - Expected: Build succeeds with no TypeScript errors

- **Step 2:** Start dev server
  - Run: `cd client && npm run dev`
  - Expected: Vite dev server starts on port 5173

- **Step 3:** Test UI manually
  - Run: Navigate to /vocabularies in browser
  - Expected: List page renders, filters work, pagination works
  - Run: Click Create New, fill form, save
  - Expected: Form validation works, creates vocabulary
  - Run: Click Edit on a row
  - Expected: Form pre-fills with data, update works
  - Run: Click Delete on a row
  - Expected: Confirm dialog shows, deletes vocabulary

- **Step 4: Commit**
  - `git commit --allow-empty -m "chore: verify frontend build and UI integration"`
