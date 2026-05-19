---
name: test-driven-development
description: Drives development with tests. Use when implementing any logic, fixing any bug, or changing any behavior.
---

# Test-Driven Development (TDD)

## Overview

Write a failing test before writing the code that makes it pass. Tests are proof — "seems right" is not done.

**When to use:** Implementing new logic, fixing bugs, modifying existing behavior, adding edge cases.  
**When NOT to use:** Pure config changes, documentation, static content with no behavioral impact.

---

## The TDD Cycle

```
    RED                GREEN              REFACTOR
 Write a test    Write minimal code    Clean up the
 that fails  ──→  to make it pass  ──→  implementation  ──→  (repeat)
      │                  │                    │
      ▼                  ▼                    ▼
   Test FAILS        Test PASSES         Tests still PASS
```

1. **RED** — Write a test that fails. A test that passes immediately proves nothing.
2. **GREEN** — Write the minimum code to make it pass. No over-engineering.
3. **REFACTOR** — Improve the code. Run tests after every change to confirm nothing broke.

---

## The Prove-It Pattern (Bug Fixes)

Do not start by fixing the bug. Start by writing a test that reproduces it.

```
Bug arrives → Write failing test (confirms bug) → Implement fix → Test passes → Full suite passes
```

---

## Writing Good Tests

### Arrange-Act-Assert (AAA)
Every test follows three clearly separated steps:
```
// Arrange: set up the scenario
// Act: perform the action under test
// Assert: verify the outcome
```

### Test State, Not Interactions
Assert on the *outcome* of an operation, not on which methods were called. Interaction-based tests break on refactoring even when behavior is unchanged.

### One Assertion Per Concept
Each `it`/`test` block verifies exactly one behavior. Split: `'rejects empty titles'`, `'trims whitespace'`, `'enforces max length'` — not `'validates titles correctly'`.

### Name Tests Descriptively
Names read like specs: `'sets completedAt when task is completed'`, `'throws NotFoundError for non-existent task'`. Not: `'works'`, `'handles errors'`, `'test 3'`.

### Prefer Real Implementations Over Mocks
```
Real implementation > Fake (in-memory) > Stub > Mock
```
Mock only at boundaries where real deps are slow, non-deterministic, or have uncontrollable side effects. Over-mocking creates tests that pass while production breaks.

### DAMP Over DRY
Each test should be self-contained and tell a complete story. Duplication in tests is acceptable when it makes each test independently understandable.

---

## Test Anti-Patterns

| Anti-Pattern | Problem | Fix |
|---|---|---|
| Testing implementation details | Breaks on refactoring even if behavior unchanged | Test inputs and outputs, not internal structure |
| Flaky tests (timing, order-dependent) | Erodes trust | Use deterministic assertions, isolate state |
| Snapshot abuse | Large snapshots nobody reviews | Use snapshots sparingly, review every change |
| No test isolation | Tests fail together even if passing individually | Each test sets up and tears down its own state |
| Mocking everything | Tests pass, production breaks | Mock only at system boundaries |
| Empty catch blocks | Errors swallowed silently | Always assert the error, not just that it throws |

---

## Test Type Decision Guide

```
Pure logic, no side effects?          → Unit test
Crosses a boundary (API, DB, FS)?     → Integration test
Critical user flow, end-to-end?       → E2E test (limit to critical paths only)
```

---

## Verification Checklist

Before declaring implementation done:

- [ ] Every new behavior has a corresponding test
- [ ] All tests pass: `npm test` or `npx vitest run`
- [ ] Bug fixes include a reproduction test that **failed before the fix**
- [ ] Test names describe the behavior being verified
- [ ] No tests skipped or disabled
- [ ] Coverage has not decreased (if tracked)