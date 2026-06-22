```markdown
---
title: [Feature] - Backend Specification
version: [e.g., 1.0]
author: [Team or Owner]
date: [YYYY-MM-DD]
---

# [Feature] - Backend Specification

> Related: [00-index.md](./00-index.md) | [02-frontend.md](./02-frontend.md) | [03-behavior.md](./03-behavior.md) | [04-quality.md](./04-quality.md)

---

## 1. Data Models

### 1.1 Database Schema (Prisma models)

#### `ModelName` (table `[table_name]`)

| Property | Type / Prisma Modifier | Notes |
|----------|------------------------|-------|
| `id` | `Int @id @default(autoincrement())` | UNSIGNED, auto-increment |
| `fieldA` | `String` | NOT NULL |
| `fieldB` | `String?` | nullable |
| `fieldC` | `DateTime @default(now())` (column `created_at`) | timestamp |
| `updatedAt` | `DateTime @updatedAt` (column `updated_at`) | auto-updated |
| `relationField` | `RelatedModel[] @relation("Name")` | relation (if applicable) |
| Indexes | `@@index([fieldA])`, `@@index([fieldB, fieldC])` | |
| `@@map` | `"table_name"` | |

#### `RelatedModel` (table `[related_table]`, if applicable)

| Property | Type / Prisma Modifier | Notes |
|----------|------------------------|-------|
| `id` | `Int @id @default(autoincrement())` | |
| `parentId` | `Int` (column `parent_id`) | FK → `ModelName.id`, `onDelete: Cascade` |
| `parent` | `ModelName @relation("Name", fields: [parentId], references: [id], onDelete: Cascade)` | |
| `@@map` | `"related_table"` | |

### 1.2 TypeScript Models
Only list name of the data models relevant to this feature. Do not include full definitions.
Include full path of the files where these models are defined.
``` markdown
### [model_name].model.ts (`models/`)
- `[ModelName]` (field1, field2, field3, ...)

---

## 2. API Endpoints

### 2.1 Authorization

All endpoints require:
1. Valid JWT token in `Authorization: Bearer <token>` header
2. Role/permission validation per endpoint

---

### SV-001 — GET `/api/[resource]`
**List all [resource] with pagination and filtering**

**Required Role:** `[role]`

Request:
```http
GET /api/[resource]?page=1&limit=10&search=keyword&filterA=value
Authorization: Bearer <token>
```

Query Parameters:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number |
| `limit` | number | No | 10 | Items per page (max 100) |
| `search` | string | No | - | Search by [field] |
| `filterA` | string | No | - | Filter by [field A] |

Flow:
1. Verify JWT token
2. Check role/permission
3. Validate query parameters
4. Query database with filters and pagination
5. Return result with pagination metadata

Response (200 OK):
```json
{
  "data": Model[], (Name of MODEL described in `1.2 TypeScript Models` section)
  "pagination": PaginationInfo
}
```

Errors:
| Status | Code | Message |
|--------|------|---------|
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Insufficient permissions |

---

### SV-002 — POST `/api/[resource]`
**Create a new [resource]**

**Required Role:** `[role]`

Request:
```http
POST /api/[resource]
Authorization: Bearer <token>
Content-Type: application/json
Body: Model (Name of MODEL described in `1.2 TypeScript Models` section)
```

Flow:
1. Verify JWT token
2. Check role/permission
3. Validate request body (see Validation Rules)
4. Check for duplicates if applicable
5. Insert record to database
6. Return created entity

Response (201 Created):
```json
{
  "data": Model[], (Name of MODEL described in `1.2 TypeScript Models` section)
}
```

Errors:
| Status | Code | Message |
|--------|------|---------|
| 400 | `VALIDATION_ERROR` | Validation failed |
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 409 | `CONFLICT` | [Resource] already exists |

---

### SV-003 — GET `/api/[resource]/:id`
**Get single [resource] by ID**

**Required Role:** `[role]`

Request:
```http
GET /api/[resource]/1
Authorization: Bearer <token>
```

Flow:
1. Verify JWT token
2. Check role/permission
3. Validate `id` route parameter (positive integer)
4. Query by id
5. Return entity or 404

Response (200 OK):
```json
{
  "data": Model, (Name of MODEL described in `1.2 TypeScript Models` section)
}
```

Errors:
| Status | Code | Message |
|--------|------|---------|
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | [Resource] not found |

---

### SV-004 — PUT `/api/[resource]/:id`
**Update an existing [resource]**

**Required Role:** `[role]`

Request:
```http
PUT /api/[resource]/1
Authorization: Bearer <token>
Content-Type: application/json
Body: Model (Name of MODEL, Do not list detailed fields)
```

Flow:
1. Verify JWT token
2. Check role/permission
3. Validate `id` route parameter and request body
4. Check record exists
5. Check for duplicate conflicts if applicable
6. Update record
7. Return updated entity

Response (200 OK):
```json
{
  "data": Model, (Name of MODEL described in `1.2 TypeScript Models` section)
}
```

Errors:
| Status | Code | Message |
|--------|------|---------|
| 400 | `VALIDATION_ERROR` | Validation failed |
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | [Resource] not found |
| 409 | `CONFLICT` | Duplicate value conflict |

---

### SV-005 — DELETE `/api/[resource]/:id`
**Delete a [resource]**

**Required Role:** `[role]`

Request:
```http
DELETE /api/[resource]/1
Authorization: Bearer <token>
```

Flow:
1. Verify JWT token
2. Check role/permission
3. Validate `id` route parameter
4. Check record exists
5. Check business constraints (e.g., cannot delete if has dependents)
6. Delete record
7. Return success message

Response (200 OK):
```json
{
  "message": "Deleted successfully"
}
```

Errors:
| Status | Code | Message |
|--------|------|---------|
| 400 | `BAD_REQUEST` | Cannot delete: [business reason] |
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | [Resource] not found |

---

## 3. Validation Rules

### 3.1 Client-Side Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| `fieldA` | Required, min 2 chars, max 100 chars | "Field A is required" / "Min 2 characters" |
| `fieldB` | Required, must be valid enum value | "Field B is required" |
| `fieldC` | Optional, max 500 chars | "Max 500 characters" |

### 3.2 Server-Side Validation

| Field | Rule | HTTP Status |
|-------|------|-------------|
| `fieldA` | Required, string, 2–100 chars | 400 |
| `fieldB` | Required, must be in allowed values | 400 |
| `fieldC` | Optional, string, max 500 chars | 400 |
| `id` (route param) | Must be positive integer | 400 |

### 3.3 Business Rules

- [Rule 1]: [Description] -> [Error if violated]
- [Rule 2]: [Description] -> [Error if violated]

---

## 4. Error Handling

### 4.1 Standard Error Response Format

All errors must follow this format:
```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

### 4.2 Error Scenarios

| Scenario | HTTP Status | Code | Response Message |
|----------|-------------|------|-----------------|
| Not authenticated | 401 | `UNAUTHORIZED` | "Not authenticated" |
| Forbidden | 403 | `FORBIDDEN` | "Insufficient permissions" |
| Validation failed | 400 | `VALIDATION_ERROR` | "Validation error: [details]" |
| Duplicate conflict | 409 | `CONFLICT` | "[Resource] already exists" |
| Not found | 404 | `NOT_FOUND` | "[Resource] not found" |
| Business rule violation | 400 | `BUSINESS_ERROR` | "[Specific reason]" |
| Database error | 500 | `INTERNAL_ERROR` | "Internal server error" |

---
```