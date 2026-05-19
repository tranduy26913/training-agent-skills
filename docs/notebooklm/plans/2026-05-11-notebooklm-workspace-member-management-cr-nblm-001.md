# NotebookLM Workspace Member Management (CR-NBLM-001) Implementation Plan
> **For agentic workers:** REQUIRED SUB-SKILL: Use skill executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bổ sung luồng thêm user vào NotebookLM workspace bằng tìm kiếm name/email và thay đổi hành vi add member sang upsert role khi user đã là thành viên.

**Architecture:** Mở rộng module notebooklm hiện có theo hướng không phá vỡ API cũ: thêm endpoint user search riêng, giữ endpoint add member nhưng đổi nghiệp vụ từ conflict sang upsert. Frontend thêm một member management panel tại trang Workspace Edit, gọi API search users theo debounce và thực thi add/upsert với role bắt buộc.

**Tech Stack:** Node.js/Express/TypeScript/Zod/Vitest, Vue 3/Pinia/PrimeVue/Vitest, Playwright

---

## File Map

### Create

- `client/src/pages/notebooklm/workspace/components/WorkspaceMemberManager.vue`
- `client/src/pages/notebooklm/workspace/components/WorkspaceMemberManager.test.ts`

### Modify

- `server/src/models/notebooklm.model.ts`
- `server/src/modules/notebooklm/notebooklm.validation.ts`
- `server/src/modules/notebooklm/notebooklm.repository.ts`
- `server/src/modules/notebooklm/notebooklm.service.ts`
- `server/src/modules/notebooklm/notebooklm.controller.ts`
- `server/src/modules/notebooklm/notebooklm.routes.ts`
- `server/src/modules/notebooklm/notebooklm.service.test.ts`
- `server/src/modules/notebooklm/notebooklm.controller.test.ts`
- `client/src/types/notebooklm.types.ts`
- `client/src/services/notebooklm-workspace.service.ts`
- `client/src/stores/notebooklm-workspace.store.ts`
- `client/src/pages/notebooklm/workspace/WorkspaceEditPage.vue`
- `client/src/stores/__tests__/notebooklm-workspace.store.test.ts` (create if missing)
- `client/src/locales/en.ts`
- `client/src/locales/vi.ts`
- `client/src/locales/ja.ts`
- `client/e2e/notebooklm-operations.spec.ts`

---

### Task 1: Define Failing Backend Tests for CR-NBLM-001

**Files:**
- Test: `server/src/modules/notebooklm/notebooklm.service.test.ts`
- Test: `server/src/modules/notebooklm/notebooklm.controller.test.ts`

- [ ] **Step 1: Write the failing test**
Add tests for:
- `addMember` upsert behavior (existing member -> role updated, no 409).
- only owner can add/upsert member.
- user search endpoint returns paginated users by keyword.

- [ ] **Step 2: Run test to verify it fails**
Run: `cd server && npx vitest run src/modules/notebooklm/notebooklm.service.test.ts src/modules/notebooklm/notebooklm.controller.test.ts`
Expected: FAIL on missing search endpoint/service method and old addMember conflict behavior.

- [ ] **Step 3: Write minimal implementation**
Update test fixtures/mocks to include repository methods for user search and upsert path.

- [ ] **Step 4: Run test to verify it passes**
Run: `cd server && npx vitest run src/modules/notebooklm/notebooklm.service.test.ts src/modules/notebooklm/notebooklm.controller.test.ts`
Expected: PASS for new CR behaviors.

- [ ] **Step 5: Commit**
Run: `git add server/src/modules/notebooklm/notebooklm.service.test.ts server/src/modules/notebooklm/notebooklm.controller.test.ts && git commit -m "test(server): add CR-NBLM-001 member upsert and user search coverage"`

**Effort Total (hours):** 2

---

### Task 2: Implement Backend User Search + AddMember Upsert

**Files:**
- Modify: `server/src/models/notebooklm.model.ts`
- Modify: `server/src/modules/notebooklm/notebooklm.validation.ts`
- Modify: `server/src/modules/notebooklm/notebooklm.repository.ts`
- Modify: `server/src/modules/notebooklm/notebooklm.service.ts`
- Modify: `server/src/modules/notebooklm/notebooklm.controller.ts`
- Modify: `server/src/modules/notebooklm/notebooklm.routes.ts`

- [ ] **Step 1: Write the failing test**
Add/adjust integration-style controller tests for:
- `GET /api/notebooklm/users/search`
- `POST /api/notebooklm/workspaces/:id/members` returns 200 for upsert path.

- [ ] **Step 2: Run test to verify it fails**
Run: `cd server && npx vitest run src/modules/notebooklm/notebooklm.controller.test.ts`
Expected: FAIL because route/validation/response mapping not implemented for CR behavior.

- [ ] **Step 3: Write minimal implementation**
Implement:
- user search query + paging in repository (name/email keyword).
- service method for search users.
- `addMember` logic: insert if missing, update role if existing (owner rule preserved).
- controller add/search handlers and route wiring.
- validation schema for search query params.

- [ ] **Step 4: Run test to verify it passes**
Run: `cd server && npx vitest run src/modules/notebooklm/notebooklm.service.test.ts src/modules/notebooklm/notebooklm.controller.test.ts`
Expected: PASS with upsert semantics and search endpoint behavior.

- [ ] **Step 5: Commit**
Run: `git add server/src/models/notebooklm.model.ts server/src/modules/notebooklm/notebooklm.validation.ts server/src/modules/notebooklm/notebooklm.repository.ts server/src/modules/notebooklm/notebooklm.service.ts server/src/modules/notebooklm/notebooklm.controller.ts server/src/modules/notebooklm/notebooklm.routes.ts && git commit -m "feat(server): implement CR-NBLM-001 member upsert and user search API"`

**Effort Total (hours):** 4

---

### Task 3: Add Frontend Data Layer Tests and API Methods

**Files:**
- Modify: `client/src/types/notebooklm.types.ts`
- Modify: `client/src/services/notebooklm-workspace.service.ts`
- Modify: `client/src/stores/notebooklm-workspace.store.ts`
- Test: `client/src/stores/__tests__/notebooklm-workspace.store.test.ts` (create if missing)

- [ ] **Step 1: Write the failing test**
Add store tests for:
- search users by keyword with debounce-safe API call path.
- add member with selected role.
- add existing member triggers role update state path (no client conflict state).

- [ ] **Step 2: Run test to verify it fails**
Run: `cd client && npx vitest run src/stores/__tests__/notebooklm-workspace.store.test.ts`
Expected: FAIL due to missing member-search/member-upsert actions and types.

- [ ] **Step 3: Write minimal implementation**
Implement service/store methods and types:
- `searchWorkspaceCandidateUsers(workspaceId, q, page, limit)`
- `addOrUpdateWorkspaceMember(workspaceId, userId, role)`
- state for members list and candidate users list.

- [ ] **Step 4: Run test to verify it passes**
Run: `cd client && npx vitest run src/stores/__tests__/notebooklm-workspace.store.test.ts`
Expected: PASS for all data-layer CR scenarios.

- [ ] **Step 5: Commit**
Run: `git add client/src/types/notebooklm.types.ts client/src/services/notebooklm-workspace.service.ts client/src/stores/notebooklm-workspace.store.ts client/src/stores/__tests__/notebooklm-workspace.store.test.ts && git commit -m "feat(client): add workspace member search/upsert data flow for CR-NBLM-001"`

**Effort Total (hours):** 3

---

### Task 4: Build Member Management UI in Workspace Edit

**Files:**
- Create: `client/src/pages/notebooklm/workspace/components/WorkspaceMemberManager.vue`
- Create: `client/src/pages/notebooklm/workspace/components/WorkspaceMemberManager.test.ts`
- Modify: `client/src/pages/notebooklm/workspace/WorkspaceEditPage.vue`
- Modify: `client/src/locales/en.ts`
- Modify: `client/src/locales/vi.ts`
- Modify: `client/src/locales/ja.ts`

- [ ] **Step 1: Write the failing test**
Add component tests for:
- search input triggers candidate fetch.
- role selection is required before add.
- add existing member updates role row display.
- non-owner sees read-only/no add controls.

- [ ] **Step 2: Run test to verify it fails**
Run: `cd client && npx vitest run src/pages/notebooklm/workspace/components/WorkspaceMemberManager.test.ts`
Expected: FAIL because component and wiring do not exist.

- [ ] **Step 3: Write minimal implementation**
Implement `WorkspaceMemberManager.vue` with PrimeVue controls:
- search box, role select, add action.
- members table list with role badges.
- integrate into `WorkspaceEditPage.vue` and connect store actions.
- add i18n keys for labels/messages.

- [ ] **Step 4: Run test to verify it passes**
Run: `cd client && npx vitest run src/pages/notebooklm/workspace/components/WorkspaceMemberManager.test.ts`
Expected: PASS for required member-management UI interactions.

- [ ] **Step 5: Commit**
Run: `git add client/src/pages/notebooklm/workspace/components/WorkspaceMemberManager.vue client/src/pages/notebooklm/workspace/components/WorkspaceMemberManager.test.ts client/src/pages/notebooklm/workspace/WorkspaceEditPage.vue client/src/locales/en.ts client/src/locales/vi.ts client/src/locales/ja.ts && git commit -m "feat(client): add workspace member manager UI for CR-NBLM-001"`

**Effort Total (hours):** 4

---

### Task 5: Validate End-to-End and Regression Safety

**Files:**
- Modify: `client/e2e/notebooklm-operations.spec.ts`
- Test: `server/src/modules/notebooklm/notebooklm.controller.test.ts`
- Test: `client/src/pages/notebooklm/workspace/components/WorkspaceMemberManager.test.ts`

- [ ] **Step 1: Write the failing test**
Extend E2E flow:
- owner opens workspace edit.
- searches existing user.
- adds with selected role.
- repeats add with different role and verifies updated role.

- [ ] **Step 2: Run test to verify it fails**
Run: `cd client && npx playwright test e2e/notebooklm-operations.spec.ts --project=chromium`
Expected: FAIL before CR implementation is complete.

- [ ] **Step 3: Write minimal implementation**
Adjust selectors/test data and stabilize waits for user search + role update feedback.

- [ ] **Step 4: Run test to verify it passes**
Run:
- `cd server && npx vitest run src/modules/notebooklm/notebooklm.service.test.ts src/modules/notebooklm/notebooklm.controller.test.ts`
- `cd client && npx vitest run src/pages/notebooklm/workspace/components/WorkspaceMemberManager.test.ts src/stores/__tests__/notebooklm-workspace.store.test.ts`
- `cd client && npx playwright test e2e/notebooklm-operations.spec.ts --project=chromium`
Expected: PASS all targeted tests, no regression on notebooklm workspace operations.

- [ ] **Step 5: Commit**
Run: `git add client/e2e/notebooklm-operations.spec.ts server/src/modules/notebooklm/notebooklm.controller.test.ts client/src/pages/notebooklm/workspace/components/WorkspaceMemberManager.test.ts client/src/stores/__tests__/notebooklm-workspace.store.test.ts && git commit -m "test(e2e): cover CR-NBLM-001 workspace member add/upsert flow"`

**Effort Total (hours):** 3

---

## Self-Review

1. Spec coverage:
- API search user and add-member upsert: covered in Tasks 1-2.
- Workspace edit member panel behavior: covered in Tasks 3-4.
- End-to-end owner workflow and role update UX: covered in Task 5.

2. Placeholder scan:
- No placeholder tokens (TBD/TODO/[...] ) remain.
- All file paths and commands are specific.

3. Type consistency:
- Member role union stays `owner | editor | viewer` across backend model, validation, API DTO, store state, and component props.
- Add member behavior is consistently named as upsert across service, tests, and E2E assertions.
