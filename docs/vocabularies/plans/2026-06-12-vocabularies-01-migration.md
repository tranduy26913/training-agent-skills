# Vocabulary Management — Database Migration Plan
> **For agentic workers:** REQUIRED SKILL: Use skill `executing-plans` to implement this plan.
> **Execution mode:** Phases are sequential. Tasks within a phase are executed sequentially.

## Plan Structure

## Phase 1 — Database Schema & Migration

### Task 1: Create Database Migration File

**Spec Reference:** `docs/vocabularies/specs/vocabularies-design/01-backend.md — Section 1.1`

**Files:**
- Create: `database/migrations/011_create_vocabularies_tables.sql`

- **Step 1:** Create migration SQL file with all 4 tables
  - Run: Create file with CREATE TABLE statements for:
    - `vocabularies` — main vocabulary table with all fields
    - `vocab_relations` — self-referencing relations table
    - `vocab_change_logs` — audit trail table
    - `vocab_reports` — user reports table
  - Expected: SQL file with proper syntax, indexes, and foreign keys

- **Step 2: Commit**
  - `git add database/migrations/011_create_vocabularies_tables.sql`
  - `git commit -m "feat(db): add vocabularies tables migration"`

### Task 2: Run Migration

**Spec Reference:** `docs/vocabularies/specs/vocabularies-design/01-backend.md — Section 1.1`

**Files:**
- Modify: `database/schema.sql` (if needed to include new tables)

- **Step 1:** Execute migration using npm script
  - Run: `cd server && npm run migrate`
  - Expected: Migration script runs and creates all 4 tables successfully

- **Step 2:** Verify table structure
  - Run: `mysql -u root -p vocabulary_db -e "DESCRIBE vocabularies; DESCRIBE vocab_relations; DESCRIBE vocab_change_logs; DESCRIBE vocab_reports;"`
  - Expected: Output showing all columns with correct types and constraints

- **Step 3: Commit**
  - `git add database/schema.sql`
  - `git commit -m "chore(db): update schema.sql with vocabularies tables"`
