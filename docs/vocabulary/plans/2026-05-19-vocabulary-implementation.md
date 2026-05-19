# Vocabulary Management Implementation Plan
> **For agentic workers:** REQUIRED SUB-SKILL: Use skill `executing-plans` to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.
> **Execution mode:** Tasks within the same Phase run in parallel. Phases are sequential.

**Goal:** Build the Vocabulary admin module — list, create, edit (3-tab: Thông tin / Audit / Analytics), soft delete, and lookup API for relations.
**Architecture:** Express backend with validation middleware (Zod), service-repository pattern, MySQL with 4 new tables. Vue 3 Composition API frontend with Pinia store, PrimeVue DataTable and TabView.
**Tech Stack:** Express/TypeScript, Zod, MySQL, Vitest (server) | Vue 3, PrimeVue, Pinia, vee-validate + Zod, Vitest (client)

---

## Execution Phases

### Phase 1 — Foundation _(sequential, all other phases depend on this)_
- Task 1: Database migration
- Task 2: Shared TypeScript types + Zod validation schemas

### Phase 2 — Core Implementation _(tasks in this phase run in parallel)_
- Task 3: Backend — repository + service + controller + routes
- Task 4: Frontend — store + composable

### Phase 3 — UI Layer _(tasks in this phase run in parallel, after Phase 2)_
- Task 5: VocabularyListPage + VocabularyTable + VocabularyFilters
- Task 6: VocabularyCreatePage + VocabularyEditPage + VocabularyForm + VocabularyLookupMultiSelect
- Task 7: VocabularyAuditTab + VocabularyAnalyticsTab

### Phase 4 — Quality _(after Phase 2 and 3)_
- Task 8: Backend unit + integration tests
- Task 9: Frontend component unit tests

---

## Task 1: Database Migration

**Phase:** 1
**Depends on:** None
**Spec Reference:** `docs/vocabulary/specs/vocabulary-design/01-backend.md` — Section 1.1 Database Schema

**Files:**
- Create: `database/migrations/011_create_vocabulary_tables.sql`

- [ ] **Step 1: Write migration SQL**
  - Create 4 tables: `vocabularies`, `vocabulary_relations`, `vocabulary_reports`, `vocabulary_metrics` — exact column definitions per spec including NVARCHAR for all user-input text fields, ENUM types, indexes, foreign keys
  - `vocabularies`: id, meaning_vi NVARCHAR(255) NOT NULL, hiragana_kana NVARCHAR(255) NOT NULL, romaji NVARCHAR(255) NOT NULL, kanji NVARCHAR(255) NULL, sino_vietnamese NVARCHAR(255) NULL, level ENUM('N5','N4','N3','N2','N1'), media_url NVARCHAR(500) NULL, note NVARCHAR(1000) NULL, tags_json JSON NULL, status ENUM('publish','hide','delete') DEFAULT 'hide', version INT UNSIGNED DEFAULT 1, created_by, updated_by, timestamps, plus indexes on status/level/meaning_vi/hiragana_kana/romaji/kanji
  - `vocabulary_relations`: id, source_vocabulary_id, target_vocabulary_id, relation_type ENUM('related','synonym','antonym'), created_at, UNIQUE KEY on (source, target, relation_type), index on (source_vocabulary_id, relation_type)
  - `vocabulary_reports`: id, vocabulary_id, reporter_user_id, report_reason NVARCHAR(100), report_message NVARCHAR(1000) NULL, status ENUM('new','in_review','resolved','rejected') DEFAULT 'new', reviewed_by NULL, reviewed_at NULL, review_note NVARCHAR(1000) NULL, index on (vocabulary_id, status)
  - `vocabulary_metrics`: vocabulary_id PK, learn_count BIGINT DEFAULT 0, favorite_count BIGINT DEFAULT 0, last_synced_at
  - `audit_logs` already exists (migration 004) — no changes needed

- [ ] **Step 2: Run migration and verify**
  - Connect to local MySQL and run the migration file directly: `mysql -u root -p training < database/migrations/011_create_vocabulary_tables.sql`
  - Verify: `SHOW TABLES LIKE 'vocabulary%';` returns 4 rows
  - Verify columns: `DESCRIBE vocabularies;` confirms NVARCHAR columns and ENUM types

- [ ] **Step 3: Commit**
  - `git add database/migrations/011_create_vocabulary_tables.sql`
  - `git commit -m "feat(vocabulary): add migration for vocabulary tables"`

**Effort:** 1 hour

---

## Task 2: Shared TypeScript Types + Zod Validation Schemas

**Phase:** 1
**Depends on:** None
**Spec Reference:** `docs/vocabulary/specs/vocabulary-design/01-backend.md` — Section 1.2 TypeScript DTOs and Section 3 Validation Rules

**Files:**
- Create: `client/src/types/vocabulary.types.ts`
- Create: `server/src/modules/vocabulary/vocabulary.validation.ts`

- [ ] **Step 1: Write failing validation tests**
  - Create `server/src/modules/vocabulary/__tests__/vocabulary.validation.test.ts`
  - Write tests U-BE-07 through U-BE-23 from `04-quality.md` — Unit Tests table:
    - meaning_vi: empty string, whitespace-only string, string > 255 chars → each should fail validation
    - hiragana_kana: empty → fail; romaji: empty → fail
    - level = "N0" → fail; status = "archived" → fail
    - media_url = "not-a-url" → fail; media_url = "ftp://example.com" → fail; media_url > 500 chars → fail
    - note > 1000 chars → fail
    - tags = ["  abc  ", "abc"] → normalize to ["abc"]; tags with 21 items → fail; tag > 50 chars → fail
    - related_ids = [1, 1, 2] → dedupe to [1, 2]; related_ids containing self (e.g. id=5 in related_ids=[5]) → fail; related_ids = [999999] → fail (non-existent); same id in related_ids and synonym_ids → fail
  - Run: `cd server && npx vitest run src/modules/vocabulary/__tests__/vocabulary.validation.test.ts`
  - Expected: FAIL — file does not exist yet

- [ ] **Step 2: Create server-side types and validation schemas**
  - Create `server/src/modules/vocabulary/vocabulary.validation.ts` following the pattern in `server/src/modules/users/users.validation.ts` (Zod schemas exported as `createVocabularySchema`, `updateVocabularySchema`, `lookupQuerySchema`)
  - `createVocabularySchema`: meaning_vi/hiragana_kana/romaji required, `.trim().min(1).max(255)`; kanji/sino_vietnamese optional `.trim().max(255).nullable()`; level z.enum(['N5','N4','N3','N2','N1']); status z.enum(['publish','hide','delete']); media_url optional `z.string().url().max(500).nullable()` (http/https only via `.refine()`); note optional `.trim().max(1000)`; tags optional array with `.transform()` to trim/dedupe/filter empty, max 20 items, each max 50 chars; related_ids/synonym_ids/antonym_ids optional `z.array(z.number().int().positive())` with `.transform()` to dedupe
  - `updateVocabularySchema`: extends createVocabularySchema plus `version: z.number().int().positive()`
  - Export inferred types: `CreateVocabularyInput`, `UpdateVocabularyInput`, `LookupQuery`

- [ ] **Step 3: Create client-side shared types**
  - Create `client/src/types/vocabulary.types.ts` with all interfaces from spec Section 1.2: `VocabularyLevel`, `VocabularyStatus`, `VocabularyRelationType`, `VocabularyDto`, `VocabularyLookupItemDto`, `CreateVocabularyDto`, `UpdateVocabularyDto`, `VocabularyChangeLogDto`, `VocabularyReportDto`, `VocabularyAuditDto`, `VocabularyAnalyticsDto`, `VocabularyListResponse`

- [ ] **Step 4: Run tests and verify all pass**
  - Run: `cd server && npx vitest run src/modules/vocabulary/__tests__/vocabulary.validation.test.ts`
  - Expected: all U-BE-07 through U-BE-23 tests PASS

- [ ] **Step 5: Commit**
  - `git add server/src/modules/vocabulary/vocabulary.validation.ts server/src/modules/vocabulary/__tests__/vocabulary.validation.test.ts client/src/types/vocabulary.types.ts`
  - `git commit -m "feat(vocabulary): add Zod validation schemas and shared types"`

**Effort:** 2 hours

---

## Task 3: Backend — Repository + Service + Controller + Routes

**Phase:** 2
**Depends on:** Task 1 (tables), Task 2 (validation schemas)
**Spec Reference:** `docs/vocabulary/specs/vocabulary-design/01-backend.md` — Section 2 API Endpoints VA-001 to VA-007; Section 3 Validation Rules; Section 4 Error Handling

**Files:**
- Create: `server/src/modules/vocabulary/vocabulary.repository.ts`
- Create: `server/src/modules/vocabulary/vocabulary.service.ts`
- Create: `server/src/modules/vocabulary/vocabulary.controller.ts`
- Create: `server/src/modules/vocabulary/vocabulary.routes.ts`
- Modify: `server/src/app.ts` — register vocabulary routes
- Test: `server/src/modules/vocabulary/vocabulary.service.test.ts`
- Test: `server/src/modules/vocabulary/__tests__/vocabulary.integration.test.ts`

- [ ] **Step 1: Write failing service unit tests (U-BE-01 through U-BE-06)**
  - Create `server/src/modules/vocabulary/vocabulary.service.test.ts` following pattern in `server/src/modules/users/users.service.test.ts` (mock repository with vi.fn())
  - Write tests from `04-quality.md` — Unit Tests table U-BE-01 through U-BE-06:
    - normalizeTags: input `["  abc  ", "abc", ""]` → output `["abc"]`
    - buildChangedFields: given old record and new dto with 2 changed fields, returns only those 2 fields with {old, new} shape
    - buildRelationPayload: given related_ids=[1], synonym_ids=[2], antonym_ids=[] → returns 2 rows with correct relation_type
    - getLookup with excludeId=10: returned rows do not contain id=10
    - updateVocabulary with version=3: response has version=4
    - soft delete: calling update with status='delete' → record still exists in DB (not hard deleted)
  - Run: `cd server && npx vitest run src/modules/vocabulary/vocabulary.service.test.ts`
  - Expected: FAIL

- [ ] **Step 2: Implement repository**
  - Create `server/src/modules/vocabulary/vocabulary.repository.ts`
  - Methods:
    - `findAllWithFilters(filters, page, limit, sortBy, sortOrder)`: SQL with dynamic WHERE (status/level/search/tag), JOIN vocabulary_metrics for counts, whitelist sortBy validation, parameterized queries
    - `findByIdWithRelations(id)`: JOIN vocabulary_relations mapped to 3 arrays (related/synonym/antonym)
    - `create(data, userId)`: INSERT vocabularies + relations in transaction, init vocabulary_metrics row
    - `update(id, data, userId)`: UPDATE vocabularies (version + 1), DELETE+INSERT relations in transaction
    - `findLookup(search, excludeId, limit)`: SELECT for multiSelect options, exclude id if provided
    - `getAudit(id)`: SELECT vocabularies JOIN users for names, plus audit_logs WHERE target_type='VOCABULARY' AND target_id=id, plus vocabulary_reports WHERE vocabulary_id=id
    - `getAnalytics(id)`: SELECT vocabulary_metrics WHERE vocabulary_id=id, return null if not found
    - `createAuditLog(actorId, targetId, action, changedFields)`: INSERT audit_logs with target_type='VOCABULARY'

- [ ] **Step 3: Implement service**
  - Create `server/src/modules/vocabulary/vocabulary.service.ts`
  - Helper functions: `normalizeTags(tags)`, `buildChangedFields(oldRecord, newDto)`, `buildRelationPayload(related_ids, synonym_ids, antonym_ids)`
  - Service methods wrap repository calls, add business rules:
    - `listVocabularies`: delegates to repo, returns `VocabularyListResponse`
    - `createVocabulary(dto, userId)`: normalize tags, insert, audit log action='CREATE', return VocabularyDto
    - `getVocabulary(id)`: fetch with relations, throw ServiceError(404) if not found
    - `updateVocabulary(id, dto, userId)`: fetch current, build changed_fields diff, update, audit log action='UPDATE', return VocabularyDto
    - `getLookupOptions(query)`: delegates to repo
    - `getAudit(id)`: delegates to repo, format VocabularyAuditDto
    - `getAnalytics(id)`: delegates to repo, return zeros if no metrics row

- [ ] **Step 4: Run service unit tests**
  - Run: `cd server && npx vitest run src/modules/vocabulary/vocabulary.service.test.ts`
  - Expected: U-BE-01 through U-BE-06 all PASS

- [ ] **Step 5: Write failing integration tests**
  - Create `server/src/modules/vocabulary/__tests__/vocabulary.integration.test.ts`
  - Write tests I-BE-01 through I-BE-16 from `04-quality.md` — Integration Tests table
  - Use same pattern as existing integration tests in `server/src/__tests__/` — start test server, authenticate as admin, use real DB (test DB)
  - Run: `cd server && npx vitest run src/modules/vocabulary/__tests__/vocabulary.integration.test.ts`
  - Expected: FAIL

- [ ] **Step 6: Implement controller + routes**
  - Create `server/src/modules/vocabulary/vocabulary.controller.ts` with 7 methods, each: parse validated body/query from `req`, call service, return JSON response. 400 on validation error, 404 on not found, 409 on version mismatch, 403 via middleware
  - Create `server/src/modules/vocabulary/vocabulary.routes.ts` — same pattern as `server/src/modules/users/users.routes.ts`: `router.use(authMiddleware, requireRole('admin'))`, register 7 routes with `validate()` middleware on POST/PUT. Note: `/lookup` must be registered BEFORE `/:id` to avoid route conflict
  - Modify `server/src/app.ts`: import `vocabularyRoutes`, add `app.use(`${appConfig.apiPrefix}/vocabularies`, vocabularyRoutes)`

- [ ] **Step 7: Run integration tests**
  - Run: `cd server && npx vitest run src/modules/vocabulary/__tests__/vocabulary.integration.test.ts`
  - Expected: all I-BE-01 through I-BE-16 PASS

- [ ] **Step 8: Commit**
  - `git add server/src/modules/vocabulary/ server/src/app.ts`
  - `git commit -m "feat(vocabulary): implement backend repository, service, controller, routes"`

**Effort:** 5 hours

---

## Task 4: Frontend — Store + Composable

**Phase:** 2
**Depends on:** Task 2 (shared types)
**Spec Reference:** `docs/vocabulary/specs/vocabulary-design/02-frontend.md` — Section 1 File Structure; `04-quality.md` — F-COMP and F-STORE test tables

**Files:**
- Create: `client/src/pages/vocabulary/vocabulary.routes.ts`
- Create: `client/src/pages/vocabulary/composables/useVocabulary.ts`
- Create: `client/src/stores/vocabulary.store.ts`
- Modify: `client/src/router/index.ts` — register vocabulary routes under `/admin/vocabularies`
- Test: `client/src/pages/vocabulary/composables/__tests__/useVocabulary.test.ts`
- Test: `client/src/stores/__tests__/vocabulary.store.test.ts`

- [ ] **Step 1: Write failing composable tests**
  - Create `client/src/pages/vocabulary/composables/__tests__/useVocabulary.test.ts`
  - Write tests F-COMP-01 through F-COMP-06 from `04-quality.md` — useVocabulary.ts test table (mock apiClient, verify correct endpoint called for each function)
  - Run: `cd client && npx vitest run src/pages/vocabulary/composables/__tests__/useVocabulary.test.ts`
  - Expected: FAIL

- [ ] **Step 2: Write failing store tests**
  - Create `client/src/stores/__tests__/vocabulary.store.test.ts`
  - Write tests F-STORE-01 through F-STORE-06 from `04-quality.md` — vocabulary.store.ts test table (mock useVocabulary composable, verify state mutations after each action)
  - Run: `cd client && npx vitest run src/stores/__tests__/vocabulary.store.test.ts`
  - Expected: FAIL

- [ ] **Step 3: Implement composable**
  - Create `client/src/pages/vocabulary/composables/useVocabulary.ts` following pattern of `client/src/pages/users/composables/useUsers.ts`
  - 7 thin API wrapper functions: `getVocabularies(params)`, `getVocabulary(id)`, `createVocabulary(dto)`, `updateVocabulary(id, dto)`, `getLookupOptions(params)`, `getAudit(id)`, `getAnalytics(id)` — all using the shared API client, no business logic

- [ ] **Step 4: Implement store**
  - Create `client/src/stores/vocabulary.store.ts` following pattern of `client/src/stores/users.store.ts`
  - State: `vocabularies`, `currentVocabulary`, `relationOptions`, `audit`, `analytics`, `pagination {page, limit, total, pages}`, `filters {search, level, status, tag, sortBy, sortOrder}`, loading flags `{list, detail, lookup, audit, analytics}`, `error`
  - Actions: `fetchVocabularies(filters?)`, `fetchVocabulary(id)`, `createVocabulary(dto)`, `updateVocabulary(id, dto)`, `fetchLookupOptions(params?)`, `fetchAudit(id)`, `fetchAnalytics(id)`, `clearCurrentState()`, `setFilters(newFilters)`, `setPage(page)`

- [ ] **Step 5: Create route file and register routes**
  - Create `client/src/pages/vocabulary/vocabulary.routes.ts` with 3 lazy-loaded routes per spec Section 2 route definitions: path `''` → VocabularyListPage, path `'create'` → VocabularyCreatePage, path `':id/edit'` → VocabularyEditPage
  - Modify `client/src/router/index.ts`: import and register vocabulary routes under `/admin/vocabularies` with `DefaultLayout` and admin guard, following the same pattern as the existing users/employees route registrations

- [ ] **Step 6: Run tests**
  - Run: `cd client && npx vitest run src/pages/vocabulary/composables/__tests__/useVocabulary.test.ts src/stores/__tests__/vocabulary.store.test.ts`
  - Expected: all F-COMP-01 through F-COMP-06 and F-STORE-01 through F-STORE-06 PASS

- [ ] **Step 7: Commit**
  - `git add client/src/pages/vocabulary/vocabulary.routes.ts client/src/pages/vocabulary/composables/ client/src/stores/vocabulary.store.ts client/src/router/index.ts`
  - `git commit -m "feat(vocabulary): add store, composable, and route definitions"`

**Effort:** 3 hours

---

## Task 5: VocabularyListPage + VocabularyTable + VocabularyFilters

**Phase:** 3
**Depends on:** Task 4 (store)
**Spec Reference:** `docs/vocabulary/specs/vocabulary-design/02-frontend.md` — Section 3.1; `03-behavior.md` — List Page Behavior; `04-quality.md` — F-LIST test table

**Files:**
- Create: `client/src/pages/vocabulary/VocabularyListPage.vue`
- Create: `client/src/pages/vocabulary/components/VocabularyTable.vue`
- Create: `client/src/pages/vocabulary/components/VocabularyFilters.vue`
- Test: `client/src/pages/vocabulary/__tests__/VocabularyListPage.test.ts`
- Test: `client/src/pages/vocabulary/components/__tests__/VocabularyTable.test.ts`
- Test: `client/src/pages/vocabulary/components/__tests__/VocabularyFilters.test.ts`

- [ ] **Step 1: Write failing tests**
  - Create `client/src/pages/vocabulary/__tests__/VocabularyListPage.test.ts`
  - Write tests F-LIST-01 through F-LIST-04 from `04-quality.md` — VocabularyListPage test table
  - Run: `cd client && npx vitest run src/pages/vocabulary/__tests__/VocabularyListPage.test.ts`
  - Expected: FAIL

- [ ] **Step 2: Implement VocabularyFilters**
  - Create `client/src/pages/vocabulary/components/VocabularyFilters.vue`
  - Props: none; emits `@filter-change(filters)` on every change
  - Controls: searchInput (PrimeVue InputText, debounce 300ms via `useDebounce` from vueuse), levelFilter (PrimeVue Dropdown with N5-N1 options), statusFilter (PrimeVue Dropdown with publish/hide/delete options), clearFiltersBtn (reset all and emit)
  - Items per spec Section 3.1 VocabularyFilters rows 1-5

- [ ] **Step 3: Implement VocabularyTable**
  - Create `client/src/pages/vocabulary/components/VocabularyTable.vue`
  - Props: `vocabularies`, `pagination`, `loading`; emits: `@edit(id)`, `@delete(id)`, `@page-change(page)`, `@sort-change(sortBy, sortOrder)`
  - PrimeVue DataTable with columns per spec Section 3.1 VocabularyTable rows 6-15: meaning_vi (sortable), hiragana_kana (sortable), romaji (sortable), kanji (sortable), level (Badge, sortable), status (Badge, sortable), updated_at (sortable, default sort desc), actions (edit + delete buttons)
  - Pagination component: server-side, options 10/25/50 per page

- [ ] **Step 4: Implement VocabularyListPage**
  - Create `client/src/pages/vocabulary/VocabularyListPage.vue`
  - `onMounted`: call `store.fetchVocabularies()`
  - Template: `VocabularyFilters` + `VocabularyTable` + "Create" button (router.push to VocabularyCreate)
  - Handlers: `handleFilterChange(filters)` → `store.setFilters(filters); store.setPage(1); store.fetchVocabularies()`; `handlePageChange(page)` → `store.setPage(page); store.fetchVocabularies()`; `handleSortChange(sortBy, sortOrder)` → update store and fetch; `handleEdit(id)` → `router.push({name: 'VocabularyEdit', params: {id}})`; `handleDelete(id)` → PrimeVue ConfirmDialog, on accept call `store.updateVocabulary(id, {status: 'delete', version: currentVersion})` then `store.fetchVocabularies()`
  - Error: show PrimeVue Toast on store error

- [ ] **Step 5: Run tests**
  - Run: `cd client && npx vitest run src/pages/vocabulary/__tests__/VocabularyListPage.test.ts`
  - Expected: F-LIST-01 through F-LIST-04 all PASS

- [ ] **Step 6: Commit**
  - `git add client/src/pages/vocabulary/VocabularyListPage.vue client/src/pages/vocabulary/components/VocabularyTable.vue client/src/pages/vocabulary/components/VocabularyFilters.vue client/src/pages/vocabulary/__tests__/ client/src/pages/vocabulary/components/__tests__/`
  - `git commit -m "feat(vocabulary): add list page, table, and filters components"`

**Effort:** 3 hours

---

## Task 6: VocabularyCreatePage + VocabularyEditPage + VocabularyForm + VocabularyLookupMultiSelect

**Phase:** 3
**Depends on:** Task 4 (store)
**Spec Reference:** `docs/vocabulary/specs/vocabulary-design/02-frontend.md` — Section 3.2 and 3.3; `03-behavior.md` — Create/Edit Page Behavior; `04-quality.md` — F-CREATE, F-EDIT, F-FORM test tables

**Files:**
- Create: `client/src/pages/vocabulary/VocabularyCreatePage.vue`
- Create: `client/src/pages/vocabulary/VocabularyEditPage.vue`
- Create: `client/src/pages/vocabulary/components/VocabularyForm.vue`
- Create: `client/src/pages/vocabulary/components/VocabularyLookupMultiSelect.vue`
- Test: `client/src/pages/vocabulary/__tests__/VocabularyCreatePage.test.ts`
- Test: `client/src/pages/vocabulary/__tests__/VocabularyEditPage.test.ts`
- Test: `client/src/pages/vocabulary/components/__tests__/VocabularyForm.test.ts`

- [ ] **Step 1: Write failing tests**
  - Create `client/src/pages/vocabulary/__tests__/VocabularyCreatePage.test.ts` — tests F-CREATE-01 through F-CREATE-04
  - Create `client/src/pages/vocabulary/__tests__/VocabularyEditPage.test.ts` — tests F-EDIT-01 through F-EDIT-04
  - Create `client/src/pages/vocabulary/components/__tests__/VocabularyForm.test.ts` — tests F-FORM-01 through F-FORM-09
  - Run: `cd client && npx vitest run src/pages/vocabulary/__tests__/`
  - Expected: FAIL

- [ ] **Step 2: Implement VocabularyLookupMultiSelect**
  - Create `client/src/pages/vocabulary/components/VocabularyLookupMultiSelect.vue`
  - PrimeVue MultiSelect with remote search: props `v-model`, `excludeId` (optional), `label`, `placeholder`; uses `store.fetchLookupOptions({search, excludeId})` on search input; debounce 300ms via vueuse `useDebounce`; displays label = `${hiragana_kana} — ${meaning_vi}` with status badge

- [ ] **Step 3: Implement VocabularyForm**
  - Create `client/src/pages/vocabulary/components/VocabularyForm.vue`
  - Props: `mode: 'create' | 'edit'`, `initialData?: VocabularyDto`; emits `@submit(payload: CreateVocabularyDto | UpdateVocabularyDto)`
  - vee-validate `useForm` + Zod schema from `vocabulary.types.ts` for client-side validation (same field rules as server: required/max lengths/URL/enum)
  - Form fields per spec Section 3.2 items 1-12 (meaningViInput through antonymIdsMultiSelect); in edit mode pass `excludeId=route.params.id` to all 3 VocabularyLookupMultiSelect instances
  - Show inline errors below each field; character counter on note field
  - On submit: call `handleSubmit()` from vee-validate, normalize tags (trim/dedupe), emit payload

- [ ] **Step 4: Implement VocabularyCreatePage**
  - Create `client/src/pages/vocabulary/VocabularyCreatePage.vue`
  - `onMounted`: call `store.fetchLookupOptions()`
  - PrimeVue TabView with 3 tabs: Tab 0 (Thông tin) = `VocabularyForm` in create mode; Tab 1 (Audit) and Tab 2 (Analytics) = read-only empty state message ("Dữ liệu sẽ xuất hiện sau khi tạo từ vựng")
  - Action bar: Save button (calls form submit), Cancel button (router.push to VocabularyList)
  - `handleSubmit(dto)`: call `store.createVocabulary(dto)`, on success router.push to `{name: 'VocabularyEdit', params: {id: result.id}}`

- [ ] **Step 5: Implement VocabularyEditPage**
  - Create `client/src/pages/vocabulary/VocabularyEditPage.vue`
  - `onMounted`: call in parallel `store.fetchVocabulary(id)`, `store.fetchLookupOptions({excludeId: id})`, `store.fetchAudit(id)`, `store.fetchAnalytics(id)` via `Promise.all`
  - PrimeVue TabView with 3 tabs: Tab 0 = `VocabularyForm` with `initialData=store.currentVocabulary` in edit mode; Tab 1 = `VocabularyAuditTab`; Tab 2 = `VocabularyAnalyticsTab`
  - Action bar: Save button, Delete button (ConfirmDialog → `store.updateVocabulary(id, {status: 'delete', version})` → reload page), Cancel button
  - `handleSubmit(dto)`: call `store.updateVocabulary(id, dto)`, on success reload all tabs via `Promise.all([store.fetchVocabulary, store.fetchAudit, store.fetchAnalytics])`

- [ ] **Step 6: Run tests**
  - Run: `cd client && npx vitest run src/pages/vocabulary/__tests__/VocabularyCreatePage.test.ts src/pages/vocabulary/__tests__/VocabularyEditPage.test.ts src/pages/vocabulary/components/__tests__/VocabularyForm.test.ts`
  - Expected: F-CREATE-01..04, F-EDIT-01..04, F-FORM-01..09 all PASS

- [ ] **Step 7: Commit**
  - `git add client/src/pages/vocabulary/VocabularyCreatePage.vue client/src/pages/vocabulary/VocabularyEditPage.vue client/src/pages/vocabulary/components/VocabularyForm.vue client/src/pages/vocabulary/components/VocabularyLookupMultiSelect.vue client/src/pages/vocabulary/__tests__/`
  - `git commit -m "feat(vocabulary): add create/edit pages, form, and lookup multi-select"`

**Effort:** 5 hours

---

## Task 7: VocabularyAuditTab + VocabularyAnalyticsTab

**Phase:** 3
**Depends on:** Task 4 (store)
**Spec Reference:** `docs/vocabulary/specs/vocabulary-design/02-frontend.md` — Section 3.3 Edit Page Tabs; `04-quality.md` — F-AUDIT and F-AN test tables

**Files:**
- Create: `client/src/pages/vocabulary/components/VocabularyAuditTab.vue`
- Create: `client/src/pages/vocabulary/components/VocabularyAnalyticsTab.vue`
- Test: `client/src/pages/vocabulary/components/__tests__/VocabularyAuditTab.test.ts`
- Test: `client/src/pages/vocabulary/components/__tests__/VocabularyAnalyticsTab.test.ts`

- [ ] **Step 1: Write failing tests**
  - Create `client/src/pages/vocabulary/components/__tests__/VocabularyAuditTab.test.ts` — tests F-AUDIT-01 through F-AUDIT-03
  - Create `client/src/pages/vocabulary/components/__tests__/VocabularyAnalyticsTab.test.ts` — tests F-AN-01 through F-AN-03
  - Run: `cd client && npx vitest run src/pages/vocabulary/components/__tests__/VocabularyAuditTab.test.ts src/pages/vocabulary/components/__tests__/VocabularyAnalyticsTab.test.ts`
  - Expected: FAIL

- [ ] **Step 2: Implement VocabularyAuditTab**
  - Create `client/src/pages/vocabulary/components/VocabularyAuditTab.vue`
  - Props: `loading: boolean`, `mode: 'create' | 'edit'`, `audit: VocabularyAuditDto | null`
  - If `mode === 'create'`: show empty state message "Dữ liệu Audit sẽ xuất hiện sau khi tạo từ vựng"
  - If `loading`: show PrimeVue Skeleton rows
  - Otherwise: metadata section (created_by_name, created_at, updated_by_name, updated_at, version); change log DataTable (columns: action badge, changed_at, actor_name, changed_fields JSON display sorted newest first); report info DataTable (reporter_name, report_reason, status badge, created_at, review_note) — all read-only
  - Per spec Section 5 Logging & Audit: report info is read-only display only

- [ ] **Step 3: Implement VocabularyAnalyticsTab**
  - Create `client/src/pages/vocabulary/components/VocabularyAnalyticsTab.vue`
  - Props: `loading: boolean`, `mode: 'create' | 'edit'`, `analytics: VocabularyAnalyticsDto | null`
  - If `mode === 'create'`: show empty state message "Dữ liệu Analytics sẽ xuất hiện sau khi tạo từ vựng"
  - If `loading`: show PrimeVue Skeleton
  - Otherwise: 2 stat cards showing `learn_count` and `favorite_count` — read-only, per spec Section 3 In Scope (Analytics tab)

- [ ] **Step 4: Run tests**
  - Run: `cd client && npx vitest run src/pages/vocabulary/components/__tests__/VocabularyAuditTab.test.ts src/pages/vocabulary/components/__tests__/VocabularyAnalyticsTab.test.ts`
  - Expected: F-AUDIT-01..03 and F-AN-01..03 all PASS

- [ ] **Step 5: Commit**
  - `git add client/src/pages/vocabulary/components/VocabularyAuditTab.vue client/src/pages/vocabulary/components/VocabularyAnalyticsTab.vue client/src/pages/vocabulary/components/__tests__/`
  - `git commit -m "feat(vocabulary): add audit and analytics tab components"`

**Effort:** 2 hours

---

## Task 8: Backend Unit Tests + Integration Tests

**Phase:** 4
**Depends on:** Task 3 (backend complete)
**Spec Reference:** `docs/vocabulary/specs/vocabulary-design/04-quality.md` — Section 1.1 Backend Tests (U-BE-01 through U-BE-23, I-BE-01 through I-BE-16)

**Files:**
- Verify/complete: `server/src/modules/vocabulary/vocabulary.service.test.ts`
- Verify/complete: `server/src/modules/vocabulary/__tests__/vocabulary.validation.test.ts`
- Verify/complete: `server/src/modules/vocabulary/__tests__/vocabulary.integration.test.ts`

- [ ] **Step 1: Verify all tests pass**
  - Run: `cd server && npx vitest run src/modules/vocabulary/`
  - Expected: All 23 unit tests (U-BE-01 through U-BE-23) and 16 integration tests (I-BE-01 through I-BE-16) PASS with zero skipped
  - If any test is red: fix the implementation (not the test) to match spec behavior

- [ ] **Step 2: Check coverage**
  - Run: `cd server && npx vitest run --coverage src/modules/vocabulary/`
  - Expected: lines/branches/functions >= 90% for vocabulary module files
  - Fix any uncovered branches by adding tests

- [ ] **Step 3: Commit**
  - `git add server/src/modules/vocabulary/`
  - `git commit -m "test(vocabulary): verify all backend unit and integration tests pass"`

**Effort:** 1 hour

---

## Task 9: Frontend Component Unit Tests

**Phase:** 4
**Depends on:** Tasks 5, 6, 7 (UI complete)
**Spec Reference:** `docs/vocabulary/specs/vocabulary-design/04-quality.md` — Section 1.2 Frontend Tests (F-LIST, F-CREATE, F-EDIT, F-FORM, F-AUDIT, F-AN, F-COMP, F-STORE)

**Files:**
- Verify/complete all test files in `client/src/pages/vocabulary/__tests__/` and `client/src/pages/vocabulary/components/__tests__/`

- [ ] **Step 1: Verify all tests pass**
  - Run: `cd client && npx vitest run src/pages/vocabulary/ src/stores/__tests__/vocabulary.store.test.ts`
  - Expected: All tests PASS — F-LIST-01..04, F-CREATE-01..04, F-EDIT-01..04, F-FORM-01..09, F-AUDIT-01..03, F-AN-01..03, F-COMP-01..06, F-STORE-01..06 with zero skipped
  - If any test is red: fix the implementation (not the test)

- [ ] **Step 2: Smoke test in browser**
  - Start server: `cd server && npm run dev:debug`
  - Start client: `cd client && npm run dev`
  - Navigate to `http://localhost:5173/admin/vocabularies`
  - Verify: table renders (empty is fine), "Create" button visible, filter controls present
  - Click Create: form renders, tabs show, required field errors on empty submit, cancel goes back to list
  - (If seed data exists) Click Edit: 3 tabs visible, form pre-filled, Audit and Analytics tabs show data

- [ ] **Step 3: Commit**
  - `git add client/src/pages/vocabulary/ client/src/stores/__tests__/vocabulary.store.test.ts`
  - `git commit -m "test(vocabulary): verify all frontend component tests pass"`

**Effort:** 1 hour

---

## Summary

| Phase | Tasks | Can parallelize |
|-------|-------|----------------|
| 1 — Foundation | T1, T2 | Yes (T1 and T2 are independent) |
| 2 — Core | T3, T4 | Yes (backend and frontend store are independent) |
| 3 — UI | T5, T6, T7 | Yes (list, create/edit, and tabs are independent) |
| 4 — Quality | T8, T9 | Yes (backend tests and frontend tests are independent) |

**Total estimated effort:** ~23 hours senior developer, no AI assistance.
