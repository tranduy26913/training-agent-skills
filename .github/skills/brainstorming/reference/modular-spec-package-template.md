# Modular Spec Package Template

This document defines the required multi-file specification format for feature design documents.

The goal is to keep each document reviewable while preserving one clear source of truth for scope, architecture, UI behavior, API contracts, and operational quality.

## Design Principles

- Keep one canonical entry point per feature spec package.
- Split by concern, not by implementation layer noise.
- Avoid duplicating business rules across files.
- Keep change history and approval context in one place.
- Keep each file small enough to review in isolation.
- If a required section does not apply, keep the heading and write `Not applicable` with a short reason.

## Canonical Package Rules

- The spec package root is `docs/<topic>/specs/<topic>-design/`.
- The canonical entry point is `index.md`.
- Only `index.md` contains front matter, executive summary, changelog, summary of changes, approval status, and document map.
- Detailed content is delegated to concern files referenced from `index.md`.
- Business rules must live in exactly one file. Other files may reference them, but must not restate them differently.
- API contracts are owned by `backend-api.md`.
- UI behavior and frontend component responsibilities are owned by `frontend-spec.md`.
- Data model, architecture, and system interaction diagrams are owned by `architecture-data.md`.
- Testing, non-functional requirements, observability, rollout, and risks are owned by `quality-operations.md`.

## Cross-File Reference Rules

- Reference other files by heading name when a rule is owned elsewhere.
- Do not duplicate tables, rules, or contracts across files.
- If a file depends on a rule defined elsewhere, add a short pointer instead of restating the content.
- If a reviewer can only approve one concern, that file must still be understandable without reading all other files in full.

## Traceability Rules

- Each major requirement should be traceable from `index.md` to one owning detail file.
- Each endpoint should map to at least one UI or system flow when applicable.
- Each risky or high-impact business rule should map to at least one testing item in `quality-operations.md`.
- Each change request should update both the `Changelog` and the affected owning file.

## Change Request Handling In A Modular Package

- Update the version row in `index.md`.
- Add or revise `Summary of Changes` in `index.md`.
- Update only the owning concern file for the changed behavior.
- If diagrams or acceptance criteria are affected, update those files in the same change.
- Preserve `[NEW]`, `[UPDATE - CR-XXXX]`, and `[DEPRECATED]` markers where they help reviewers detect deltas.

## Required File Tree

```text
docs/
└── <topic>/
    └── specs/
        └── <topic>-design/
            ├── index.md
            ├── architecture-data.md
            ├── frontend-spec.md
            ├── backend-api.md
            └── quality-operations.md
```

## Section Ownership Map

| Concern | Owning File |
|---------|-------------|
| Executive summary, scope, changelog, approval | `index.md` |
| Architecture, data model, diagrams, state transitions | `architecture-data.md` |
| Pages, forms, UX states, components, store/composable roles | `frontend-spec.md` |
| Endpoints, auth, validation, error contract, business rules for requests | `backend-api.md` |
| Error scenarios, testing, performance, observability, rollout, risks | `quality-operations.md` |

## Package Validation Rules

- A valid spec package MUST contain all five required root files.
- `index.md` MUST be the canonical entry point and MUST reference the concern files through `Document Map`.
- A concern belongs to exactly one owning file at the first split level.
- Second-level splits are optional and are only allowed after the required root files exist.
- If a second-level split is used, the parent root file still acts as the concern entry file and must link to its child files.
- Reviewers must be able to understand the concern from the parent file without opening every child file.

## File Skeletons

### `index.md`

```markdown
---
title: [Feature Design Title]
version: [e.g., 1.0]
author: [Team or Owner]
date: [YYYY-MM-DD]
status: [Draft | Review | Approved]
---

# [Feature Design Title]

## Executive Summary

Provide a concise summary of the feature objective, business value, and expected outcome.

## Changelog

| Version | Date | Author | Summary |
|---------|------|--------|---------|
| 1.0 | [YYYY-MM-DD] | [Author] | Initial design |

### Summary of Changes

Describe the current change request or latest revision in business language.

---

## 1. Objective & Scope

### Purpose

Describe the main goal of this feature and its intended users.

### Problem Statement

Describe the current pain point or business need.

### Success Criteria

List measurable outcomes that define success.

### In Scope

- [List features included in this delivery]
- [...]

### Out of Scope

- [List features explicitly excluded from this delivery]
- [...]

### Assumptions

- [Assumption 1]
- [Assumption 2]

### Dependencies

- [Dependency on migration, service, role, upstream system, or feature]

---

## 2. Document Map

| File | Purpose |
|------|---------|
| `architecture-data.md` | System architecture, data model, state transitions, diagrams |
| `frontend-spec.md` | UI flows, component responsibilities, client state |
| `backend-api.md` | API endpoints, auth, validation, error contracts |
| `quality-operations.md` | Testing, observability, rollout, risks, acceptance |

---

## 3. Cross-Cutting Decisions

### Business Rules Ownership

List the canonical location of major business rules to avoid duplication.

### Terminology

Define important domain terms used across this spec package.

### Open Questions

- [Question]
- [Question]

---

## 4. Approval Sign-off

| Role | Name | Status | Date | Notes |
|------|------|--------|------|-------|
| Product Owner | [Name] | [Pending/Approved] | [YYYY-MM-DD] | [Notes] |
| Engineering | [Name] | [Pending/Approved] | [YYYY-MM-DD] | [Notes] |
| QA | [Name] | [Pending/Approved] | [YYYY-MM-DD] | [Notes] |
```

### `architecture-data.md`

```markdown
# Architecture and Data

## 1. Architecture

### 1.1 System Architecture

```text
[Client Application]
      |
   HTTP/REST
      |
[Backend API]
  - Controller
  - Service
  - Repository
  - Validation
      |
    SQL/ORM
      |
[Database]
  - Existing tables
  - New tables
```

### 1.2 Module Boundaries

- [Module A]: [Responsibility]
- [Module B]: [Responsibility]

### 1.3 External Integrations

- [Integration]: [Purpose, direction, failure mode]

---

## 2. Data Model

### 2.1 Existing Structures

#### [Main Table] (Existing)
```sql
[table_name] {
  id: INT (PRIMARY KEY)
  ...
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

### 2.2 New Structures

#### [New Table] (NEW)
```sql
[table_name] {
  id: INT (PRIMARY KEY)
  ...
}
```

### 2.3 Data Lifecycle

- [How records are created]
- [How records are updated]
- [How records are archived or deleted]

### 2.4 Migration and Backward Compatibility

- [Migration required or not]
- [Backfill strategy]
- [Compatibility risks]

---

## 3. State Model

### 3.1 Entity States

| State | Meaning | Entry Condition | Exit Condition |
|-------|---------|-----------------|----------------|
| [state] | [meaning] | [condition] | [condition] |

### 3.2 State Transitions

1. [Transition rule]
2. [Transition rule]

---

## 4. Sequence Diagrams

### 4.1 Primary Flow

```text
Actor        Frontend      Backend       Database
  |             |             |              |
  |-- Action -->|             |              |
  |             |-- Request ->|              |
  |             |             |-- Write ---->|
  |             |<-- Reply ---|              |
```

### 4.2 Failure or Recovery Flow

```text
Actor        Frontend      Backend       Worker/Database
  |             |             |                |
  |-- Action -->|             |                |
  |             |-- Request ->|                |
  |             |             |-- Failure ---->|
  |             |<-- Error ---|                |
```
```

### `frontend-spec.md`

```markdown
# Frontend Specification

## 1. User Experience Overview

### Primary User Journeys

- [Journey 1]
- [Journey 2]

### Entry Points

- [Route or navigation entry point]

### Permissions and Visibility Rules

- [Who can see what]

---

## 2. Page Specifications

### 2.1 [List Page Name] (`/path`)

#### Purpose

Describe what the page helps the user accomplish.

#### Display

- [Field or column]: [Description] | [Validation or formatting]
- [Field or column]: [Description] | [Validation or formatting]

#### Filtering and Search

- [Search by ...]
- [Filter by ...]
- [Date range ...]

#### Sorting

- [Server-side or client-side]
- [Default sort]
- [Allowed sort fields]

#### Pagination

- [Server-side or client-side]
- [Default limit]
- [Limit options]

#### Empty, Loading, and Error States

- Empty: [Expected UI]
- Loading: [Expected UI]
- Error: [Expected UI]

#### UX Interactions

- [Interaction 1 -> expected behavior]
- [Interaction 2 -> expected behavior]

### 2.2 [Create Page Name] (`/path/create`)

#### Purpose

Describe the create flow goal.

#### Form Fields

- **[Field A]** (required): [Validation]
- **[Field B]** (optional): [Validation]

#### Form Actions

- **Save**: [Validate -> submit -> success flow]
- **Cancel**: [Cancel flow]

#### Validation

- Client-side: [Rules]
- Server-side dependencies: [Rules checked via API or backend]

#### Error Feedback

- Inline: [Field-level feedback]
- Global: [Toast/dialog/banner rules]

### 2.3 [Edit Page Name] (`/path/:id/edit`)

#### Purpose

Describe the edit flow goal.

#### Form Fields

- [Same as create + read-only fields if needed]

#### Form Actions

- **Save**: [Update flow]
- **Cancel**: [Cancel flow]

#### Additional Panel (Optional)

- [Audit/history/sidebar details]

#### Validation

- [Business constraints]

---

## 3. Component Specifications

### 3.1 Layout Overview

```text
[DefaultLayout]
├── [Topbar]
├── [Sidebar]
└── <router-view>
    ├── [ListPage]
    ├── [CreatePage]
    └── [EditPage]
```

### 3.2 Component Responsibilities

#### [ListPage].vue

- [Primary responsibilities]
- [Events and handlers]

**Flow - onMounted:**
1. [Step]
2. [Step]

#### [Table].vue

- [Responsibilities]
- [Props]
- [Emits]

#### [Filters].vue

- [Filter controls]
- [Debounce rules]

#### [Form].vue

- [Create/edit mode details]

**Props:**
- `mode`: `'create' | 'edit'`
- `initialData?`: [Type]

**Emits:**
- `submit(formData)`
- `cancel`

---

## 4. Client State and Data Fetching

### 4.1 Composable

#### use[Feature].ts

```typescript
getItems(filters)
createItem(data)
getItem(id)
updateItem(id, data)
deleteItem(id)
getItemActivity(id)

items: Ref<Item[]>
loading: Ref<boolean>
error: Ref<string>
pagination: Ref<PaginationInfo>
```

### 4.2 Store Management

#### File: client/src/stores/[feature].store.ts

Use this state/getter/action pattern:

```typescript
interface [Feature]State {
  items: Item[]
  currentItem: Item | null
  activityLogs: ActivityLog[]
  pagination: PaginationInfo
  filters: ItemFilters
  loading: boolean
  error: string | null
}
```

Store dependencies:

| Store | Role |
|-------|------|
| use[Feature]Store | Manage feature state |
| useAuthStore | Provide auth token/context |
| useUiStore | Show success/error toasts |

---

## 5. Accessibility and Localization

### Accessibility Requirements

- [Keyboard navigation]
- [Screen reader or aria behavior]
- [Focus handling]

### Localization Requirements

- [Translation keys]
- [Date, time, number formatting]
- [Locale-sensitive validation messages]
```

### `backend-api.md`

```markdown
# Backend API Specification

## 1. API Overview

### Base Path

- `[Base API path]`

### Authentication Model

- [JWT/session/other]

### Authorization Model

- [Role and permission model]

### Idempotency and Concurrency Rules

- [Idempotent operations]
- [Conflict handling]
- [Locking/version rules if applicable]

---

## 2. Endpoint Specifications

### 2.1 SV-001 - GET /api/[resource]

**[Endpoint description]**

Request:
```http
GET /api/[resource]?page=1&limit=10
```

Query Parameters:
- `page` (optional): default 1
- `limit` (optional): default 10
- `search` (optional): search fields

Flow:
1. Verify JWT token
2. Check role or permission
3. Validate query parameters
4. Query data
5. Return result with pagination metadata

Response (200 OK):
```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "pages": 0
  }
}
```

Errors:
- 401: Not authenticated
- 403: Forbidden

---

### 2.2 SV-002 - POST /api/[resource]

**[Create resource description]**

Request Body:
```json
{
  "field": "value"
}
```

Flow:
1. Verify JWT token
2. Check role or permission
3. Validate request body
4. Apply business rules
5. Insert to database
6. Return created entity

Response (201 Created):
```json
{
  "data": {}
}
```

Errors:
- 400: Validation error
- 409: Conflict

---

### 2.3 SV-003 - GET /api/[resource]/:id

**[Get detail description]**

Flow:
1. Verify JWT token
2. Validate route parameter
3. Query by id
4. Return entity

Response (200 OK):
```json
{
  "data": {}
}
```

Errors:
- 404: Not found

---

### 2.4 SV-004 - PUT /api/[resource]/:id

**[Update description]**

Request Body:
```json
{
  "field": "new value"
}
```

Flow:
1. Verify JWT token
2. Validate route parameter and request body
3. Check existing record
4. Apply business rules
5. Update entity
6. Return updated entity

Response (200 OK):
```json
{
  "data": {}
}
```

Errors:
- 400: Validation error
- 404: Not found
- 409: Conflict

---

### 2.5 SV-005 - DELETE /api/[resource]/:id

**[Delete description]**

Flow:
1. Verify JWT token
2. Check permission and business constraints
3. Delete entity
4. Return success message

Response (200 OK):
```json
{
  "message": "Deleted successfully"
}
```

Errors:
- 400: Bad request
- 404: Not found

---

### 2.6 SV-006 - GET /api/[resource]/:id/activity

**[Activity history description]**

Flow:
1. Verify JWT token
2. Validate route parameter
3. Query activity logs
4. Return logs

Response (200 OK):
```json
{
  "data": []
}
```

---

## 3. Shared Authorization Rules

All endpoints require:
1. Authentication verification
2. Role or permission validation

Special cases:
- [Add endpoint-specific authorization rules]

---

## 4. Validation and Error Contract

### Validation Rules

- [Schema or whitelist rules]
- [Field constraints]
- [Cross-field constraints]

### Error Handling

All errors must follow this format:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Error Scenarios

| Scenario | Status | Response |
|----------|--------|----------|
| [Scenario] | [Code] | [Response] |

---

## 5. Business Rules

- [Rule 1]
- [Rule 2]
- [Rule 3]
```

### `quality-operations.md`

```markdown
# Quality and Operations

## 1. Testing Strategy

### Backend Tests

- Unit: [Core business logic]
- Integration: [API or database flow]
- Authorization: [Role or permission boundary]

### Frontend Tests

- Component: [Component coverage]
- Integration: [Page or store behavior]
- E2E: [End-to-end user flows]

### Test Data and Fixtures

- [Required seed data]
- [Mock or fake integrations]

---

## 2. Non-Functional Requirements

### Performance Considerations

- [Pagination strategy]
- [Expected payload size]
- [Timeouts, polling, debounce, throughput]

### Reliability Requirements

- [Retry behavior]
- [Recovery expectations]
- [Consistency guarantees]

### Security Considerations

- Authentication: [Rule]
- Authorization: [Rule]
- Input Validation: [Rule]
- SQL Injection Prevention: [Rule]
- Sensitive Data Protection: [Rule]
- Audit Trail: [Rule]

---

## 3. Observability and Audit

### Logging

- [Structured log fields]
- [Correlation id]
- [PII restrictions]

### Metrics

- [Success/failure counters]
- [Latency or duration metrics]
- [Backlog or queue metrics if relevant]

### Audit Events

- [User or admin actions to record]
- [Audit payload fields]

---

## 4. Rollout and Operations

### Release Plan

- [Migration sequence]
- [Feature flag or phased rollout]
- [Rollback approach]

### Operational Runbook

- [How to diagnose failures]
- [How to retry or recover]
- [Manual fallback process]

---

## 5. Risks and Open Issues

### Risks

- [Risk]
- [Risk]

### Mitigations

- [Mitigation]
- [Mitigation]

### Open Issues

- [Issue]
- [Issue]

---

## 6. Acceptance Criteria

- [Criterion 1]
- [Criterion 2]
- [Criterion 3]

---

## 7. Future Enhancements

- [Future idea]
- [Future idea]
```

## Optional Second-Level Splits

Create sub-files only when one concern becomes too large to review comfortably.

Allowed second-level splits:

- `frontend-spec/`
  - `pages.md`
  - `components.md`
  - `client-state.md`
- `backend-api/`
  - `endpoints.md`
  - `validation-errors.md`
  - `business-rules.md`
- `quality-operations/`
  - `testing.md`
  - `observability.md`
  - `rollout-risks.md`

Rules for second-level splits:

- Do not split by page or endpoint too early unless the feature is already large and independently reviewable that way.
- Do not skip the required root concern files in favor of child-only files.
- Keep one parent concern file as the summary and navigation entry point.
- Keep business rule ownership explicit even after splitting.

## Migration Guide From Current Single-File Template

| Current Section | New Location |
|-----------------|--------------|
| Front matter | `index.md` |
| Executive Summary | `index.md` |
| Changelog | `index.md` |
| Objective & Scope | `index.md` |
| Architecture | `architecture-data.md` |
| Data Model | `architecture-data.md` |
| Feature Specifications | `frontend-spec.md` |
| Backend API Specification | `backend-api.md` |
| Frontend Components | `frontend-spec.md` |
| Sequence Diagrams | `architecture-data.md` |
| Security Considerations | `quality-operations.md` |
| Error Scenarios & Handling | `backend-api.md` or `quality-operations.md` |
| Testing Strategy | `quality-operations.md` |
| Performance Considerations | `quality-operations.md` |
| Future Enhancements | `quality-operations.md` |
| Approval Sign-off | `index.md` |

## Minimum Review Checklist

- Is `index.md` sufficient for a stakeholder to understand scope without opening every file?
- Does each business rule appear in exactly one canonical location?
- Can frontend, backend, and QA review mostly stay inside their owning files?
- Are testing and operational concerns explicit instead of implied?
- Is the package still small enough that cross-file navigation is manageable?
