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

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Create [resource] - success | Valid input | Call create method | Returns entity |
| 2 | Create [resource] - validation error | Invalid input | Call create method | Throws validation error |
| 3 | Create [resource] - duplicate | Duplicate key | Call create method | Throws conflict error |
| 4 | Get [resource] by ID - found | Existing ID | Call getById method | Returns correct entity |
| 5 | Get [resource] by ID - not found | Non-existing ID | Call getById method | Throws 404 error |
| 6 | Update [resource] - success | Valid update | Call update method | Modifies and returns entity |
| 7 | Update [resource] - not found | Non-existing ID | Call update method | Throws 404 error |
| 8 | Delete [resource] - success | Existing ID | Call delete method | Deletes record and returns success |
| 9 | Delete [resource] - constraint | Business rule prevents deletion | Call delete method | Throws error |
| 10 | List [resource] - filtered | Filter criteria | Call list method | Returns filtered, paginated results |

#### Integration Tests

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | GET list — authenticated, returns data | Mock authenticated user | GET `/api/[resource]` | 200 with data |
| 2 | GET list — unauthenticated, 401 | Mock unauthenticated request | GET `/api/[resource]` | 401 |
| 3 | GET list — no permission, 403 | Mock user without permission | GET `/api/[resource]` | 403 |
| 4 | POST create — valid body, 201 | Mock authenticated user with valid body | POST `/api/[resource]` | 201 with created entity |
| 5 | POST create — invalid body, 400 | Mock authenticated user with invalid body | POST `/api/[resource]` | 400 with validation errors |
| 6 | PUT update — existing id, 200 | Mock authenticated user with valid update | PUT `/api/[resource]/:id` | 200 with updated entity |
| 7 | PUT update — non-existing id, 404 | Mock authenticated user with unknown ID | PUT `/api/[resource]/:id` | 404 |
| 8 | DELETE — existing id, 200 | Mock authenticated user | DELETE `/api/[resource]/:id` | 200 with success |
| 9 | DELETE — non-existing id, 404 | Mock authenticated user with unknown ID | DELETE `/api/[resource]/:id` | 404 |

#### Authorization Tests

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | [Role A] can access list | Mock user with [RoleA] | GET `/api/[resource]` | 200 |
| 2 | [Role B] cannot access list | Mock user with [RoleB] | GET `/api/[resource]` | 403 |
| 3 | [Role A] can create | Mock user with [RoleA] | POST `/api/[resource]` | 201 |
| 4 | [Role B] cannot delete | Mock user with [RoleB] | DELETE `/api/[resource]/:id` | 403 |

---

### 1.2 Frontend Tests
Only create unit tests for each page component and composable.
Test scope includes:
- Validate form input and display errors
- Call API with correct payload when user interacts
- Tests related to state management (store/composable)
- Test UI states (loading, empty, error, success) based on state from store/composable
- Test functional logic within component if any, no need to test functional behavior.
No tests related to detailed display (CSS, layout) or end-to-end (E2E) tests.
No tests for toast, confirm dialog, navigation flow (only test event trigger, not navigation results).

#### [ListPage] — Unit Tests

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Displays items in table on mount | Mock `fetchItems` returns 2 items | Mount `[ListPage]` | Table displays 2 rows |
| 2 | Shows loading state while fetching | Mock `fetchItems` pending | Mount `[ListPage]` | Loading skeleton visible; table rows hidden |
| 3 | Shows empty state when no items | Mock `fetchItems` returns `[]` | Mount `[ListPage]` | Empty state message shown |
| 4 | Calls `fetchItems` with updated search filter | Mount `[ListPage]` | Type in search input (debounced) | `fetchItems` called with updated search filter |
| 5 | Calls `fetchItems` with updated filter | Mount `[ListPage]` | Select [Filter A] option | `fetchItems` called with updated filter, page reset to 1 |
| 6 | Calls `fetchItems` with updated page number | Mount `[ListPage]` | Click next page | `fetchItems` called with updated page number |
| 7 | Shows error state when fetch fails | Mock `fetchItems` rejects | Mount `[ListPage]` | Error state displayed |
| 8 | Emits `delete` event on Delete click | Mount `[ListPage]` with 1 item | Click Delete on row | `delete` event emitted with item id |
| 9 | Emits `edit` event on Edit click | Mount `[ListPage]` with 1 item | Click Edit on row | `edit` event emitted with item id |
| 10 | Emits `add` event on Add click | Mount `[ListPage]` | Click Add button | `add` event emitted |

---

#### [CreatePage] — Unit Tests

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Renders empty form on mount | Mount `[CreatePage]` | — | All fields empty; Save button enabled |
| 2 | Shows validation error when required field is empty | Mount `[CreatePage]` | Click Save without filling fields | Validation error shown on required fields |
| 3 | Shows validation error when [Field A] too short | Mount `[CreatePage]` | Enter 1-char value in [Field A] | Validation error "Min 2 characters" shown |
| 4 | Calls `createItem` with valid form data | Mock `createItem` resolves | Fill form, click Save | `createItem` called with correct payload |
| 5 | Shows error state on API failure | Mock `createItem` rejects | Fill form, click Save | Error state displayed |
| 6 | Emits `cancel` on Cancel click | Mount `[CreatePage]` | Click Cancel | `cancel` event emitted |

---

#### [EditPage] — Unit Tests

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Pre-fills form with existing item data | Mock `fetchItem` returns item | Mount `[EditPage]` with id=1 | Form fields populated with item values |
| 2 | Shows loading state while fetching item | Mock `fetchItem` pending | Mount `[EditPage]` | Form skeleton/spinner visible |
| 3 | Shows error state when item not found | Mock `fetchItem` returns 404 | Mount `[EditPage]` with unknown id | Error state displayed |
| 4 | Shows validation error on invalid field | Mount `[EditPage]`, item loaded | Clear required field, click Save | Validation error shown on field |
| 5 | Calls `updateItem` with modified data | Mock `updateItem` resolves | Change a field, click Save | `updateItem` called with id and updated payload |
| 6 | Shows error state on API failure | Mock `updateItem` rejects | Change a field, click Save | Error state displayed |
| 7 | Emits `cancel` on Cancel click | Mount `[EditPage]`, item loaded | Click Cancel | `cancel` event emitted |

---

#### [Form].vue — Unit Tests

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Renders all fields in create mode | Mount `<Form mode="create">` | — | All fields visible and empty |
| 2 | Pre-fills fields in edit mode | Mount `<Form mode="edit" :initialData="item">` | — | Fields populated with initialData values |
| 3 | Shows validation error for required field empty | Mount form, fill all fields except [RequiredField] | Click Save | Validation error shown on [RequiredField] |
| 4 | Shows validation error for required field whitespace only | Mount form, fill [RequiredField] with spaces | Click Save | Validation error shown on [RequiredField] |
| 5 | Shows validation error for [Field] too short | Mount form, enter value below min length for [Field] | Click Save | Validation error "Min X characters" shown |
| 6 | Shows validation error for [Field] too long | Mount form, enter value above max length for [Field] | Click Save | Validation error "Max X characters" shown |
| 7 | Shows validation error for invalid email format | Mount form, enter invalid email in email field | Click Save | Validation error "Invalid email format" shown |
| 8 | Shows validation error for invalid number range (too low) | Mount form, enter number below min for [NumberField] | Click Save | Validation error "Min value is X" shown |
| 9 | Shows validation error for invalid number range (too high) | Mount form, enter number above max for [NumberField] | Click Save | Validation error "Max value is X" shown |
| 10 | Shows validation error for invalid pattern (regex) | Mount form, enter value not matching pattern for [PatternField] | Click Save | Validation error "Invalid format" shown |
| 11 | Shows validation error for duplicate value | Mount form, enter duplicate value for [UniqueField] | Click Save | Validation error "Value already exists" shown |
| 12 | Clears inline error when field becomes valid | Mount form, trigger validation error on [Field] | Fix [Field] to valid value | Validation error cleared |
| 13 | Emits `submit` with all valid data | Mount form, fill all fields with valid values | Click Save | `submit` event emitted with correct form payload |
| 14 | Does not emit `submit` when any field invalid | Mount form, leave at least one field invalid | Click Save | `submit` event NOT emitted |
| 15 | Does not emit `submit` when loading=true | Mount `<Form :loading="true">`, fill valid data | Click Save | `submit` event NOT emitted |
| 16 | Disables Save button when `loading=true` | Mount `<Form :loading="true">` | — | Save button disabled |
| 17 | Emits `cancel` on Cancel click | Mount form | Click Cancel | `cancel` event emitted |
| 18 | Resets form to initial state on reset | Mount form with initialData, modify fields | Trigger reset | Form returns to initialData values |
| 19 | Shows/hides fields based on mode | Mount `<Form mode="create">` vs `<Form mode="edit">` | — | [ConditionalField] visible only in edit mode |
| 20 | Validates on blur for individual fields | Mount form, focus in then out of empty [RequiredField] | Blur from [RequiredField] | Validation error shown on [RequiredField] |

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
