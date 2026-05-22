# Vocabulary Management Implementation Plan
> **For agentic workers:** REQUIRED SUB-SKILL: Use skill `executing-plans` to implement this plan.
> **Execution mode:** Phases are sequential. Tasks within a phase are executed sequentially.

**Goal:** Build full CRUD Vocabulary Management for Admin — list, create, edit, soft-delete, relation management, audit log, report resolve/reject, and analytics.
**Tech Stack:** Node.js + Express + MySQL2 + Zod (server); Vue 3 + Pinia + PrimeVue + VueUse + Vite (client)

---

## Existing Assets (Do NOT recreate)

| File | Status |
|------|--------|
| `database/migrations/011_create_vocabularies_tables.sql` | ✓ Already applied |
| `server/src/modules/vocabularies/vocabularies.validation.ts` | ✓ Already exists |
| `client/src/pages/vocabularies/components/` (empty dir) | ✓ Already exists |
| `client/src/pages/vocabularies/composables/` (empty dir) | ✓ Already exists |

---

## File Map

### Backend
| File | Action | Responsibility |
|------|--------|----------------|
| `server/src/models/vocabularies.model.ts` | Create | DB row interfaces + DTO types |
| `server/src/modules/vocabularies/vocabularies.repository.ts` | Create | All DB queries (CRUD, relations, audit, reports, analytics) |
| `server/src/modules/vocabularies/vocabularies.service.ts` | Create | Business logic (2-way relations, version bump, audit write, report resolution) |
| `server/src/modules/vocabularies/vocabularies.controller.ts` | Create | Express request handlers |
| `server/src/modules/vocabularies/vocabularies.routes.ts` | Create | Express router + middleware wiring |
| `server/src/modules/vocabularies/vocabularies.controller.test.ts` | Create | All backend tests (Validation + Service + Repository + Auth) |
| `server/src/app.ts` | Modify | Register `/api/vocabularies` routes |

### Frontend
| File | Action | Responsibility |
|------|--------|----------------|
| `client/src/types/vocabularies.types.ts` | Create | Entity types, DTOs, filter types |
| `client/src/services/vocabularies.service.ts` | Create | API client (extends BaseApiClient) |
| `client/src/pages/vocabularies/composables/useVocabularies.ts` | Create | Composable wrapping service calls |
| `client/src/stores/vocabularies.store.ts` | Create | Pinia store (state + actions) |
| `client/src/locales/vi.ts` | Modify | Add `vocab.*` i18n keys |
| `client/src/locales/en.ts` | Modify | Add `vocab.*` i18n keys |
| `client/src/locales/ja.ts` | Modify | Add `vocab.*` i18n keys |
| `client/src/pages/vocabularies/vocabularies.routes.ts` | Create | Route definitions (List / Create / Edit) |
| `client/src/router/routes.ts` | Modify | Register vocabularies routes |
| `client/src/pages/vocabularies/components/VocabularyFilters.vue` | Create | Filter bar (search, level, status, tag, clear) |
| `client/src/pages/vocabularies/components/VocabularyTable.vue` | Create | DataTable with pagination, sort, badge columns, actions |
| `client/src/pages/vocabularies/VocabularyListPage.vue` | Create | List page composing Filters + Table |
| `client/src/pages/vocabularies/components/VocabularyInfoTab.vue` | Create | Tab 1 form (all fields + relation MultiSelects + Zod validation) |
| `client/src/pages/vocabularies/VocabularyCreatePage.vue` | Create | Create page (Tab 1 only) |
| `client/src/pages/vocabularies/components/VocabularyAuditTab.vue` | Create | Tab 2: metadata, audit log list, reports table with resolve/reject |
| `client/src/pages/vocabularies/components/VocabularyAnalyticsTab.vue` | Create | Tab 3: read-only learn/favorite counts |
| `client/src/pages/vocabularies/VocabularyEditPage.vue` | Create | Edit page (Tab 1 + 2 + 3) |

---

## Phase 1 — Backend API

### Task 1: Model Types + Repository

**Spec Reference:** `docs/vocabularies/specs/vocabularies-design/01-backend.md — Section 1 (Data Models)`

**Files:**
- Create: `server/src/models/vocabularies.model.ts`
- Create: `server/src/modules/vocabularies/vocabularies.repository.ts`

- [ ] **Step 1:** Create `vocabularies.model.ts` with all `RowDataPacket` interfaces and DTOs exactly as specified: `VocabularyRow`, `VocabularyRelationRow`, `VocabularyReportRow`, `VocabularyAuditLogRow`, `VocabularyAnalyticsRow`, `VocabularySimpleRow`, `VocabularyFilters`, `CreateVocabularyDto`, `UpdateVocabularyDto`.

- [ ] **Step 2:** Create `vocabularies.repository.ts` implementing:
  - `findAllWithFilters(filters)` — parameterized LIKE search on `meaning_vi`, `kanji`, `hiragana`, `romaji`; JSON_CONTAINS filter for `tag`; sortBy whitelist; LIMIT/OFFSET pagination with total COUNT
  - `findById(id)` — returns vocabulary + joined relations + reports + analytics + created/updated by names
  - `findAllSimple()` — selects `id, kanji, hiragana, meaning_vi` only
  - `create(dto, adminId)` — INSERT vocabularies, INSERT analytics row, INSERT 2-way relation pairs, INSERT audit log (action='CREATE') — all in transaction
  - `update(id, dto, adminId)` — computes changed_fields diff, UPDATE vocabularies (version += 1), replace relations, INSERT audit log (action='UPDATE') — in transaction
  - `softDelete(id, adminId)` — UPDATE status='deleted', version += 1, INSERT audit log (action='DELETE')
  - `findAuditLogs(vocabId)` — returns audit log entries with admin_name
  - `findReport(reportId)` — returns single report row
  - `updateReport(reportId, status, adminId)` — updates status, resolved_by, resolved_at

- [ ] **Step 3: Commit**
  - `git add server/src/models/vocabularies.model.ts server/src/modules/vocabularies/vocabularies.repository.ts`
  - `git commit -m "feat(vocabularies): add model types and repository"`

---

### Task 2: Service + Controller + Routes + Tests + Register

**Spec Reference:** `docs/vocabularies/specs/vocabularies-design/01-backend.md — Section 2 (API Endpoints), Section 3 (Validation), Section 4 (Error Handling)` | `docs/vocabularies/specs/vocabularies-design/04-quality.md — Section 1.1`

**Files:**
- Create: `server/src/modules/vocabularies/vocabularies.service.ts`
- Create: `server/src/modules/vocabularies/vocabularies.controller.ts`
- Create: `server/src/modules/vocabularies/vocabularies.routes.ts`
- Create: `server/src/modules/vocabularies/vocabularies.controller.test.ts`
- Modify: `server/src/app.ts`

- [ ] **Step 1 (TDD — write failing tests):** Write `vocabularies.controller.test.ts` with all test cases from `04-quality.md — Section 1.1`:
  - `describe('Validation — POST /api/vocabularies')` — V-1 through V-17
  - `describe('Validation — PUT /api/vocabularies/:id')` — V-18 through V-22
  - `describe('Service Logic')` — S-1 through S-12
  - `describe('Repository — Query Logic')` — R-1 through R-7
  - `describe('Authorization')` — A-1 through A-13

  Run: `cd server && npx vitest run src/modules/vocabularies/vocabularies.controller.test.ts`
  Expected: All tests **FAIL** (not yet implemented).

- [ ] **Step 2:** Implement `vocabularies.service.ts` with business logic:
  - `list(filters)`, `getDetail(id)`, `getSimpleList()`
  - `create(dto, adminId)` — validates self-relation not allowed; delegates to repository
  - `update(id, dto, adminId)` — validates 404, validates self-relation; delegates to repository
  - `softDelete(id, adminId)` — validates 404; delegates to repository
  - `getAuditLogs(vocabId)`, `resolveReport(reportId, adminId)`, `rejectReport(reportId, adminId)` — validates 404 + 409 REPORT_ALREADY_RESOLVED

- [ ] **Step 3:** Implement `vocabularies.controller.ts` with handlers for all 9 endpoints (GET list, GET simple, GET detail, POST, PUT, DELETE, GET audit-logs, PATCH resolve, PATCH reject). Map service errors to HTTP status codes.

- [ ] **Step 4:** Create `vocabularies.routes.ts` — apply `authMiddleware + requireRole('admin')` to all routes; wire Zod validation middleware using `createVocabularySchema` and `updateVocabularySchema` from `vocabularies.validation.ts`. Note: `GET /list/simple` must be registered **before** `GET /:id`.

- [ ] **Step 5:** Register in `server/src/app.ts`:
  - Import `vocabulariesRoutes` from `./modules/vocabularies/vocabularies.routes`
  - Add `app.use(\`${appConfig.apiPrefix}/vocabularies\`, vocabulariesRoutes)` following the existing employees pattern.

- [ ] **Step 6 (verify tests PASS):**
  Run: `cd server && npx vitest run src/modules/vocabularies/vocabularies.controller.test.ts`
  Expected: All tests **PASS**.

- [ ] **Step 7: Commit**
  - `git add server/src/modules/vocabularies/ server/src/app.ts`
  - `git commit -m "feat(vocabularies): add service, controller, routes and tests"`

---

## Phase 2 — Frontend Foundation

### Task 3: Types + Service + Composable + Store + i18n + Routes

**Spec Reference:** `docs/vocabularies/specs/vocabularies-design/02-frontend.md — Section 1 (File Structure)` | `docs/vocabularies/specs/vocabularies-design/04-quality.md — Composable Tests`

**Files:**
- Create: `client/src/types/vocabularies.types.ts`
- Create: `client/src/services/vocabularies.service.ts`
- Create: `client/src/pages/vocabularies/composables/useVocabularies.ts`
- Create: `client/src/stores/vocabularies.store.ts`
- Modify: `client/src/locales/vi.ts`, `client/src/locales/en.ts`, `client/src/locales/ja.ts`
- Create: `client/src/pages/vocabularies/vocabularies.routes.ts`
- Modify: `client/src/router/routes.ts`
- Test: `client/src/pages/vocabularies/composables/__tests__/useVocabularies.test.ts`

- [ ] **Step 1 (TDD — write failing tests):** Write `useVocabularies.test.ts` with composable test cases from `04-quality.md — Composable Tests`:
  - `getVocabularies` calls `GET /api/vocabularies?page=1`
  - `getSimpleList` calls `GET /api/vocabularies/list/simple`
  - `createVocabulary` posts correct payload
  - `resolveReport` calls `PATCH /api/vocabularies/reports/3/resolve`

  Run: `cd client && npx vitest run src/pages/vocabularies/composables`
  Expected: All tests **FAIL**.

- [ ] **Step 2:** Create `vocabularies.types.ts` with: `Vocabulary`, `VocabularySimple`, `VocabularyRelation`, `VocabularyReport`, `VocabularyAuditLog`, `VocabularyAnalytics`, `VocabularyFilters`, `CreateVocabularyDto`, `UpdateVocabularyDto`, `PaginationInfo`.

- [ ] **Step 3:** Create `vocabularies.service.ts` extending `BaseApiClient` — implement all 9 API calls matching `01-backend.md — Section 2`.

- [ ] **Step 4:** Create `useVocabularies.ts` composable wrapping service methods.

- [ ] **Step 5:** Create `vocabularies.store.ts` Pinia store with state: `vocabularies`, `currentVocabulary`, `simpleList`, `auditLogs`, `loading`, `pagination`, `filters`. Actions: `fetchVocabularies`, `fetchVocabulary`, `fetchSimpleList`, `fetchAuditLogs`, `createVocabulary`, `updateVocabulary`, `deleteVocabulary`, `resolveReport`, `rejectReport`, `clearCurrentVocabulary`.

- [ ] **Step 6:** Add `vocab.*` i18n keys to `vi.ts`, `en.ts`, `ja.ts` for all labels listed in `02-frontend.md — Section 3` item specifications (e.g., `vocab.pageTitle`, `vocab.createBtn`, `vocab.hiragana`, `vocab.meaningVi`, etc.).

- [ ] **Step 7:** Create `vocabularies.routes.ts` defining three named routes: `VocabularyList` (path `/vocabularies`), `VocabularyCreate` (path `/vocabularies/create`), `VocabularyEdit` (path `/vocabularies/:id/edit`) — all lazy-loaded under admin auth guard.

- [ ] **Step 8:** Import and register `vocabularyRoutes` in `client/src/router/routes.ts` following the existing `employeeRoutes` pattern.

- [ ] **Step 9 (verify tests PASS):**
  Run: `cd client && npx vitest run src/pages/vocabularies/composables`
  Expected: All tests **PASS**.

- [ ] **Step 10: Commit**
  - `git add client/src/types/vocabularies.types.ts client/src/services/vocabularies.service.ts client/src/pages/vocabularies/composables/ client/src/stores/vocabularies.store.ts client/src/locales/ client/src/pages/vocabularies/vocabularies.routes.ts client/src/router/routes.ts`
  - `git commit -m "feat(vocabularies): add types, service, composable, store, i18n, routes"`

---

## Phase 3 — Frontend Pages

### Task 4: VocabularyFilters + VocabularyTable + VocabularyListPage

**Spec Reference:** `docs/vocabularies/specs/vocabularies-design/02-frontend.md — Section 3.1 (VocabularyListPage), Section 4.1 (VocabularyTable props/emits), Section 4.2 (VocabularyFilters props/emits)` | `docs/vocabularies/specs/vocabularies-design/04-quality.md — VocabularyListPage tests`

**Files:**
- Create: `client/src/pages/vocabularies/components/VocabularyFilters.vue`
- Create: `client/src/pages/vocabularies/components/VocabularyTable.vue`
- Create: `client/src/pages/vocabularies/VocabularyListPage.vue`
- Test: `client/src/pages/vocabularies/__tests__/VocabularyListPage.test.ts`

- [ ] **Step 1 (TDD — write failing tests):** Write `VocabularyListPage.test.ts` with all 8 test cases from `04-quality.md — VocabularyListPage tests` (fetch on mount, loading skeleton, empty state, navigate to Create, navigate to Edit, open ConfirmDialog on Delete, call deleteVocabulary on confirm, reset page to 1 on filter change).

  Run: `cd client && npx vitest run src/pages/vocabularies/__tests__/VocabularyListPage.test.ts`
  Expected: All tests **FAIL**.

- [ ] **Step 2:** Implement `VocabularyFilters.vue` — v-model binding on `VocabularyFilters` type; SearchInput with 300ms debounce (useDebounce from VueUse); LevelSelect (N5/N4/N3/N2/N1/All); StatusSelect (publish/hide/deleted/All); TagInput (Enter triggers filter); ClearButton resets all fields. Emit `update:modelValue` and `filter`. Use PrimeVue InputText, Select, Button.

- [ ] **Step 3:** Implement `VocabularyTable.vue` — PrimeVue DataTable with columns per `02-frontend.md — Section 3.1`: Kanji, Hiragana, MeaningVi, Level badge (N5=green/N4=blue/N3=yellow/N2=orange/N1=red), Status badge, Tags chips (max 3 + "+n" overflow), Edit icon button, Delete icon button. Server-side sort via `sortChange` emit. PrimeVue Paginator via `pageChange` emit. Props and emits per `02-frontend.md — Section 4.1`.

- [ ] **Step 4:** Implement `VocabularyListPage.vue` — fetches vocabularies on mount; passes loading/data/pagination to `VocabularyTable`; passes filters to `VocabularyFilters`; handles `handleEdit(id)` (router.push VocabularyEdit), `handleDelete(id)` (useConfirm dialog → store.deleteVocabulary → re-fetch), `handleFilterChange` (reset page=1 → re-fetch), `handleSortChange`, `handlePageChange`.

- [ ] **Step 5 (verify tests PASS):**
  Run: `cd client && npx vitest run src/pages/vocabularies/__tests__/VocabularyListPage.test.ts`
  Expected: All tests **PASS**.

- [ ] **Step 6: Commit**
  - `git add client/src/pages/vocabularies/components/VocabularyFilters.vue client/src/pages/vocabularies/components/VocabularyTable.vue client/src/pages/vocabularies/VocabularyListPage.vue client/src/pages/vocabularies/__tests__/VocabularyListPage.test.ts`
  - `git commit -m "feat(vocabularies): add list page, filters, and table components"`

---

### Task 5: VocabularyInfoTab + VocabularyCreatePage

**Spec Reference:** `docs/vocabularies/specs/vocabularies-design/02-frontend.md — Section 3.2 (VocabularyInfoTab), Section 4.3 (VocabularyInfoTab props/emits)` | `docs/vocabularies/specs/vocabularies-design/01-backend.md — Section 3.1 (Validation Rules)` | `docs/vocabularies/specs/vocabularies-design/04-quality.md — VocabularyInfoTab Behavior Tests, VocabularyInfoTab Validation Tests, VocabularyCreatePage tests`

**Files:**
- Create: `client/src/pages/vocabularies/components/VocabularyInfoTab.vue`
- Create: `client/src/pages/vocabularies/VocabularyCreatePage.vue`
- Test: `client/src/pages/vocabularies/components/__tests__/VocabularyInfoTab.test.ts`
- Test: `client/src/pages/vocabularies/__tests__/VocabularyCreatePage.test.ts`

- [ ] **Step 1 (TDD — write failing tests):** Write:
  - `VocabularyInfoTab.test.ts` with all IT-1 to IT-4 (behavior) and FV-1 to FV-20 (validation) tests from `04-quality.md`
  - `VocabularyCreatePage.test.ts` with all 4 test cases from `04-quality.md — VocabularyCreatePage tests`

  Run: `cd client && npx vitest run src/pages/vocabularies/components/__tests__/VocabularyInfoTab.test.ts src/pages/vocabularies/__tests__/VocabularyCreatePage.test.ts`
  Expected: All tests **FAIL**.

- [ ] **Step 2:** Implement `VocabularyInfoTab.vue` with:
  - All 15 form fields from `02-frontend.md — Section 3.2`: MeaningViInput, HiraganaInput, RomajiInput, KanjiInput, SinoVietnameseInput, LevelSelect, StatusSelect (default 'publish'), ImageUrlInput, NoteTextarea (rows=4), TagsInput (PrimeVue InputChips, max 20 tags), RelatedVocabSelect, SynonymSelect, AntonymSelect (all three use PrimeVue MultiSelect, options from `vocabularyOptions` prop)
  - Client-side Zod validation (matching `01-backend.md — Section 3.1`) on submit; display inline error messages per field
  - In `mode='edit'`, pre-fill all fields from `initialData`
  - Emit `submit(dto: CreateVocabularyDto)` on valid submit; emit `cancel` on Hủy button
  - Props and emits per `02-frontend.md — Section 4.3`

- [ ] **Step 3:** Implement `VocabularyCreatePage.vue`:
  - On mount: call `store.fetchSimpleList()`
  - Render one PrimeVue Tab panel "Thông tin" containing `VocabularyInfoTab` (mode='create')
  - On `submit`: call `store.createVocabulary(dto)` → toast success → `router.push({ name: 'VocabularyList' })`
  - On error: toast severity='error'
  - On `cancel`: `router.push({ name: 'VocabularyList' })`

- [ ] **Step 4 (verify tests PASS):**
  Run: `cd client && npx vitest run src/pages/vocabularies/components/__tests__/VocabularyInfoTab.test.ts src/pages/vocabularies/__tests__/VocabularyCreatePage.test.ts`
  Expected: All tests **PASS**.

- [ ] **Step 5: Commit**
  - `git add client/src/pages/vocabularies/components/VocabularyInfoTab.vue client/src/pages/vocabularies/VocabularyCreatePage.vue client/src/pages/vocabularies/components/__tests__/VocabularyInfoTab.test.ts client/src/pages/vocabularies/__tests__/VocabularyCreatePage.test.ts`
  - `git commit -m "feat(vocabularies): add VocabularyInfoTab and CreatePage"`

---

### Task 6: VocabularyAuditTab + VocabularyAnalyticsTab + VocabularyEditPage

**Spec Reference:** `docs/vocabularies/specs/vocabularies-design/02-frontend.md — Section 3.3 (VocabularyAuditTab), Section 3.4 (VocabularyAnalyticsTab)` | `docs/vocabularies/specs/vocabularies-design/04-quality.md — VocabularyEditPage tests`

**Files:**
- Create: `client/src/pages/vocabularies/components/VocabularyAuditTab.vue`
- Create: `client/src/pages/vocabularies/components/VocabularyAnalyticsTab.vue`
- Create: `client/src/pages/vocabularies/VocabularyEditPage.vue`
- Test: `client/src/pages/vocabularies/__tests__/VocabularyEditPage.test.ts`

- [ ] **Step 1 (TDD — write failing tests):** Write `VocabularyEditPage.test.ts` with all 6 test cases from `04-quality.md — VocabularyEditPage tests` (load vocab+auditLogs+simpleList on mount, clearCurrentVocabulary on unmount, submit update success, resolve report opens ConfirmDialog, confirm calls resolveReport, reject report calls rejectReport).

  Run: `cd client && npx vitest run src/pages/vocabularies/__tests__/VocabularyEditPage.test.ts`
  Expected: All tests **FAIL**.

- [ ] **Step 2:** Implement `VocabularyAuditTab.vue`:
  - Read-only metadata section: CreatedBy, UpdatedBy, Version, CreatedAt, UpdatedAt (from currentVocabulary)
  - Audit log list: display each `VocabularyAuditLog` entry (action badge, admin name, timestamp, changed fields)
  - Reports DataTable: columns = reporter name, reason, status badge (pending=orange/resolved=green/rejected=red), created_at; for pending rows: Resolve button (useConfirm → emit `resolve(reportId)`) and Reject button (useConfirm → emit `reject(reportId)`)
  - Props: `{ vocabulary: Vocabulary; auditLogs: VocabularyAuditLog[] }` — emits: `resolve(id)`, `reject(id)`

- [ ] **Step 3:** Implement `VocabularyAnalyticsTab.vue` — read-only display of `learn_count` and `favorite_count` from analytics data passed as prop.

- [ ] **Step 4:** Implement `VocabularyEditPage.vue`:
  - On mount: call `store.fetchVocabulary(id)`, `store.fetchAuditLogs(id)`, `store.fetchSimpleList()`
  - On unmount: call `store.clearCurrentVocabulary()`
  - Three PrimeVue Tab panels: "Thông tin" (VocabularyInfoTab mode='edit', initialData=currentVocabulary), "Audit" (VocabularyAuditTab), "Analytics" (VocabularyAnalyticsTab)
  - On `submit`: call `store.updateVocabulary(id, dto)` → toast success → **stay on page** (re-fetch vocabulary)
  - On VocabularyAuditTab `resolve(reportId)`: call `store.resolveReport(reportId)` → toast success → re-fetch vocabulary
  - On VocabularyAuditTab `reject(reportId)`: call `store.rejectReport(reportId)` → toast success → re-fetch vocabulary
  - On `cancel`: `router.push({ name: 'VocabularyList' })`

- [ ] **Step 5 (verify tests PASS):**
  Run: `cd client && npx vitest run src/pages/vocabularies/__tests__/VocabularyEditPage.test.ts`
  Expected: All tests **PASS**.

- [ ] **Step 6: Run full vocabulary test suite**
  Run: `cd client && npx vitest run src/pages/vocabularies src/stores/__tests__/vocabularies.store.test.ts`
  Expected: All tests **PASS**.

- [ ] **Step 7: Commit**
  - `git add client/src/pages/vocabularies/components/VocabularyAuditTab.vue client/src/pages/vocabularies/components/VocabularyAnalyticsTab.vue client/src/pages/vocabularies/VocabularyEditPage.vue client/src/pages/vocabularies/__tests__/VocabularyEditPage.test.ts`
  - `git commit -m "feat(vocabularies): add AuditTab, AnalyticsTab, and EditPage — vocabularies complete"`
