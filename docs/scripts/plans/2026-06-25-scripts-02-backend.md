# Script Management — Phase 2: Backend API + Tests

> **For agentic workers:** REQUIRED SKILL: Use skill `executing-plans` to implement this plan.

## Phase 2 — Backend API + Tests

### Task 1: Create scripts model file (DTOs + Prisma re-export)

**Spec Reference:** `docs/scripts/specs/scripts-design/01-backend.md — Section 1.2 (TypeScript Models)`

**Files:**
- Create: `server/src/models/scripts.model.ts`

- **Step 1:** Create `server/src/models/scripts.model.ts` following the pattern of `server/src/models/projects.model.ts`:
  - Re-export Prisma type: `export type Script = import('@prisma/client').Script`
  - Define `CreateScriptDto` interface: `title`, `idea`, `characterCount`, `minScenes`, `vibe` (string[]), `content?` (string), `status` ('draft' | 'generated'), `projectId` (number)
  - Define `UpdateScriptDto` interface: all fields optional (no `projectId`, no `aiModel`)
  - Define `GenerateScriptDto` interface: `title`, `idea`, `characterCount`, `minScenes`, `vibe` (string[]), `aiModel` (string)
  - Define `GenerateScriptResponse` interface: `content` (string), `model` (string), `provider` (string)
  - Define `AiModelInfo` interface: `provider` (string), `models` (string[])
  - No `aiModel` in CreateScriptDto/UpdateScriptDto — AI model only in GenerateScriptDto

- **Step 2: Commit**
  - `git add server/src/models/scripts.model.ts`
  - `git commit -m "feat: add scripts model file (DTOs + Prisma re-export)"`

---

### Task 2: Create scripts validation (Zod schemas)

**Spec Reference:** `docs/scripts/specs/scripts-design/01-backend.md — Section 3 (Validation Rules)`

**Files:**
- Create: `server/src/modules/admin/scripts/scripts.validation.ts`

- **Step 1:** Create `server/src/modules/admin/scripts/scripts.validation.ts` following the pattern of `server/src/modules/admin/projects/projects.validation.ts`:
  - `createScriptSchema`: `title` (min 2, max 200), `idea` (min 10, max 5000), `characterCount` (int, min 1, max 20), `minScenes` (int, min 1, max 50), `vibe` (array of strings, min 1), `content` (string, max 100000, optional), `status` (enum ['draft', 'generated']), `projectId` (int, positive)
  - `updateScriptSchema`: all fields optional (same rules, no `projectId`)
  - `generateScriptSchema`: `title`, `idea`, `characterCount`, `minScenes`, `vibe` (same rules), `aiModel` (string, min 1, max 100)
  - Export inferred types: `CreateScriptInput`, `UpdateScriptInput`, `GenerateScriptInput`
  - Error messages in Vietnamese per spec Section 3

- **Step 2: Commit**
  - `git add server/src/modules/admin/scripts/scripts.validation.ts`
  - `git commit -m "feat: add scripts Zod validation schemas"`

---

### Task 3: Create scripts repository (Prisma data access)

**Spec Reference:** `docs/scripts/specs/scripts-design/01-backend.md — Section 1.1, Section 2 (SV-001–SV-005)`

**Files:**
- Create: `server/src/modules/admin/scripts/scripts.repository.ts`

- **Step 1:** Create `server/src/modules/admin/scripts/scripts.repository.ts` following the pattern of `server/src/modules/admin/projects/projects.repository.ts`:
  - Define `SCRIPT_PUBLIC_SELECT` const (with `as const`) selecting: `id`, `title`, `idea`, `characterCount`, `minScenes`, `vibe`, `content`, `status`, `projectId`, `ownerId`, `isDeleted`, `createdAt`, `updatedAt`, plus nested `project: { select: { name: true } }` and `owner: { select: { name: true } }`
  - `findAllByProject(projectId: number)`: findMany where `{ projectId, isDeleted: false }`, orderBy `updatedAt desc`, select SCRIPT_PUBLIC_SELECT
  - `findById(id: number)`: findFirst where `{ id, isDeleted: false }`, select SCRIPT_PUBLIC_SELECT
  - `create(data: Prisma.ScriptCreateInput)`: prisma.script.create with data
  - `update(id: number, data: Prisma.ScriptUpdateInput)`: prisma.script.updateMany where `{ id, isDeleted: false }`, return count
  - `softDelete(id: number)`: prisma.script.updateMany where `{ id, isDeleted: false }`, data `{ isDeleted: true }`, return count

- **Step 2: Commit**
  - `git add server/src/modules/admin/scripts/scripts.repository.ts`
  - `git commit -m "feat: add scripts repository (Prisma data access)"`

---

### Task 4: Create scripts service (CRUD + generate logic)

**Spec Reference:** `docs/scripts/specs/scripts-design/01-backend.md — Section 2 (SV-001–SV-006), Section 4 (AI Provider Integration)`

**Files:**
- Create: `server/src/modules/admin/scripts/scripts.service.ts`
- Modify: `server/src/core/providers/types.ts`
- Modify: `server/src/core/providers/gemini.provider.ts`
- Modify: `server/src/core/providers/zai.provider.ts`
- Modify: `server/src/core/providers/comfy.provider.ts`
- Modify: `server/src/core/api-provider.service.ts`

- **Step 1:** Modify `server/src/core/providers/types.ts` — add `AVAILABLE_MODELS: string[]` to the `IAiProvider` interface as a static property requirement. Add `getAvailableModels(): string[]` instance method to interface.

- **Step 2:** Modify each provider file to add `static AVAILABLE_MODELS`:
  - `gemini.provider.ts`: `static AVAILABLE_MODELS = ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash']`
  - `zai.provider.ts`: `static AVAILABLE_MODELS = ['zai-default', 'zai-pro']`
  - `comfy.provider.ts`: `static AVAILABLE_MODELS = ['comfy-default']`
  - Add `getAvailableModels()` instance method returning the static array

- **Step 3:** Modify `server/src/core/api-provider.service.ts`:
  - Add `generateWithModel(aiModel: string, prompt: string): Promise<ProviderResponse>` method:
    - Parse `aiModel` prefix → determine `ProviderType` (gemini-* → gemini, zai-* → zai, comfy-* → comfy)
    - If no match → throw `Error('Unknown AI model: ' + aiModel)`
    - Get provider: `this.getProvider(providerType)`
    - Call `provider.generate(prompt, { model: aiModel })`
    - Return `ProviderResponse`
  - Add `getAvailableModels(): AiModelInfo[]` method:
    - Iterate `this.getRegisteredProviders()`
    - For each provider type, get the constructor's `AVAILABLE_MODELS` static property
    - Return array of `{ provider, models }`

- **Step 4:** Create `server/src/modules/admin/scripts/scripts.service.ts` following the pattern of `server/src/modules/admin/projects/projects.service.ts`:
  - Import `ScriptsRepository`, `ServiceError` from `@models/common.model`, `ApiProviderService` from `@core/api-provider.service`
  - Define `toResponse()` mapper function: flatten nested `project.name` → `projectName`, `owner.name` → `ownerName`, cast `vibe` from Prisma.Json to `string[]`
  - `getScripts(projectId: number)`: call repo `findAllByProject`, map to response
  - `getScript(id: number)`: call repo `findById`, throw 404 if not found, map to response
  - `createScript(data: CreateScriptInput, ownerId: number)`: verify project exists (isDeleted=false), set ownerId, if content null/empty → status='draft', else status='generated', call repo create, return response
  - `updateScript(id: number, data: UpdateScriptInput)`: check exists, if content changed update status accordingly, call repo update, return response (re-fetch)
  - `deleteScript(id: number)`: check exists, call repo softDelete
  - `generateScript(data: GenerateScriptInput)`: build prompt from fields (template per spec Section 2 SV-006 Step 4), call `ApiProviderService.getInstance().generateWithModel(data.aiModel, prompt)`, return `{ content, model, provider }`
  - `getAiModels()`: call `ApiProviderService.getInstance().getAvailableModels()`

- **Step 5:** Verify TypeScript compiles:
  - Run: `cd server && npx tsc --noEmit`
  - Expected: No errors

- **Step 6: Commit**
  - `git add server/src/modules/admin/scripts/scripts.service.ts server/src/core/providers/types.ts server/src/core/providers/gemini.provider.ts server/src/core/providers/zai.provider.ts server/src/core/providers/comfy.provider.ts server/src/core/api-provider.service.ts`
  - `git commit -m "feat: add scripts service + AI provider model list integration"`

---

### Task 5: Create scripts controller + routes + wire into app

**Spec Reference:** `docs/scripts/specs/scripts-design/01-backend.md — Section 2 (SV-001–SV-007)`

**Files:**
- Create: `server/src/modules/admin/scripts/scripts.controller.ts`
- Create: `server/src/modules/admin/scripts/scripts.routes.ts`
- Modify: `server/src/app.ts`

- **Step 1:** Create `server/src/modules/admin/scripts/scripts.controller.ts` following the pattern of `server/src/modules/admin/projects/projects.controller.ts`:
  - `getScripts(req, res)`: parse `projectId` from query (required, positive int), call service `getScripts(projectId)`, `sendSuccess(res, { data: result })`
  - `getScript(req, res)`: parse `id` from params, call service `getScript(id)`, `sendSuccess(res, { data: script })`
  - `createScript(req, res)`: get `ownerId` via `getAuthUserId(req)`, call service `createScript(req.body, ownerId)`, `sendSuccess(res, { data: script }, 201)`
  - `updateScript(req, res)`: parse `id`, call service `updateScript(id, req.body)`, `sendSuccess(res, { data: script })`
  - `deleteScript(req, res)`: parse `id`, call service `deleteScript(id)`, `sendSuccess(res, { message: 'Script deleted successfully' })`
  - `generateScript(req, res)`: call service `generateScript(req.body)`, `sendSuccess(res, { data: result })`
  - `getAiModels(req, res)`: call service `getAiModels()`, `sendSuccess(res, { data: result })`
  - All handlers wrapped with `asyncHandler()`

- **Step 2:** Create `server/src/modules/admin/scripts/scripts.routes.ts` following the pattern of `server/src/modules/admin/projects/projects.routes.ts`:
  - Apply `authMiddleware, requireRole('admin')` to all routes
  - `GET /` — validate projectId query param (add a simple Zod query schema or manual check) → `getScripts`
  - `POST /` — `validate(createScriptSchema)` → `createScript`
  - `GET /:id` → `getScript`
  - `PUT /:id` — `validate(updateScriptSchema)` → `updateScript`
  - `DELETE /:id` → `deleteScript`
  - `POST /generate` — `validate(generateScriptSchema)` → `generateScript`
  - `GET /ai-models` → `getAiModels` (register as separate route in app.ts or within scripts routes)

- **Step 3:** Modify `server/src/app.ts` — add imports and register routes:
  - Import `scriptsRoutes` from `@modules/admin/scripts/scripts.routes`
  - Add: `app.use(`${appConfig.apiPrefix}/admin/scripts`, scriptsRoutes)`
  - Note: `GET /api/admin/scripts/ai-models` will be handled by scripts routes (add route `GET /ai-models` before `GET /:id` to avoid route conflict)

- **Step 4:** Verify TypeScript compiles:
  - Run: `cd server && npx tsc --noEmit`
  - Expected: No errors

- **Step 5: Commit**
  - `git add server/src/modules/admin/scripts/scripts.controller.ts server/src/modules/admin/scripts/scripts.routes.ts server/src/app.ts`
  - `git commit -m "feat: add scripts controller + routes + wire into app"`

---

### Task 6: Write backend tests

**Spec Reference:** `docs/scripts/specs/scripts-design/04-quality.md — Section 1.1 (Backend Tests)`

**Files:**
- Create: `server/src/modules/admin/scripts/scripts.controller.test.ts`

- **Step 1:** Create `server/src/modules/admin/scripts/scripts.controller.test.ts` following the pattern of `server/src/modules/admin/projects/projects.controller.test.ts`:
  - Use test database, run migrations before tests
  - Write all Unit Tests (23 tests) per spec 04-quality.md Section 1.1 Unit Tests table
  - Write all Integration Tests (20 tests) per spec 04-quality.md Section 1.1 Integration Tests table
  - Write all Authorization Tests (8 tests) per spec 04-quality.md Section 1.1 Authorization Tests table
  - Mock `ApiProviderService` for generate tests (don't call real AI API)
  - Test: create draft (content=null, status='draft'), create generated (content=JSON, status='generated'), validation errors, project not found, soft delete, generate success/failure, ai-models list

- **Step 2:** Run tests:
  - Run: `cd server && npx vitest run src/modules/admin/scripts/scripts.controller.test.ts`
  - Expected: All tests pass

- **Step 3: Commit**
  - `git add server/src/modules/admin/scripts/scripts.controller.test.ts`
  - `git commit -m "test: add scripts backend tests (unit + integration + auth)"`