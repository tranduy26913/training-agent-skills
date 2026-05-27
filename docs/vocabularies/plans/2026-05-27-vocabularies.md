# Vocabulary Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use skill `executing-plans` to implement this plan.
> **Execution mode:** Phases are sequential. Tasks within a phase are executed sequentially.

**Goal:** Xây dựng tính năng Vocabulary Management cho Admin — bao gồm CRUD API, trang danh sách (filter + pagination) và trang tạo/chỉnh sửa từ vựng tiếng Nhật với 3 tab (Thông tin, Audit, Analytics).

**Tech Stack:** Node.js + Express + TypeScript + MySQL2 (backend) | Vue 3 + PrimeVue + Pinia + VeeValidate + Zod (frontend)

**Spec Package:** `docs/vocabularies/specs/vocabularies-design/`

---

## File Map

### Server (Create)
| File | Vai trò |
|------|---------|
| `database/migrations/011_create_vocabulary_tables.sql` | DB schema: 6 bảng mới |
| `server/src/models/vocabularies.model.ts` | DB row types, DTOs, filter types |
| `server/src/modules/vocabularies/vocabularies.validation.ts` | Zod schemas |
| `server/src/modules/vocabularies/vocabularies.repository.ts` | SQL queries |
| `server/src/modules/vocabularies/vocabularies.service.ts` | Business logic |
| `server/src/modules/vocabularies/vocabularies.controller.ts` | HTTP handling |
| `server/src/modules/vocabularies/vocabularies.controller.test.ts` | Controller tests (Supertest) |
| `server/src/modules/vocabularies/vocabularies.routes.ts` | Route definitions |

### Server (Modify)
| File | Thay đổi |
|------|---------|
| `server/src/models/index.ts` | Export vocabularies models |
| `server/src/app.ts` | Register `/api/vocabularies` + `/api/tags` routes |

### Client (Create)
| File | Vai trò |
|------|---------|
| `client/src/types/vocabularies.types.ts` | TypeScript types & enums |
| `client/src/services/vocabularies.service.ts` | BaseApiClient subclass |
| `client/src/pages/vocabularies/composables/useVocabularies.ts` | API calls composable |
| `client/src/stores/vocabularies.store.ts` | Pinia store |
| `client/src/pages/vocabularies/vocabularies.routes.ts` | Route definitions |
| `client/src/pages/vocabularies/VocabularyListPage.vue` | Trang danh sách |
| `client/src/pages/vocabularies/VocabularyCreatePage.vue` | Trang tạo mới |
| `client/src/pages/vocabularies/VocabularyEditPage.vue` | Trang chỉnh sửa |
| `client/src/pages/vocabularies/components/VocabularyTable.vue` | DataTable component |
| `client/src/pages/vocabularies/components/VocabularyFilters.vue` | Filter bar component |
| `client/src/pages/vocabularies/components/VocabularyForm.vue` | Container TabView |
| `client/src/pages/vocabularies/components/VocabularyInfoTab.vue` | Tab 1: Thông tin |
| `client/src/pages/vocabularies/components/VocabularyAuditTab.vue` | Tab 2: Audit |
| `client/src/pages/vocabularies/components/VocabularyAnalyticsTab.vue` | Tab 3: Analytics |
| `client/src/pages/vocabularies/__tests__/VocabularyListPage.test.ts` | List page tests |
| `client/src/pages/vocabularies/__tests__/VocabularyCreatePage.test.ts` | Create page tests |
| `client/src/pages/vocabularies/__tests__/VocabularyEditPage.test.ts` | Edit page tests |

### Client (Modify)
| File | Thay đổi |
|------|---------|
| `client/src/stores/index.ts` | Export vocabularies store |
| `client/src/router/routes.ts` | Import và spread `vocabularyRoutes` |

---

## Phase 1 — Database & Type Foundation

### Task 1: DB Migration + Server Models

**Spec Reference:** `docs/vocabularies/specs/vocabularies-design/01-backend.md — Section 1.1 & 1.2`

**Files:**
- Create: `database/migrations/011_create_vocabulary_tables.sql`
- Create: `server/src/models/vocabularies.model.ts`
- Modify: `server/src/models/index.ts`

- [ ] **Step 1:** Tạo file migration `011_create_vocabulary_tables.sql` với đầy đủ 6 bảng theo spec (vocabularies, tags, vocabulary_tags, vocabulary_relationships, vocabulary_change_logs, vocabulary_reports) bao gồm indexes và foreign keys.

- [ ] **Step 2:** Chạy migration:
  ```
  cd server && npx ts-node scripts/migrate.ts
  ```
  Expected: Migration chạy thành công, không có lỗi SQL.

- [ ] **Step 3:** Tạo `server/src/models/vocabularies.model.ts` với các types: `VocabularyRow`, `VocabularyDetail`, `VocabSummary`, `CreateVocabularyDto`, `UpdateVocabularyDto`, `VocabularyFilters`, `VocabularyChangeLog`, `VocabularyReport`, và các enums `VocabularyLevel`, `VocabularyStatus`, `RelationshipType`, `ReportStatus`.

- [ ] **Step 4:** Export từ `server/src/models/index.ts`.

- [ ] **Step 5: Commit**
  - `git add database/migrations/011_create_vocabulary_tables.sql server/src/models/`
  - `git commit -m "feat(vocab): add DB migration and server model types"`

---

### Task 2: Client TypeScript Types

**Spec Reference:** `docs/vocabularies/specs/vocabularies-design/02-frontend.md — Section 7`

**Files:**
- Create: `client/src/types/vocabularies.types.ts`

- [ ] **Step 1:** Tạo `client/src/types/vocabularies.types.ts` với đầy đủ types theo spec: `VocabularyLevel`, `VocabularyStatus`, `RelationshipType`, `ReportStatus`, `VocabSummary`, `VocabularyRow`, `VocabularyDetail`, `CreateVocabularyDto`, `UpdateVocabularyDto`, `VocabularyFilters`, `VocabularyChangeLog`, `VocabularyReport`.

- [ ] **Step 2: Commit**
  - `git add client/src/types/vocabularies.types.ts`
  - `git commit -m "feat(vocab): add client TypeScript types"`

---

## Phase 2 — Backend API

### Task 3: Backend API — Validation, Repository, Service, Controller (TDD), Routes

**Spec Reference:** `docs/vocabularies/specs/vocabularies-design/01-backend.md — Section 2, 3, 4` | `04-quality.md — Section 1.1`

**Files:**
- Create: `server/src/modules/vocabularies/vocabularies.validation.ts`
- Create: `server/src/modules/vocabularies/vocabularies.repository.ts`
- Create: `server/src/modules/vocabularies/vocabularies.service.ts`
- Create: `server/src/modules/vocabularies/vocabularies.controller.test.ts`
- Create: `server/src/modules/vocabularies/vocabularies.controller.ts`
- Create: `server/src/modules/vocabularies/vocabularies.routes.ts`
- Modify: `server/src/app.ts`

- [ ] **Step 1:** Tạo `vocabularies.validation.ts` — Zod schemas cho `createVocabularySchema`, `updateVocabularySchema`, `reportStatusSchema`, và query schemas cho list/search, theo validation rules trong spec Section 3.

- [ ] **Step 2:** Tạo `vocabularies.repository.ts` với các methods: `findAll(filters)`, `findById(id)`, `create(dto, adminId)`, `update(id, dto, adminId)`, `softDelete(id)`, `findChangeLogs(vocabularyId)`, `findReports(vocabularyId, status?)`, `updateReportStatus(reportId, status, resolvedBy?)`, `suggestTags(q)`, `searchVocabularies(q, excludeId?)`. Dùng parameterized queries MySQL2.

- [ ] **Step 3:** Tạo `vocabularies.service.ts` với các methods tương ứng. Service thực hiện: (a) business logic self-reference check cho `related_ids/synonym_ids/antonym_ids`, (b) auto-diff và ghi `vocabulary_change_logs` khi update, (c) `version + 1` khi update, (d) upsert tags (create-on-save), (e) sync relationships. Throw `ServiceError` với đúng error codes theo spec Section 4.

- [ ] **Step 4 (TDD — Write failing tests):** Tạo `vocabularies.controller.test.ts` với **37 test cases** theo `04-quality.md — Section 1.1`. Mock `VocabulariesService` hoàn toàn (`vi.mock`). Dùng Supertest. Chạy tests và xác nhận tất cả **FAIL** (chưa có controller).
  ```
  cd server && npx vitest run src/modules/vocabularies/vocabularies.controller.test.ts
  ```
  Expected: Tất cả tests fail với "Cannot find module" hoặc 404/500 errors.

- [ ] **Step 5 (TDD — Implement):** Tạo `vocabularies.controller.ts` với class `VocabulariesController` bao gồm đầy đủ methods: `getVocabularies`, `getVocabulary`, `createVocabulary`, `updateVocabulary`, `deleteVocabulary`, `getChangeLogs`, `getReports`, `updateReportStatus`, `suggestTags`, `searchVocabularies`. Dùng `sendSuccess`/`handleError` pattern theo codebase.

- [ ] **Step 6:** Tạo `vocabularies.routes.ts`. Áp dụng `authMiddleware + requireRole('admin')` cho tất cả routes. Route `GET /tags/suggest` và `GET /vocabularies/search` sẽ được mount riêng (xem Step 7). Đăng ký đúng thứ tự: static paths trước, `:id` params sau.

- [ ] **Step 7:** Modify `server/src/app.ts` — import và đăng ký:
  ```typescript
  app.use(`${appConfig.apiPrefix}/vocabularies`, vocabulariesRoutes);
  app.use(`${appConfig.apiPrefix}/tags`, tagsRoutes); // suggestTags endpoint
  ```

- [ ] **Step 8 (TDD — Verify):** Chạy lại tests:
  ```
  cd server && npx vitest run src/modules/vocabularies/vocabularies.controller.test.ts
  ```
  Expected: Tất cả **37 tests PASS**.

- [ ] **Step 9: Commit**
  - `git add server/src/modules/vocabularies/ server/src/app.ts`
  - `git commit -m "feat(vocab): add backend API with validation, service, controller, routes"`

---

## Phase 3 — Client Foundation

### Task 4: Client Service, Composable, Store, Routes

**Spec Reference:** `docs/vocabularies/specs/vocabularies-design/02-frontend.md — Section 1, 5, 6`

**Files:**
- Create: `client/src/services/vocabularies.service.ts`
- Create: `client/src/pages/vocabularies/composables/useVocabularies.ts`
- Create: `client/src/stores/vocabularies.store.ts`
- Create: `client/src/pages/vocabularies/vocabularies.routes.ts`
- Modify: `client/src/stores/index.ts`
- Modify: `client/src/router/routes.ts`

- [ ] **Step 1:** Tạo `vocabularies.service.ts` mở rộng `BaseApiClient<VocabularyRow, CreateVocabularyDto, UpdateVocabularyDto>` với base path `/vocabularies`. Thêm các methods: `getChangeLogs(id)`, `getReports(id, status?)`, `updateReportStatus(vocabId, reportId, status)`, `suggestTags(q)`, `searchVocabularies(q, excludeId?)`.

- [ ] **Step 2:** Tạo `useVocabularies.ts` composable theo spec Section 5. Wrap tất cả service calls, không có state (state thuộc store).

- [ ] **Step 3:** Tạo `vocabularies.store.ts` với Pinia `defineStore`. State shape theo spec Section 6. Actions: `fetchVocabularies`, `fetchVocabulary`, `createVocabulary`, `updateVocabulary`, `deleteVocabulary`, `fetchChangeLogs`, `fetchReports`, `updateReportStatus`, `clearCurrent`. Manage `loading`/`error` state per action.

- [ ] **Step 4:** Tạo `vocabularies.routes.ts` với routes:
  ```
  /vocabularies        → VocabularyListPage  (name: 'VocabularyList')
  /vocabularies/create → VocabularyCreatePage (name: 'VocabularyCreate')
  /vocabularies/:id    → VocabularyEditPage  (name: 'VocabularyEdit')
  ```
  Lazy-load tất cả page components. Metadata `requiresAdmin: true` (route guard hiện có).

- [ ] **Step 5:** Export `useVocabulariesStore` từ `client/src/stores/index.ts`.

- [ ] **Step 6:** Import và spread `vocabularyRoutes` vào `client/src/router/routes.ts`.

- [ ] **Step 7: Commit**
  - `git add client/src/services/vocabularies.service.ts client/src/pages/vocabularies/composables/ client/src/stores/vocabularies.store.ts client/src/pages/vocabularies/vocabularies.routes.ts client/src/stores/index.ts client/src/router/routes.ts`
  - `git commit -m "feat(vocab): add client service, composable, store, routes"`

---

## Phase 4 — UI Pages & Components

### Task 5: VocabularyListPage + VocabularyTable + VocabularyFilters

**Spec Reference:** `docs/vocabularies/specs/vocabularies-design/02-frontend.md — Section 3.1` | `03-behavior.md — Section 1.1, 2.1, 3.1, 4` | `04-quality.md — Section 1.2 VocabularyListPage`

**Files:**
- Create: `client/src/pages/vocabularies/components/VocabularyFilters.vue`
- Create: `client/src/pages/vocabularies/components/VocabularyTable.vue`
- Create: `client/src/pages/vocabularies/VocabularyListPage.vue`
- Test: `client/src/pages/vocabularies/__tests__/VocabularyListPage.test.ts`

- [ ] **Step 1 (TDD — Write failing tests):** Tạo `VocabularyListPage.test.ts` với 9 test cases theo spec `04-quality.md — Section 1.2 VocabularyListPage`. Mock store và router. Chạy và xác nhận tất cả **FAIL**.
  ```
  cd client && npx vitest run src/pages/vocabularies/__tests__/VocabularyListPage.test.ts
  ```

- [ ] **Step 2 (Implement):** Tạo `VocabularyFilters.vue` — filter bar với 4 controls (search TextInput, level Select, status Select, tag AutoComplete). Props: `modelValue: VocabularyFilters`. Emits: `update:modelValue`. Search input dùng `watchDebounced` (400ms, VueUse).

- [ ] **Step 3 (Implement):** Tạo `VocabularyTable.vue` — PrimeVue DataTable với 7 columns theo spec Section 3.1: Kanji, Nghĩa TV, Level (Badge), Status (Tag với màu theo value), Tags (chips, max 3), CreatedAt, Actions (Edit/Delete buttons). Props và emits theo spec Section 4.1. Paginator tích hợp.

- [ ] **Step 4 (Implement):** Tạo `VocabularyListPage.vue` — kết hợp `VocabularyFilters` + `Button tạo mới` + `VocabularyTable` + `ConfirmDialog`. Xử lý handlers: `handleFilterChange`, `handlePageChange`, `handleSortChange`, `handleEdit`, `handleDelete` (với confirm). `onMounted` gọi `store.fetchVocabularies()`. Hiển thị đúng loading skeleton, empty state (2 loại: không có data vs filter rỗng).

- [ ] **Step 5 (TDD — Verify):**
  ```
  cd client && npx vitest run src/pages/vocabularies/__tests__/VocabularyListPage.test.ts
  ```
  Expected: Tất cả **9 tests PASS**.

- [ ] **Step 6: Commit**
  - `git add client/src/pages/vocabularies/VocabularyListPage.vue client/src/pages/vocabularies/components/VocabularyFilters.vue client/src/pages/vocabularies/components/VocabularyTable.vue client/src/pages/vocabularies/__tests__/VocabularyListPage.test.ts`
  - `git commit -m "feat(vocab): add VocabularyListPage with table and filters"`

---

### Task 6: VocabularyCreatePage + VocabularyEditPage + Form Components (3 Tabs)

**Spec Reference:** `docs/vocabularies/specs/vocabularies-design/02-frontend.md — Section 3.2, 3.3, 3.4, 4.3–4.6` | `03-behavior.md — Section 1.2, 1.3, 1.4, 2.2, 2.3, 3.2, 5.1, 5.2` | `04-quality.md — Section 1.2 Create/Edit/InfoTab`

**Files:**
- Create: `client/src/pages/vocabularies/components/VocabularyInfoTab.vue`
- Create: `client/src/pages/vocabularies/components/VocabularyAuditTab.vue`
- Create: `client/src/pages/vocabularies/components/VocabularyAnalyticsTab.vue`
- Create: `client/src/pages/vocabularies/components/VocabularyForm.vue`
- Create: `client/src/pages/vocabularies/VocabularyCreatePage.vue`
- Create: `client/src/pages/vocabularies/VocabularyEditPage.vue`
- Test: `client/src/pages/vocabularies/__tests__/VocabularyCreatePage.test.ts`
- Test: `client/src/pages/vocabularies/__tests__/VocabularyEditPage.test.ts`

- [ ] **Step 1 (TDD — Write failing tests):** Tạo `VocabularyCreatePage.test.ts` (15 tests) và `VocabularyEditPage.test.ts` (13 tests) theo spec `04-quality.md — Section 1.2`. Mock store, router, composable. Chạy và xác nhận tất cả **FAIL**.
  ```
  cd client && npx vitest run src/pages/vocabularies/__tests__/
  ```

- [ ] **Step 2 (Implement VocabularyInfoTab.vue):** Tạo Tab 1 với tất cả fields theo spec Section 3.2. Dùng `useForm` (VeeValidate) + Zod schema (computed cho reactive i18n). Required fields: `meaning_vi`, `level`, `status`. Các fields optional: hiragana, romaji, kanji, sino_vietnamese, media_url (URL validation), note (Textarea). Tag dùng PrimeVue `AutoComplete` (chips mode, debounce 300ms, gọi `composable.suggestTags`). 3 MultiSelect fields (related_words, synonyms, antonyms): debounce 300ms, gọi `composable.searchVocabularies(q, excludeId)`, option label dạng `"{kanji || hiragana} ({meaning_vi})"`. Props: `modelValue`, `loading`. Emits: `update:modelValue`.

- [ ] **Step 3 (Implement VocabularyAuditTab.vue):** Tạo Tab 2 theo spec Section 3.3. Fields readonly: createdBy, updatedBy, version, createdAt, updatedAt. Timeline (PrimeVue `Timeline`) cho changeLogs với format `"field: old→new by admin on date"`. DataTable cho reports với columns: lý do, user, ngày, status chip (pending=orange, resolved=green), nút Resolve/Pending. Props và emits theo spec Section 4.5. Khi `changeLogs=[]` hiển thị `vocabularies.audit.noChanges`.

- [ ] **Step 4 (Implement VocabularyAnalyticsTab.vue):** Tạo Tab 3 theo spec Section 3.4 — 2 stat cards hiển thị `learn_count` và `favorite_count` (readonly). Props: `learnCount: number`, `favoriteCount: number`.

- [ ] **Step 5 (Implement VocabularyForm.vue):** Tạo container TabView (PrimeVue) với 3 `TabPanel`: Thông tin / Audit / Analytics. Nhận `VocabularyInfoTab`, `VocabularyAuditTab`, `VocabularyAnalyticsTab` là slots/embedded. Nút [Hủy] và [Lưu từ vựng] nằm ngoài TabView. Emit `submit` khi form valid, `cancel` khi bấm Hủy. Props và emits theo spec Section 4.3.

- [ ] **Step 6 (Implement VocabularyCreatePage.vue):** Trang tạo mới — dùng `VocabularyForm` (mode='create'). `handleSubmit(dto)` gọi `store.createVocabulary(dto)` → toast success → navigate `VocabularyList`. Lỗi → toast error. `handleCancel()`: nếu `isDirty` thì mở `ConfirmDialog`; ngược lại navigate thẳng.

- [ ] **Step 7 (Implement VocabularyEditPage.vue):** Trang chỉnh sửa — `onMounted` gọi `store.fetchVocabulary(id)` + `store.fetchChangeLogs(id)` + `store.fetchReports(id)`. `onUnmounted` gọi `store.clearCurrent()`. Pre-fill form từ `store.currentVocabulary`. Handlers: `handleSubmit`, `handleCancel`, `handleResolveReport(reportId)`, `handlePendingReport(reportId)` (gọi `store.updateReportStatus`, cập nhật chip inline).

- [ ] **Step 8 (TDD — Verify):**
  ```
  cd client && npx vitest run src/pages/vocabularies/__tests__/
  ```
  Expected: Tất cả **37 frontend tests PASS** (9 List + 15 Create + 13 Edit).

- [ ] **Step 9: Commit**
  - `git add client/src/pages/vocabularies/`
  - `git commit -m "feat(vocab): add VocabularyCreatePage, EditPage and all form tab components"`
