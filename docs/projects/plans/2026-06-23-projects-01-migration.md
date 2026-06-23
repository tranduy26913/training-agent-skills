# Project Management — Migration Plan
> **For agentic workers:** REQUIRED SKILL: Use skill `executing-plans` to implement this plan.

## Plan Structure

## Phase 1 — Foundation

### Task 1.1 — Create Prisma migration for `projects` table

**Spec Reference:** `docs/projects/specs/projects-design/01-backend.md — Section 1.1`

**Files:**
- Modify: `server/prisma/schema.prisma`

- **Step 1:** Add `Project` model to Prisma schema at `server/prisma/schema.prisma` with these fields per spec:
  - `id` (Int, autoincrement), `name` (String), `description` (String?), `projectPrompt` (String?, column `project_prompt`), `headline` (String?), `caption` (String?), `subtext` (String?), `ownerId` (Int, FK → User), `owner` (relation with onDelete: Restrict), `isDeleted` (Boolean @default(false), column `is_deleted`), `createdAt` (DateTime @default(now()), column `created_at`), `updatedAt` (DateTime @updatedAt, column `updated_at`)
  - Indexes: `@@index([ownerId])`, `@@index([isDeleted])`
  - `@@map("projects")`

- **Step 2:** Run migration:
  - `cd server && npx prisma migrate dev --name add_projects_table`
  - Expected: migration file created, `projects` table exists in DB

- **Step 3:** Commit
  - `git add server/prisma/schema.prisma server/prisma/migrations/`
  - `git commit -m "feat(projects): add projects table to Prisma schema"`

### Task 1.2 — Create server TypeScript types

**Spec Reference:** `docs/projects/specs/projects-design/01-backend.md — Section 1.2`

**Files:**
- Create: `server/src/models/projects.model.ts`

- **Step 1:** Create `server/src/models/projects.model.ts` with interfaces:
  - `Project` (id, name, description, projectPrompt, headline, caption, subtext, ownerId, isDeleted, createdAt, updatedAt)
  - `CreateProjectDto` (name required, description?, projectPrompt?)
  - `UpdateProjectDto` (name?, description?, projectPrompt?)

- **Step 2:** Export from barrel `server/src/models/index.ts`:
  - Add `export * from './projects.model'`

- **Step 3:** Commit
  - `git add server/src/models/projects.model.ts server/src/models/index.ts`
  - `git commit -m "feat(projects): add TypeScript models"`

### Task 1.3 — Create client TypeScript types

**Spec Reference:** `docs/projects/specs/projects-design/02-frontend.md — Section 7`

**Files:**
- Create: `client/src/types/projects.types.ts`

- **Step 1:** Create `client/src/types/projects.types.ts` with interfaces:
  - `Project` (id, name, description, projectPrompt, headline, caption, subtext, ownerId, ownerName, isDeleted, createdAt, updatedAt)
  - `CreateProjectDto` (name required, description?, projectPrompt?)
  - `UpdateProjectDto` (same as CreateProjectDto but all optional)

- **Step 2:** Commit
  - `git add client/src/types/projects.types.ts`
  - `git commit -m "feat(projects): add client TypeScript types"`
