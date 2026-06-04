---
title: Admin Vocabulary Management - Quality Specification
version: 1.0
author: Admin Team
date: 2026-06-04
---

# Admin Vocabulary Management - Quality Specification

> Related: [00-index.md](./00-index.md) | [01-backend.md](./01-backend.md) | [02-frontend.md](./02-frontend.md) | [03-behavior.md](./03-behavior.md)

---

## 1. Testing Strategy

### 1.1 Backend Unit Tests

**VocabulariesService Tests**

| Test ID | Method | Scenario | Arrange | Act | Assert |
|---------|--------|----------|--------|-----|--------|
| BU-001 | listVocabularies() | List with no filters | Insert 5 vocabularies | Call with {} filters | Returns all 5 vocabs, pagination correct |
| BU-002 | listVocabularies() | List with status filter | Insert 3 publish, 2 hide | Call with {status: 'publish'} | Returns 3 vocabs with publish status |
| BU-003 | listVocabularies() | List with pagination | Insert 25 vocabs | Call with {limit: 10, page: 2} | Returns vocabs 11-20, pagination.pages = 3 |
| BU-004 | listVocabularies() | List with search keyword | Insert vocab "日本", "世界" | Call with {search: '日本'} | Returns only "日本" |
| BU-005 | listVocabularies() | List with date range | Insert vocabs from Jan-May | Call with {dateFrom, dateTo} | Returns vocabs within range |
| BU-006 | getVocabulary() | Get with relations | Create vocab with tags, synonyms | Call with id | Returns vocab with all relations populated |
| BU-007 | createVocabulary() | Create valid vocab | Provide valid DTO | Call createVocabulary() | Returns created vocab with id, version = 1 |
| BU-008 | createVocabulary() | Create with tags | Provide tags in DTO | Call createVocabulary() | Tags inserted into vocabulary_tags table |
| BU-009 | createVocabulary() | Create with related words | Provide relatedWordIds | Call createVocabulary() | Links created in vocabulary_related_words |
| BU-010 | createVocabulary() | Duplicate check fails | Existing vocab (にほん, nihon) | Try to create same | Returns 409 Conflict error |
| BU-011 | createVocabulary() | Missing required field | No meaning_vi | Call createVocabulary() | Returns validation error |
| BU-012 | updateVocabulary() | Update single field | Existing vocab, change meaning | Call updateVocabulary() | Vocab updated, version incremented, changelog created |
| BU-013 | updateVocabulary() | Update tags | Change tags | Call updateVocabulary() | Old tags deleted, new tags inserted |
| BU-014 | updateVocabulary() | Update with duplicate check | Change hiragana to existing | Call updateVocabulary() | Returns 409 Conflict |
| BU-015 | updateVocabulary() | Version increment | vocab.version = 1 | Call updateVocabulary() | vocab.version = 2 |
| BU-016 | updateVocabulary() | Changelog creation | Any field changes | Call updateVocabulary() | New changelog entry created with description |
| BU-017 | deleteVocabulary() | Soft delete | Existing vocab, status = publish | Call deleteVocabulary() | status changed to 'deleted', changelog created |
| BU-018 | deleteVocabulary() | Non-existent vocab | id = 999 | Call deleteVocabulary() | Returns 404 Not Found |
| BU-019 | exportCsv() | Export all | Multiple vocabs | Call exportCsv() | Returns CSV string with all vocab data |
| BU-020 | exportCsv() | Export with filters | vocabs with status=publish | Call exportCsv({status:'publish'}) | CSV contains only publish vocabs |

**VocabulariesRepository Tests**

| Test ID | Method | Scenario | Arrange | Act | Assert |
|---------|--------|----------|--------|-----|--------|
| BR-001 | create() | Insert vocabulary | Valid vocab object | Call create() | Returns created record with id |
| BR-002 | findById() | Find with relations | Created vocab with tags | Call findById(id) | Returns vocab with tags array populated |
| BR-003 | update() | Update with version | Existing vocab | Call update() | Version counter incremented |
| BR-004 | findByHiraganaRomaji() | Duplicate check | Existing (にほん, nihon) | Call findByHiraganaRomaji() | Returns the existing vocab |
| BR-005 | delete() | Soft delete | Existing vocab | Call delete(id) | status = 'deleted', data preserved |

**VocabulariesValidation Tests**

| Test ID | Schema | Field | Valid Input | Invalid Input | Expected Error |
|---------|--------|-------|-------------|---------------|-----------------|
| BV-001 | createVocabularySchema | meaning_vi | "日本" | "" | Required error |
| BV-002 | createVocabularySchema | meaning_vi | "a".repeat(500) | "a".repeat(501) | Max length error |
| BV-003 | createVocabularySchema | hiragana | "にほん" | "nihon" (no hiragana) | Japanese charset error |
| BV-004 | createVocabularySchema | level | "N5" | "N0" | Invalid enum error |
| BV-005 | createVocabularySchema | media_url | "https://example.com/img.jpg" | "not-a-url" | URL format error |
| BV-006 | createVocabularySchema | tags | ["tag1"] | ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10", "tag11"] | Max 10 items error |

---

### 1.2 Backend Integration Tests

**API Endpoint Tests**

| Test ID | Endpoint | Method | Scenario | Setup | Expected | Notes |
|---------|----------|--------|----------|-------|----------|-------|
| BI-001 | /api/admin/vocabularies | GET | List vocabs (admin) | Auth: admin, Insert 5 vocabs | 200 OK, 5 items | Auth required |
| BI-002 | /api/admin/vocabularies | GET | List vocabs (non-admin) | Auth: user role | 403 Forbidden | Role check |
| BI-003 | /api/admin/vocabularies | GET | List vocabs (no auth) | No auth header | 401 Unauthorized | Auth required |
| BI-004 | /api/admin/vocabularies | GET | List with filters | Auth: admin, query params | 200 OK, filtered items | Filtering works |
| BI-005 | /api/admin/vocabularies | POST | Create vocab | Auth: admin, valid body | 201 Created, id assigned | Auto-increment |
| BI-006 | /api/admin/vocabularies | POST | Create duplicate | Auth: admin, duplicate hiragana | 409 Conflict | Unique constraint |
| BI-007 | /api/admin/vocabularies/:id | GET | Get single | Auth: admin, existing id | 200 OK, with relations | Includes changelog, reports |
| BI-008 | /api/admin/vocabularies/:id | GET | Get non-existent | Auth: admin, id=999 | 404 Not Found | Proper error |
| BI-009 | /api/admin/vocabularies/:id | PUT | Update vocab | Auth: admin, valid body | 200 OK, version incremented | Changelog created |
| BI-010 | /api/admin/vocabularies/:id | PUT | Update non-existent | Auth: admin, id=999 | 404 Not Found | Proper error |
| BI-011 | /api/admin/vocabularies/:id | DELETE | Delete vocab | Auth: admin, existing id | 200 OK, soft delete | Status = 'deleted' |
| BI-012 | /api/admin/vocabularies/export/csv | GET | Export CSV | Auth: admin, multiple vocabs | 200 OK, CSV content | Content-Type correct |

---

### 1.3 Frontend Unit Tests (Vue Components)

**VocabularyListPage Tests**

| Test ID | Component | Method | Scenario | Arrange | Act | Assert |
|---------|-----------|--------|----------|--------|-----|--------|
| FU-001 | VocabularyListPage | onMounted() | Initial load | Mock store.fetchVocabularies | Mount component | fetchVocabularies called |
| FU-002 | VocabularyListPage | handleFilterChange() | Apply filters | Create filter object | Emit filter-change | Store.fetchVocabularies called with filters |
| FU-003 | VocabularyListPage | handlePageChange() | Change page | Initial page 1 | Click page 2 | fetchVocabularies called with page 2 |
| FU-004 | VocabularyListPage | handleEdit() | Click edit | Render table, mock router | Click edit row | router.push called with id |
| FU-005 | VocabularyListPage | handleDelete() | Delete with confirm | Render table | Click delete, confirm | deleteVocabulary called |
| FU-006 | VocabularyListPage | handleDelete() | Delete reject | Delete dialog open | Click reject | deleteVocabulary NOT called |
| FU-007 | VocabularyListPage | handleExportCsv() | Export all | Mock exportCsv | Click export button | Trigger file download |
| FU-008 | VocabularyListPage | render() | Empty state | Store.vocabularies = [] | Mount component | Show "No vocabularies" message |
| FU-009 | VocabularyListPage | render() | Error state | Store.error = "API error" | Mount component | Show error toast |

**VocabularyFormPage Tests**

| Test ID | Component | Method | Scenario | Arrange | Act | Assert |
|---------|-----------|--------|----------|--------|-----|--------|
| FU-010 | VocabularyFormPage | onMounted() | Create mode | route.params.id undefined | Mount | Form empty, formDirty = false |
| FU-011 | VocabularyFormPage | onMounted() | Edit mode | route.params.id = 1 | Mount | fetchVocabulary called, form populated |
| FU-012 | VocabularyFormPage | handleSave() | Create valid | Fill form with valid data | Click Save | POST API called, success toast |
| FU-013 | VocabularyFormPage | handleSave() | Missing required field | Form with empty meaning_vi | Click Save | Show validation error |
| FU-014 | VocabularyFormPage | handleSave() | Update | Edit existing vocab | Click Save | PUT API called |
| FU-015 | VocabularyFormPage | handleCancel() | Cancel pristine | formDirty = false | Click Cancel | Navigate to list (no confirm) |
| FU-016 | VocabularyFormPage | handleCancel() | Cancel dirty | formDirty = true | Click Cancel | Show confirm dialog |
| FU-017 | VocabularyFormPage | handleCancel() | Confirm discard | Dirty form, show dialog | Click Discard | Navigate to list |
| FU-018 | VocabularyFormPage | handleDelete() | Delete confirm | Edit mode form | Click Delete | Show confirm dialog |
| FU-019 | VocabularyFormPage | handleDelete() | Confirm delete | Delete dialog open | Click confirm | DELETE API called, navigate to list |
| FU-020 | VocabularyFormPage | handleFormInput() | Field change | Form rendered | Type in input | formDirty = true |
| FU-021 | VocabularyInformationTab | handleRelatedWordsSelect() | Select related word | MultiSelect rendered with options | Select item | Self-reference filtered out |
| FU-022 | VocabularyAuditTab | render() | Display changelog | Pass changeLogs array | Render tab | Table shows all changelogs |
| FU-023 | VocabularyAnalyticsTab | render() | Display counts | learnCount=156, favoriteCount=45 | Render tab | Show correct counts |

**Composable Tests**

| Test ID | Composable | Function | Scenario | Arrange | Act | Assert |
|---------|-----------|----------|----------|--------|-----|--------|
| FU-024 | useVocabularies | listVocabularies() | API call success | Mock API | Call with filters | Return data array |
| FU-025 | useVocabularies | getVocabulary() | API call | Mock API | Call with id | Return vocabulary object |
| FU-026 | useVocabularies | createVocabulary() | API call | Mock API | Call with DTO | Return created vocab |
| FU-027 | useVocabularies | exportCsv() | API call | Mock API | Call with filters | Return Blob |

**Store Tests**

| Test ID | Store | Action | Scenario | Arrange | Act | Assert |
|---------|-------|--------|----------|--------|-----|--------|
| FU-028 | useVocabulariesStore | fetchVocabularies() | Fetch success | Mock API | Call action | vocabularies array updated |
| FU-029 | useVocabulariesStore | fetchVocabularies() | Fetch error | Mock API error | Call action | error state set, loading = false |
| FU-030 | useVocabulariesStore | updateVocabulary() | Update | Mock API | Call action | currentVocabulary updated |
| FU-031 | useVocabulariesStore | setFormDirty() | Set dirty | Initial state | Call action | formDirty = true |

---

### 1.4 Frontend E2E Tests (Playwright)

| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| E2E-001 | View vocabulary list | 1. Login as admin<br/>2. Navigate to /vocabularies | List page loads with table |
| E2E-002 | Filter by status | 1. On list page<br/>2. Select status filter<br/>3. Click Apply | Table updates showing filtered results |
| E2E-003 | Create vocabulary | 1. Click Create button<br/>2. Fill form fields<br/>3. Click Save | Form submits, success toast, redirect to list |
| E2E-004 | Edit vocabulary | 1. Click Edit on row<br/>2. Change a field<br/>3. Click Save | Updates save, version increments |
| E2E-005 | Discard unsaved | 1. Edit form<br/>2. Change field<br/>3. Click Cancel<br/>4. Confirm Discard | Form closes without saving |
| E2E-006 | Delete vocabulary | 1. Click Delete<br/>2. Confirm | Vocabulary deleted, removed from list |
| E2E-007 | Export CSV | 1. On list page<br/>2. Click Export CSV | CSV file downloaded |
| E2E-008 | View audit history | 1. Open form (edit)<br/>2. Click Audit tab | Shows changelog with all versions |
| E2E-009 | View analytics | 1. Open form<br/>2. Click Analytics tab | Shows learn count and favorite count |
| E2E-010 | Authorization check | 1. Login as regular user<br/>2. Try to access /vocabularies | Redirect to 403 Forbidden or list (role check) |

---

## 2. Performance Considerations

### 2.1 Frontend Performance

| Metric | Target | Implementation |
|--------|--------|-----------------|
| **Page Load Time** | < 2s | Lazy-load related words dropdowns (paginated load instead of all at once) |
| **Form Response** | < 100ms | Debounce validation, use shallowRef for large lists |
| **List Pagination** | < 500ms | Use virtual scrolling for large tables (PrimeVue DataTable) |
| **Search/Filter** | < 1s | Debounce search input (300ms), server-side filtering |
| **Export CSV** | < 3s | Generate client-side for small datasets, server-side for large |
| **Bundle Size** | No increase | Use tree-shaking, code-split components |

### 2.2 Backend Performance

| Metric | Target | Implementation |
|--------|--------|-----------------|
| **List API** | < 200ms | Pagination (max 50 items), database indexes on level, status, created_by, created_at |
| **Get Detail** | < 300ms | Eager load relations (tags, related words, changelog, reports) |
| **Create** | < 500ms | Batch insert tags/relations, single transaction |
| **Update** | < 500ms | Batch update links, create changelog in same transaction |
| **CSV Export** | < 2s | Stream response, no memory buffering |
| **Database Connections** | Pool 10-20 | Use connection pooling (default in Express/MySQL) |

### 2.3 Database Optimization

| Technique | Purpose |
|-----------|---------|
| **Indexes** | CREATE INDEX on level, status, created_by, created_at for filtering |
| **Pagination** | LIMIT/OFFSET for list endpoint, max 50 items |
| **Eager Loading** | SELECT with JOINs for related words, synonyms, antonyms |
| **Lazy Loading** | Load changelog/reports only on demand (separate API call in edit mode) |
| **Connection Pooling** | Reuse connections, max pool size 20 |

---

## 3. Security Considerations

### 3.1 Authentication & Authorization

| Requirement | Implementation |
|-------------|-----------------|
| **Role-Based Access** | All endpoints require JWT + admin role verification |
| **Token Validation** | Verify JWT signature and expiration |
| **Rate Limiting** | 100 req/min per user (prevent brute force) |
| **CORS** | Allow only domain specified in config |
| **CSRF Protection** | Use SameSite=Strict cookies (if applicable) |

### 3.2 Data Validation

| Validation | Implementation |
|-----------|-----------------|
| **Input Sanitization** | Remove HTML tags from meaning_vi, note fields |
| **Field Length Validation** | Enforce max length limits (500 chars for meaning, etc.) |
| **Enum Validation** | Only allow specified status/level values |
| **URL Validation** | Validate media_url is valid HTTP/HTTPS URL |
| **File Upload** | Not implemented in MVP, but future: validate file type/size |

### 3.3 Data Protection

| Requirement | Implementation |
|-------------|-----------------|
| **SQL Injection** | Use parameterized queries (Knex/ORM) |
| **XSS Prevention** | Escape/sanitize all user input before DB insert |
| **Password Hashing** | Not applicable (no password field in vocabularies) |
| **Sensitive Data Logging** | Never log full payloads, only request metadata |
| **Soft Delete** | Keep deleted records for audit trail |

### 3.4 API Security

| Header | Value | Purpose |
|--------|-------|---------|
| `Authorization` | Bearer `<token>` | Require valid JWT |
| `Content-Type` | application/json | Validate request format |
| `X-Request-ID` | UUID | Track requests for logging |
| `Strict-Transport-Security` | max-age=31536000 | Force HTTPS |

---

## 4. Accessibility (a11y)

### 4.1 Keyboard Navigation

| Component | Requirement |
|-----------|-------------|
| **Form Fields** | Tab order: top-to-bottom, Shift+Tab to go back |
| **Buttons** | Space/Enter to activate, visible focus ring |
| **Dropdowns** | Arrow keys to navigate, Enter to select |
| **MultiSelect** | Arrow keys, Space to toggle item, Ctrl+A for select all |
| **DataTable** | Arrow keys for navigation, 'a' for actions menu |
| **Dialogs** | Tab loops within dialog, Escape to close |

### 4.2 Screen Reader Support

| Element | Implementation |
|---------|-----------------|
| **Page Titles** | Each page has unique, descriptive `<title>` |
| **Headings** | Proper heading hierarchy (h1 → h2 → h3) |
| **Form Labels** | `<label for="field-id">` for each input |
| **ARIA Attributes** | aria-label for icon buttons, aria-live for toasts |
| **Error Messages** | Associated with field via aria-describedby |
| **Tables** | `<thead>`, `<tbody>`, scope="col" for column headers |
| **Icons** | Use aria-hidden="true" for decorative icons |

### 4.3 Visual Accessibility

| Requirement | Implementation |
|-------------|-----------------|
| **Color Contrast** | Minimum 4.5:1 for text (WCAG AA) |
| **Font Size** | Minimum 14px for body text, 16px for inputs |
| **Focus Indicators** | Clear visible focus ring (2px outline) |
| **Error Display** | Use color + icon + text (not color alone) |
| **Status Badges** | Include text label alongside color |

---

## 5. Logging & Audit

### 5.1 Application Logging

| Event | Log Level | Details | Purpose |
|-------|-----------|---------|---------|
| Create vocabulary | INFO | vocabulary_id, meaning_vi, created_by, timestamp | Audit trail |
| Update vocabulary | INFO | vocabulary_id, changed_fields, updated_by, timestamp | Audit trail |
| Delete vocabulary | INFO | vocabulary_id, deleted_by, timestamp | Audit trail |
| API Error | ERROR | endpoint, status, error_code, request_id | Debugging |
| Authorization Failure | WARN | endpoint, user_id, reason | Security audit |
| Validation Error | INFO | endpoint, field_errors | Debugging |
| Export CSV | INFO | export_count, filtered_by, timestamp | Usage tracking |

### 5.2 Change Log Table

The `vocabulary_change_logs` table stores all modifications:

| Field | Purpose |
|-------|---------|
| `id` | Unique identifier |
| `vocabulary_id` | Foreign key to vocabulary |
| `version` | Version number (matches vocab.version) |
| `changed_fields` | Comma-separated list of changed field names |
| `change_description` | Human-readable description (e.g., "meaning_vi updated from 'X' to 'Y'") |
| `changed_by` | User ID who made the change |
| `created_at` | Timestamp of change |

**Example Entry:**
```
id: 5
vocabulary_id: 1
version: 3
changed_fields: "meaning_vi, note"
change_description: "meaning_vi updated from 'Japan' to 'Japan (country)'. note updated from empty to 'East Asia'"
changed_by: 5
created_at: 2026-06-04 15:30:00
```

### 5.3 Report Tracking

The `vocabulary_reports` table tracks user-submitted reports:

| Field | Purpose |
|-------|---------|
| `id` | Unique identifier |
| `vocabulary_id` | Which vocabulary was reported |
| `reporter_id` | User who submitted report |
| `report_type` | Type: incorrect_meaning, offensive_content, duplicate, other |
| `report_reason` | User's description |
| `status` | pending, resolved, rejected |
| `created_at` | When reported |
| `resolved_at` | When resolved/rejected |

**Admin View in Audit Tab:**
- Shows all reports for a vocabulary
- Displays: Type, Reason, Status, Reporter Name, Date
- Admins can mark as resolved/rejected (future feature)

### 5.4 Logging Best Practices

```typescript
// DO: Log with context
logger.info('vocabulary.updated', {
  vocabulary_id: 1,
  changed_fields: ['meaning_vi', 'note'],
  changed_by: 5,
  request_id: 'uuid'
});

// DON'T: Log sensitive data
logger.error('vocabulary.create_failed', {
  // ❌ Don't include full request body
  // payload: req.body
  // ✅ Do include only relevant metadata
  endpoint: '/api/admin/vocabularies',
  status: 500,
  request_id: 'uuid'
});
```

### 5.5 Error Tracking

| Error Scenario | Log Level | Action |
|----------------|-----------|--------|
| Duplicate vocabulary error | WARN | Log user action, suggest edit existing |
| Validation error | INFO | Log field validation failure |
| Database connection error | ERROR | Alert ops team, retry logic |
| Authorization failure | WARN | Log failed attempt, check for abuse |
| API timeout | ERROR | Retry, log timeout threshold exceeded |

---
