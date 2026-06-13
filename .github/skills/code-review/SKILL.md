---
name: code-review
description: Two-pass code review — Technical (rule-based) + Design Spec compliance. Produces a structured findings report.
context: fork
---

# Code Review

**Announce at start:** "I'm using the code-review skill."

## Overview

This skill performs a structured, two-pass code review of a git diff range:

1. **Pass 1 — Technical Review**: checks all changed files against the rule catalog in `review-rules.md`. Each rule has an ID (`R-XXX`) covering Code Quality, Architecture, TypeScript, Vue 3, Security, and Performance. Every finding must cite its Rule ID.

2. **Pass 2 — Design Spec Review** _(when spec files are provided)_: verifies that the implementation matches the agreed design exactly — endpoints, DTOs, validation, screen items, i18n keys, event handlers, and UI states as defined in `01-backend.md`, `02-frontend.md`, and `03-behavior.md`.

After both passes, the skill produces a **Review Report** with a findings table (Rule | File:Line | Severity | Description | Fix), a summary by category, and a clear **Ready to merge?** verdict with a required-actions checklist.

**Core principle:** Every finding must cite a Rule ID (or "spec") and state whether it is fixable in this session.

---

## When to Run

- After completing a feature or major task
- Before merge to main
- When stuck (fresh perspective)

---

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `WHAT_WAS_IMPLEMENTED` | ✅ | One-line summary of what was built |
| `SPEC_FILES` | optional | Paths to `01-backend.md`, `02-frontend.md`, `03-behavior.md` |

---

## Pass 1 — Technical Review

Load `code-review/review-rules.md`.

For each changed file, check every applicable rule. Record each violation as a finding:

| Field | Value |
|-------|-------|
| Rule | `R-XXX` |
| File:Line | exact location |
| Severity | Critical / Important / Minor |
| Description | what is wrong and why it matters |
| Fix | `Yes — [how]` or `No — [reason]` |

Apply all rule categories that are relevant to the file type:
- Run build and tests first — any failures are Critical findings
- All files: R-001 to R-010 (Code Quality)
- Backend/Express files: R-011 to R-017 (Architecture), R-041 to R-045 (Security), R-051 to R-053 (Performance), R-071 to R-076 (Express)
- Vue component files: R-031 to R-038 (Vue 3), R-052 to R-054 (Performance), R-061 to R-067 (PrimeVue), R-101 to R-106 (i18n)
- TypeScript files: R-021 to R-025 (TypeScript)
- Pinia store files: R-091 to R-096 (Pinia Store)
- Database/SQL files: R-081 to R-086 (MySQL)
- Locale JSON files: R-101 to R-106 (i18n)

---

## Pass 2 — Design Spec Review

> Skip if `SPEC_FILES` not provided.

For each spec file provided, verify implementation matches exactly:

**`01-backend.md`:**
- All endpoints exist with correct method, path, request body, response shape
- All validation rules applied
- All error codes returned as specified

**`02-frontend.md`:**
- All screen items present (controls, props, emits match)
- All i18n keys used (no raw display strings)
- Component boundary structure matches

**`03-behavior.md`:**
- All event handlers implemented
- All UI states handled (loading, empty, error, success)
- All navigation flows and confirm dialogs present

Record each deviation as a finding with:
- Severity: Critical (functionality broken) / Important (spec deviated) / Minor (cosmetic)
- Fix: `Yes — [how]` or `No — [reason]`

---

## Report Format

After both passes, output the full review report:

```
## Code Review Report
**Feature:** {WHAT_WAS_IMPLEMENTED}

---

### Findings

| # | Rule | File:Line | Severity | Description | Fix |
|---|------|-----------|----------|-------------|-----|
| 1 | R-004 | src/services/user.ts:45 | Important | Deep nesting — 4 levels of if/else | Yes — refactor with guard clauses |
| 2 | R-038 | src/pages/UserList.vue:12 | Important | Raw string "Danh sách người dùng" — use i18n key | Yes — use `$t('users.list.pageTitle')` |
| 3 | spec | src/api/users.ts | Critical | POST /users missing `role` field in response DTO | Yes — add to response mapper |

_(Fill with actual findings — remove example rows)_

---

### Summary

| Category | Critical | Important | Minor | Total |
|----------|----------|-----------|-------|-------|
| Technical (R-XXX) | 0 | 1 | 2 | 3 |
| Spec Compliance | 1 | 1 | 0 | 2 |
| **Total** | **1** | **2** | **2** | **5** |

---
```

---

## After Report

- Fix all **Critical** findings immediately
- Fix all **Important** findings before proceeding
- Log **Minor** findings for later improvement
- If a finding is wrong: push back with technical reasoning and evidence

See rules at: `code-review/review-rules.md`
