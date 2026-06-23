--- 
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code 
--- 

# Writing Plans 
## Overview

Write execution-ready plans for the `executing-plans` skill. Audience: skilled developers with no context on our codebase or problem domain. DRY. YAGNI. TDD. Frequent commits.

## Scope Check

If the spec covers multiple independent subsystems, split into separate plans — one per subsystem. Each plan must produce working, testable software on its own.

## Phase Structure

Organize tasks into **Phases**. Phases are sequential — each phase starts only after the previous phase completes. Tasks within a phase are also executed sequentially.

Rules:
- Group related tasks that logically belong together into the same phase.
- Start a new phase only when tasks depend on output from the previous phase.
- If the plan has only one phase, use a single `## Phase 1 — [Name]` heading with tasks nested under it.
- Separate phases into 4 files, Do not create any other files besides the 4 below: 
`YYYY-MM-DD-<topic>-01-migration.md`: DB schema + migration tasks. Short descriptions
`YYYY-MM-DD-<topic>-02-backend.md`: Backend API tasks + Test tasks related to backend + Build success/test verification
`YYYY-MM-DD-<topic>-03-frontend.md`: Frontend store + UI tasks + Test tasks related to frontend, Build success/test verification
`YYYY-MM-DD-<topic>-04-review.md`: review tests + review code

## File Structure

Before defining tasks, map out which files will be created or modified and what each one is responsible for. This is where decomposition decisions get locked in.

- Design units with clear boundaries and well-defined interfaces. Each file should have one clear responsibility.
- You reason best about code you can hold in context at once, and your edits are more reliable when files are focused. Prefer smaller, focused files over large ones that do too much.
- Files that change together should live together. Split by responsibility, not by technical layer.
- In existing codebases, follow established patterns. If the codebase uses large files, don't unilaterally restructure - but if a file you're modifying has grown unwieldy, including a split in the plan is reasonable.

This structure informs the task decomposition. Each task should produce self-contained changes that make sense independently.

## Keep Plans SHORT
- 5-10 clear tasks max
- Only actionable items
- Keep the task description section in spec. No code in the task body.

## Reference the Design Spec in Every Task
> **Every implementation task must trace directly to its spec source. Never implement from memory or assumption.**
- Implement per `01-backend.md` — SV-002"
- Build `[ListPage]` per `02-frontend.md` — Section 3.1
- Write unit tests per `04-quality.md` — [CreatePage] Unit Tests table
- Handle form validation per rules in `01-backend.md` — Section 3. Validation Rules

> **Rule:** Each task must include a `**Spec Reference:**` field linking to the exact spec file and section. An executor who has never seen the feature must be able to open the spec and know exactly what to build.

## Tests are embedded in tasks, not deferred
- Tests live in the same task as the code they test.

##  No Placeholders or Vague Language
- No `[TODO]`, `TBD`, vague paths (`path/to/file.ts`), or steps with no verifiable outcome. Every command must have an expected result.
> **Rule:** If a step requires the executor to ask a question before acting, it must be rewritten.

## Plan Document Header
**Every plan MUST start with this header:**

````markdown
# [Feature Name] Implementation Plan
> **For agentic workers:** REQUIRED SKILL: Use skill `executing-plans` to implement this plan.

## Plan Structure
````markdown
## Phase 1 — [Name]
### Task N: [Task Name]

**Spec Reference:** `docs/<topic>/specs/<topic>-design/01-backend.md — Section X.Y`

**Files:**
- Create: `exact/path/to/file.ts`
- Modify: `exact/path/to/existing.ts`
- Test: `exact/path/to/test.spec.ts` _(omit if no tests in this task)_

- **Step 1:** [Describe what to do — e.g., run migration, implement endpoint, write tests in Section X.Y of 01-backend.md, etc.] 
[Describe content of the spec that is relevant to this task. This is a sanity check to ensure the task is fully informed by the spec and not based on memory or assumption.]
  - Run: `[command]`
  - Expected: [verifiable outcome]

- **Step 2: Commit**
  - `git add [files]`
  - `git commit -m "feat: [description]"`

[In task can have multiple steps (can be more than 2)]
````


## CheckList Review (run before saving)

1. **Spec coverage** — every spec requirement maps to a task. Add missing tasks.
2. **Placeholder scan** — no vague paths, missing commands, or unverifiable outcomes.
3. **Type consistency** — types and method names match across all tasks.
4. **Dependency check** — tasks that depend on prior phase output are in a later phase.
5. **Test coverage check** — every phase that writes logic includes tests. No task defers tests to a later phase. No tests for tasks with no logic (migrations, config, type files).
