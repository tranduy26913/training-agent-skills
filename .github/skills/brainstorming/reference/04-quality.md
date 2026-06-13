```markdown
---
title: [Feature] - Quality & Operations
version: [e.g., 1.0]
author: [Team or Owner]
date: [YYYY-MM-DD]
---

# [Feature] - Quality & Operations

> Related: [00-index.md](./00-index.md) | [01-backend.md](./01-backend.md) | [02-frontend.md](./02-frontend.md) | [03-behavior.md](./03-behavior.md)

---

## 1. Testing Strategy

### 1.1 Backend Tests

> **Rule**: All **backend tests** should be in **only 1 file**: `server/src/modules/[feature]/[feature].controller.test.ts`
- Use Database test for test. Not use in-memory mocks or fake implementations. Use the same test database and run migrations before tests.

#### Unit Tests

| Test Case | Description |
|-----------|-------------|
| Create [resource] - success | Valid input creates record and returns entity |
| Create [resource] - validation error | Invalid input throws validation error |
| Create [resource] - duplicate | Duplicate key throws conflict error |
| Get [resource] by ID - found | Returns correct entity |
| Get [resource] by ID - not found | Throws 404 error |
| Update [resource] - success | Valid update modifies and returns entity |
| Update [resource] - not found | Throws 404 error |
| Delete [resource] - success | Deletes record and returns success |
| Delete [resource] - constraint | Business rule prevents deletion, throws error |
| List [resource] - filtered | Returns filtered, paginated results |

#### Integration Tests

| Test Case | HTTP Method | Endpoint |
|-----------|-------------|----------|
| GET list — authenticated, returns data | GET | `/api/[resource]` |
| GET list — unauthenticated, 401 | GET | `/api/[resource]` |
| GET list — no permission, 403 | GET | `/api/[resource]` |
| POST create — valid body, 201 | POST | `/api/[resource]` |
| POST create — invalid body, 400 | POST | `/api/[resource]` |
| PUT update — existing id, 200 | PUT | `/api/[resource]/:id` |
| PUT update — non-existing id, 404 | PUT | `/api/[resource]/:id` |
| DELETE — existing id, 200 | DELETE | `/api/[resource]/:id` |
| DELETE — non-existing id, 404 | DELETE | `/api/[resource]/:id` |

#### Authorization Tests

| Test Case | Role | Expected |
|-----------|------|----------|
| [Role A] can access list | [RoleA] | 200 |
| [Role B] cannot access list | [RoleB] | 403 |
| [Role A] can create | [RoleA] | 201 |
| [Role B] cannot delete | [RoleB] | 403 |

---

### 1.2 Frontend Tests

#### [ListPage] — Unit Tests

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Renders items in table on mount | Mock `fetchItems` returns 2 items | Mount `[ListPage]` | Table displays 2 rows |
| 2 | Shows loading skeleton while fetching | Mock `fetchItems` pending | Mount `[ListPage]` | Loading skeleton visible; table rows hidden |
| 3 | Shows empty state when no items | Mock `fetchItems` returns `[]` | Mount `[ListPage]` | Empty state message shown |
| 4 | Triggers fetch when search input changes | Mount `[ListPage]` | Type in search input (debounced) | `fetchItems` called with updated search filter |
| 5 | Triggers fetch when filter changes | Mount `[ListPage]` | Select [Filter A] option | `fetchItems` called with updated filter, page reset to 1 |
| 6 | Triggers fetch when page changes | Mount `[ListPage]` | Click next page | `fetchItems` called with updated page number |
| 7 | Navigates to create page on Add click | Mount `[ListPage]` | Click Add button | Router push called with `/path/create` |
| 8 | Navigates to edit page on Edit click | Mount `[ListPage]` with 1 item | Click Edit on row | Router push called with `/path/1/edit` |
| 9 | Shows delete confirm dialog on Delete click | Mount `[ListPage]` with 1 item | Click Delete on row | Confirm dialog shown with item name |
| 10 | Deletes item and refreshes list on confirm | Mock `deleteItem` resolves | Confirm delete dialog | `deleteItem` called; `fetchItems` called again; success toast shown |
| 11 | Shows error toast when fetch fails | Mock `fetchItems` rejects | Mount `[ListPage]` | Error message/banner shown |

---

#### [CreatePage] — Unit Tests

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Renders empty form on mount | Mount `[CreatePage]` | — | All fields empty; Save button enabled |
| 2 | Shows inline error when required field is empty | Mount `[CreatePage]` | Click Save without filling fields | Validation error shown on required fields |
| 3 | Shows inline error when [Field A] too short | Mount `[CreatePage]` | Enter 1-char value in [Field A] | Validation error "Min 2 characters" shown |
| 4 | Calls `createItem` with valid form data | Mock `createItem` resolves | Fill form, click Save | `createItem` called with correct payload |
| 5 | Navigates to list after successful create | Mock `createItem` resolves | Fill form, click Save | Router push called with `/path`; success toast shown |
| 6 | Shows error toast on API failure | Mock `createItem` rejects | Fill form, click Save | Error toast shown; stays on create page |
| 7 | Cancel without changes navigates back | Mount `[CreatePage]` | Click Cancel (form untouched) | Router push called with `/path` |
| 8 | Cancel with changes shows confirm dialog | Mount `[CreatePage]` | Fill a field, then click Cancel | Unsaved-changes confirm dialog shown |
| 9 | Stay on page when cancel dialog is dismissed | Fill a field, click Cancel, dismiss dialog | Dismiss confirm dialog | Stays on create page; form unchanged |

---

#### [EditPage] — Unit Tests

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Pre-fills form with existing item data | Mock `fetchItem` returns item | Mount `[EditPage]` with id=1 | Form fields populated with item values |
| 2 | Shows loading while fetching item | Mock `fetchItem` pending | Mount `[EditPage]` | Form skeleton/spinner visible |
| 3 | Redirects to list when item not found | Mock `fetchItem` returns 404 | Mount `[EditPage]` with unknown id | Router push called with `/path`; warning toast shown |
| 4 | Shows inline error on invalid field | Mount `[EditPage]`, item loaded | Clear required field, click Save | Validation error shown on field |
| 5 | Calls `updateItem` with modified data | Mock `updateItem` resolves | Change a field, click Save | `updateItem` called with id and updated payload |
| 6 | Shows success toast and stays on page after save | Mock `updateItem` resolves | Change a field, click Save | Success toast shown; still on edit page |
| 7 | Shows error toast on API failure | Mock `updateItem` rejects | Change a field, click Save | Error toast shown; stays on edit page |
| 8 | Cancel without changes navigates back | Mount `[EditPage]`, item loaded | Click Cancel (no changes) | Router push called with `/path` |
| 9 | Cancel with changes shows confirm dialog | Mount `[EditPage]`, item loaded | Change a field, click Cancel | Unsaved-changes confirm dialog shown |

---

#### [Form].vue — Unit Tests

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Renders all fields in create mode | Mount `<Form mode="create">` | — | All fields visible and empty |
| 2 | Pre-fills fields in edit mode | Mount `<Form mode="edit" :initialData="item">` | — | Fields populated with initialData values |
| 3 | Emits `submit` with valid data | Mount form, fill all required fields | Click Save | `submit` event emitted with form payload |
| 4 | Does not emit `submit` when validation fails | Mount form, leave required field empty | Click Save | `submit` event NOT emitted |
| 5 | Emits `cancel` on Cancel click | Mount form | Click Cancel | `cancel` event emitted |
| 6 | Disables Save button when `loading=true` | Mount `<Form :loading="true">` | — | Save button disabled |

---

#### Composable Tests — `use[Feature].ts`

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | `fetchItems` sets `items` and `pagination` | Mock API returns paginated list | Call `fetchItems()` | `items.value` and `pagination.value` updated |
| 2 | `fetchItems` sets `loading` during call | Mock API pending | Call `fetchItems()` | `loading.value` is `true` during call, `false` after |
| 3 | `fetchItems` sets `error` on failure | Mock API rejects | Call `fetchItems()` | `error.value` contains message |
| 4 | `createItem` calls API and returns entity | Mock API resolves with new item | Call `createItem(data)` | Returns created item |
| 5 | `updateItem` calls API with correct id and data | Mock API resolves | Call `updateItem(1, data)` | API called with `PUT /api/[resource]/1` |
| 6 | `deleteItem` calls API with correct id | Mock API resolves | Call `deleteItem(1)` | API called with `DELETE /api/[resource]/1` |

---

## 2. Performance Considerations

| Concern | Strategy |
|---------|----------|
| List query | Server-side pagination (default limit: 10) |
| Search | Debounced input (300ms) to reduce API calls |
| Database indexes | Index on `[searchable_field]` and `[filter_field]` |
| Filtering | Use indexed columns only in WHERE clause |
| Caching | [If applicable: cache strategy, TTL] |
| Lazy loading | [If applicable: component lazy load, image lazy] |

---

## 3. Security Considerations

| Concern | Control |
|---------|---------|
| Authentication | All endpoints require valid JWT token |
| Authorization | Role-based access control (RBAC) per endpoint |
| Input Validation | Server-side validation on all request body fields |
| SQL Injection | Use parameterized queries / ORM (no raw string concat) |
| Sensitive Data | Never return passwords or tokens in responses |
| Audit Trail | Log all create/update/delete actions with user + timestamp |
| Rate Limiting | Apply rate limiting on write endpoints (POST, PUT, DELETE) |

---

```
