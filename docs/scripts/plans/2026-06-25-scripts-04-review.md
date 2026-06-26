# Script Management — Phase 4: Review Tests + Review Code

> **For agentic workers:** REQUIRED SKILL: Use skill `executing-plans` to implement this plan.

## Phase 4 — Review Tests + Review Code

### Task 1: Run full backend test suite + verify build

**Spec Reference:** `docs/scripts/specs/scripts-design/04-quality.md — Section 1.1`

**Files:**
- No new files — verification only

- **Step 1:** Run full backend test suite:
  - Run: `cd server && npx vitest run`
  - Expected: All tests pass (existing projects tests + new scripts tests)

- **Step 2:** Verify backend TypeScript compiles:
  - Run: `cd server && npx tsc --noEmit`
  - Expected: No errors

- **Step 3:** Verify Prisma client is up to date:
  - Run: `cd server && npx prisma generate`
  - Expected: Prisma client generated, no drift

- **Step 4: Commit** (if any fixes were needed)
  - `git add -A && git commit -m "fix: backend review fixes"` (only if changes were needed)

---

### Task 2: Run full frontend test suite + verify build

**Spec Reference:** `docs/scripts/specs/scripts-design/04-quality.md — Section 1.2`

**Files:**
- No new files — verification only

- **Step 1:** Run full frontend test suite:
  - Run: `cd client && npx vitest run`
  - Expected: All tests pass (existing tests + new scripts tests)

- **Step 2:** Verify frontend TypeScript compiles:
  - Run: `cd client && npx vue-tsc -p tsconfig.app.json --noEmit`
  - Expected: No errors

- **Step 3:** Verify dev server starts:
  - Run: `cd client && npx vite build`
  - Expected: Build succeeds, no errors

- **Step 4: Commit** (if any fixes were needed)
  - `git add -A && git commit -m "fix: frontend review fixes"` (only if changes were needed)

---

### Task 3: Code review against spec

**Spec Reference:** `docs/scripts/specs/scripts-design/` (all files), `docs/projects/specs/projects-design/` (v1.01 updates)

**Files:**
- No new files — review only

- **Step 1:** Review backend code against spec:
  - Verify all 7 API endpoints (SV-001–SV-007) match spec Section 2
  - Verify Script Prisma model matches spec Section 1.1 (no `aiModel` field)
  - Verify validation rules match spec Section 3
  - Verify AI provider integration: `generateWithModel` + `getAvailableModels` per spec Section 4
  - Verify error handling codes match spec Section 5
  - Verify audit logging for CREATE/UPDATE/DELETE per spec Section 6
  - Verify Project model has `scripts Script[]` relation (CR-SCRIPT-001)

- **Step 2:** Review frontend code against spec:
  - Verify ScriptListPage matches spec Section 3.2 (all screen items)
  - Verify ScriptFormPage matches spec Section 3.3 (2-column layout, all form items)
  - Verify ScriptForm validation: `aiModel` required only for Generate, not Save
  - Verify ScriptContentViewer matches spec Section 3.3 items 18-21
  - Verify ProjectDetailPage has Card Script section per spec Section 3.1
  - Verify routes match spec Section 2.3
  - Verify store actions match spec Section 6 (no auto-reload on create/update, auto-reload on delete)
  - Verify i18n keys exist in all 3 locale files

- **Step 3:** Review test coverage against spec:
  - Verify all backend tests from 04-quality.md Section 1.1 are implemented
  - Verify all frontend tests from 04-quality.md Section 1.2 are implemented
  - Check for any missing test cases

- **Step 4:** Fix any discrepancies found in review:
  - Make necessary code changes to match spec
  - Re-run tests after fixes

- **Step 5: Commit** (if any fixes were needed)
  - `git add -A && git commit -m "fix: spec compliance review fixes"`

---

### Task 4: Final integration verification

**Spec Reference:** `docs/scripts/specs/scripts-design/00-index.md — Section 4 (Architecture Overview)`

**Files:**
- No new files — verification only

- **Step 1:** Start backend server and verify endpoints respond:
  - Run: `cd server && npm run dev`
  - Expected: Server starts without errors
  - Verify `GET /api/admin/ai-models` returns 401 without auth (endpoint exists)
  - Verify `GET /api/admin/scripts?projectId=1` returns 401 without auth (endpoint exists)

- **Step 2:** Start frontend dev server and verify pages load:
  - Run: `cd client && npm run dev`
  - Expected: Dev server starts
  - Navigate to `/projects/1` — verify Card Script section appears
  - Navigate to `/projects/1/scripts` — verify ScriptListPage loads
  - Navigate to `/projects/1/scripts/create` — verify ScriptFormPage loads with 2-column layout

- **Step 3:** Final commit with all changes:
  - `git add -A && git commit -m "feat: complete Script Management feature"`
  - Expected: All changes committed, working tree clean