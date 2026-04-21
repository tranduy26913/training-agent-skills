# User Management Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use skill executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the User Management feature by adding Last Login tracking, Points system, Note/Birthday fields, email duplicate validation with debounce, and Clear Filters button.

**Architecture:** 
- Database layer: Add 4 new columns to users table
- Backend API: Add email validation endpoint, update CRUD operations to handle new fields
- Frontend: Add composable for email validation with debounce, update UserForm/UserTable/UserFilters components, update type definitions
- Testing: Add unit tests for validation logic, component tests for new UI elements

**Tech Stack:** Vue 3 (Composition API), TypeScript, PrimeVue, Express.js, MySQL, VueUse, Vitest

---

## File Structure

### Database
- `database/migrations/005_add_user_fields.sql` [NEW] - Add last_login_at, points, note, birthday columns

### Backend (`server/src/`)
- `modules/users/controller.ts` [UPDATE] - Add email check endpoint + update create/update
- `services/users.service.ts` [UPDATE] - Add email duplicate check logic
- `models/users.model.ts` [UPDATE] - Add new field mappings
- `modules/users/validation.ts` [UPDATE] - Update validation schemas for new fields

### Frontend (`client/src/`)
- `types/users.types.ts` [UPDATE] - Add lastLoginAt, points, note, birthday to User type
- `composables/useEmailValidation.ts` [NEW] - Email duplicate check with debounce 500ms
- `pages/users/components/UserForm.vue` [UPDATE] - Add Note textarea, Birthday picker, email validation
- `pages/users/components/UserTable.vue` [UPDATE] - Add Last Login & Points columns
- `pages/users/components/UserFilters.vue` [UPDATE] - Add Clear Filters button

### Locales
- `client/src/locales/en.ts` [UPDATE] - Add labels for new fields
- `client/src/locales/ja.ts` [UPDATE] - Add Japanese labels
- `client/src/locales/vi.ts` [UPDATE] - Add Vietnamese labels

---

## Implementation Tasks

- [ ] **T1 Create database migration**
  - File: `database/migrations/005_add_user_fields.sql`
  - Add columns: `last_login_at` (TIMESTAMP NULL), `points` (INT DEFAULT 0), `note` (VARCHAR 500 NULL), `birthday` (DATE NULL)
  - Verify: Run migration, check users table has new columns

- [ ] **T2 Update Zod validation schemas**
  - File: `server/src/modules/users/validation.ts`
  - [UPDATE] Name validation: min 2, max 50 (from min 3, max 100)
  - [NEW] Note validation: optional, max 500 chars
  - [NEW] Birthday validation: optional, valid date, no future dates
  - Verify: Schema rejects invalid name lengths and future birthdays

- [ ] **T3 Add email duplicate check endpoint**
  - File: `server/src/modules/users/controller.ts`
  - [NEW] GET /api/users/check-email?email=...&excludeId=...
  - Query email, return `{ exists: boolean }`
  - Exclude user if excludeId provided (for edit mode)
  - Verify: Test with curl: `curl localhost:3000/api/users/check-email?email=test@example.com`

- [ ] **T4 Update POST /api/users endpoint**
  - File: `server/src/modules/users/controller.ts`
  - Accept and validate: note, birthday
  - Set defaults: points = 0, last_login_at = NULL
  - Update response to include new fields
  - Verify: Create user, check response includes points=0, last_login_at=null

- [ ] **T5 Update PUT /api/users/:id endpoint**
  - File: `server/src/modules/users/controller.ts`
  - Accept optional: note, birthday
  - Reject if points field provided in request (read-only)
  - [UPDATE] Name validation: 2-50 chars (from 3-100)
  - Update response to include all fields
  - Verify: Edit user, check points not changed, name accepts 2-char min

- [ ] **T6 Update GET /api/users endpoint**
  - File: `server/src/modules/users/controller.ts`
  - Include new fields in response list
  - Verify: List users shows last_login_at, points, note, birthday

- [ ] **T7 Update user.model.ts**
  - File: `server/src/models/users.model.ts`
  - Add field mappings for: lastLoginAt, points, note, birthday
  - Verify: Type checking passes

- [ ] **T8 Update User type definition**
  - File: `client/src/types/users.types.ts`
  - [UPDATE] Add to User interface: lastLoginAt?: string | null, points: number, note?: string | null, birthday?: string | null
  - [UPDATE] Update CreateUserDto: add optional note, birthday
  - Verify: TypeScript compilation passes, types are exported

- [ ] **T9 Create email validation composable**
  - File: `client/src/composables/useEmailValidation.ts` [NEW]
  - Function: `useEmailValidation(email: Ref<string>, excludeId?: number, debounceMs: number = 500)`
  - Returns: `{ isChecking, error, checkEmail }`
  - Logic: debounce API call to GET /api/users/check-email with 500ms delay
  - Verify: Debounce works, error shows "Email already exists" on duplicate

- [ ] **T10 Update localization files**
  - Files: `client/src/locales/{en, ja, vi}.ts`
  - [NEW] Add labels: users.note, users.birthday, users.lastLogin, users.points
  - [NEW] Add validation messages for max 500 chars (note), future dates (birthday)
  - Verify: i18n integration works, labels display correctly

- [ ] **T11 Update UserForm component**
  - File: `client/src/pages/users/components/UserForm.vue`
  - [UPDATE] Name field: Update validation to 2-50 chars (from 3-100)
  - [UPDATE] Email field: Add useEmailValidation composable, show loading spinner while checking, display error if duplicate
  - [NEW] Add Note field: InputTextarea, max 500, character counter, optional
  - [NEW] Add Birthday field: DatePicker, optional, no future dates
  - Points field (edit mode only): Display as read-only text (if initialData)
  - Verify: Form validates correctly, email debounce works, note counter shows 0-500

- [ ] **T12 Update form validation logic**
  - File: `client/src/pages/users/components/UserForm.vue`
  - [UPDATE] Name: min 2, max 50
  - [NEW] Note: max 500 (no error if empty)
  - [NEW] Birthday: valid date, no future dates
  - Prevent form submit if email duplicate error exists
  - Verify: Submit blocked on email duplicate, validation errors display correctly

- [ ] **T13 Add Last Login & Points columns to UserTable**
  - File: `client/src/pages/users/components/UserTable.vue`
  - Insert column 8: Last Login (after Updated At) - format DD/MM/YYYY HH:mm or "-" if null
  - Insert column 9: Points (before Actions) - display integer, read-only
  - Verify: Columns render in table, data displays correctly

- [ ] **T14 Update formatDate helper**
  - File: `client/src/pages/users/components/UserTable.vue`
  - [UPDATE] formatDate() to handle null values (show "-" for Last Login if null)
  - Verify: null lastLoginAt shows "-", valid dates show DD/MM/YYYY HH:mm

- [ ] **T15 Add Clear Filters button to UserFilters**
  - File: `client/src/pages/users/components/UserFilters.vue`
  - [NEW] Add button next to filter controls
  - On click: reset search, role, status, dateRange to empty/null
  - Emit filterChange event to reload table from page 1
  - Verify: Click button resets all filters, table refreshes

- [ ] **T16 Create validation tests (backend)**
  - File: `server/src/modules/users/__tests__/validation.test.ts` [NEW]
  - Test: Name min 2, max 50 validation
  - Test: Note max 500 validation
  - Test: Birthday no future dates validation
  - Test: Email format validation
  - Verify: All tests pass with `npm run test`

- [ ] **T17 Create email check endpoint tests (backend)**
  - File: `server/src/modules/users/__tests__/controller.test.ts` [UPDATE]
  - Test: GET /api/users/check-email returns exists: true for duplicate
  - Test: GET /api/users/check-email returns exists: false for unique
  - Test: excludeId parameter allows same email for user edit
  - Verify: All endpoint tests pass

- [ ] **T18 Create UserForm component tests (frontend)**
  - File: `client/src/pages/users/components/__tests__/UserForm.test.ts` [NEW]
  - Test: Name field stores min 2 max 50 validation error
  - Test: Email duplicate check triggers on input (with debounce)
  - Test: Note field max 500 counter displays correctly
  - Test: Birthday picker rejects future dates
  - Test: Form submit blocked when email is duplicate
  - Verify: All tests pass with `npm run test:unit`

- [ ] **T19 Create UserTable component tests (frontend)**
  - File: `client/src/pages/users/components/__tests__/UserTable.test.ts` [UPDATE]
  - Test: Last Login column renders with DD/MM/YYYY HH:mm format
  - Test: Null Last Login displays "-"
  - Test: Points column displays integer value
  - Verify: All tests pass

- [ ] **T20 Create UserFilters component tests (frontend)**
  - File: `client/src/pages/users/components/__tests__/UserFilters.test.ts` [UPDATE]
  - Test: Clear Filters button resets all filters
  - Test: Clear button emits filterChange with empty values
  - Verify: Tests pass

- [ ] **T21 Run backend test suite**
  - Command: `cd server && npm run test`
  - Verify: All unit tests pass, no type errors, 100% coverage for new validation

- [ ] **T22 Run frontend test suite**
  - Command: `cd client && npm run test:unit`
  - Verify: All component tests pass, no type errors

- [ ] **T23 Manual E2E verification - Create User**
  - Start app: `cd server && npm run dev` + `cd client && npm run dev`
  - Fill form with new fields (note, birthday), verify submit works
  - Check database: user created with points=0, last_login_at=null
  - Verify: User appears in list with correct data

- [ ] **T24 Manual E2E verification - Edit User**
  - Edit user: Change note/birthday, verify points field is read-only
  - Test email change: See debounce working, verify duplicate check
  - Verify: Changes saved correctly, audit log updated

- [ ] **T25 Manual E2E verification - List & Filter**
  - Check list page: Last Login & Points columns display correctly
  - Test Clear Filters button: Resets all filters, reloads table
  - Verify: No console errors, UI responsive

- [ ] **T26 Database verification**
  - Query: `SELECT last_login_at, points, note, birthday FROM users LIMIT 1;`
  - Verify: New columns exist, data types correct, defaults applied

- [ ] **T27 Update spec documentation**
  - File: `docs/users/specs/users-management-design.md`
  - Mark completed features with ✅
  - Document any deviations from plan
  - Verify: Spec matches implementation

- [ ] **T28 Commit all changes**
  - Commit with message referencing v1.2 spec and [NEW]/[UPDATE]/[DEPRECATED] markers
  - Include all implementation and test files
  - Push to branch

---

## Checklist for Completion

Before marking done:
- [ ] All database migrations applied
- [ ] All backend tests passing (unit + integration)
- [ ] All frontend tests passing
- [ ] Manual E2E testing completed
- [ ] No console errors or warnings
- [ ] TypeScript compilation clean
- [ ] All new fields displayed correctly in UI
- [ ] Email validation debounce working (500ms)
- [ ] Clear Filters button resets and reloads
- [ ] Points read-only in edit form
- [ ] Birthday picker prevents future dates
- [ ] Spec updated with completion status
