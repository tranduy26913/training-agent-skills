# NotebookLM Workspace and Ingestion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use skill executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement workspace, membership, document upload, and fully queue-driven ingestion with MySQL BLOB storage and Python worker processing.

**Architecture:** Express module handles authentication, authorization, validation, and job creation only. All ingestion/delete processing runs in Python worker consuming MySQL queue rows. Frontend renders workspace/document management and tracks job progress through SSE fallback polling.

**Tech Stack:** Node.js/Express/TypeScript/Zod/Vitest, Vue 3/Pinia/Vitest/Playwright, MySQL, Python 3.11 worker, Ollama integration hooks

---

## File Map

### Create

- `database/migrations/007_create_notebooklm_workspace_ingestion.sql`
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
- `client/src/pages/notebooklm/workspace/WorkspaceListPage.vue`
- `client/src/pages/notebooklm/workspace/WorkspaceCreatePage.vue`
- `client/src/pages/notebooklm/workspace/WorkspaceEditPage.vue`
- `client/src/pages/notebooklm/workspace/components/WorkspaceForm.vue`
- `client/src/pages/notebooklm/workspace/components/WorkspaceTable.vue`
- `client/src/pages/notebooklm/workspace/components/DocumentIngestionViewer.vue`
- `client/src/pages/notebooklm/workspace/workspace.routes.ts`
- `python-services/workers/ingestion_worker.py`
- `python-services/workers/delete_worker.py`
- `python-services/tests/test_ingestion_worker.py`
- `python-services/tests/test_delete_worker.py`

### Modify

- `server/src/models/index.ts`
- `server/src/app.ts`
- `client/src/router/routes.ts`
- `client/src/locales/en.ts`
- `client/src/locales/vi.ts`
- `client/src/locales/ja.ts`

---

### Task 1: Create Database Schema for Workspace + Queue

**Files:**
- Create: `database/migrations/007_create_notebooklm_workspace_ingestion.sql`
- Test: SQL verification via migration runner

- [ ] **Step 1: Write the failing test**
Add migration validation test in SQL form: verify missing tables before migration (`workspaces`, `workspace_members`, `documents`, `chunks`, `jobs`, `job_steps`).

- [ ] **Step 2: Run test to verify it fails**
Run: `cd server && npm run migrate`
Expected: FAIL on missing migration file or missing table checks.

- [ ] **Step 3: Write minimal implementation**
Create migration with tables, foreign keys, indexes on `workspace_id`, `status`, `type`, and constraints for role/status enums.

- [ ] **Step 4: Run test to verify it passes**
Run: `cd server && npm run migrate`
Expected: PASS, migration applied without SQL errors.

- [ ] **Step 5: Commit**
Run: `git add database/migrations/007_create_notebooklm_workspace_ingestion.sql && git commit -m "feat(db): add notebooklm workspace ingestion schema"`

**Effort Total (hours):** 2

---

### Task 2: Implement Backend Workspace/Document Job Producer Module

**Files:**
- Create: `server/src/models/notebooklm.model.ts`
- Create: `server/src/modules/notebooklm/notebooklm.validation.ts`
- Create: `server/src/modules/notebooklm/notebooklm.repository.ts`
- Create: `server/src/modules/notebooklm/notebooklm.service.ts`
- Create: `server/src/modules/notebooklm/notebooklm.controller.ts`
- Create: `server/src/modules/notebooklm/notebooklm.routes.ts`
- Test: `server/src/modules/notebooklm/notebooklm.service.test.ts`
- Test: `server/src/modules/notebooklm/notebooklm.controller.test.ts`
- Modify: `server/src/models/index.ts`
- Modify: `server/src/app.ts`

- [ ] **Step 1: Write the failing test**
Add service/controller tests for: create workspace, add member, upload document (202 + job id), delete document (202 + job id), role checks (`viewer` forbidden for upload/delete).

- [ ] **Step 2: Run test to verify it fails**
Run: `cd server && npx vitest run src/modules/notebooklm/notebooklm.service.test.ts src/modules/notebooklm/notebooklm.controller.test.ts`
Expected: FAIL because notebooklm module does not exist.

- [ ] **Step 3: Write minimal implementation**
Implement repository + service + controller + routes. Persist uploaded file into `documents.file_data` and insert queue rows in `jobs` and `job_steps` only.

- [ ] **Step 4: Run test to verify it passes**
Run: `cd server && npx vitest run src/modules/notebooklm/notebooklm.service.test.ts src/modules/notebooklm/notebooklm.controller.test.ts`
Expected: PASS for success and authorization/error mapping cases.

- [ ] **Step 5: Commit**
Run: `git add server/src/models/index.ts server/src/models/notebooklm.model.ts server/src/app.ts server/src/modules/notebooklm && git commit -m "feat(server): add notebooklm workspace and ingestion job producer APIs"`

**Effort Total (hours):** 6

---

### Task 3: Implement Python Queue Workers for INGEST and DELETE_DOC

**Files:**
- Create: `python-services/workers/ingestion_worker.py`
- Create: `python-services/workers/delete_worker.py`
- Test: `python-services/tests/test_ingestion_worker.py`
- Test: `python-services/tests/test_delete_worker.py`

- [ ] **Step 1: Write the failing test**
Add worker tests that simulate pending jobs in MySQL and assert step transitions (`parse`, `chunk`, `embed`, `index`) and delete flow (`vector delete`, `chunks delete`, `documents.status update`).

- [ ] **Step 2: Run test to verify it fails**
Run: `cd python-services && pytest tests/test_ingestion_worker.py tests/test_delete_worker.py -q`
Expected: FAIL because worker files are missing.

- [ ] **Step 3: Write minimal implementation**
Implement polling worker loop with transactional lock (`SELECT ... FOR UPDATE`), retry increment, dead-letter transition on max retries, and heartbeat update.

- [ ] **Step 4: Run test to verify it passes**
Run: `cd python-services && pytest tests/test_ingestion_worker.py tests/test_delete_worker.py -q`
Expected: PASS for happy path and retry/DLQ scenarios.

- [ ] **Step 5: Commit**
Run: `git add python-services/workers python-services/tests && git commit -m "feat(worker): add queue-driven notebooklm ingestion and delete workers"`

**Effort Total (hours):** 8

---

### Task 4: Implement Frontend Workspace + Upload + Job Progress UI

**Files:**
- Create: `client/src/types/notebooklm.types.ts`
- Create: `client/src/services/notebooklm-workspace.service.ts`
- Create: `client/src/stores/notebooklm-workspace.store.ts`
- Create: `client/src/pages/notebooklm/workspace/WorkspaceListPage.vue`
- Create: `client/src/pages/notebooklm/workspace/WorkspaceCreatePage.vue`
- Create: `client/src/pages/notebooklm/workspace/WorkspaceEditPage.vue`
- Create: `client/src/pages/notebooklm/workspace/components/WorkspaceForm.vue`
- Create: `client/src/pages/notebooklm/workspace/components/WorkspaceTable.vue`
- Create: `client/src/pages/notebooklm/workspace/components/DocumentIngestionViewer.vue`
- Create: `client/src/pages/notebooklm/workspace/workspace.routes.ts`
- Modify: `client/src/router/routes.ts`
- Modify: `client/src/locales/en.ts`
- Modify: `client/src/locales/vi.ts`
- Modify: `client/src/locales/ja.ts`

- [ ] **Step 1: Write the failing test**
Add component/store tests for: list workspace render, upload validation (type + 100MB), enqueue feedback, progress update rendering, and role-based action visibility.

- [ ] **Step 2: Run test to verify it fails**
Run: `cd client && npx vitest run src/pages/notebooklm/workspace src/stores/notebooklm-workspace.store.ts`
Expected: FAIL due to missing pages/store/service.

- [ ] **Step 3: Write minimal implementation**
Implement pages/components/store/service with route integration and SSE fallback polling hooks for job status updates.

- [ ] **Step 4: Run test to verify it passes**
Run: `cd client && npx vitest run src/pages/notebooklm/workspace src/stores/notebooklm-workspace.store.ts`
Expected: PASS for upload, listing, and progress tracking behaviors.

- [ ] **Step 5: Commit**
Run: `git add client/src/pages/notebooklm client/src/services/notebooklm-workspace.service.ts client/src/stores/notebooklm-workspace.store.ts client/src/types/notebooklm.types.ts client/src/router/routes.ts client/src/locales && git commit -m "feat(client): add notebooklm workspace and ingestion UI"`

**Effort Total (hours):** 8

---

### Task 5: Add End-to-End Verification for Workspace Ingestion

**Files:**
- Create: `client/e2e/notebooklm-workspace-ingestion.spec.ts`
- Modify: `client/e2e/fixtures.ts`

- [ ] **Step 1: Write the failing test**
Create Playwright flow: login admin -> create workspace -> upload valid file -> observe processing -> observe indexed state -> delete document -> verify removed from list.

- [ ] **Step 2: Run test to verify it fails**
Run: `cd client && npx playwright test e2e/notebooklm-workspace-ingestion.spec.ts`
Expected: FAIL because feature routes and APIs are not yet fully wired.

- [ ] **Step 3: Write minimal implementation**
Adjust fixtures and selectors only as needed to match implemented UI and stable data-test ids.

- [ ] **Step 4: Run test to verify it passes**
Run: `cd client && npx playwright test e2e/notebooklm-workspace-ingestion.spec.ts`
Expected: PASS and deterministic status transitions.

- [ ] **Step 5: Commit**
Run: `git add client/e2e/notebooklm-workspace-ingestion.spec.ts client/e2e/fixtures.ts && git commit -m "test(e2e): cover notebooklm workspace ingestion flow"`

**Effort Total (hours):** 4

---

### Task 6: Final Verification and Integration Gate

**Files:**
- Modify: none (verification only)

- [ ] **Step 1: Write the failing test**
Define release gate checklist as executable commands for backend, frontend, worker, migration, and e2e.

- [ ] **Step 2: Run test to verify it fails**
Run: `cd server && npm test && cd ../client && npm test && cd ../python-services && pytest -q`
Expected: FAIL if any module has uncovered regressions.

- [ ] **Step 3: Write minimal implementation**
Fix only defects found by tests. Do not refactor outside notebooklm scope.

- [ ] **Step 4: Run test to verify it passes**
Run:
- `cd server && npm test`
- `cd client && npm test`
- `cd client && npx playwright test e2e/notebooklm-workspace-ingestion.spec.ts`
- `cd python-services && pytest -q`
Expected: PASS all suites.

- [ ] **Step 5: Commit**
Run: `git add -A && git commit -m "chore: finalize notebooklm workspace ingestion implementation"`

**Effort Total (hours):** 3
