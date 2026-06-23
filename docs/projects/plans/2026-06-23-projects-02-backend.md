# Project Management — Backend Implementation Plan
> **For agentic workers:** REQUIRED SKILL: Use skill `executing-plans` to implement this plan.

## Plan Structure

## Phase 2 — Backend API

### Task 2.1 — Create backend module structure (routes, controller, service, repository, validation)

**Spec Reference:** `docs/projects/specs/projects-design/01-backend.md — Section 2`

**Files:**
- Create: `server/src/modules/admin/projects/projects.routes.ts`
- Create: `server/src/modules/admin/projects/projects.controller.ts`
- Create: `server/src/modules/admin/projects/projects.service.ts`
- Create: `server/src/modules/admin/projects/projects.repository.ts`
- Create: `server/src/modules/admin/projects/projects.validation.ts`
- Modify: `server/src/app.ts` (mount routes)

- **Step 1:** Create `projects.validation.ts` with Zod schemas:
  - `createProjectSchema`: name (string, min 2, max 200), description (string, max 2000, optional), projectPrompt (string, max 10000, optional)
  - `updateProjectSchema`: same fields but all optional

- **Step 2:** Create `projects.repository.ts` with Prisma queries:
  - `findAll()`: findMany where isDeleted=false, include owner (select name), orderBy updatedAt desc
  - `findById(id)`: findUnique where id + isDeleted=false, include owner (select name)
  - `create(data)`: create with ownerId from authenticated user
  - `update(id, data)`: update where id + isDeleted=false
  - `softDelete(id)`: update isDeleted=true where id

- **Step 3:** Create `projects.service.ts` with business logic:
  - `getProjects()`: calls repository.findAll(), maps owner.name to ownerName
  - `getProject(id)`: calls repository.findById(), throws ServiceError(404) if not found
  - `createProject(dto, ownerId)`: calls repository.create() with ownerId
  - `updateProject(id, dto)`: calls repository.update(), throws ServiceError(404) if not found
  - `deleteProject(id)`: calls repository.softDelete(), throws ServiceError(404) if not found

- **Step 4:** Create `projects.controller.ts` with class-based pattern:
  - `getProjects` → req → service.getProjects() → res.json({ data })
  - `getProject` → req.params.id → service.getProject(id) → res.json({ data })
  - `createProject` → req.body + req.user.id → service.createProject() → res.status(201).json({ data })
  - `updateProject` → req.params.id + req.body → service.updateProject() → res.json({ data })
  - `deleteProject` → req.params.id → service.deleteProject() → res.json({ message })

- **Step 5:** Create `projects.routes.ts`:
  - All routes under `/api/admin/projects`
  - Apply authMiddleware + requireRole('admin')
  - GET `/` → getProjects
  - POST `/` → validate(createProjectSchema) → createProject
  - GET `/:id` → getProject
  - PUT `/:id` → validate(updateProjectSchema) → updateProject
  - DELETE `/:id` → deleteProject

- **Step 6:** Mount routes in `server/src/app.ts`:
  - Import and use projects routes

- **Step 7:** Commit
  - `git add server/src/modules/admin/projects/ server/src/app.ts`
  - `git commit -m "feat(projects): implement backend CRUD API"`

### Task 2.2 — Write backend tests

**Spec Reference:** `docs/projects/specs/projects-design/04-quality.md — Section 1.1`

**Files:**
- Create: `server/src/modules/admin/projects/projects.controller.test.ts`

- **Step 1:** Write integration tests per spec (all in 1 test file):
  - GET list — authenticated admin → 200 with data[]
  - GET list — unauthenticated → 401
  - GET list — non-admin → 403
  - POST create — valid body → 201
  - POST create — short name → 400
  - POST create — empty name → 400
  - GET by id — existing → 200
  - GET by id — non-existing → 404
  - GET by id — soft deleted → 404
  - PUT update — existing → 200
  - PUT update — non-existing → 404
  - PUT update — invalid body → 400
  - DELETE — existing → 200
  - DELETE — non-existing → 404
  - DELETE — already deleted → 404
  - Authorization: admin can access → 200
  - Authorization: user cannot access → 403

- **Step 2:** Run tests:
  - `cd server && npx vitest run src/modules/admin/projects/projects.controller.test.ts`
  - Expected: all tests pass

- **Step 3:** Commit
  - `git add server/src/modules/admin/projects/projects.controller.test.ts`
  - `git commit -m "test(projects): add backend integration tests"`
