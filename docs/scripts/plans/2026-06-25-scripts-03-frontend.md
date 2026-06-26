# Script Management — Phase 3: Frontend Store + UI + Tests

> **For agentic workers:** REQUIRED SKILL: Use skill `executing-plans` to implement this plan.

## Phase 3 — Frontend Store + UI + Tests

### Task 1: Create client TypeScript types

**Spec Reference:** `docs/scripts/specs/scripts-design/02-frontend.md — Section 7 (TypeScript Types)`

**Files:**
- Create: `client/src/types/scripts.types.ts`

- **Step 1:** Create `client/src/types/scripts.types.ts` per spec Section 7:
  - Interface `Script`: `id`, `title`, `idea`, `characterCount`, `minScenes`, `vibe` (string[]), `content` (string | null), `status` ('draft' | 'generated'), `projectId`, `projectName`, `ownerId`, `ownerName`, `isDeleted`, `createdAt` (string), `updatedAt` (string)
  - Interface `CreateScriptDto`: `title`, `idea`, `characterCount`, `minScenes`, `vibe`, `content?`, `status`, `projectId`
  - Interface `UpdateScriptDto`: all optional (no `projectId`)
  - Interface `GenerateScriptDto`: `title`, `idea`, `characterCount`, `minScenes`, `vibe`, `aiModel`
  - Interface `GenerateScriptResponse`: `content`, `model`, `provider`
  - Interface `AiModelInfo`: `provider`, `models` (string[])
  - No `aiModel` in Script/CreateScriptDto/UpdateScriptDto

- **Step 2: Commit**
  - `git add client/src/types/scripts.types.ts`
  - `git commit -m "feat: add scripts client TypeScript types"`

---

### Task 2: Create scripts API service + composable

**Spec Reference:** `docs/scripts/specs/scripts-design/02-frontend.md — Section 5 (Composable)`

**Files:**
- Create: `client/src/services/scripts.service.ts`
- Create: `client/src/pages/scripts/composables/useScripts.ts`

- **Step 1:** Create `client/src/services/scripts.service.ts` following the pattern of `client/src/services/projects.service.ts`:
  - Class `ScriptsApiClient` with basePath `/admin/scripts`
  - `getScripts(projectId: number)`: GET `?projectId=${projectId}`, unwrap `{ data: Script[] }`
  - `getById(id: number)`: GET `/:id`, unwrap `{ data: Script }`
  - `create(data: CreateScriptDto)`: POST, unwrap `{ data: Script }`
  - `update(id: number, data: UpdateScriptDto)`: PUT `/:id`, unwrap `{ data: Script }`
  - `delete(id: number)`: DELETE `/:id`
  - `generate(data: GenerateScriptDto)`: POST `/generate`, unwrap `{ data: GenerateScriptResponse }`
  - `getAiModels()`: GET `/ai-models`, unwrap `{ data: AiModelInfo[] }`
  - Export singleton `scriptsApiService`

- **Step 2:** Create `client/src/pages/scripts/composables/useScripts.ts` per spec Section 5:
  - Methods: `getScripts(projectId)`, `getScript(id)`, `createScript(data)`, `updateScript(id, data)`, `deleteScript(id)`, `generateScript(data)`, `getAiModels()` — all wrapping `scriptsApiService` calls

- **Step 3:** Verify TypeScript compiles:
  - Run: `cd client && npx vue-tsc -p tsconfig.app.json --noEmit`
  - Expected: No errors

- **Step 4: Commit**
  - `git add client/src/services/scripts.service.ts client/src/pages/scripts/composables/useScripts.ts`
  - `git commit -m "feat: add scripts API service + composable"`

---

### Task 3: Create scripts Pinia store

**Spec Reference:** `docs/scripts/specs/scripts-design/02-frontend.md — Section 6 (Store)`

**Files:**
- Create: `client/src/stores/scripts.store.ts`

- **Step 1:** Create `client/src/stores/scripts.store.ts` following the pattern of `client/src/stores/projects.store.ts` (Composition API `defineStore`):
  - State: `scripts` (ref Script[]), `currentScript` (ref Script | null), `aiModels` (ref AiModelInfo[]), `loading` (shallowRef boolean), `generating` (shallowRef boolean), `error` (ref string | null)
  - Actions: `fetchScripts(projectId)`, `fetchScript(id)`, `fetchAiModels()`, `createScript(data)` (no auto-reload), `updateScript(id, data)` (no auto-reload), `deleteScript(id)` (auto-reload), `generateScript(data)` (set generating flag, return content), `clearCurrentScript()`
  - Use `catch (err: unknown)` with error helper functions per client conventions

- **Step 2:** Verify TypeScript compiles:
  - Run: `cd client && npx vue-tsc -p tsconfig.app.json --noEmit`
  - Expected: No errors

- **Step 3: Commit**
  - `git add client/src/stores/scripts.store.ts`
  - `git commit -m "feat: add scripts Pinia store"`

---

### Task 4: Create script components (Card, Form, ContentViewer, DeleteDialog)

**Spec Reference:** `docs/scripts/specs/scripts-design/02-frontend.md — Section 3 (Screen Item Specs), Section 4 (Component Details)`

**Files:**
- Create: `client/src/pages/scripts/components/ScriptCard.vue`
- Create: `client/src/pages/scripts/components/ScriptForm.vue`
- Create: `client/src/pages/scripts/components/ScriptContentViewer.vue`
- Create: `client/src/pages/scripts/components/ScriptDeleteDialog.vue`

- **Step 1:** Create `ScriptCard.vue` per spec Section 3.2 (items 4-11) and Section 4.1:
  - Props: `script: Script`
  - Emits: `click(id)`, `edit(id)`, `delete(id)`
  - Layout: Card with title (bold, truncate 2 lines), Status Tag (Draft=gray, Generated=green), idea (truncate 3 lines), vibe tags (3 + "+N"), updatedAt, action menu (SpeedDial/Button + OverlayPanel)
  - Use PrimeVue Card, Tag, Button components

- **Step 2:** Create `ScriptForm.vue` per spec Section 3.3 (items 3-17) and Section 4.2:
  - Props: `mode` ('create' | 'edit'), `script` (Script | null), `aiModels` (AiModelInfo[]), `loading` (boolean), `generating` (boolean)
  - Emits: `generate(GenerateScriptDto)`, `save({ data, content })`, `cancel`
  - Internal state: `formData` (title, idea, characterCount, minScenes, vibe, aiModel), `submitted`
  - Validation: VeeValidate + Zod per spec Section 4.2 — `aiModel` required only for Generate, not for Save
  - Fields: InputText (title), Textarea (idea, char counter n/5000), InputNumber (characterCount, minScenes), Chips (vibe, preset + custom), Select (aiModel, group by provider), Generate button (PiSparkles), Save button, Cancel button
  - Use PrimeVue InputText, Textarea, InputNumber, Chips, Select, Button

- **Step 3:** Create `ScriptContentViewer.vue` per spec Section 3.3 (items 18-21) and Section 4.3:
  - Props: `content` (string | null), `loading` (boolean)
  - Emits: `contentChange(string)`
  - Layout: Panel (60% width), header "Nội dung kịch bản", Textarea monospace with auto-format JSON (pretty print), empty state message, skeleton when loading
  - Use PrimeVue Panel, Textarea, Skeleton

- **Step 4:** Create `ScriptDeleteDialog.vue` per spec Section 3.4 and Section 4.5:
  - Props: `visible` (boolean), `scriptTitle` (string)
  - Emits: `confirmed`, `cancelled`
  - Use PrimeVue Dialog, Button

- **Step 5:** Verify TypeScript compiles:
  - Run: `cd client && npx vue-tsc -p tsconfig.app.json --noEmit`
  - Expected: No errors

- **Step 6: Commit**
  - `git add client/src/pages/scripts/components/`
  - `git commit -m "feat: add script components (Card, Form, ContentViewer, DeleteDialog)"`

---

### Task 5: Create script pages (ListPage, FormPage) + routes

**Spec Reference:** `docs/scripts/specs/scripts-design/02-frontend.md — Section 2 (Layout & Wireframes), Section 3.1-3.3`

**Files:**
- Create: `client/src/pages/scripts/ScriptListPage.vue`
- Create: `client/src/pages/scripts/ScriptFormPage.vue`
- Create: `client/src/pages/scripts/scripts.routes.ts`
- Modify: `client/src/pages/projects/projects.routes.ts`

- **Step 1:** Create `ScriptListPage.vue` per spec Section 3.2:
  - onMounted: get `projectId` from route params, call `scriptsStore.fetchScripts(projectId)`
  - PageHeader: Back button (→ ProjectDetail), title "Kịch bản", Create button (→ ScriptCreate)
  - ScriptCard grid (responsive 1→2→3 columns)
  - Empty state: icon + message + create button
  - Loading state: 3 skeleton cards
  - Handlers: `handleBackClick`, `handleCreateClick`, `handleCardClick(id)` (→ ScriptEdit), `handleEditClick(id)`, `handleDeleteClick(id)` (open delete dialog), `handleDeleteConfirmed`
  - Use PrimeVue Button, Skeleton

- **Step 2:** Create `ScriptFormPage.vue` per spec Section 3.3:
  - onMounted: get `projectId` from route, call `scriptsStore.fetchAiModels()`, if `scriptId` in route → `fetchScript(scriptId)` + populate form
  - Layout: 2 columns — ScriptForm (left 40%), ScriptContentViewer (right 60%)
  - Handlers: `handleGenerate(data)` (call store generateScript, set content), `handleSave({ data, content })` (determine status, call create/update, redirect to list), `handleCancel` (check dirty, confirm dialog, redirect), `handleContentChange(content)`
  - onUnmounted: `clearCurrentScript()`
  - Use `useRoute`, `useRouter` from vue-router

- **Step 3:** Create `scripts.routes.ts` per spec Section 2.3:
  - Routes nested under `/projects/:projectId/scripts`:
    - `''` → ScriptListPage (name: ScriptList)
    - `create` → ScriptFormPage mode=create (name: ScriptCreate)
    - `:scriptId/edit` → ScriptFormPage mode=edit (name: ScriptEdit)
  - Meta: `requiresAuth: true`, `roles: ['admin']`, `title`, `titleKey`, `breadcrumb`

- **Step 4:** Modify `client/src/pages/projects/projects.routes.ts` — add script routes as children of the `/projects` route (or register separately in router index). Ensure projectId param flows through.

- **Step 5:** Verify TypeScript compiles:
  - Run: `cd client && npx vue-tsc -p tsconfig.app.json --noEmit`
  - Expected: No errors

- **Step 6: Commit**
  - `git add client/src/pages/scripts/ client/src/pages/projects/projects.routes.ts`
  - `git commit -m "feat: add script pages (List, Form) + routes"`

---

### Task 6: Create ProjectScriptCard + update ProjectDetailPage

**Spec Reference:** `docs/scripts/specs/scripts-design/02-frontend.md — Section 3.1 (ProjectScriptCard), Section 8 (Project v1.01 Update)`, `docs/projects/specs/projects-design/02-frontend.md — Section 3.2 ([UPDATE - CR-SCRIPT-001])`

**Files:**
- Create: `client/src/pages/projects/components/ProjectScriptCard.vue`
- Modify: `client/src/pages/projects/ProjectDetailPage.vue`

- **Step 1:** Create `ProjectScriptCard.vue` per spec Section 4.4:
  - Props: `projectId` (number), `scriptCount` (number)
  - Emits: `click(projectId)`
  - Layout: Small clickable card, icon PiFile, title "Kịch bản", count "N kịch bản", "Xem tất cả" link
  - Use PrimeVue Card, Button

- **Step 2:** Modify `ProjectDetailPage.vue` per spec Section 8.1:
  - Import `useScriptsStore` and `ProjectScriptCard`
  - In `onMounted`: after fetching project, call `scriptsStore.fetchScripts(projectId)` to get count
  - Add `ProjectScriptCard` section at bottom of detail page with `projectId` and `scriptCount` (from `scriptsStore.scripts.length`)
  - Add `handleScriptCardClick(projectId)` → `router.push({ name: 'ScriptList', params: { projectId } })`

- **Step 3:** Verify TypeScript compiles:
  - Run: `cd client && npx vue-tsc -p tsconfig.app.json --noEmit`
  - Expected: No errors

- **Step 4: Commit**
  - `git add client/src/pages/projects/components/ProjectScriptCard.vue client/src/pages/projects/ProjectDetailPage.vue`
  - `git commit -m "feat: add ProjectScriptCard + update ProjectDetailPage with script card"`

---

### Task 7: Add i18n keys for scripts

**Spec Reference:** `docs/scripts/specs/scripts-design/02-frontend.md — Section 3 (DisplayText column references)`

**Files:**
- Modify: `client/src/locales/en.ts`
- Modify: `client/src/locales/vi.ts`
- Modify: `client/src/locales/ja.ts`

- **Step 1:** Add i18n keys for scripts module to all 3 locale files. Keys needed (from spec DisplayText column):
  - `scripts.title`, `scripts.card.title`, `scripts.card.viewAll`
  - `scripts.list.pageTitle`, `scripts.list.createButton`, `scripts.list.empty`
  - `scripts.form.createTitle`, `scripts.form.editTitle`, `scripts.form.title`, `scripts.form.titlePlaceholder`, `scripts.form.idea`, `scripts.form.ideaPlaceholder`, `scripts.form.characterCount`, `scripts.form.minScenes`, `scripts.form.vibe`, `scripts.form.vibePlaceholder`, `scripts.form.aiModel`, `scripts.form.aiModelPlaceholder`, `scripts.form.generate`, `scripts.form.contentTitle`, `scripts.form.contentEmpty`
  - `scripts.delete.header`, `scripts.delete.confirm`
  - Use Vietnamese for vi.ts, English for en.ts, Japanese for ja.ts
  - Follow existing i18n structure (nested objects)

- **Step 2:** Verify TypeScript compiles:
  - Run: `cd client && npx vue-tsc -p tsconfig.app.json --noEmit`
  - Expected: No errors

- **Step 3: Commit**
  - `git add client/src/locales/en.ts client/src/locales/vi.ts client/src/locales/ja.ts`
  - `git commit -m "feat: add script i18n keys (en, vi, ja)"`

---

### Task 8: Write frontend tests

**Spec Reference:** `docs/scripts/specs/scripts-design/04-quality.md — Section 1.2 (Frontend Tests)`

**Files:**
- Create: `client/src/pages/scripts/ScriptListPage.test.ts`
- Create: `client/src/pages/scripts/ScriptFormPage.test.ts`
- Create: `client/src/pages/scripts/components/ScriptCard.test.ts`
- Create: `client/src/pages/scripts/components/ScriptForm.test.ts`
- Create: `client/src/pages/scripts/components/ScriptContentViewer.test.ts`
- Create: `client/src/pages/scripts/components/ScriptDeleteDialog.test.ts`
- Create: `client/src/pages/projects/components/ProjectScriptCard.test.ts`
- Create: `client/src/stores/scripts.store.test.ts`
- Create: `client/src/pages/scripts/composables/useScripts.test.ts`

- **Step 1:** Write all frontend test files per spec 04-quality.md Section 1.2:
  - `ScriptListPage.test.ts`: 10 tests per spec table
  - `ScriptFormPage.test.ts`: 18 tests per spec table
  - `ScriptCard.test.ts`: 11 tests per spec table (no aiModel test)
  - `ScriptForm.test.ts`: 20 tests per spec table (aiModel validation only for Generate)
  - `ScriptContentViewer.test.ts`: 5 tests per spec table
  - `ScriptDeleteDialog.test.ts`: 3 tests per spec table
  - `ProjectScriptCard.test.ts`: 3 tests per spec table
  - `scripts.store.test.ts`: 11 tests per spec table
  - `useScripts.test.ts`: 6 tests per spec table
  - Use Vitest + Vue Test Utils, mock stores and API services per client conventions

- **Step 2:** Run all frontend tests:
  - Run: `cd client && npx vitest run src/pages/scripts src/stores/scripts.store.test.ts src/pages/projects/components/ProjectScriptCard.test.ts`
  - Expected: All tests pass

- **Step 3: Commit**
  - `git add client/src/pages/scripts/ client/src/stores/scripts.store.test.ts client/src/pages/projects/components/ProjectScriptCard.test.ts`
  - `git commit -m "test: add scripts frontend tests (all component + store + composable)"`