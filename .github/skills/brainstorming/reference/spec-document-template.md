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

---

## 1. Objective & Scope

### Purpose

Describe the main goal of this feature and its intended users.

### In Scope

- [List features included in this delivery]
- [...]

### Out of Scope

- [List features explicitly excluded from this delivery]
- [...]

---

## 2. Architecture

### 2.1 System Architecture

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

### 2.2 Data Model

#### [Main Table] (Existing)
```sql
[table_name] {
  id: INT (PRIMARY KEY)
  ...
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

#### [New Table] (NEW)
```sql
[table_name] {
  id: INT (PRIMARY KEY)
  ...
}
```

---

## 3. Feature Specifications

### 3.1 [List Page Name] (`/path`)

#### Display

- [Field/column 1]: [Description]
- [Field/column 2]: [Description]

#### Filtering & Search

- [Search by ...]
- [Filter by ...]
- [Date range ...]

#### Pagination

- [Server-side/client-side]
- [Default limit]
- [Limit options]

#### UX Interactions

- [Interaction 1 -> expected behavior]
- [Interaction 2 -> expected behavior]

### 3.2 [Create Page Name] (`/path/create`)

#### Form Fields

- **[Field A]** (required): [Validation]
- **[Field B]** (optional): [Validation]

#### Form Actions

- **Save**: [Validate -> submit -> success flow]
- **Cancel**: [Cancel flow]

#### Validation

- Client-side: [Rules]
- Server-side: [Rules]

### 3.3 [Edit Page Name] (`/path/:id/edit`)

#### Form Fields

- [Same as create + read-only fields if needed]

#### Form Actions

- **Save**: [Update flow]
- **Cancel**: [Cancel flow]

#### Additional Panel (Optional)

- [Audit/history/sidebar details]

#### Validations

- [Business constraints]

---

## 4. Backend API Specification

### 4.1 Endpoints

#### SV-001 - GET /api/[resource]
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
2. Check role/permission
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

#### SV-002 - POST /api/[resource]
**[Create resource description]**

Request Body:
```json
{
  "field": "value"
}
```

Flow:
1. Verify JWT token
2. Check role/permission
3. Validate request body
4. Insert to database
5. Return created entity

Response (201 Created):
```json
{
  "data": {}
}
```

Errors:
- 400: Validation error
- 409: Conflict (duplicate)

---

#### SV-003 - GET /api/[resource]/:id
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

#### SV-004 - PUT /api/[resource]/:id
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
4. Update entity
5. Return updated entity

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

#### SV-005 - DELETE /api/[resource]/:id
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

#### SV-006 - GET /api/[resource]/:id/activity
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

### 4.2 Authorization

All endpoints require:
1. JWT verification
2. Role/permission validation

Special cases:
- [Add any endpoint-specific authorization rules]

### 4.3 Error Handling

All errors must follow this format:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

---

## 5. Frontend Components

### 5.1 File Structure

```text
client/src/pages/[feature]/
├── [ListPage].vue
├── [CreatePage].vue
├── [EditPage].vue
├── components/
│   ├── [Table].vue
│   ├── [Filters].vue
│   ├── [Form].vue
│   └── [OptionalViewer].vue
├── composables/
│   └── use[Feature].ts
└── [feature].routes.ts
```

### 5.2 Component Details

#### Layout Overview

```text
[DefaultLayout]
├── [Topbar]
├── [Sidebar]
└── <router-view>
    ├── [ListPage]      <- /path
    ├── [CreatePage]    <- /path/create
    └── [EditPage]      <- /path/:id/edit
```

Component relationships:

```text
[ParentPage]
  |- [ChildA] emits: ...
  |- [ChildB] emits: ...
```

#### [ListPage].vue

- [Primary responsibilities]
- [Events and handlers]

**Flow - onMounted:**
1. [Step]
2. [Step]

**Flow - handleFilterChange(filters):**
1. [Step]
2. [Step]

#### [Table].vue

- [Table responsibilities]
- [Props]
- [Emits]

#### [Filters].vue

- [Filter controls]

**Flow - handleSearchInput(value):**
1. [Step]
2. [Step]

#### [Form].vue

- [Create/edit mode details]

**Props:**
- `mode`: `'create' | 'edit'`
- `initialData?`: [Type]

**Emits:**
- `submit(formData)`
- `cancel`

**Flow - handleSubmit():**
1. Validate fields
2. Emit submit if valid

#### [CreatePage].vue

- [Create flow summary]

#### [EditPage].vue

- [Edit flow summary]

#### [OptionalViewer].vue

- [Sidebar/history/extra details]

### 5.3 Composable

#### use[Feature].ts
```typescript
// API calls
getItems(filters)
createItem(data)
getItem(id)
updateItem(id, data)
deleteItem(id)
getItemActivity(id)

// State management
items: Ref<Item[]>
loading: Ref<boolean>
error: Ref<string>
pagination: Ref<PaginationInfo>
```

### 5.4 Store Management

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

// Actions
fetchItems(filters?: ItemFilters): Promise<void>
fetchItem(id: number): Promise<void>
createItem(data: CreateItemDto): Promise<Item>
updateItem(id: number, data: UpdateItemDto): Promise<void>
deleteItem(id: number): Promise<void>
fetchItemActivity(id: number): Promise<void>
```

Store dependencies:

| Store | Role |
|-------|------|
| use[Feature]Store | Manage feature state |
| useAuthStore | Provide auth token/context |
| useUiStore | Show success/error toasts |

---

## 6. Sequence Diagrams

### 6.1 Create Flow

```text
Actor        Frontend      Backend       Database
  |             |             |              |
  |-- Submit -->|             |              |
  |             |-- POST ---->|              |
  |             |             |-- INSERT --->|
  |             |<-- 201 -----|              |
```

### 6.2 Delete Flow

```text
Actor        Frontend      Backend       Database
  |             |             |              |
  |-- Delete -->|             |              |
  |             |-- DELETE -->|              |
  |             |             |-- DELETE --->|
  |             |<-- 200 -----|              |
```

---

## 7. Security Considerations

- Authentication: [Rule]
- Authorization: [Rule]
- Input Validation: [Rule]
- SQL Injection Prevention: [Rule]
- Sensitive Data Protection: [Rule]
- Audit Trail: [Rule]

---

## 8. Error Scenarios & Handling

| Scenario | Status | Response |
|----------|--------|----------|
| Not authenticated | 401 | "Not authenticated" |
| Forbidden | 403 | "Forbidden" |
| Validation failed | 400 | "Validation error" |
| Conflict | 409 | "Already exists" |
| Not found | 404 | "Not found" |
| Database error | 500 | "Internal server error" |

---

## 9. Testing Strategy

### Backend Tests
- Unit: [Service/business rules]
- Integration: [API + database]
- Authorization: [Permission rules]

### Frontend Tests
- Component: [Form/table/filter]
- Integration: [API + store]
- E2E: [Main user flows]

---

## 10. Performance Considerations
- Pagination: [Strategy]
- Filtering: [Indexed columns]
- Search: [Strategy]
- Caching: [If applicable]
- Lazy Loading: [If applicable]

---

```