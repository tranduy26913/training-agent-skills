---
name: review-and-fix-tests
description: "Use when reviewing, auditing, or fixing tests. Covers unit tests (UT) and end-to-end (E2E) tests. Use when: tests are missing, failing, incomplete, or need coverage review; before merging to verify test quality; after adding features to check untested code paths. Triggers: review tests, audit tests, missing tests, fix tests, add tests, test coverage, UT review, E2E review."
argument-hint: "Optional: path or module to focus on (e.g. src/modules/users)"
---

# Review and Fix Tests

**Announce at start:** "I'm using the review-and-fix-tests skill."

## Purpose

Audit existing unit tests (UT) and end-to-end (E2E) tests, identify gaps, add missing tests, then fix any failures until all tests pass.

---

## Required Skills — Load First

Before executing any step, load these skills:

- `d:\training\.github\skills\vue-testing-best-practices\SKILL.md` — for Vue/Vitest/Playwright patterns
- `d:\training\.github\skills\test-driven-development\SKILL.md` — for TDD discipline
- `d:\training\.github\skills\systematic-debugging\SKILL.md` — when fixing failing tests
- `d:\training\.github\skills\verification-before-completion\SKILL.md` — before claiming done

---

## Phase 1 — Discover

1. Identify test runner and E2E framework from `package.json` (Vitest, Jest, Playwright, Cypress…).
2. Find all test files: `**/*.{test,spec}.{ts,js,vue}` and E2E folders (`e2e/`, `tests/`, `cypress/`).
3. Run existing tests and capture baseline output:
   - **UT**: `npm run test` or `npx vitest run`
   - **E2E**: `npx playwright test` or `npx cypress run`
4. Note: total tests, passing, failing, skipped.

---

## Phase 2 — Audit Coverage

For each module / component under review:

| Check | UT | E2E |
|-------|----|-----|
| Happy path | ✅ required | ✅ required |
| Edge cases (empty, null, boundary values) | ✅ required | — |
| Error / failure paths | ✅ required | ✅ required |
| Auth / permission guards | ✅ required | ✅ required |
| UI interactions (click, submit, navigate) | component test | ✅ required |
| API integration | mock in UT | real in E2E |

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

### E2E Tests (Playwright preferred)

- Use Page Object Model pattern for reusable selectors.
- Test critical user flows end-to-end (login → action → result).
- Assert visible text, URL, and network responses where appropriate.
- Scope: only flows that unit tests cannot verify.

---

## Phase 4 — Fix Failing Tests

For each failing test:

1. Read the error message carefully — do not guess.
2. Load `systematic-debugging` skill procedure.
3. Determine root cause:
   - **Test is broken** → fix the test assertion or setup.
   - **Implementation is broken** → fix the source code (follow TDD red→green cycle).
4. Never delete a failing test to make CI green.
5. Re-run the specific test file after each fix to verify.

---

## Phase 5 — Verify All Pass

1. Run the full test suite:
   ```
   npx vitest run
   npx playwright test
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
