---
name: writing-plans
description: Create decision-complete, task-based coding plans from approved specifications, requirements, change requests, or repository context before implementation. Use when the user asks for an implementation plan, coding plan, task plan, phased delivery plan, or wants an approved design translated into executable engineering tasks.
---

# Writing Plans

## Purpose

Create one execution-ready plan for the `executing-plans` skill. Write for a skilled developer or agent who has no prior context about the feature or repository.

Produce a decision-complete plan: the executor may discover implementation details, but must not need to choose product behavior, public contracts, data ownership, failure handling, test scope, or rollout strategy.

Do not implement code while writing the plan.

## Non-Negotiable Output Rules

- Use numbered tasks as the mandatory execution unit.
- Save one consolidated plan file per independently deliverable feature. Never force migration, backend, frontend, and review into four separate files.
- Use phases only to group dependency boundaries inside the same plan file.
- Include explicit dependencies, source references, implementation checklists, and verifiable completion criteria in every task.
- Place dedicated review and test tasks after all implementation tasks. Run review first, then backend tests, then frontend tests, then final verification; omit only inapplicable layers.
- Do not require a commit after each task unless the user explicitly requests a commit strategy.
- Do not include implementation code blocks. Describe interfaces, behavior, data flow, and verification precisely enough to implement.
- Use the user's language for prose. Preserve technical identifiers, commands, paths, and spec headings exactly.

## Evidence-First Workflow

Follow these steps in order.

### 1. Establish the planning source

Read every user-specified requirement, approved design, change request, ADR, issue, and relevant spec file completely. When a spec package exists, inspect its index and every concern file needed by the feature.

Treat approved product decisions as authoritative. Do not treat an old plan as authoritative when current specs or repository state disagree with it.

### 2. Ground the plan in the repository

Before asking questions or defining tasks, inspect the actual environment:

- Locate manifests, build scripts, framework versions, schemas, migrations, entrypoints, routes, services, stores, components, and tests relevant to the request.
- Read existing implementation patterns before proposing new files or abstractions.
- Run non-mutating checks when useful to establish the baseline.
- Verify every path, symbol, command, and test script named in the plan.

Do not ask the user for facts discoverable from the repository.

### 3. Separate evidence categories

Classify findings before decomposing work:

- **Specification requirement:** behavior explicitly required by a spec or approved requirement.
- **Repository fact:** current implementation, convention, dependency, or limitation discovered in code.
- **Repository prerequisite:** broken or missing foundation that must be repaired before the feature can be implemented or verified.
- **Decision / Deviation:** an approved choice outside the spec or a deliberate departure from it.

Never silently convert a repository fact into a product requirement. Never silently choose between conflicting sources.

### 4. Resolve only material ambiguity

Ask the user only when an unresolved choice materially changes scope, public contracts, stored data, security, compatibility, or user-visible behavior.

If the spec and code conflict:

1. Describe the conflict with exact references.
2. Determine whether an approved decision already resolves it.
3. Ask for a decision if no authoritative resolution exists.
4. Record the resolution under `Decision / Deviation` in affected tasks.

Do not emit a final plan while a high-impact decision remains open.

### 5. Lock the implementation contract

Before creating tasks, state the following when applicable:

- Goal and measurable completion criteria.
- Audience and authorization boundary.
- Public APIs, request/response types, events, routes, schemas, and configuration changes.
- Data ownership, validation, status transitions, and error behavior.
- Compatibility, migration, rollout, and observability expectations.
- Explicit assumptions and out-of-scope items.

### 6. Build the dependency flow

Derive a dependency graph before numbering tasks. A later task may consume output only from earlier tasks or explicitly named prerequisites.

Use the following decomposition order as a heuristic, not a required checklist:

1. Repository or tooling prerequisites.
2. Domain contracts and validation.
3. Persistence and repositories.
4. Business services and transactions.
5. External integrations.
6. HTTP or other public interfaces.
7. Frontend data layer.
8. Components.
9. Pages, routes, and workflows.
10. Internationalization and accessibility.
11. Code and spec review.
12. Backend tests.
13. Frontend tests.
14. Final verification.

Include only applicable tasks. Do not add unrelated refactors. Split into another plan only when a subsystem can be built, tested, and delivered independently.

Keep every review and test task at the end of the plan, after implementation is complete. The review task must precede all test tasks so its findings can refine the final test scope.

## Traceability Rules

Every implementation, review, and test task must trace to its source.

### When a design spec exists

Reference the exact file plus section, endpoint, table, component, event, or test-case table. Use the owning concern when the repository follows the standard spec package:

- Database, API, server types, validation: `01-backend.md`.
- Layout, components, client types, routes: `02-frontend.md`.
- Events, states, dialogs, data flow, navigation: `03-behavior.md`.
- Tests, performance, security, operations: `04-quality.md`.

Use multiple references when a task crosses concerns. Verify each referenced heading exists. Never invent a path or section.

### When no design spec exists

Write `**Spec References:** No design spec exists.` and add the exact requirement, ADR, issue, or repository source under `Requirements References` or `Repo References`.

### When work is outside or different from the spec

Add one of these explicit labels:

- `**Repository Prerequisite:**` for foundational work required by the real repository.
- `**Decision / Deviation:**` for an approved choice not stated in, or intentionally different from, the spec.

The final review must prove that every requirement maps to at least one task.

## Task Design Rules

- Number tasks as `Task 01`, `Task 02`, and so on.
- Make each task deliver one coherent capability or verification boundary.
- State `Depends on` when the dependency is not obvious from sequence.
- Describe observable behavior and contracts, not merely a list of files.
- Use exact paths only after verifying them in the repository.
- Include failure modes and edge cases when they affect implementation.
- Use `- [ ]` checkboxes for executable work.
- End with `Done when` containing concrete, verifiable outcomes.
- Name commands only after confirming they exist in manifests or repository tooling; state their expected result.
- Keep tasks concise, but do not impose an arbitrary task count.

Do not use:

- `TODO`, `TBD`, placeholder paths, or fake identifiers.
- Vague instructions such as “implement as needed,” “handle errors,” or “add tests.”
- Tasks that only enumerate files without defining behavior or outcome.
- Detailed source code or large pseudocode blocks.
- Automatic commit steps unless requested.

## Review and Testing Order

Keep implementation tasks focused on production changes. Use local non-test checks such as schema validation, typecheck, compile, or build only when they are useful completion evidence for that task.

After all implementation tasks, create the applicable closing tasks in this exact order:

1. **Code and spec review:** compare the completed implementation with all referenced specs, locked decisions, public contracts, repository conventions, security requirements, and scope boundaries. Fix confirmed implementation gaps before tests are written or finalized.
2. **Backend tests:** implement and run the complete backend unit and integration coverage identified by the quality spec and review findings.
3. **Frontend tests:** implement and run component, store, composable, router, and page coverage identified by the quality spec and review findings.
4. **Final verification:** run full suites, typechecks, production builds, migration checks, smoke paths, and the final spec-to-code audit.

Keep backend and frontend tests in separate tasks when both layers exist. Do not duplicate the same scenario across multiple test levels without a clear regression reason.

Test tasks must specify:

- Test level: unit, integration, component, store, router, or end-to-end when explicitly in scope.
- Success, validation, authorization, state transition, and failure scenarios.
- External boundaries that must be faked or mocked.
- Isolation and cleanup requirements for databases or mutable state.
- Exact verified commands and expected results.

Do not call real external services in automated tests unless the approved specification explicitly requires it.

Final verification must include all applicable checks: schema or migration validation, full test suites, typecheck, production build, lint or formatting checks, manual smoke paths, and confirmation that all review findings were resolved.

## Required Plan Format

Write the plan using this structure:

```markdown
# <Feature Name> — Task-based Coding Plan

> **For agentic workers:** REQUIRED SKILL: Use skill `executing-plans` to implement this plan.

## Summary

<Goal, current baseline, success criteria, and important scope boundaries.>

## Locked Decisions / Public Contracts

<APIs, types, schemas, routes, state transitions, failure behavior, and approved deviations.>

## Dependency Flow

`Task 01 → Task 02 → Task 03`

## Phase 1 — <Dependency Boundary>

### Task 01 — <Outcome-Oriented Name>

**Depends on:** None

**Spec References**

- `<verified spec path> — <exact section, endpoint, component, or table>`

**Repo References**

- `<verified current file or symbol>`

**Repository Prerequisite** or **Decision / Deviation**

<Include only when applicable.>

**Work**

- [ ] <Concrete implementation action and required behavior.>
- [ ] <Concrete verification action.>

**Done when:** <Observable and verifiable completion criteria.>

## Final Phase — Review and Tests

### Task NN — Code and Spec Review

<Use the same required task fields. Review and fix implementation gaps before test tasks.>

### Task NN+1 — Backend Tests

<Include only when a backend exists.>

### Task NN+2 — Frontend Tests

<Include only when a frontend exists.>

## Final Verification

- [ ] <Full-suite and build checks.>
- [ ] <Spec coverage and manual acceptance checks.>

## Assumptions and Out of Scope

- <Explicit assumption or exclusion.>
```

Use one or more phases in the same file. When only one dependency boundary exists, use one phase containing all tasks. The numbered tasks, not the phases, are the primary execution units.

## Save and Return the Plan

Default to `docs/<topic>/plans/YYYY-MM-DD-<topic>-implementation.md`. Follow a more specific existing repository naming convention when one is clearly established.

If the target file already exists:

- Update it when the user is revising that same plan.
- Do not overwrite a different plan without confirmation.

Create exactly one plan artifact for the feature. Do not add README, changelog, template, or auxiliary files.

After saving, return:

1. A clickable path to the saved plan.
2. The complete plan content for immediate review.
3. A concise note identifying important assumptions, repository prerequisites, and deviations.

## Self-Review Gate

Before saving, answer every check:

1. Are the goal and measurable success criteria explicit?
2. Were the relevant specs and current implementation both inspected?
3. Does every source reference exist and point to the right concern?
4. Does every requirement map to at least one task?
5. Are public contracts, data flow, state transitions, and failure modes locked?
6. Is the dependency flow acyclic and ordered correctly?
7. Does every task have executable checkboxes and verifiable `Done when` criteria?
8. Are all review and test tasks at the end, ordered as review, backend tests, frontend tests, then final verification?
9. Do test tasks cover new behavior, failures, authorization, review findings, and regressions without unnecessary duplication?
10. Were all commands verified against repository tooling?
11. Does the plan avoid unrequested refactors?
12. Are all repository prerequisites and spec deviations explicit?
13. Would the executor still need to make a material product or architecture decision?

If the answer to the final check is yes, continue exploring or ask the user for the missing decision. Do not save or present the plan yet.
