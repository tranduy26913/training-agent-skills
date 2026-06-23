---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session
---

# Overview
Load plan, review critically, execute all phases and tasks sequentially, report when complete.

## Required skills - Allways reference the following skills when executing plans:
### With backend tasks:
- **coding-guidelines** - REQUIRED: Use for all implementation tasks that involve writing code
### With frontend tasks:
- **vue-best-practices** - REQUIRED: Use for all Vue.js implementation tasks
- **prime-vue** - REQUIRED: Use for any PrimeVue component in Vue.js implementation
- **vueuse-functions** - REQUIRED: Use for any VueUse function in Vue.js implementation
- **vue-testing-best-practices** - REQUIRED: Use for all Vue.js testing tasks
- **vue-router-best-practices** - REQUIRED: Use for any Vue Router implementation tasks

# Document Structure Principles
- Follow common file:`project_structure_spec.md` and `common-system-guide.md`
- Follow the specifications in the design spec (`docs/<topic>/specs/<topic>-design/`) — this is the source of truth for how to implement

# The Process (MUST FOLLOW EXACTLY)
## Step 1: Load and Review Plan
1. Only one plan will be loaded and executed at a time.
2. Review critically — identify hard blockers that would prevent execution entirely
3. Resolve any ambiguities independently using codebase context; do **not** ask the user unless a blocker cannot be resolved by any means
4. Create TodoWrite and proceed immediately

## Step 2: Execute Phase and Tasks (all sequential)
**Phases are sequential. Tasks within a phase are also executed sequentially, one after another.**

Execution rules:
1. Within each phase, execute each task in order.
2. Keep track of completed tasks before moving to the next.
3. When all tasks in a phase are completed, verify build and tests — no syntax errors or failing the entire test suite are allowed before proceeding to the next phase.
4. When a phase is completed, turn step 1 of the next phase into a TodoWrite and execute it

For each task:
1. Execute the task instructions exactly as written
2. Read the relevant specs, load the relevant skills, and reference them as needed

When all phases and tasks are completed, proceed to the Step 3: Post-Completion Review.

## Step 3: Post-Completion Review

After **ALL** tasks are completed, dispatch review:

**Locate the design spec package first:** `docs/<topic>/specs/<topic>-design/`  

#### A — Code Review
Load skill: `code-review`

Provide:
- `WHAT_WAS_IMPLEMENTED`: one-line summary of what was built
- `SPEC_FILES`: paths to `01-backend.md`, `02-frontend.md`, `03-behavior.md` in the spec package

#### B — UT Coverage Review
Load skill: `ut-review`

Provide:
- `QUALITY_SPEC`: path to `04-quality.md` in the spec package
- Focus: **UT only** — do not add or run E2E tests

#### After all complete:
1. Fix all **Critical** and **Important** issues from the code review report
2. Add all missing UT cases identified by the UT coverage review
3. Re-run `npx vitest run` — all UT tests must pass

## When to Stop and Ask for Help
**STOP executing immediately when:**
- Hit a blocker (missing dependency, test fails, instruction unclear)
- Plan has critical gaps preventing starting
- You don't understand an instruction
- Verification fails repeatedly

## When have next-step suggestions
**If you have a next-step suggestion for the user, use tool vscode_askQuestions:**

## Remember
- Review plan critically first
- Follow plan steps exactly
- Don't skip verifications
- Reference skills when plan says to
- Phases are sequential; tasks within a phase are also sequential
- If a phase has only one task, execute it directly
- Stop when blocked, don't guess
- Never start implementation on main/master branch without explicit user consent