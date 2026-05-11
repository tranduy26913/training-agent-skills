# NotebookLM Chat Provider Selection Implementation Plan
> **For agentic workers:** REQUIRED SUB-SKILL: Use skill executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.
**Goal:** Add a per-session NotebookLM chat provider selector and route QUERY jobs through Ollama, mock server, or Gemini.
**Architecture:** Keep the chat session as the source of truth for provider choice, persist that provider in the server and job payload, and let the Python worker dispatch through a small provider abstraction. On the client, surface the choice in the chat session form with PrimeVue and keep the optimistic chat flow unchanged.
**Tech Stack:** Express.js + TypeScript + Zod + MySQL, Vue 3 + Pinia + PrimeVue + Vitest + Playwright, Python 3.11 + pytest + google-genai.

---

## File Structure

| Area | Files | Responsibility |
|------|-------|----------------|
| Server contract | `server/src/modules/notebooklm/chat.validation.ts`, `chat.repository.ts`, `chat.service.ts`, `chat.controller.ts`, `server/src/models/notebooklm.model.ts` | Add the provider enum, persist it on sessions, and snapshot it into QUERY jobs. |
| Database | `database/migrations/010_add_chat_session_llm_provider.sql`, `database/schema.sql` | Add the `llm_provider` session column and keep schema docs in sync. |
| Python worker | `python-services/workers/llm_provider.py`, `python-services/workers/query_worker.py` | Dispatch Ollama, mock, or Gemini generation through a provider abstraction. |
| Python deps/tests | `python-services/requirements.txt`, `python-services/tests/test_llm_provider.py`, `python-services/tests/test_query_worker.py` | Add `google-genai` and lock the provider behavior with unit tests. |
| Client types/API/store | `client/src/types/notebooklm.types.ts`, `client/src/services/notebooklm-chat.service.ts`, `client/src/stores/notebooklm-chat.store.ts` | Carry the provider field through API mapping and state. |
| Client UI | `client/src/pages/notebooklm/chat/ChatSessionCreatePage.vue`, `ChatSessionEditPage.vue`, `ChatSessionListPage.vue`, `client/src/pages/notebooklm/chat/components/ChatSessionForm.vue` | Add the provider dropdown and show the active provider in the chat workflow. |
| Client tests | `client/src/pages/notebooklm/chat/components/__tests__/ChatSessionForm.test.ts`, `client/src/stores/__tests__/notebooklm-chat.store.test.ts` | Verify the dropdown, validation, and state wiring. |
| E2E | `client/e2e/notebooklm-chat-retrieval.spec.ts`, `client/e2e/pages/chat-page.ts` | Cover the provider dropdown and a deterministic mock-server path. |

---

### Task 1: Persist the session provider on the server

**Files:**
- Modify: `database/migrations/010_add_chat_session_llm_provider.sql`
- Modify: `database/schema.sql`
- Modify: `server/src/modules/notebooklm/chat.validation.ts`
- Modify: `server/src/modules/notebooklm/chat.repository.ts`
- Modify: `server/src/modules/notebooklm/chat.service.ts`
- Modify: `server/src/modules/notebooklm/chat.controller.ts`
- Modify: `server/src/models/notebooklm.model.ts`
- Test: `server/src/modules/notebooklm/chat.service.test.ts`
- Test: `server/src/modules/notebooklm/chat.controller.test.ts`

- [ ] **Step 1: Write the failing server tests**

  Add cases for defaulting a new session to `ollama`, rejecting an unsupported provider, updating an existing session provider, and snapshotting the provider into the QUERY job payload.

- [ ] **Step 2: Run the server slice tests and confirm they fail**

  Run: `cd server && npm test -- src/modules/notebooklm/chat.service.test.ts src/modules/notebooklm/chat.controller.test.ts`

  Expected: Failures showing missing `llmProvider` handling in validation, repository persistence, or job payload assertions.

- [ ] **Step 3: Implement the server contract changes**

  Add the provider enum, persist it on `chat_sessions`, expose it in session responses, validate it on create/update, and include it in the QUERY job payload.

- [ ] **Step 4: Re-run the same tests plus a build check**

  Run: `cd server && npm test -- src/modules/notebooklm/chat.service.test.ts src/modules/notebooklm/chat.controller.test.ts`

  Expected: Both test files pass.

  Run: `cd server && npm run build`

  Expected: TypeScript compilation succeeds.

- [ ] **Step 5: Commit the server slice**

  Commit after the server tests and build are green.

**Effort Total (hours):** 4

---

### Task 2: Add Python provider routing for Ollama, mock, and Gemini

**Files:**
- Create: `python-services/workers/llm_provider.py`
- Modify: `python-services/workers/query_worker.py`
- Modify: `python-services/requirements.txt`
- Create: `python-services/tests/test_llm_provider.py`
- Modify: `python-services/tests/test_query_worker.py`

- [ ] **Step 1: Write the failing provider tests**

  Cover provider factory selection, Ollama request generation, Gemini dispatch, and error handling for an unsupported provider.

- [ ] **Step 2: Run the Python worker tests and confirm they fail**

  Run: `cd python-services && python -m pytest tests/test_llm_provider.py tests/test_query_worker.py -v`

  Expected: Failures from the missing provider module or outdated Ollama-only assumptions.

- [ ] **Step 3: Implement the provider abstraction and Gemini dependency**

  Add a small provider interface, keep Ollama/mock on the existing HTTP shape, route Gemini through `google-genai`, and update `requirements.txt` for the new dependency.

- [ ] **Step 4: Re-run the targeted Python tests and then the full worker suite**

  Run: `cd python-services && python -m pytest tests/test_llm_provider.py tests/test_query_worker.py -v`

  Expected: The targeted provider tests pass.

  Run: `cd python-services && python -m pytest tests/ -v`

  Expected: The full worker suite passes.

- [ ] **Step 5: Commit the Python slice**

  Commit after the provider tests and full worker suite are green.

**Effort Total (hours):** 4

---

### Task 3: Add the provider dropdown to the client chat flow

**Files:**
- Modify: `client/src/types/notebooklm.types.ts`
- Modify: `client/src/services/notebooklm-chat.service.ts`
- Modify: `client/src/stores/notebooklm-chat.store.ts`
- Create: `client/src/pages/notebooklm/chat/components/ChatSessionForm.vue`
- Modify: `client/src/pages/notebooklm/chat/ChatSessionCreatePage.vue`
- Modify: `client/src/pages/notebooklm/chat/ChatSessionEditPage.vue`
- Modify: `client/src/pages/notebooklm/chat/ChatSessionListPage.vue`
- Create: `client/src/pages/notebooklm/chat/components/__tests__/ChatSessionForm.test.ts`
- Create: `client/src/stores/__tests__/notebooklm-chat.store.test.ts`

- [ ] **Step 1: Write the failing Vue and store tests**

  Add checks for the provider dropdown defaulting to `ollama`, rejecting invalid values, mapping `llm_provider` in API responses, and preserving the selected provider when creating or editing a session.

- [ ] **Step 2: Run the client unit tests and confirm they fail**

  Run: `cd client && npm run test:unit -- src/pages/notebooklm/chat/components/__tests__/ChatSessionForm.test.ts src/stores/__tests__/notebooklm-chat.store.test.ts`

  Expected: Failing assertions for missing provider state or form fields.

- [ ] **Step 3: Implement the chat form and state wiring**

  Add the PrimeVue dropdown, thread the provider field through the service and store, and use the same form in create and edit pages so the session choice stays visible.

- [ ] **Step 4: Re-run the unit tests and a client build**

  Run: `cd client && npm run test:unit -- src/pages/notebooklm/chat/components/__tests__/ChatSessionForm.test.ts src/stores/__tests__/notebooklm-chat.store.test.ts`

  Expected: Both unit test files pass.

  Run: `cd client && npm run build`

  Expected: Vue type-checking and Vite build succeed.

- [ ] **Step 5: Commit the client slice**

  Commit after the form, store, and build checks are green.

**Effort Total (hours):** 4

---

### Task 4: Update the chat E2E flow for provider selection

**Files:**
- Modify: `client/e2e/notebooklm-chat-retrieval.spec.ts`
- Modify: `client/e2e/pages/chat-page.ts`
- Modify: `client/e2e/fixtures.ts`

- [ ] **Step 1: Add the failing E2E scenario**

  Cover opening the chat form, selecting the mock provider, saving the session, and confirming the chosen provider survives a reload; keep Gemini gated behind `GEMINI_API_KEY` so the suite stays deterministic when the key is absent.

- [ ] **Step 2: Run the focused Playwright spec and confirm it fails**

  Run: `cd client && npm run test:e2e -- notebooklm-chat-retrieval.spec.ts`

  Expected: The new provider-selection assertions fail until the UI and client wiring are implemented.

- [ ] **Step 3: Implement the page-object selectors and spec updates**

  Add the dropdown selectors, make the test flow select the provider, and keep the mock path as the default deterministic branch for CI.

- [ ] **Step 4: Re-run the same Playwright spec**

  Run: `cd client && npm run test:e2e -- notebooklm-chat-retrieval.spec.ts`

  Expected: The provider-selection scenario passes.

- [ ] **Step 5: Commit the E2E slice**

  Commit after the Playwright spec passes.

**Effort Total (hours):** 2

---

### Task 5: Refresh environment docs and run the final verification sweep

**Files:**
- Modify: `.env.example`
- Modify: `README.md` if NotebookLM runtime setup is documented there

- [ ] **Step 1: Write the failing docs/config expectation checks**

  Note the missing Gemini environment variables and the new provider choice in the repo's runtime docs.

- [ ] **Step 2: Run the repo verification commands once and confirm the gap**

  Run: `cd server && npm test -- src/modules/notebooklm/chat.service.test.ts src/modules/notebooklm/chat.controller.test.ts`

  Run: `cd client && npm run test:unit -- src/pages/notebooklm/chat/components/__tests__/ChatSessionForm.test.ts src/stores/__tests__/notebooklm-chat.store.test.ts`

  Run: `cd python-services && python -m pytest tests/ -v`

  Expected: This step is just a final confirmation pass after the code slices are done; any remaining failures should be local to the last slice touched.

- [ ] **Step 3: Update the runtime docs and env example**

  Add the Gemini keys and any provider setup notes that users need to run the chat flow locally.

- [ ] **Step 4: Re-run the full verification sweep**

  Run: `cd server && npm test -- src/modules/notebooklm/chat.service.test.ts src/modules/notebooklm/chat.controller.test.ts`

  Run: `cd client && npm run test:unit -- src/pages/notebooklm/chat/components/__tests__/ChatSessionForm.test.ts src/stores/__tests__/notebooklm-chat.store.test.ts`

  Run: `cd client && npm run test:e2e -- notebooklm-chat-retrieval.spec.ts`

  Run: `cd python-services && python -m pytest tests/ -v`

  Expected: The server, client, E2E, and Python slices all pass together.

- [ ] **Step 5: Commit the full change set**

  Commit after the sweep is green.

**Effort Total (hours):** 2
