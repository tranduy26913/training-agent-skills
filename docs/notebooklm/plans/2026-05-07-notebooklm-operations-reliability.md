# NotebookLM Operations and Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use skill executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement production-grade queue reliability and operations tooling: monitoring, retries, dead-letter handling, and operational auditability.

**Architecture:** Queue state remains in MySQL and is updated atomically by workers. Express exposes admin-only operations endpoints and aggregates metrics snapshots. Frontend operations pages provide filtering, step timeline, and controlled retry/purge actions.

**Tech Stack:** Node.js/Express/TypeScript/Vitest, Vue 3/Pinia/Vitest/Playwright, MySQL, Python 3.11 workers

---

## File Map

### Create

- `database/migrations/009_create_notebooklm_operations_tables.sql`
- `server/src/modules/notebooklm/operations.validation.ts`
- `server/src/modules/notebooklm/operations.repository.ts`
- `server/src/modules/notebooklm/operations.service.ts`
- `server/src/modules/notebooklm/operations.controller.ts`
- `server/src/modules/notebooklm/operations.routes.ts`
- `server/src/modules/notebooklm/operations.service.test.ts`
- `server/src/modules/notebooklm/operations.controller.test.ts`
- `client/src/services/notebooklm-operations.service.ts`
- `client/src/stores/notebooklm-operations.store.ts`
- `client/src/pages/notebooklm/operations/JobMonitorListPage.vue`
- `client/src/pages/notebooklm/operations/RetryRequestCreatePage.vue`
- `client/src/pages/notebooklm/operations/DlqItemEditPage.vue`
- `client/src/pages/notebooklm/operations/components/JobMonitorTable.vue`
- `client/src/pages/notebooklm/operations/components/JobMonitorFilters.vue`
- `client/src/pages/notebooklm/operations/components/JobStepViewer.vue`
- `client/src/pages/notebooklm/operations/operations.routes.ts`
- `python-services/tests/test_queue_retry_policy.py`
- `client/e2e/notebooklm-operations.spec.ts`

### Modify

- `server/src/app.ts`
- `python-services/workers/ingestion_worker.py`
- `python-services/workers/query_worker.py`
- `python-services/workers/delete_worker.py`
- `client/src/router/routes.ts`
- `client/src/locales/en.ts`
- `client/src/locales/vi.ts`
- `client/src/locales/ja.ts`

---

### Task 1: Create Operations Persistence Tables

**Files:**
- Create: `database/migrations/009_create_notebooklm_operations_tables.sql`

- [ ] **Step 1: Write the failing test**
Define migration assertions for missing `dead_letter_jobs`, `job_metrics_daily`, and required indexes.

- [ ] **Step 2: Run test to verify it fails**
Run: `cd server && npm run migrate`
Expected: FAIL before migration exists.

- [ ] **Step 3: Write minimal implementation**
Create migration with tables, FKs to `jobs` where applicable, and index strategy for status/date/type filters.

- [ ] **Step 4: Run test to verify it passes**
Run: `cd server && npm run migrate`
Expected: PASS with new operations tables.

- [ ] **Step 5: Commit**
Run: `git add database/migrations/009_create_notebooklm_operations_tables.sql && git commit -m "feat(db): add notebooklm operations tables"`

**Effort Total (hours):** 1.5

---

### Task 2: Implement Admin Operations Backend APIs

**Files:**
- Create: `server/src/modules/notebooklm/operations.validation.ts`
- Create: `server/src/modules/notebooklm/operations.repository.ts`
- Create: `server/src/modules/notebooklm/operations.service.ts`
- Create: `server/src/modules/notebooklm/operations.controller.ts`
- Create: `server/src/modules/notebooklm/operations.routes.ts`
- Test: `server/src/modules/notebooklm/operations.service.test.ts`
- Test: `server/src/modules/notebooklm/operations.controller.test.ts`
- Modify: `server/src/app.ts`

- [ ] **Step 1: Write the failing test**
Add tests for admin-only list jobs, get job detail with steps, retry failed/dead_letter job, list DLQ, and purge DLQ.

- [ ] **Step 2: Run test to verify it fails**
Run: `cd server && npx vitest run src/modules/notebooklm/operations.service.test.ts src/modules/notebooklm/operations.controller.test.ts`
Expected: FAIL because operations module is not implemented.

- [ ] **Step 3: Write minimal implementation**
Implement operations APIs with strict admin guard, status transition rules, and audit log insertions for retry/purge actions.

- [ ] **Step 4: Run test to verify it passes**
Run: `cd server && npx vitest run src/modules/notebooklm/operations.service.test.ts src/modules/notebooklm/operations.controller.test.ts`
Expected: PASS for authorization and transition behavior.

- [ ] **Step 5: Commit**
Run: `git add server/src/app.ts server/src/modules/notebooklm/operations* server/src/modules/notebooklm/*.test.ts && git commit -m "feat(server): add notebooklm operations admin APIs"`

**Effort Total (hours):** 4.5

---

### Task 3: Harden Worker Retry and Dead-Letter Policy

**Files:**
- Modify: `python-services/workers/ingestion_worker.py`
- Modify: `python-services/workers/query_worker.py`
- Modify: `python-services/workers/delete_worker.py`
- Create: `python-services/tests/test_queue_retry_policy.py`

- [ ] **Step 1: Write the failing test**
Add tests for retry backoff progression, max retry enforcement, DLQ insertion payload, and idempotent reprocessing guard.

- [ ] **Step 2: Run test to verify it fails**
Run: `cd python-services && pytest tests/test_queue_retry_policy.py -q`
Expected: FAIL before retry policy is fully implemented.

- [ ] **Step 3: Write minimal implementation**
Implement uniform retry policy helper shared by workers and enforce deterministic status transitions.

- [ ] **Step 4: Run test to verify it passes**
Run: `cd python-services && pytest tests/test_queue_retry_policy.py -q`
Expected: PASS for all retry and DLQ policy cases.

- [ ] **Step 5: Commit**
Run: `git add python-services/workers python-services/tests/test_queue_retry_policy.py && git commit -m "feat(worker): enforce notebooklm retry and dlq policy"`

**Effort Total (hours):** 3.5

---

### Task 4: Build Frontend Operations Monitoring UI

**Files:**
- Create: `client/src/services/notebooklm-operations.service.ts`
- Create: `client/src/stores/notebooklm-operations.store.ts`
- Create: `client/src/pages/notebooklm/operations/JobMonitorListPage.vue`
- Create: `client/src/pages/notebooklm/operations/RetryRequestCreatePage.vue`
- Create: `client/src/pages/notebooklm/operations/DlqItemEditPage.vue`
- Create: `client/src/pages/notebooklm/operations/components/JobMonitorTable.vue`
- Create: `client/src/pages/notebooklm/operations/components/JobMonitorFilters.vue`
- Create: `client/src/pages/notebooklm/operations/components/JobStepViewer.vue`
- Create: `client/src/pages/notebooklm/operations/operations.routes.ts`
- Modify: `client/src/router/routes.ts`
- Modify: `client/src/locales/en.ts`
- Modify: `client/src/locales/vi.ts`
- Modify: `client/src/locales/ja.ts`

- [ ] **Step 1: Write the failing test**
Add UI/store tests for job filtering, detail drawer step timeline, retry action, and purge confirmation flow.

- [ ] **Step 2: Run test to verify it fails**
Run: `cd client && npx vitest run src/pages/notebooklm/operations src/stores/notebooklm-operations.store.ts`
Expected: FAIL due to missing operations pages and store.

- [ ] **Step 3: Write minimal implementation**
Implement operations pages/components/store/service with admin-only routing and clear status visualizations.

- [ ] **Step 4: Run test to verify it passes**
Run: `cd client && npx vitest run src/pages/notebooklm/operations src/stores/notebooklm-operations.store.ts`
Expected: PASS for monitoring and action UX behaviors.

- [ ] **Step 5: Commit**
Run: `git add client/src/pages/notebooklm/operations client/src/services/notebooklm-operations.service.ts client/src/stores/notebooklm-operations.store.ts client/src/router/routes.ts client/src/locales && git commit -m "feat(client): add notebooklm operations monitoring UI"`

**Effort Total (hours):** 5

---

### Task 5: Add E2E for Retry and DLQ Operations

**Files:**
- Create: `client/e2e/notebooklm-operations.spec.ts`

- [ ] **Step 1: Write the failing test**
Create Playwright flow: force job failure fixture, verify failed status in monitor, execute retry, verify status transitions to processing/done, then test DLQ purge path.

- [ ] **Step 2: Run test to verify it fails**
Run: `cd client && npx playwright test e2e/notebooklm-operations.spec.ts`
Expected: FAIL before operations pages/APIs are fully integrated.

- [ ] **Step 3: Write minimal implementation**
Adjust test data fixtures and selectors to make failure/retry scenarios deterministic.

- [ ] **Step 4: Run test to verify it passes**
Run: `cd client && npx playwright test e2e/notebooklm-operations.spec.ts`
Expected: PASS with reliable retry and DLQ coverage.

- [ ] **Step 5: Commit**
Run: `git add client/e2e/notebooklm-operations.spec.ts && git commit -m "test(e2e): add notebooklm operations reliability flow"`

**Effort Total (hours):** 3

---

### Task 6: Full Reliability Verification Gate

**Files:**
- Modify: none (verification only)

- [ ] **Step 1: Write the failing test**
Define final reliability gate command set including fault-injection test and admin operations tests.

- [ ] **Step 2: Run test to verify it fails**
Run: `cd server && npm test && cd ../client && npm test && cd ../python-services && pytest -q`
Expected: FAIL if any reliability regression exists.

- [ ] **Step 3: Write minimal implementation**
Fix only defects exposed by gate; avoid scope expansion beyond operations reliability.

- [ ] **Step 4: Run test to verify it passes**
Run:
- `cd server && npm test`
- `cd client && npm test`
- `cd client && npx playwright test e2e/notebooklm-operations.spec.ts`
- `cd python-services && pytest -q`
Expected: PASS all checks.

- [ ] **Step 5: Commit**
Run: `git add -A && git commit -m "chore: finalize notebooklm operations reliability implementation"`

**Effort Total (hours):** 2
