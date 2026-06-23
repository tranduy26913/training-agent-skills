# Project Management — Review Plan
> **For agentic workers:** REQUIRED SKILL: Use skill `executing-plans` to implement this plan.

## Plan Structure

## Phase 4 — Review

### Task 4.1 — Review backend tests

**Spec Reference:** `docs/projects/specs/projects-design/04-quality.md — Section 1.1`

**Files:**
- Review: `server/src/modules/admin/projects/projects.controller.test.ts`

- **Step 1:** Run backend tests and verify all pass:
  - `cd server && npx vitest run src/modules/admin/projects/projects.controller.test.ts`
  - Expected: all integration + authorization tests pass (17+ test cases)

- **Step 2:** Review test coverage against spec:
  - Verify all 15 integration test cases from spec are covered
  - Verify all 4 authorization test cases from spec are covered
  - Verify edge cases: soft-deleted project returns 404, already-deleted returns 404

- **Step 3:** If any tests missing or failing, fix and re-run

### Task 4.2 — Review frontend tests

**Spec Reference:** `docs/projects/specs/projects-design/04-quality.md — Section 1.2`

**Files:**
- Review: `client/src/pages/projects/` (all test files)

- **Step 1:** Run frontend tests and verify all pass:
  - `cd client && npx vitest run src/pages/projects/`
  - Expected: all tests pass

- **Step 2:** Review test coverage against spec:
  - Verify ProjectListPage: 10 test cases
  - Verify ProjectDetailPage: 5 test cases
  - Verify ProjectCard: 8 test cases
  - Verify ProjectFormDialog: 13 test cases
  - Verify ProjectDeleteDialog: 3 test cases
  - Verify useProjects: 4 test cases
  - Verify projects.store: 8 test cases

- **Step 3:** If any tests missing or failing, fix and re-run

### Task 4.3 — Review code quality

**Spec Reference:** `docs/projects/specs/projects-design/00-index.md` (full spec)

- **Step 1:** Verify backend implementation matches spec:
  - All 5 API endpoints exist (SV-001 to SV-005)
  - Soft delete logic: isDeleted flag, not physical delete
  - Validation rules match spec (name min 2 max 200, description max 2000, prompt max 10000)
  - OwnerId auto-assigned from authenticated user
  - Response format matches spec ({ data: ... })

- **Step 2:** Verify frontend implementation matches spec:
  - ProjectListPage: card grid layout, no pagination, no filters
  - ProjectFormDialog: modal for create/edit, not separate pages
  - ProjectDeleteDialog: confirm dialog with project name
  - ProjectDetailPage: read-only display, back navigation
  - Sidebar menu item "Quản lý Project" visible for admin only

- **Step 3:** Verify build succeeds:
  - `cd client && npx vue-tsc --noEmit` (or `npx tsc --noEmit`)
  - `cd server && npx tsc --noEmit`
  - Expected: no type errors

- **Step 4:** Commit any final fixes
  - `git add -A`
  - `git commit -m "chore(projects): review and fix issues"`
