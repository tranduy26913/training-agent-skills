# Vocabulary FlashCard — User Learning: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use skill `executing-plans` to implement this plan.
> **Execution mode:** Phases are sequential. Tasks within a phase are executed sequentially.

**Goal:** Xây dựng tính năng học từ vựng FlashCard cho User, bao gồm DB migration, backend API, và 3 trang frontend (chọn level, danh sách từ, phiên học).  
**Tech Stack:** MySQL2, Express, TypeScript, Zod, Vue 3 (Composition API), Pinia, PrimeVue, Vitest, Vue Test Utils

---

## Phase 1 — Database & Backend Models

### Task 1: DB Migration — Tạo bảng `user_vocabulary_progress`

**Spec Reference:** `docs/vocabularies/specs/flashcard-design/01-backend.md — Section 1.1 Database Schema`

**Files:**
- Create: `database/migrations/012_create_user_vocabulary_progress.sql`

- [ ] **Step 1:** Tạo file migration SQL với bảng `user_vocabulary_progress` đúng theo spec (PK composite, FK, indexes).
- [ ] **Step 2:** Chạy migration thủ công hoặc apply vào `schema.sql`.
  - Chạy: `mysql -u root -p training < database/migrations/012_create_user_vocabulary_progress.sql`
  - Expected: Bảng tạo thành công, không có lỗi SQL.
- [ ] **Step 3: Commit**
  - `git add database/migrations/012_create_user_vocabulary_progress.sql database/schema.sql`
  - `git commit -m "feat(db): add user_vocabulary_progress table for flashcard learning"`

---

### Task 2: Backend — Models & Validation

**Spec Reference:** `docs/vocabularies/specs/flashcard-design/01-backend.md — Section 1.2 TypeScript DTOs` và `Section 3. Validation Rules`

**Files:**
- Create: `server/src/models/learn.model.ts`
- Create: `server/src/modules/learn/learn.validation.ts`

- [ ] **Step 1:** Tạo `learn.model.ts` với các TypeScript interfaces: `LearnVocabularyItem`, `UserProgressDto`, `LevelStatsDto`, `UpdateProgressDto`, `BatchUpdateProgressDto`, `ToggleFavoriteResponse` theo spec.
- [ ] **Step 2:** Tạo `learn.validation.ts` với Zod schemas: `batchUpdateProgressSchema` (validate `updates[]`, max 200) và `getVocabulariesQuerySchema` (validate `level`, `progress_status`, `page`, `limit`).
- [ ] **Step 3: Commit**
  - `git add server/src/models/learn.model.ts server/src/modules/learn/learn.validation.ts`
  - `git commit -m "feat(learn): add backend models and Zod validation schemas"`

---

## Phase 2 — Backend API

### Task 3: Backend — Repository & Service

**Spec Reference:** `docs/vocabularies/specs/flashcard-design/01-backend.md — Section 2. API Endpoints` và `Section 3. Business Rules`

**Files:**
- Create: `server/src/modules/learn/learn.repository.ts`
- Create: `server/src/modules/learn/learn.service.ts`
- Test: `server/src/modules/learn/learn.service.test.ts`

- [ ] **Step 1 (TDD):** Viết failing unit tests cho `LearnService` theo bảng tests trong `04-quality.md — Section 1.1 Unit Tests`. Cover: `getLevelStats`, `getVocabularies` (filter publish-only, filter progress_status), `batchUpdateProgress` (upsert, review_count, learn_count), `toggleFavorite` (upsert, toggle, not-found).
  - Run: `cd server && npx vitest run src/modules/learn/learn.service.test.ts`
  - Expected: Tests FAIL (file chưa tồn tại).
- [ ] **Step 2:** Implement `learn.repository.ts` với các functions: `getLevelStats(userId)`, `getVocabularies(userId, filters)`, `batchUpsertProgress(userId, updates)`, `incrementLearnCount(vocabularyIds[])`, `toggleFavorite(userId, vocabularyId)`.
  - SQL `batchUpsertProgress`: dùng `INSERT INTO ... ON DUPLICATE KEY UPDATE`.
  - SQL `incrementLearnCount`: single `UPDATE vocabularies SET learn_count = learn_count + 1 WHERE id IN (?)`.
  - `getVocabularies`: chỉ lấy từ có `vocabularies.status = 'publish'`.
  - `toggleFavorite`: validate từ tồn tại và `status='publish'` trước khi upsert — throw `ServiceError(404)` nếu không tìm thấy.
- [ ] **Step 3:** Implement `learn.service.ts` với class `LearnService`, wrap repository calls, xử lý business logic theo spec.
- [ ] **Step 4:** Run tests — tất cả PASS.
  - Run: `cd server && npx vitest run src/modules/learn/learn.service.test.ts`
  - Expected: All tests PASS.
- [ ] **Step 5: Commit**
  - `git add server/src/modules/learn/`
  - `git commit -m "feat(learn): add repository, service, and unit tests"`

---

### Task 4: Backend — Controller & Routes

**Spec Reference:** `docs/vocabularies/specs/flashcard-design/01-backend.md — Section 2. API Endpoints` và `Section 4. Error Handling`

**Files:**
- Create: `server/src/modules/learn/learn.controller.ts`
- Create: `server/src/modules/learn/learn.routes.ts`
- Modify: `server/src/app.ts`

- [ ] **Step 1 (TDD):** Viết failing integration tests trong `server/src/__tests__/learn.integration.test.ts` theo bảng trong `04-quality.md — Section 1.1 Integration Tests`. Cover: auth required (401), role guard (403 for admin/moderator), valid responses cho `GET /stats`, `GET /vocabularies`, `POST /progress/batch`, `POST /favorite/:id`.
  - Run: `cd server && npx vitest run src/__tests__/learn.integration.test.ts`
  - Expected: Tests FAIL.
- [ ] **Step 2:** Tạo `learn.controller.ts` với 4 handlers: `getStats`, `getVocabularies`, `batchUpdateProgress`, `toggleFavorite`. Sử dụng `req.user.id` từ JWT middleware cho `userId`.
- [ ] **Step 3:** Tạo `learn.routes.ts` — apply `authMiddleware` + `requireRole('user')` cho tất cả routes. Đăng ký: `GET /stats`, `GET /vocabularies`, `POST /progress/batch`, `POST /favorite/:vocabularyId`.
- [ ] **Step 4:** Đăng ký routes trong `app.ts`: `app.use('/api/learn', learnRoutes)`.
- [ ] **Step 5:** Run integration tests — tất cả PASS.
  - Run: `cd server && npx vitest run src/__tests__/learn.integration.test.ts`
  - Expected: All tests PASS.
- [ ] **Step 6: Commit**
  - `git add server/src/modules/learn/learn.controller.ts server/src/modules/learn/learn.routes.ts server/src/app.ts server/src/__tests__/learn.integration.test.ts`
  - `git commit -m "feat(learn): add controller, routes, and integration tests"`

---

## Phase 3 — Frontend

### Task 5: Frontend — Types, Service & Store

**Spec Reference:** `docs/vocabularies/specs/flashcard-design/02-frontend.md — Section 7. TypeScript Models`, `Section 5. Composable`, `Section 6. Store`

**Files:**
- Create: `client/src/types/learn.types.ts`
- Create: `client/src/services/learn.service.ts`
- Create: `client/src/stores/learn.store.ts`

- [ ] **Step 1:** Tạo `learn.types.ts` với tất cả interfaces và types theo spec: `ProgressStatus`, `FlipDirection`, `UserProgressDto`, `LearnVocabularyItem`, `LevelStatsDto`, `CardConfig`, `SessionResults`, `VocabListFilter`.
- [ ] **Step 2:** Tạo `learn.service.ts` extends `BaseApiClient` với 4 methods: `getLevelStats()`, `getVocabularies(level, filter)`, `batchUpdateProgress(updates)`, `toggleFavorite(vocabularyId)`.
- [ ] **Step 3:** Tạo `learn.store.ts` (Pinia) với state, actions theo spec: `fetchLevelStats()`, `fetchVocabList(level, filter)`, `startSession(cards)`, `clearSession()`, `updateLocalProgress()`, `toggleLocalFavorite()`.
- [ ] **Step 4:** Viết unit tests cho store trong `client/src/stores/__tests__/learn.store.test.ts`: test `startSession`, `clearSession`, `updateLocalProgress`, `toggleLocalFavorite` với mocked service.
  - Run: `cd client && npx vitest run src/stores/__tests__/learn.store.test.ts`
  - Expected: All tests PASS.
- [ ] **Step 5: Commit**
  - `git add client/src/types/learn.types.ts client/src/services/learn.service.ts client/src/stores/learn.store.ts client/src/stores/__tests__/learn.store.test.ts`
  - `git commit -m "feat(learn): add types, service, and Pinia store with tests"`

---

### Task 6: Frontend — Shared Components

**Spec Reference:** `docs/vocabularies/specs/flashcard-design/02-frontend.md — Section 4. Component Details`

**Files:**
- Create: `client/src/pages/learn/components/LevelCard.vue`
- Create: `client/src/pages/learn/components/SessionProgress.vue`
- Create: `client/src/pages/learn/components/FlashCard.vue`
- Create: `client/src/pages/learn/components/CardConfigPanel.vue`
- Create: `client/src/pages/learn/components/SessionSummary.vue`
- Create: `client/src/pages/learn/composables/useLearnSession.ts`

- [ ] **Step 1 (TDD):** Viết failing unit tests theo bảng trong `04-quality.md — Section 1.2` cho: `FlashCard` (flip state, disabled buttons), `CardConfigPanel` (emit update:modelValue), `SessionSummary` (emit retry/backToList), `useLearnSession` (progress computed, currentCard, markKnown/markUnknown, finishSession).
  - Run: `cd client && npx vitest run src/pages/learn/components/__tests__/`
  - Expected: Tests FAIL.
- [ ] **Step 2:** Implement `LevelCard.vue` — nhận props `level`, `stats: LevelStatsDto`; emit `start`; hiển thị PrimeVue ProgressBar.
- [ ] **Step 3:** Implement `SessionProgress.vue` — nhận `current`, `total`; hiển thị label "N / Total" và ProgressBar.
- [ ] **Step 4:** Implement `FlashCard.vue` — nhận `vocab`, `config: CardConfig`, `isFlipped`; render mặt trước/sau theo `config`; nút [Lật thẻ]; icon ★ favorite; emit `flip`, `toggleFavorite`.
- [ ] **Step 5:** Implement `CardConfigPanel.vue` — PrimeVue Sidebar/Dialog; RadioButton cho `flipDirection`; Checkbox groups cho `frontFields` và `backFields`; emit `update:modelValue`, `update:visible` khi Apply.
- [ ] **Step 6:** Implement `SessionSummary.vue` — hiển thị `knownCount`, `unknownCount`, `newFavoriteCount`; nút [Học lại] emit `retry`, [Về danh sách] emit `backToList`.
- [ ] **Step 7:** Implement `useLearnSession.ts` composable theo interface spec: `cards`, `currentIndex`, `isFlipped`, `cardConfig`, `sessionResults`, `isSessionComplete`, `flipCard()`, `markKnown()`, `markUnknown()`, `toggleFavorite()`, `updateCardConfig()`, `restartSession()`, `finishSession()`.
- [ ] **Step 8:** Run tests — tất cả PASS.
  - Run: `cd client && npx vitest run src/pages/learn/`
  - Expected: All tests PASS.
- [ ] **Step 9: Commit**
  - `git add client/src/pages/learn/components/ client/src/pages/learn/composables/`
  - `git commit -m "feat(learn): add shared flashcard components and useLearnSession composable"`

---

### Task 7: Frontend — Pages & Routes

**Spec Reference:** `docs/vocabularies/specs/flashcard-design/02-frontend.md — Section 1, 2, 3` | `03-behavior.md — Section 1, 2, 3, 4`

**Files:**
- Create: `client/src/pages/learn/LearnLevelPage.vue`
- Create: `client/src/pages/learn/LearnVocabListPage.vue`
- Create: `client/src/pages/learn/components/LearnFilters.vue`
- Create: `client/src/pages/learn/components/LearnVocabTable.vue`
- Create: `client/src/pages/learn/LearnSessionPage.vue`
- Create: `client/src/pages/learn/learn.routes.ts`
- Modify: `client/src/router/routes.ts`

- [ ] **Step 1 (TDD):** Viết failing unit tests cho `LearnLevelPage`, `LearnVocabListPage`, `LearnSessionPage` theo bảng trong `04-quality.md — Section 1.2`. Tập trung: gọi fetch khi mounted, navigate behavior, empty states, guard redirect.
  - Run: `cd client && npx vitest run src/pages/learn/__tests__/`
  - Expected: Tests FAIL.
- [ ] **Step 2:** Implement `LearnLevelPage.vue` — dùng `useLearnStore`; `onMounted` gọi `fetchLevelStats`; render 5 `LevelCard`; skeleton khi loading; toast nếu lỗi.
- [ ] **Step 3:** Implement `LearnFilters.vue` — SelectButton (Tất cả/Mới/Đang học/Đã biết) + InputText search; emit `change` với filter mới.
- [ ] **Step 4:** Implement `LearnVocabTable.vue` — PrimeVue DataTable với checkbox selection; columns: Kanji, Hiragana, Romaji, Nghĩa TV, status Badge, ★ icon; PrimeVue Paginator.
- [ ] **Step 5:** Implement `LearnVocabListPage.vue` — `onMounted` gọi `fetchVocabList`; filter change + debounce search; sticky ActionBar với 3 nút; `startSession` logic theo `03-behavior.md — Section 1.2`; `onBeforeRouteLeave` guard không cần ở trang này.
- [ ] **Step 6:** Implement `LearnSessionPage.vue` — `onMounted` check `sessionCards` không rỗng (redirect nếu rỗng); integrate `useLearnSession`; render `SessionProgress`, `CardConfigPanel`, `FlashCard` (ẩn khi complete), `SessionSummary` (hiện khi complete); `onBeforeRouteLeave` guard chỉ khi `currentIndex > 0 && !isSessionComplete`.
- [ ] **Step 7:** Tạo `learn.routes.ts` — 3 routes với `meta: { requiresAuth: true, roles: ['user'] }`:
  - `/learn` → `LearnLevelPage`
  - `/learn/:level/list` → `LearnVocabListPage`
  - `/learn/:level/session` → `LearnSessionPage`
- [ ] **Step 8:** Thêm `...learnRoutes` vào `client/src/router/routes.ts`.
- [ ] **Step 9:** Run tests — tất cả PASS.
  - Run: `cd client && npx vitest run src/pages/learn/`
  - Expected: All tests PASS.
- [ ] **Step 10:** Kiểm tra visual bằng dev server — navigate qua 3 trang, thử flip card, đánh dấu known/unknown.
  - Run: `cd client && npm run dev`
  - Expected: 3 trang hiển thị đúng, luồng học hoạt động end-to-end.
- [ ] **Step 11: Commit**
  - `git add client/src/pages/learn/ client/src/router/routes.ts`
  - `git commit -m "feat(learn): add LearnLevelPage, LearnVocabListPage, LearnSessionPage with routes"`
