---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session
---

# Executing Plans

## Overview
Load plan, review critically, execute all phases sequentially, report when complete.
Tasks **within** the same phase are dispatched as parallel subagents. Phases are sequential — all tasks in a phase must complete before the next phase starts.
If the plan has only 1 phase with 1 task, parallel subagents are not required.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

**Required skills:** Allways reference the following skills when executing plans:
- **test-driven-development** - REQUIRED: Use for all implementation tasks that involve writing code (TDD)
- **coding-guidelines** - REQUIRED: Use for all implementation tasks that involve writing code
- **vue-best-practices** - REQUIRED: Use for all Vue.js implementation tasks
- **prime-vue** - REQUIRED: Use for any PrimeVue component in Vue.js implementation
- **vueuse-functions** - REQUIRED: Use for any VueUse function in Vue.js implementation
- **vue-testing-best-practices** - REQUIRED: Use for all Vue.js testing tasks
- **vue-router-best-practices** - REQUIRED: Use for any Vue Router implementation tasks

## The Process

### Step 1: Load and Review Plan
1. Read plan file
2. Review critically — identify hard blockers that would prevent execution entirely
3. Resolve any ambiguities independently using codebase context; do **not** ask the user unless a blocker cannot be resolved by any means
4. Create TodoWrite and proceed immediately

### Step 2: Execute Phases (sequential) and Tasks (parallel within phase)
**Phases are sequential. Tasks within a phase run in parallel.**

Execution rules:
1. Execute phases in order (Phase 1 → Phase 2 → …). Do not start a phase until all tasks of the previous phase are completed.
2. Within each phase, dispatch independent tasks as parallel subagents.
3. If a task inside a phase has `Depends on: Task N`, wait for that task to complete before starting the dependent task.
4. If a phase has only 1 task, execute it directly without spawning a subagent (unless the user asks).
5. Keep the parent agent responsible for phase sequencing, task completion tracking, integration decisions, and final verification.

For each phase:
1. Mark phase as in_progress
2. Dispatch all independent tasks in the phase as parallel subagents
3. Wait for all tasks in the phase to complete
4. Mark phase as completed, then start the next phase

### Step 3: Post-Completion Review

After **ALL** tasks are marked completed, dispatch **three subagents in parallel**:

**Locate the design spec package first:** `docs/<topic>/specs/<topic>-design/`  
_(If no spec package exists — e.g., pure refactoring — skip `SPEC_FILES`, `QUALITY_SPEC`, and `E2E_SPEC`. Subagent A runs Technical Review only; Subagent B and C run their respective Phase 1–5 fallback modes.)_

#### Subagent A — Code Review
Load skill: `code-review` _(context: fork)_

Provide:
- `WHAT_WAS_IMPLEMENTED`: one-line summary of what was built
- `SPEC_FILES`: paths to `01-backend.md`, `02-frontend.md`, `03-behavior.md` in the spec package _(omit if no spec)_
- `BASE_SHA`: first commit of this feature — `git log --oneline origin/main..HEAD | tail -1 | awk '{print $1}'`
- `HEAD_SHA`: `git rev-parse HEAD`

#### Subagent B — UT Coverage Review
Load skill: `ut-review` _(context: fork)_

Provide:
- `QUALITY_SPEC`: path to `04-quality.md` in the spec package _(omit if no spec — ut-review will run Phases 1–5 instead)_
- Focus: **UT only** — do not add or run E2E tests

#### Subagent C — E2E Tests
Load skill: `playwright-e2e` _(context: fork)_ → run **Phase 5: Standalone Post-Implementation E2E Writer**

Provide:
- `FEATURE`: one-line summary of what was built
- `QUALITY_SPEC`: path to `04-quality.md` in the spec package _(omit if no spec — skip Subagent C entirely)_
- `E2E_DIR`: `client/e2e/`

#### After all subagents complete:
1. Fix all **Critical** and **Important** issues from the code review report
2. Add all missing UT cases identified by the UT coverage review
3. Re-run `npx vitest run` — all UT tests must pass
4. Run E2E tests written by Subagent C: `npx playwright test --reporter=list`


## When use tool [vscode_askQuestions]
- Always present next-step suggestions as a short list of selectable options using the VS Code vscode_askQuestions tool.
- Provide 3–6 concise options. Do not accept freeform text unless the user explicitly requests it.
- Each option must have a clear label and optional description. Mark the recommended default with recommended: true.
- Wait for the user's choice, then continue handling that specific selection.
- allowFreeformInput: true, allow the user to provide freeform text input if they select an "Other" option or if the question requires it. Handle the freeform input appropriately based on the context of the question.

## When to Stop and Ask for Help
**STOP executing immediately when:**
- Hit a blocker (missing dependency, test fails, instruction unclear)
- Plan has critical gaps preventing starting
- You don't understand an instruction
- Verification fails repeatedly

**Ask for clarification rather than guessing.**
- Always use tool vscode_askQuestions to ask for help.

## When have next-step suggestions
**If you have a next-step suggestion for the user, use tool vscode_askQuestions:**

## When to Revisit Earlier Steps

**Return to Review (Step 1) when:**
- Partner updates the plan based on your feedback
- Fundamental approach needs rethinking

**Don't force through blockers** - stop and ask.

## Remember
- Review plan critically first
- Follow plan steps exactly
- Don't skip verifications
- Reference skills when plan says to
- Phases are sequential; tasks within a phase run in parallel as subagents by default
- If a phase has only one task, direct execution is acceptable
- Stop when blocked, don't guess
- Never start implementation on main/master branch without explicit user consent
