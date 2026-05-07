# NotebookLM Chat and Retrieval Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use skill executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver queue-driven chat sessions with retrieval-augmented answers and source citation grounded in workspace-scoped indexed documents.

**Architecture:** Frontend creates chat sessions and sends questions through Express APIs. Express stores user messages and enqueues QUERY jobs. Python worker consumes QUERY jobs, performs embedding + retrieval + Ollama generation, and writes assistant responses with citations back to MySQL.

**Tech Stack:** Node.js/Express/TypeScript/Vitest, Vue 3/Pinia/Vitest/Playwright, MySQL, Python 3.11 worker, Ollama, Vector DB

---

## File Map

### Create

- `database/migrations/008_create_notebooklm_chat_tables.sql`
- `server/src/modules/notebooklm/chat.validation.ts`
- `server/src/modules/notebooklm/chat.repository.ts`
- `server/src/modules/notebooklm/chat.service.ts`
- `server/src/modules/notebooklm/chat.controller.ts`
- `server/src/modules/notebooklm/chat.routes.ts`
- `server/src/modules/notebooklm/chat.service.test.ts`
- `server/src/modules/notebooklm/chat.controller.test.ts`
- `client/src/services/notebooklm-chat.service.ts`
- `client/src/stores/notebooklm-chat.store.ts`
- `client/src/pages/notebooklm/chat/ChatSessionListPage.vue`
- `client/src/pages/notebooklm/chat/ChatSessionCreatePage.vue`
- `client/src/pages/notebooklm/chat/ChatSessionEditPage.vue`
- `client/src/pages/notebooklm/chat/components/ChatPanel.vue`
- `client/src/pages/notebooklm/chat/components/ChatMessageBubble.vue`
- `client/src/pages/notebooklm/chat/components/RetrievalSourceViewer.vue`
- `client/src/pages/notebooklm/chat/chat.routes.ts`
- `python-services/workers/query_worker.py`
- `python-services/tests/test_query_worker.py`
- `client/e2e/notebooklm-chat-retrieval.spec.ts`

### Modify

- `server/src/app.ts`
- `client/src/router/routes.ts`
- `client/src/types/notebooklm.types.ts`
- `client/src/locales/en.ts`
- `client/src/locales/vi.ts`
- `client/src/locales/ja.ts`

---

### Task 1: Create Chat Session and Message Schema

**Files:**
- Create: `database/migrations/008_create_notebooklm_chat_tables.sql`

- [ ] **Step 1: Write the failing test**
Prepare schema assertions for missing `chat_sessions` and `chat_messages` tables and required indexes.

- [ ] **Step 2: Run test to verify it fails**
Run: `cd server && npm run migrate`
Expected: FAIL because migration file is not present yet.

- [ ] **Step 3: Write minimal implementation**
Add migration for `chat_sessions`, `chat_messages`, and foreign keys to `workspaces`, `users`, and `jobs`.

- [ ] **Step 4: Run test to verify it passes**
Run: `cd server && npm run migrate`
Expected: PASS with new chat schema applied.

- [ ] **Step 5: Commit**
Run: `git add database/migrations/008_create_notebooklm_chat_tables.sql && git commit -m "feat(db): add notebooklm chat session schema"`

**Effort Total (hours):** 1.5

---

### Task 2: Implement Backend Chat APIs and QUERY Job Enqueue

**Files:**
- Create: `server/src/modules/notebooklm/chat.validation.ts`
- Create: `server/src/modules/notebooklm/chat.repository.ts`
- Create: `server/src/modules/notebooklm/chat.service.ts`
- Create: `server/src/modules/notebooklm/chat.controller.ts`
- Create: `server/src/modules/notebooklm/chat.routes.ts`
- Test: `server/src/modules/notebooklm/chat.service.test.ts`
- Test: `server/src/modules/notebooklm/chat.controller.test.ts`
- Modify: `server/src/app.ts`

- [ ] **Step 1: Write the failing test**
Add tests for create session, list sessions, post message (creates QUERY job), list message history, and workspace access denial.

- [ ] **Step 2: Run test to verify it fails**
Run: `cd server && npx vitest run src/modules/notebooklm/chat.service.test.ts src/modules/notebooklm/chat.controller.test.ts`
Expected: FAIL due to missing chat module files.

- [ ] **Step 3: Write minimal implementation**
Implement controller/service/repository with strict workspace membership checks and queue insert for QUERY jobs plus initial `job_steps` rows.

- [ ] **Step 4: Run test to verify it passes**
Run: `cd server && npx vitest run src/modules/notebooklm/chat.service.test.ts src/modules/notebooklm/chat.controller.test.ts`
Expected: PASS for all success and auth/error cases.

- [ ] **Step 5: Commit**
Run: `git add server/src/app.ts server/src/modules/notebooklm/chat* server/src/modules/notebooklm/*.test.ts && git commit -m "feat(server): add notebooklm chat query producer APIs"`

**Effort Total (hours):** 5

---

### Task 3: Implement Python QUERY Worker with RAG + Citations

**Files:**
- Create: `python-services/workers/query_worker.py`
- Test: `python-services/tests/test_query_worker.py`

- [ ] **Step 1: Write the failing test**
Add tests for QUERY job lifecycle: embedding called, vector search filtered by workspace, prompt built with chunks, assistant message persisted with `sources` JSON.

- [ ] **Step 2: Run test to verify it fails**
Run: `cd python-services && pytest tests/test_query_worker.py -q`
Expected: FAIL because query worker is not implemented.

- [ ] **Step 3: Write minimal implementation**
Implement worker processing for QUERY jobs, retries, DLQ handoff, and deterministic citation format containing `document_id`, `filename`, and snippet.

- [ ] **Step 4: Run test to verify it passes**
Run: `cd python-services && pytest tests/test_query_worker.py -q`
Expected: PASS for happy path and failure/retry transitions.

- [ ] **Step 5: Commit**
Run: `git add python-services/workers/query_worker.py python-services/tests/test_query_worker.py && git commit -m "feat(worker): add notebooklm query rag worker"`

**Effort Total (hours):** 6

---

### Task 4: Build Frontend Chat Session and Conversation Experience

**Files:**
- Create: `client/src/services/notebooklm-chat.service.ts`
- Create: `client/src/stores/notebooklm-chat.store.ts`
- Create: `client/src/pages/notebooklm/chat/ChatSessionListPage.vue`
- Create: `client/src/pages/notebooklm/chat/ChatSessionCreatePage.vue`
- Create: `client/src/pages/notebooklm/chat/ChatSessionEditPage.vue`
- Create: `client/src/pages/notebooklm/chat/components/ChatPanel.vue`
- Create: `client/src/pages/notebooklm/chat/components/ChatMessageBubble.vue`
- Create: `client/src/pages/notebooklm/chat/components/RetrievalSourceViewer.vue`
- Create: `client/src/pages/notebooklm/chat/chat.routes.ts`
- Modify: `client/src/router/routes.ts`
- Modify: `client/src/types/notebooklm.types.ts`
- Modify: `client/src/locales/en.ts`
- Modify: `client/src/locales/vi.ts`
- Modify: `client/src/locales/ja.ts`

- [ ] **Step 1: Write the failing test**
Add component and store tests for: create session, send question, job pending indicator, done state rendering, and citation accordion behavior.

- [ ] **Step 2: Run test to verify it fails**
Run: `cd client && npx vitest run src/pages/notebooklm/chat src/stores/notebooklm-chat.store.ts`
Expected: FAIL because chat pages/store/service do not exist.

- [ ] **Step 3: Write minimal implementation**
Implement chat pages/components/store/service and consume job progress stream for QUERY jobs.

- [ ] **Step 4: Run test to verify it passes**
Run: `cd client && npx vitest run src/pages/notebooklm/chat src/stores/notebooklm-chat.store.ts`
Expected: PASS for message flow, pending states, and citation display.

- [ ] **Step 5: Commit**
Run: `git add client/src/pages/notebooklm/chat client/src/services/notebooklm-chat.service.ts client/src/stores/notebooklm-chat.store.ts client/src/router/routes.ts client/src/types/notebooklm.types.ts client/src/locales && git commit -m "feat(client): add notebooklm chat retrieval UI"`

**Effort Total (hours):** 7

---

### Task 5: Add E2E for Chat Grounded Answers

**Files:**
- Create: `client/e2e/notebooklm-chat-retrieval.spec.ts`

- [ ] **Step 1: Write the failing test**
Implement Playwright scenario: open workspace with indexed docs, ask question, wait for completion, assert answer text and at least one citation source.

- [ ] **Step 2: Run test to verify it fails**
Run: `cd client && npx playwright test e2e/notebooklm-chat-retrieval.spec.ts`
Expected: FAIL before full backend/worker wiring is complete.

- [ ] **Step 3: Write minimal implementation**
Stabilize selectors and fixture data only for deterministic assertions.

- [ ] **Step 4: Run test to verify it passes**
Run: `cd client && npx playwright test e2e/notebooklm-chat-retrieval.spec.ts`
Expected: PASS with stable grounded response verification.

- [ ] **Step 5: Commit**
Run: `git add client/e2e/notebooklm-chat-retrieval.spec.ts && git commit -m "test(e2e): add notebooklm chat retrieval flow"`

**Effort Total (hours):** 3

---

### Task 6: Cross-Module Regression and Release Gate

**Files:**
- Modify: none (verification only)

- [ ] **Step 1: Write the failing test**
Define end-state verification commands covering API tests, UI tests, worker tests, and targeted e2e.

- [ ] **Step 2: Run test to verify it fails**
Run: `cd server && npm test && cd ../client && npm test && cd ../python-services && pytest -q`
Expected: FAIL if any chat/retrieval integration mismatch remains.

- [ ] **Step 3: Write minimal implementation**
Apply minimal fixes for broken contracts only (DTO, status values, source payload shape).

- [ ] **Step 4: Run test to verify it passes**
Run:
- `cd server && npm test`
- `cd client && npm test`
- `cd client && npx playwright test e2e/notebooklm-chat-retrieval.spec.ts`
- `cd python-services && pytest -q`
Expected: PASS all.

- [ ] **Step 5: Commit**
Run: `git add -A && git commit -m "chore: finalize notebooklm chat retrieval implementation"`

**Effort Total (hours):** 2.5
