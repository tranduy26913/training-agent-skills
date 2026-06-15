# Vocabulary Management — Backend Implementation Plan
> **For agentic workers:** REQUIRED SKILL: Use skill `executing-plans` to implement this plan.
> **Execution mode:** Phases are sequential. Tasks within a phase are executed sequentially.

## Plan Structure

## Phase 1 — Backend Models & Types

### Task 1: Create TypeScript Types

**Spec Reference:** `docs/vocabularies/specs/vocabularies-design/01-backend.md — Section 1.2`

**Files:**
- Create: `server/src/models/vocabularies.model.ts`

- **Step 1:** Define all TypeScript types
  - Run: Create file with interfaces for:
    - `VocabularyRow`, `VocabRelationRow`, `VocabChangeLogRow`, `VocabReportRow`
    - `VocabularyFilter`, `CreateVocabularyDto`, `UpdateVocabularyDto`, `VocabularyResponse`
    - `VocabRelationDto`, `VocabChangeLogDto`, `VocabReportDto`
    - Enums: `VocabularyStatus`, `VocabLevel`, `VocabRelationType`, `VocabReportStatus`
  - Expected: Type file with all interfaces matching database schema

- **Step 2: Commit**
  - `git add server/src/models/vocabularies.model.ts`
  - `git commit -m "feat(types): add vocabulary TypeScript types"`

## Phase 2 — Backend Repository Layer

### Task 2: Create Repository

**Spec Reference:** `docs/vocabularies/specs/vocabularies-design/01-backend.md — Section 2`

**Files:**
- Create: `server/src/modules/vocabulary/vocabulary.repository.ts`

- **Step 1:** Implement repository methods
  - Run: Create repository class with methods:
    - `findAll(filters, pagination)` — with dynamic query building
    - `findById(id)` — including relations, logs, reports
    - `create(data)` — with transaction
    - `update(id, data)` — with version increment
    - `delete(id)` — soft delete
    - `findRelationOptions(excludeIds)` — for MultiSelect
    - `createChangeLog()` — audit trail
    - `resolveReport(reportId, status)` — report management
  - Expected: Repository with parameterized queries, no SQL injection

- **Step 2: Commit**
  - `git add server/src/modules/vocabulary/vocabulary.repository.ts`
  - `git commit -m "feat(repo): add vocabulary repository with CRUD operations"`

## Phase 3 — Backend Service Layer

### Task 3: Create Service

**Spec Reference:** `docs/vocabularies/specs/vocabularies-design/01-backend.md — Section 2`

**Files:**
- Create: `server/src/modules/vocabulary/vocabulary.service.ts`

- **Step 1:** Implement business logic
  - Run: Create service class with methods:
    - `getVocabularies(filters)` — call repository with validation
    - `getVocabulary(id)` — with relations, logs, reports
    - `createVocabulary(data, userId)` — with duplicate check
    - `updateVocabulary(id, data, userId)` — with change log creation
    - `deleteVocabulary(id)` — soft delete
    - `getAnalytics(id)` — compute statistics
    - `resolveReport(reportId, status, adminId)` — report resolution
  - Expected: Service with validation, duplicate detection, change log logic

- **Step 2: Commit**
  - `git add server/src/modules/vocabulary/vocabulary.service.ts`
  - `git commit -m "feat(service): add vocabulary service with business logic"`

## Phase 4 — Backend Validation

### Task 4: Create Validation Schema

**Spec Reference:** `docs/vocabularies/specs/vocabularies-design/01-backend.md — Section 3. Validation Rules`

**Files:**
- Create: `server/src/modules/vocabulary/vocabulary.validation.ts`

- **Step 1:** Define Zod schemas
  - Run: Create validation schemas for:
    - `CreateVocabularyDto` — kanji (1-255, not numbers only), meaning_vi (1-1000), optional fields
    - `UpdateVocabularyDto` — partial schema
    - `VocabularyFilter` — query parameter validation
    - `ResolveReportDto` — status enum validation
  - Expected: Zod schemas with all validation rules from spec

- **Step 2: Commit**
  - `git add server/src/modules/vocabulary/vocabulary.validation.ts`
  - `git commit -m "feat(validation): add vocabulary Zod validation schemas"`

## Phase 5 — Backend Controller & Routes

### Task 5: Create Controller

**Spec Reference:** `docs/vocabularies/specs/vocabularies-design/01-backend.md — Section 2`

**Files:**
- Create: `server/src/modules/vocabulary/vocabulary.controller.ts`

- **Step 1:** Implement controller endpoints
  - Run: Create controller with methods:
    - `findAll(req, res)` — GET /api/vocabularies
    - `findById(req, res)` — GET /api/vocabularies/:id
    - `create(req, res)` — POST /api/vocabularies
    - `update(req, res)` — PUT /api/vocabularies/:id
    - `delete(req, res)` — DELETE /api/vocabularies/:id
    - `resolveReport(req, res)` — PATCH /api/vocabularies/:id/reports/:reportId
    - `getAnalytics(req, res)` — GET /api/vocabularies/:id/analytics
  - Expected: Controller with auth checks, validation, error handling

- **Step 2: Commit**
  - `git add server/src/modules/vocabulary/vocabulary.controller.ts`
  - `git commit -m "feat(controller): add vocabulary controller with all endpoints"`

### Task 6: Create Routes

**Spec Reference:** `docs/vocabularies/specs/vocabularies-design/01-backend.md — Section 2`

**Files:**
- Create: `server/src/modules/vocabulary/vocabulary.routes.ts`

- **Step 1:** Define Express routes
  - Run: Create router with:
    - All endpoints from controller
    - Admin middleware for write operations
    - Auth middleware for all routes
  - Expected: Routes file with proper middleware chain

- **Step 2:** Register routes in main app
  - Run: Modify `server/src/app.ts` to import and use vocabulary routes
  - Expected: Routes registered at `/api/vocabularies`

- **Step 3: Commit**
  - `git add server/src/modules/vocabulary/vocabulary.routes.ts server/src/app.ts`
  - `git commit -m "feat(routes): register vocabulary API routes"`

## Phase 6 — Backend Tests

### Task 7: Write Unit Tests

**Spec Reference:** `docs/vocabularies/specs/vocabularies-design/04-quality.md — Section 1.1`

**Files:**
- Create: `server/src/modules/vocabulary/vocabulary.controller.test.ts`

- **Step 1:** Implement all test cases from spec
  - Run: Create test file with tests for:
    - UT-001 to UT-027 — all controller tests
    - AUTH-001 to AUTH-005 — authorization tests
  - Expected: Test file with database tests (not mocks), all tests passing

- **Step 2:** Run tests
  - Run: `cd server && npm run test:vitest vocabulary`
  - Expected: All 32 tests pass (27 UT + 5 AUTH)

- **Step 3: Commit**
  - `git add server/src/modules/vocabulary/vocabulary.controller.test.ts`
  - `git commit -m "test(backend): add vocabulary controller unit tests"`

## Phase 7 — Build & Integration Verification

### Task 8: Verify Backend Build & API

**Spec Reference:** `docs/vocabularies/specs/vocabularies-design/01-backend.md — Section 2`

**Files:**
- No file changes

- **Step 1:** Build server
  - Run: `cd server && npm run build`
  - Expected: Build succeeds with no TypeScript errors

- **Step 2:** Start dev server
  - Run: `cd server && npm run dev:debug`
  - Expected: Server starts on port 3000

- **Step 3:** Test API endpoints manually
  - Run: Use Postman/curl to test:
    - GET /api/vocabularies — returns list
    - POST /api/vocabularies — creates vocab
    - GET /api/vocabularies/:id — returns detail
  - Expected: All endpoints respond correctly

- **Step 4: Commit**
  - `git commit --allow-empty -m "chore: verify backend build and API integration"`
