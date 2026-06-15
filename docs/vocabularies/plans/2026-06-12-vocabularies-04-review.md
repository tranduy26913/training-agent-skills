# Vocabulary Management — Code & Test Review Plan
> **For agentic workers:** REQUIRED SKILL: Use skill `executing-plans` to implement this plan.
> **Execution mode:** Phases are sequential. Tasks within a phase are executed sequentially.

## Plan Structure

## Phase 1 — Backend Code Review

### Task 1: Review Backend Implementation

**Spec Reference:** `docs/vocabularies/specs/vocabularies-design/01-backend.md`

**Files:**
- Review: `server/src/models/vocabularies.model.ts`
- Review: `server/src/modules/vocabulary/vocabulary.repository.ts`
- Review: `server/src/modules/vocabulary/vocabulary.service.ts`
- Review: `server/src/modules/vocabulary/vocabulary.validation.ts`
- Review: `server/src/modules/vocabulary/vocabulary.controller.ts`
- Review: `server/src/modules/vocabulary/vocabulary.routes.ts`

- **Step 1:** Technical code review
  - Run: Review each file for:
    - Type safety and consistency
    - SQL injection prevention (parameterized queries)
    - Error handling and logging
    - Transaction usage for data integrity
    - Validation completeness
    - Admin authorization checks
  - Expected: Review findings documented

- **Step 2:** Spec compliance review
  - Run: Compare implementation against `01-backend.md`:
    - All API endpoints implemented correctly
    - All validation rules from Section 3 enforced
    - Error codes match spec (400, 401, 403, 404, 409)
    - Change log creation on updates
    - Soft delete behavior
  - Expected: Spec compliance report

- **Step 3:** Fix issues
  - Run: Address all findings from Steps 1-2
  - Expected: All issues resolved, code updated

- **Step 4: Commit**
  - `git add server/src/modules/vocabulary/*`
  - `git commit -m "fix(backend): address code review findings"`

## Phase 2 — Frontend Code Review

### Task 2: Review Frontend Implementation

**Spec Reference:** `docs/vocabularies/specs/vocabularies-design/02-frontend.md`

**Files:**
- Review: `client/src/types/vocabularies.types.ts`
- Review: `client/src/services/vocabularies.service.ts`
- Review: `client/src/pages/vocabularies/composables/useVocabularies.ts`
- Review: `client/src/pages/vocabularies/VocabularyListPage.vue`
- Review: `client/src/pages/vocabularies/components/VocabularyTable.vue`
- Review: `client/src/pages/vocabularies/components/VocabularyFilter.vue`
- Review: `client/src/pages/vocabularies/VocabularyFormPage.vue`
- Review: `client/src/pages/vocabularies/components/VocabularyForm.vue`
- Review: `client/src/pages/vocabularies/components/TabInfo.vue`
- Review: `client/src/pages/vocabularies/components/TabAudit.vue`
- Review: `client/src/pages/vocabularies/components/TabAnalytics.vue`
- Review: `client/src/pages/vocabularies/components/VocabRelationSelect.vue`

- **Step 1:** Technical code review
  - Run: Review each file for:
    - Vue 3 Composition API best practices
    - TypeScript type safety
    - PrimeVue component usage
    - Reactive state management
    - Error handling and loading states
    - Form validation with Zod
    - Internationalization (i18n) usage
  - Expected: Review findings documented

- **Step 2:** Spec compliance review
  - Run: Compare implementation against `02-frontend.md`:
    - All screen items from Section 3 implemented
    - Validation rules from Section 3 enforced
    - Component tree matches Section 2.2
    - Wireframes match Section 2.3
    - Composable exports match Section 5
  - Expected: Spec compliance report

- **Step 3:** UI/UX review
  - Run: Manual testing in browser:
    - List page layout and responsiveness
    - Form validation error display
    - Tab navigation smoothness
    - Confirm dialogs behavior
    - Toast notifications
    - Loading states and skeletons
  - Expected: UI/UX feedback documented

- **Step 4:** Fix issues
  - Run: Address all findings from Steps 1-3
  - Expected: All issues resolved, code updated

- **Step 5: Commit**
  - `git add client/src/pages/vocabularies/** client/src/services/vocabularies.service.ts client/src/types/vocabularies.types.ts`
  - `git commit -m "fix(frontend): address code review findings"`

## Phase 3 — Backend Test Review

### Task 3: Review Backend Tests

**Spec Reference:** `docs/vocabularies/specs/vocabularies-design/04-quality.md — Section 1.1`

**Files:**
- Review: `server/src/modules/vocabulary/vocabulary.controller.test.ts`

- **Step 1:** Test coverage review
  - Run: Compare tests against `04-quality.md` test matrix:
    - UT-001 to UT-027 — all controller tests present
    - AUTH-001 to AUTH-005 — all authorization tests present
  - Expected: Coverage report showing 100% spec coverage

- **Step 2:** Test quality review
  - Run: Review test structure:
    - Proper Arrange-Act-Assert pattern
    - Database tests (not mocks) as per spec
    - Clear test descriptions
    - Proper cleanup between tests
    - Edge cases covered
  - Expected: Quality findings documented

- **Step 3:** Run tests and verify
  - Run: `cd server && npm run test:vitest vocabulary`
  - Expected: All 32 tests pass

- **Step 4:** Add missing tests
  - Run: Implement any missing tests from Steps 1-2
  - Expected: Complete test coverage

- **Step 5: Commit**
  - `git add server/src/modules/vocabulary/vocabulary.controller.test.ts`
  - `git commit -m "test(backend): add missing tests from review"`

## Phase 4 — Frontend Test Review

### Task 4: Review Frontend Tests

**Spec Reference:** `docs/vocabularies/specs/vocabularies-design/04-quality.md — Section 1.2`

**Files:**
- Review: `client/src/pages/vocabularies/VocabularyListPage.test.ts`
- Review: `client/src/pages/vocabularies/VocabularyFormPage.test.ts`
- Review: `client/src/pages/vocabularies/composables/useVocabularies.test.ts`

- **Step 1:** Test coverage review
  - Run: Compare tests against `04-quality.md` test matrix:
    - FE-UT-001 to FE-UT-075 — all component tests present
    - COMP-UT-001 to COMP-UT-008 — all composable tests present
  - Expected: Coverage report showing 100% spec coverage

- **Step 2:** Test quality review
  - Run: Review test structure:
    - Proper Arrange-Act-Assert pattern
    - Component mounting with proper mocks
    - User interaction simulation
    - Async handling
    - Edge cases covered
  - Expected: Quality findings documented

- **Step 3:** Run tests and verify
  - Run: `cd client && npm run test:unit vocabularies`
  - Expected: All 83 tests pass

- **Step 4:** Add missing tests
  - Run: Implement any missing tests from Steps 1-2
  - Expected: Complete test coverage

- **Step 5: Commit**
  - `git add client/src/pages/vocabularies/*.test.ts client/src/pages/vocabularies/composables/useVocabularies.test.ts`
  - `git commit -m "test(frontend): add missing tests from review"`

## Phase 5 — Integration Test Review

### Task 5: Review E2E Tests

**Spec Reference:** `docs/vocabularies/specs/vocabularies-design/04-quality.md — Section 1.3`

**Files:**
- Review: `client/e2e/vocabularies-operations.spec.ts` (if exists)

- **Step 1:** E2E test coverage review
  - Run: Check for integration tests covering:
    - Full CRUD workflow
    - Filter and pagination
    - Form validation
    - Tab navigation
    - Error scenarios
  - Expected: E2E coverage report

- **Step 2:** Run E2E tests
  - Run: `cd client && npm run test:e2e vocabularies`
  - Expected: All E2E tests pass

- **Step 3:** Add missing E2E tests
  - Run: Implement integration tests for critical paths
  - Expected: E2E tests covering main user journeys

- **Step 4: Commit**
  - `git add client/e2e/vocabularies-operations.spec.ts`
  - `git commit -m "test(e2e): add vocabulary integration tests"`

## Phase 6 — Final Verification

### Task 6: Build & Test Verification

**Spec Reference:** All spec files

**Files:**
- All vocabulary-related files

- **Step 1:** Full build verification
  - Run: `cd server && npm run build`
  - Run: `cd client && npm run build`
  - Expected: Both builds succeed with no errors

- **Step 2:** Full test suite
  - Run: `cd server && npm run test:vitest`
  - Run: `cd client && npm run test:unit`
  - Expected: All tests pass (backend + frontend)

- **Step 3:** Manual smoke test
  - Run: Start both servers and test in browser:
    - Navigate to /vocabularies
    - Create new vocabulary
    - Edit existing vocabulary
    - Delete vocabulary
    - Test filters and pagination
    - Test all 3 tabs
  - Expected: All features work correctly

- **Step 4:** Documentation update
  - Run: Update changelog in `docs/vocabularies/specs/vocabularies-design/00-index.md`
  - Expected: Changelog updated with version 1.1

- **Step 5: Commit**
  - `git add docs/vocabularies/specs/vocabularies-design/00-index.md`
  - `git commit -m "docs: update changelog after review"`

## Phase 7 — Performance & Security Review

### Task 7: Performance & Security Audit

**Spec Reference:** `docs/vocabularies/specs/vocabularies-design/04-quality.md — Sections 2-3`

**Files:**
- All vocabulary-related files

- **Step 1:** Performance review
  - Run: Review against performance targets:
    - Database indexes present and used
    - Query optimization (no N+1 queries)
    - Frontend lazy loading implemented
    - Debouncing on filter inputs
    - Pagination working correctly
  - Expected: Performance audit report

- **Step 2:** Security review
  - Run: Review against security checklist:
    - SQL injection prevention (parameterized queries)
    - XSS prevention (Vue auto-escaping)
    - Authorization checks on all endpoints
    - Mass assignment prevention (DTOs)
    - Input validation (Zod schemas)
    - Rate limiting configured
    - Soft delete filtering
  - Expected: Security audit report

- **Step 3:** Fix critical issues
  - Run: Address any critical performance or security findings
  - Expected: All critical issues resolved

- **Step 4: Commit**
  - `git add server/ client/`
  - `git commit -m "perf/security: address performance and security findings"`

## Phase 8 — Final Merge Preparation

### Task 8: Prepare for Merge

**Spec Reference:** N/A

**Files:**
- All vocabulary-related files

- **Step 1:** Git history cleanup
  - Run: Review git log for vocabulary commits
  - Expected: Clean commit history with meaningful messages

- **Step 2:** Conflict resolution
  - Run: Rebase on latest main branch
  - Expected: No merge conflicts

- **Step 3:** Final verification
  - Run: `npm run build` (both server and client)
  - Run: `npm test` (both server and client)
  - Expected: All builds and tests pass

- **Step 4:** Create PR/Merge request
  - Run: Create pull request with:
    - Description of changes
    - Link to spec documents
    - Test results summary
    - Screenshots (if applicable)
  - Expected: PR ready for review

- **Step 5: Commit**
  - `git commit --allow-empty -m "chore: vocabulary feature ready for merge"`
