# Script Management — Phase 1: DB Schema + Migration

> **For agentic workers:** REQUIRED SKILL: Use skill `executing-plans` to implement this plan.

## Phase 1 — DB Schema + Migration

### Task 1: Create Script Prisma schema + migration

**Spec Reference:** `docs/scripts/specs/scripts-design/01-backend.md — Section 1.1 (Script model)`, `docs/projects/specs/projects-design/01-backend.md — Section 1.1 (Project model, [UPDATE - CR-SCRIPT-001])`

**Files:**
- Create: `server/prisma/schema/script.prisma`
- Modify: `server/prisma/schema/project.prisma`
- Modify: `server/prisma/schema/user.prisma`
- Modify: `server/prisma/schema.prisma` (auto-generated)

- **Step 1:** Create `server/prisma/schema/script.prisma` with the Script model per spec Section 1.1:
  - Fields: `id` (Int, autoincrement, UnsignedInt), `title` (String, VarChar 200), `idea` (String, Text), `characterCount` (Int, column `character_count`), `minScenes` (Int, column `min_scenes`), `vibe` (Json), `content` (String?, Text), `status` (String, VarChar 20, default `'draft'`), `projectId` (Int, column `project_id`, UnsignedInt), `ownerId` (Int, column `owner_id`, UnsignedInt), `isDeleted` (Boolean, default false, column `is_deleted`), `createdAt` (DateTime, column `created_at`), `updatedAt` (DateTime, @updatedAt, column `updated_at`)
  - Relations: `project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)`, `owner User @relation(fields: [ownerId], references: [id], onDelete: Restrict)`
  - Indexes: `@@index([projectId])`, `@@index([ownerId])`, `@@index([isDeleted])`, `@@index([status])`
  - `@@map("scripts")`
  - No `aiModel` field — AI model is NOT persisted (per user feedback)

- **Step 2:** Modify `server/prisma/schema/project.prisma` — add `scripts Script[]` relation field to the `Project` model (per spec [UPDATE - CR-SCRIPT-001]).

- **Step 3:** Modify `server/prisma/schema/user.prisma` — add `scripts Script[]` relation field to the `User` model (needed for Prisma relation consistency).

- **Step 4:** Run schema merge script to regenerate `schema.prisma`:
  - Run: `cd server && node scripts/merge-schema.js`
  - Expected: `server/prisma/schema.prisma` updated with Script model + updated Project/User models

- **Step 5:** Generate Prisma client + create migration:
  - Run: `cd server && npx prisma generate`
  - Expected: Prisma client generated successfully
  - Run: `cd server && npx prisma migrate dev --name add_scripts_table`
  - Expected: Migration SQL file created in `server/prisma/migrations/`, DB updated

- **Step 6:** Verify migration:
  - Run: `cd server && npx prisma db pull`
  - Expected: `scripts` table exists with all columns and indexes

- **Step 7: Commit**
  - `git add server/prisma/schema/script.prisma server/prisma/schema/project.prisma server/prisma/schema/user.prisma server/prisma/schema.prisma server/prisma/migrations/`
  - `git commit -m "feat: add scripts table Prisma schema + migration"`