# Technical Review Rules

> Format: `R-XXX: [Rule name] — [Description]`  
> Reference these rules in review findings using their ID (e.g., **R-004**).

---

## Code Quality

| ID | Rule | Description |
|----|------|-------------|
| R-001 | Single Responsibility | Each function/component does exactly one thing. Split if it handles multiple concerns. |
| R-002 | No Magic Values | Literal strings, numbers, or booleans not assigned to a named constant or config. |
| R-003 | DRY | Logic duplicated in 2+ places must be extracted. Copy-paste is a bug. |
| R-004 | Early Return / Guard Clauses | Avoid deep nesting. Validate and return early at the top of functions. |
| R-005 | No Dead Code | Commented-out code, unused imports, unreachable branches must be removed. |
| R-006 | Consistent Naming | Variables, functions, components, and files must follow existing naming conventions in the codebase. |
| R-007 | Error Messages Are Actionable | Error messages must tell the caller what went wrong and how to fix it — not just "Error occurred". |
| R-008 | No Silent Failures | `catch` blocks must log or rethrow — never swallow errors silently. |
| R-009 | Function Length | Functions longer than ~30 lines are a red flag. Break them down. |
| R-010 | No Hardcoded Credentials | Secrets, passwords, API keys must never appear in source code. Use environment variables. |

---

## Architecture

| ID | Rule | Description |
|----|------|-------------|
| R-011 | Layer Separation | Controllers do not contain business logic. Services do not query HTTP context. Keep layers separate. |
| R-012 | Dependency Direction | Higher-level modules must not depend on lower-level implementation details directly. |
| R-013 | No Direct DB in Controller | Database queries belong in models/repositories, not in route handlers or controllers. |
| R-014 | Input Validated at Boundary | All user input (HTTP body, query params, path params) must be validated before processing. |
| R-015 | Response Shape Consistent | API responses follow the agreed DTO shape from `01-backend.md`. No ad-hoc JSON structures. |
| R-016 | No Business Logic in View | Vue components must not contain business rules — delegate to composables or services. |
| R-017 | Store State Minimal | Pinia stores hold only shared/persistent state. Local component state stays in `ref`/`reactive`. |

---

## TypeScript

| ID | Rule | Description |
|----|------|-------------|
| R-021 | No `any` | Using `any` defeats type safety. Use `unknown` + type guard, or define a proper interface. |
| R-022 | Explicit Return Types | Functions with non-trivial logic must have explicit return type annotations. |
| R-023 | No Non-Null Assertion Abuse | `!` operator suppresses type checking. Validate before use instead. |
| R-024 | Prefer `interface` over `type` for DTOs | Use `interface` for object shapes shared with backend. `type` for unions or aliases. |
| R-025 | Enum vs Union Type | Prefer TypeScript union string literals over `enum` unless the enum is used at runtime. |

---

## Vue 3

| ID | Rule | Description |
|----|------|-------------|
| R-031 | Composition API with `<script setup>` | Use `<script setup lang="ts">` — no Options API unless the project explicitly requires it. |
| R-032 | Props Typed with `defineProps` | Props must be typed using `defineProps<{...}>()` — no untyped prop objects. |
| R-033 | Emits Declared with `defineEmits` | All emits must be declared with `defineEmits<{...}>()`. |
| R-034 | No Direct Mutation of Props | Props are read-only. Use emits or a writable local copy with `watch`. |
| R-035 | `v-for` Must Have `:key` | Every `v-for` needs a stable `:key`. Never use loop index as key for dynamic lists. |
| R-036 | `v-if` vs `v-show` Correct Usage | Use `v-if` for conditional rendering that changes rarely; `v-show` for frequent toggles. |
| R-037 | Async in `onMounted` Wrapped | Async operations in lifecycle hooks must handle errors and loading state. |
| R-038 | i18n Keys Match Spec | All display text must use i18n keys from `02-frontend.md` — no raw strings in templates. |

---

## Security (OWASP)

| ID | Rule | Description |
|----|------|-------------|
| R-041 | Input Sanitized | User-provided data is validated and sanitized before storage or output (prevent XSS, SQLi). |
| R-042 | Authorization on Every Endpoint | Every API endpoint checks the caller has permission — no implicit trust. |
| R-043 | Sensitive Data Not Logged | Passwords, tokens, PII must never appear in logs. |
| R-044 | CORS Restricted | CORS `Access-Control-Allow-Origin` must not be wildcard `*` in production. |
| R-045 | Rate Limiting on Auth | Login and token-refresh endpoints must have rate limiting to prevent brute force. |

---

## Performance

| ID | Rule | Description |
|----|------|-------------|
| R-051 | N+1 Query | Avoid querying inside a loop. Use batch queries or eager loading. |
| R-052 | Unnecessary Re-renders | Avoid reactive dependencies that trigger component re-renders without visual change. |
| R-053 | Large Payload | API responses must not include fields unused by the client. Use projection/DTO trimming. |
| R-054 | Computed Over Method in Template | Use `computed` for derived values in templates — not methods that re-run on every render. |

---

## PrimeVue

| ID | Rule | Description |
|----|------|-------------|
| R-061 | Use PrimeVue Components | Use PrimeVue equivalents — never raw HTML where a PrimeVue component exists (e.g., `<Button>` not `<button>`, `<InputText>` not `<input>`, `<Select>` not `<select>`). |
| R-062 | Dialog via `<Dialog>` | All modal dialogs must use PrimeVue `<Dialog>` — no custom overlay HTML. |
| R-063 | Toast via `useToast()` | All in-app notifications must use `useToast()` composable — no custom alert/snackbar HTML. |
| R-064 | Form Validation Binding | Use the `invalid` prop on PrimeVue form controls bound to validation state — no custom error CSS classes. |
| R-065 | DataTable for Tables | Tabular data must use `<DataTable>` — no raw `<table>` HTML. |
| R-066 | Loading Prop on Controls | Show loading state using the `loading` prop on PrimeVue components — no custom spinner HTML inside PrimeVue-managed areas. |
| R-067 | No Inline Style Overrides | Do not override PrimeVue styles with inline `style=""`. Use PrimeVue `pt` (passthrough) or theme tokens instead. |

---

## Express

| ID | Rule | Description |
|----|------|-------------|
| R-071 | Thin Route Handler | Route handlers must only: parse request → call service → return response. No business logic inline. |
| R-072 | Async Error Propagation | All `async` route handlers must use `try/catch` with `next(err)` or an `asyncHandler` wrapper — never let unhandled promise rejections crash the server. |
| R-073 | Middleware for Cross-Cutting Concerns | Auth, logging, input validation are middleware — never inline in route handlers. |
| R-074 | Correct HTTP Status Codes | 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthenticated), 403 (Forbidden), 404 (Not Found), 409 (Conflict), 422 (Validation Error), 500 (Server Error). |
| R-075 | Modular Router Files | Routes grouped by resource in separate router files imported into `app.ts` — not all defined in one file. |
| R-076 | Use `res.json()` for JSON | Always use `res.json()` for JSON responses — not `res.send()` with a stringified object. |

---

## MySQL

| ID | Rule | Description |
|----|------|-------------|
| R-081 | Parameterized Queries | Never concatenate user input into SQL strings. Always use parameterized queries or prepared statements (prevents SQL injection). |
| R-082 | Transaction for Multi-Step Writes | Multiple related INSERT/UPDATE/DELETE operations must be wrapped in a transaction to ensure atomicity. |
| R-083 | Index on Join/Filter Columns | Columns used in `WHERE`, `JOIN ON`, or `ORDER BY` must have an index. Foreign key columns must always be indexed. |
| R-084 | No `SELECT *` | Always list required columns explicitly in SELECT — never `SELECT *` in production queries. |
| R-085 | Connection Pool Only | Always use the shared connection pool — never create ad-hoc per-request connections. |
| R-086 | Soft Delete Pattern | Records requiring audit trail must use `deleted_at` timestamp (soft delete) — not physical `DELETE`. |

---

## Pinia Store

| ID | Rule | Description |
|----|------|-------------|
| R-091 | Store Per Domain | One Pinia store per business domain (e.g., `useUserStore`, `useAuthStore`) — no monolithic global store. |
| R-092 | No Raw `$store` Access | Do not access Pinia stores directly in templates. Import and call the composable in `<script setup>`. |
| R-093 | Actions for All Async | Any async operation (API call, side effect) must be in a store `action` — not inside a component or computed. |
| R-094 | Getters Are Pure | Store `getters` must be pure (no side effects, no API calls). They derive data from state only. |
| R-095 | Reset State Pattern | Stores that need resetting (e.g., on logout) must implement a `$reset()` or explicit reset action — not modify state ad hoc. |
| R-096 | No Large Arrays in State | Avoid storing large paginated datasets in store state. Store only current page data + pagination metadata. |

---

## i18n (vue-i18n)

| ID | Rule | Description |
|----|------|-------------|
| R-101 | No Raw Display Strings in Templates | All user-visible text must use `$t('key')` or `t('key')` — never hard-coded strings in `<template>` or JS/TS. |
| R-102 | Keys Match Spec | i18n keys used in code must match the `DisplayText` column of `02-frontend.md`. No ad-hoc keys invented during implementation. |
| R-103 | Nested Key Structure | Keys follow `[feature].[page].[element]` hierarchy (e.g., `users.list.pageTitle`). Flat or inconsistent structures are a violation. |
| R-104 | No Duplicated Translations | The same phrase must not be defined under multiple different keys. Extract to a `common.*` namespace if reused. |
| R-105 | Interpolation Not Concatenation | Dynamic values must use vue-i18n interpolation (`$t('key', { name })`) — never string concatenation with translated strings. |
| R-106 | Locale Files Kept in Sync | All locale files (e.g., `en.json`, `vi.json`) must contain the same set of keys. Missing keys in any locale are a violation. |
