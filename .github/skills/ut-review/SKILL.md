---
name: ut-review
description: Unit test coverage review against 04-quality.md spec. Finds gaps, adds missing tests, and keeps spec in sync.
argument-hint: "Optional: path to 04-quality.md spec file (e.g. docs/users/specs/users-design/04-quality.md)"
context: fork
---

# UT Review

**Announce at start:** "I'm using the ut-review skill."

## Overview

This skill audits unit test coverage and keeps the test suite and the design spec (`04-quality.md`) in sync.

**When `04-quality.md` path is provided — Spec-Driven mode (Phase 0):**
- **Step 0-A (spec → code)**: reads every row in the UT tables (`# | Test Case | Arrange | Act | Assert`), finds which test cases are missing in the codebase, adds them following the exact Arrange/Act/Assert from the spec, then runs `npx vitest run` to verify all pass.
- **Step 0-B (code → spec)**: finds test cases that were written during implementation but are not yet in `04-quality.md`, and adds them to the correct table — keeping the spec file in sync with the actual test suite.

**When no spec is provided — General mode (Phase 1–5):**  
Discovers all unit test files, audits coverage against standard UT criteria (happy path, edge cases, error paths, auth guards), adds missing tests, fixes failing tests, and verifies the full suite passes.

**Scope:** UT only — does not add or run E2E tests.

---

## Required Skills — Load First

Before executing any step, load these skills:

- `vue-testing-best-practices` — for Vue/Vitest patterns
- `test-driven-development` — for TDD discipline
- `systematic-debugging` — when fixing failing tests
- `verification-before-completion` — before claiming done

---

## Phase 0 — Spec-Driven Audit _(when 04-quality.md path is provided)_

> Use this phase when a design spec exists for the feature being reviewed.

### Step 0-A: Gap Detection (spec → code)
1. Read `04-quality.md` at the provided path.
2. For each table in the UT section (`# | Test Case | Arrange | Act | Assert`):
   - Find the corresponding test file in the codebase
   - Check whether each test case is implemented (match by test name or described behavior)
3. Build a **gap list**: test cases in spec but missing in code.
4. Add each missing test following the exact `Arrange / Act / Assert` columns from the spec table.
5. Run `npx vitest run` — all tests must pass.

### Step 0-B: Sync-Back (code → spec)
> **When new test cases were written during implementation that are not in 04-quality.md:**

1. For each test case in code that has no corresponding row in `04-quality.md`:
   - Determine the correct table section (page or composable)
   - Add a new row: `| N | [Test Case name] | [Arrange] | [Act] | [Assert] |`
2. Save `04-quality.md` — spec must stay in sync with the actual test suite.
3. Report: spec cases (before/after), code cases (before/after), rows added to spec.

---

## Phase 1 — Discover

1. Identify test runner from `package.json` (Vitest, Jest…).
2. Find all unit test files: `**/*.{test,spec}.{ts,js,vue}`.
3. Run existing tests and capture baseline output:
   - `npm run test` or `npx vitest run`
4. Note: total tests, passing, failing, skipped.

---

## Phase 2 — Audit Coverage

For each module / component under review:

| Check | Required |
|-------|----------|
| Happy path | ✅ |
| Edge cases (empty, null, boundary values) | ✅ |
| Error / failure paths | ✅ |
| Auth / permission guards | ✅ |
| UI interactions (click, submit, navigate) | ✅ component test |
| API calls | ✅ mock at boundary |

Flag any **missing** or **weak** tests (e.g. tests that only check snapshots without assertions).

---

## Phase 3 — Add Missing Tests

### Unit Tests (Vitest + Vue Test Utils)

- Follow **black-box** approach: test behavior, not implementation.
- Use `createTestingPinia()` for stores.
- Use `flushPromises()` after async operations.
- Never snapshot-only tests — always include meaningful assertions.
- Group with `describe` blocks matching the file under test.
- One `it` / `test` per behavior.

---

## Phase 4 — Fix Failing Tests

For each failing test:

1. Read the error message carefully — do not guess.
3. Determine root cause:
   - **Test is broken** → fix the test assertion or setup.
   - **Implementation is broken** → fix the source code (follow TDD red→green cycle).
4. Never delete a failing test to make CI green.
5. Re-run the specific test file after each fix to verify.

---

## Phase 5 — Verify All Pass

1. Run the full unit test suite:
   ```
   npx vitest run
   ```
2. All tests must be **green** before declaring done.
3. Add a short summary: tests added, tests fixed, coverage delta (if available).

---

## Rules

- **Never disable or skip a test** without a written comment explaining why and a linked issue.
- **Never mock implementation details** — mock boundaries (HTTP, DB, file system).
- **Keep tests fast** — unit tests < 100 ms each; E2E only for flows unit tests cannot cover.
- Follow existing naming conventions in the codebase.
- Apply `clean-code` and `vue-best-practices` skills when writing new test files.
