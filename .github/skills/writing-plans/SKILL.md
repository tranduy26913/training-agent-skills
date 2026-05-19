--- 
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code 
--- 

# Writing Plans 
## Overview
Write comprehensive implementation plans assuming the engineer has zero context for our codebase and questionable taste. Document everything they need to know: which files to touch for each task, code, testing, docs they might need to check, how to test it. Give them the whole plan as bite-sized tasks. DRY. YAGNI. TDD. Frequent commits.

Plans must be execution-ready for the `executing-plans` skill. When a plan has multiple tasks, task boundaries must be explicit enough that independent tasks can be dispatched to subagents in parallel.

Assume they are a skilled developer, but know almost nothing about our toolset or problem domain. Assume they don't know good test design very well.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Context:** Prefer a dedicated worktree when the user or workflow provides one. If not, write the plan for the current workspace without assuming worktree-only setup. 

**Save plans to:** docs/<topic>/plans/YYYY-MM-DD-<topic>.md - (User preferences for plan location override this default) 

## Scope Check

If the spec covers multiple independent subsystems, it should have been broken into sub-project specs during brainstorming. If it wasn't, suggest breaking this into separate plans — one per subsystem. Each plan should produce working, testable software on its own.

## File Structure

Before defining tasks, map out which files will be created or modified and what each one is responsible for. This is where decomposition decisions get locked in.

- Design units with clear boundaries and well-defined interfaces. Each file should have one clear responsibility.
- You reason best about code you can hold in context at once, and your edits are more reliable when files are focused. Prefer smaller, focused files over large ones that do too much.
- Files that change together should live together. Split by responsibility, not by technical layer.
- In existing codebases, follow established patterns. If the codebase uses large files, don't unilaterally restructure - but if a file you're modifying has grown unwieldy, including a split in the plan is reasonable.

This structure informs the task decomposition. Each task should produce self-contained changes that make sense independently.

## Parallel-Ready Task Design

Plans are not only documentation artifacts. They are execution inputs.

- Decompose tasks so unrelated work can run in parallel.
- Make dependencies explicit. If Task 3 depends on Task 1, say so directly.
- Avoid plans where every task implicitly depends on the previous one unless that is genuinely required.
- **Organize tasks into Phases** — all tasks within a phase can execute in parallel; phases are sequential.
  - **Phase 1 — Foundation:** Schema migrations, shared types/interfaces, seed data. These have no dependencies.
  - **Phase 2 — Core Implementation (parallel):** Backend endpoints + Frontend store/composable can typically run in parallel after Phase 1.
  - **Phase 3 — UI Layer (parallel):** Individual page components (List, Create, Edit) can run in parallel with each other, after the store is ready.
  - **Phase 4 — Quality:** Backend integration tests + Frontend component unit tests. Must run after Phase 2 and 3 are complete.
  - _Not every plan needs all 4 phases. Only define phases that actually apply._
- Prefer vertical slices with clear ownership over broad phase buckets like "frontend", "backend", "testing" when those buckets force unnecessary serialization.
- If multiple tasks touch the same files heavily, either merge them into one task lane or redesign the plan to reduce conflict.
- If a plan has only one meaningful task, keep it as one task. Do not split artificially just to create parallelism.

Before finalizing the plan, ask: "Could an executing agent safely dispatch 2 or more tasks in parallel without constant integration conflicts?" If not, refine the task boundaries.

## Planning Principles (NOT Fixed Task Templates!)
> 🔴 **No fixed task count or canned phase structure. Each plan is unique to the task.**
### Principle 1: Keep It SHORT
| ❌ Wrong | ✅ Right |
|----------|----------|
| 50 tasks with sub-tasks | 5-10 clear tasks max |
| Every micro-step listed | Only actionable items |
| Verbose descriptions | One-line per task. Keep the task description concise and high-level; do not include any code within the task description. |

### Principle 2: Be SPECIFIC, Not Generic
| ❌ Wrong | ✅ Right |
|----------|----------|
| "Set up project" | "Run npx create-next-app" |
| "Add authentication" | "Install next-auth, create /api/auth/[...nextauth].ts" |
| "Style the UI" | "Add Tailwind classes to Header.tsx" |

> **Rule:** Each task should have a clear, verifiable outcome.

### Principle 3: Dynamic Content Based on Project Type

**For NEW PROJECT:**
- What tech stack? (decide first)
- What's the MVP? (minimal features)
- What's the file structure?

**For FEATURE ADDITION:**
- Which files are affected?
- What dependencies needed?
- How to verify it works?

**For BUG FIX:**
- What's the root cause?
- What file/line to change?
- How to test the fix?

### Principle 4: Reference the Design Spec in Every Task
> 🔴 **Every implementation task must trace directly to its spec source. Never implement from memory or assumption.**

| ❌ Wrong | ✅ Right |
|----------|----------|
| "Implement the create endpoint" | "Implement per `01-backend.md` — SV-002" |
| "Build the list page" | "Build `[ListPage]` per `02-frontend.md` — Section 3.1" |
| "Write unit tests" | "Write tests per `04-quality.md` — [CreatePage] Unit Tests table" |
| "Handle form validation" | "Validate per rules in `01-backend.md` — Section 3. Validation Rules" |

> **Rule:** Each task must include a `**Spec Reference:**` field linking to the exact spec file and section. An executor who has never seen the feature must be able to open the spec and know exactly what to build.

### Principle 5: Verification is Simple
| ❌ Wrong | ✅ Right |
|----------|----------|
| "Verify the component works correctly" | "Run npm run dev, click button, see toast" |
| "Test the API" | "curl localhost:3000/api/users returns 200" |
| "Check styles" | "Open browser, verify dark mode toggle works" |

### Principle 6: Tasks Must Be Phase-Organized and Parallelizable
| ❌ Wrong | ✅ Right |
|----------|----------|
| "Task 1: Backend, Task 2: Frontend, Task 3: Tests" | "Phase 1: DB schema. Phase 2 (parallel): Backend API + Frontend store. Phase 3 (parallel): List page + Create page + Edit page. Phase 4: Tests" |
| Hidden dependencies between all tasks | Explicit `Depends on:` only where truly required |
| Two tasks editing the same central file heavily | One task lane or a cleaner decomposition |
| Every task in its own sequential step | Group independent tasks in the same phase so they run in parallel |

> **Rule:** If the plan has multiple tasks, assume `executing-plans` will try to run tasks within the same phase in parallel. Write task boundaries so that is safe.

### Principle 7: No Placeholders or Vague Language
> 🔴 **Plans with vague steps cannot be executed. Every step must be immediately actionable.**

Red flags to scan for before finalizing:
- `[TODO]`, `TBD`, `...`, "add appropriate logic", "handle errors properly"
- Step descriptions with no verifiable outcome
- File paths without exact names (`path/to/file.ts` instead of `client/src/pages/users/UserListPage.vue`)
- Test commands without expected output
- "Same as above" references instead of explicit instructions

> **Rule:** If a step requires the executor to ask a question before acting, it must be rewritten.

## Plan Document Header
**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan 
> **For agentic workers:** REQUIRED SUB-SKILL: Use skill executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.
> **Execution mode:** Tasks within the same Phase run in parallel. Phases are sequential.

**Goal:** [One sentence describing what this builds]
**Architecture:** [2-3 sentences about approach]
**Tech Stack:** [Key technologies/libraries]

## Execution Phases

### Phase 1 — Foundation _(sequential, others depend on this)_
- Task 1: [Database schema / migrations]
- Task 2: [Shared TypeScript types / interfaces]

### Phase 2 — Core Implementation _(tasks in this phase run in parallel)_
- Task 3: [Backend service + API endpoints]
- Task 4: [Frontend store + composable]

### Phase 3 — UI Layer _(tasks in this phase run in parallel, after Phase 2)_
- Task 5: [List page + table component]
- Task 6: [Create page + form component]
- Task 7: [Edit page]

### Phase 4 — Quality _(after Phase 2 and 3)_
- Task 8: [Backend integration tests]
- Task 9: [Frontend component unit tests]

---
```

> Only define phases that apply to this plan. A simple CRUD feature might only need Phases 1–3. A pure backend task might only need Phases 1–2. Never add empty phases.

If the plan has only 1 task, `Execution Phases` may be omitted.

## Task Structure
````markdown
### Task N: [Task Name]

**Phase:** [1 / 2 / 3 / 4]
**Depends on:** [Task N, if required] or `None`
**Spec Reference:** [e.g., `docs/<topic>/specs/<topic>-design/01-backend.md — SV-001 to SV-003`]

**Files:**
- Create: `exact/path/to/file.ts`
- Modify: `exact/path/to/existing.ts`
- Test: `exact/path/to/test.spec.ts`

- [ ] **Step 1: Write the failing test**
  - Write test cases as defined in `04-quality.md — [relevant section name]`
  - Run: `[test command] --reporter=verbose`
  - Expected: FAIL — implementation does not exist yet

- [ ] **Step 2: Implement**
  - Implement per spec in `**Spec Reference**` above
  - Follow exact field names, endpoint contracts, and flows defined in the spec
  - Do NOT add logic not described in the spec
  - Run: `[test command]`
  - Expected: PASS

- [ ] **Step 3: Commit**
  - `git add [files]`
  - `git commit -m "feat: [short description matching the spec section]"`

**Effort:** [X hours] _(manual by senior developer 3-5 years experience, no AI assistance)_

````

## REMEMBER
- Tasks follow TDD principles: write failing test → verify it fails → implement per spec → verify it passes → commit.
- Every task must have a `**Spec Reference:**` field. The executor must be able to open the spec and know exactly what to build.
- Exact commands with expected output. No vague verification steps.
- Make phase dependencies explicit so execution can be parallelized safely.
- DRY, YAGNI, frequent commits. 

## Self-Review
After writing the complete plan, look at the spec with fresh eyes and check the plan against it. This is a checklist you run yourself — not a subagent dispatch.

**1. Spec coverage:** Skim each section/requirement in the spec. Can you point to a task that implements it? List any gaps.

**2. Placeholder scan:** Search your plan for the red flags listed in **Principle 7** above. Fix any vague steps, missing file paths, or unverifiable outcomes.

**3. Type consistency:** Do the types, method signatures, and property names you used in later tasks match what you defined in earlier tasks? A function called clearLayers() in Task 3 but clearFullLayers() in Task 7 is a bug. If you find issues, fix them inline. No need to re-review — just fix and move on. If you find a spec requirement with no task, add the task. 

**4. Parallel execution check:** If the plan has multiple tasks, can independent tasks be run by subagents without hidden file conflicts, hidden ordering assumptions, or missing dependency notes? If not, rewrite the task boundaries before finalizing the plan.

**5. Workflow consistency check:** Does the plan assume tools, branches, worktrees, or setup steps that are not actually required by the current workflow? If yes, rewrite those assumptions so the executor can act without guesswork.

## Process Flow
```dot
digraph brainstorming {
    "Writing the plan" [shape=box];
    "Self-review" [shape=box];
    "Review plan?" [shape=diamond];
    "User reviews plan?" [shape=diamond];
    "Invoke executing-plans skill?" [shape=doublecircle];
    "End" [shape=doublecircle];

    "Writing the plan" -> "Self-review\n(fix inline)";
    "Self-review" -> "Review plan?";
    "Review plan?" -> "Fix plan" [label="issues found"];
    "Review plan?" -> "User reviews plan?" [label="approved"];
    "User reviews plan?" -> "Writing the plan" [label="fix plan"];
    "User reviews plan?" -> "Invoke executing-plans skill?" [label="approved"];
}
```

## After User Approves the Plan

Invoke the `executing-plans` skill to start implementation. Do NOT start writing code directly — always go through `executing-plans`.