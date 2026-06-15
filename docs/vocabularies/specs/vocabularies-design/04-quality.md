# Vocabulary Management — Quality Specification

> Related: [00-index.md](./00-index.md) | [01-backend.md](./01-backend.md) | [02-frontend.md](./02-frontend.md) | [03-behavior.md](./03-behavior.md)

---

## 1. Testing Strategy

### 1.1 Backend Tests
> **Rule**: All **backend tests** should be in **only 1 file**: `server/src/modules/vocabulary/vocabulary.controller.test.ts`
- Use Database test for test. Not use in-memory mocks or fake implementations. Use the same test database and run migrations before tests.
#### Unit Tests — `vocabularies.controller.test.ts`

| TC ID | Test Case | Arrange | Act | Assert |
|-------|-----------|---------|-----|--------|
| UT-001 | POST /api/vocabularies — create success | Valid DTO, admin user | `controller.create(req, res)` | 201 + created vocabulary |
| UT-002 | POST /api/vocabularies — validation error | Invalid DTO (missing kanji) | `controller.create(req, res)` | 400 + validation error message |
| UT-003 | POST /api/vocabularies — duplicate kanji+meaning | Existing vocab with same kanji+meaning | `controller.create(req, res)` | 409 + DUPLICATE_VOCAB error |
| UT-004 | POST /api/vocabularies — unauthorized | No auth token | `controller.create(req, res)` | 401 Unauthorized |
| UT-005 | POST /api/vocabularies — non-admin | User role='user' | `controller.create(req, res)` | 403 Forbidden |
| UT-006 | PUT /api/vocabularies/:id — update success | Valid DTO, existing vocab | `controller.update(req, res)` | 200 + updated vocabulary + version incremented |
| UT-007 | PUT /api/vocabularies/:id — change log created | Valid DTO, existing vocab | `controller.update(req, res)` | 200 + change log in DB |
| UT-008 | PUT /api/vocabularies/:id — not found | Non-existent id | `controller.update(req, res)` | 404 NOT_FOUND |
| UT-009 | PUT /api/vocabularies/:id — soft deleted | Vocab with status='Delete' | `controller.update(req, res)` | 404 SOFT_DELETED |
| UT-010 | DELETE /api/vocabularies/:id — soft delete success | Existing vocab | `controller.delete(req, res)` | 200 + status='Delete' |
| UT-011 | DELETE /api/vocabularies/:id — not found | Non-existent id | `controller.delete(req, res)` | 404 NOT_FOUND |
| UT-012 | DELETE /api/vocabularies/:id — unauthorized | No auth token | `controller.delete(req, res)` | 401 Unauthorized |
| UT-013 | DELETE /api/vocabularies/:id — non-admin | User role='user' | `controller.delete(req, res)` | 403 Forbidden |
| UT-014 | GET /api/vocabularies — list with defaults | No query params | `controller.findAll(req, res)` | 200 + paginated results (page=1, limit=20) |
| UT-015 | GET /api/vocabularies — filter by level | Query `level=N3` | `controller.findAll(req, res)` | 200 + filtered results |
| UT-016 | GET /api/vocabularies — filter by status | Query `status=Publish` | `controller.findAll(req, res)` | 200 + filtered results |
| UT-017 | GET /api/vocabularies — filter by kanji search | Query `kanji=食べ` | `controller.findAll(req, res)` | 200 + LIKE search results |
| UT-018 | GET /api/vocabularies — pagination | Query `page=2&limit=10` | `controller.findAll(req, res)` | 200 + page 2, 10 items |
| UT-019 | GET /api/vocabularies/:id — success | Existing vocab | `controller.findById(req, res)` | 200 + vocabulary detail + relations + logs + reports |
| UT-020 | GET /api/vocabularies/:id — not found | Non-existent id | `controller.findById(req, res)` | 404 NOT_FOUND |
| UT-021 | GET /api/vocabularies/:id — soft deleted | Vocab with status='Delete' | `controller.findById(req, res)` | 404 SOFT_DELETED |
| UT-022 | PATCH /api/vocabularies/:id/reports/:reportId — resolve | Valid status='resolved' | `controller.resolveReport(req, res)` | 200 + report status updated |
| UT-023 | PATCH /api/vocabularies/:id/reports/:reportId — dismiss | Valid status='dismissed' | `controller.resolveReport(req, res)` | 200 + report status updated |
| UT-024 | PATCH /api/vocabularies/:id/reports/:reportId — invalid status | Invalid status='invalid' | `controller.resolveReport(req, res)` | 400 INVALID_STATUS |
| UT-025 | PATCH /api/vocabularies/:id/reports/:reportId — not found | Non-existent report | `controller.resolveReport(req, res)` | 404 NOT_FOUND |
| UT-026 | GET /api/vocabularies/:id/analytics — success | Existing vocab | `controller.getAnalytics(req, res)` | 200 + analytics data |
| UT-027 | GET /api/vocabularies/:id/analytics — not found | Non-existent vocab | `controller.getAnalytics(req, res)` | 404 NOT_FOUND |

#### Authorization Tests

| TC ID | Test Case | Setup | Action | Assert |
|-------|-----------|-------|--------|--------|
| AUTH-001 | Non-admin cannot create | User role='user' | POST /api/vocabularies | 403 Forbidden |
| AUTH-002 | Non-admin cannot update | User role='user' | PUT /api/vocabularies/:id | 403 Forbidden |
| AUTH-003 | Non-admin cannot delete | User role='user' | DELETE /api/vocabularies/:id | 403 Forbidden |
| AUTH-004 | Admin can resolve reports | Admin role='admin' | PATCH /api/vocabularies/:id/reports/:reportId | 200 OK |
| AUTH-005 | Unauthenticated access | No token | GET /api/vocabularies | 401 Unauthorized |

---

### 1.2 Frontend Tests

#### VocabularyListPage — Unit Tests

| TC ID | Test Case | Arrange | Act | Assert |
|-------|-----------|---------|-----|--------|
| FE-UT-001 | Display vocabulary list | Mock `fetchVocabularies` returns data | Mount VocabularyListPage | Table renders with correct data |
| FE-UT-002 | Empty state | Mock returns empty array | Mount VocabularyListPage | Shows "No vocabulary found" message |
| FE-UT-003 | Error state | Mock returns error | Mount VocabularyListPage | Shows error message + Retry button |
| FE-UT-004 | Filter by kanji | Mock data with '食べる' | Input '食べ' in filter | Table filters to matching items |
| FE-UT-005 | Filter by level | Mock data with N3 items | Select 'N3' in level filter | Table filters to N3 items only |
| FE-UT-006 | Filter by status | Mock data with Publish items | Select 'Publish' in status filter | Table filters to Publish items only |
| FE-UT-007 | Reset filters | All filters applied | Click "Reset" button | All filters cleared, full list shown |
| FE-UT-008 | Pagination | 50 items in mock | Click page 2 | Shows items 21-40 |
| FE-UT-009 | Navigate to create | Mounted | Click "Create New" button | Router navigates to `/vocabularies/create` |
| FE-UT-0010 | Navigate to edit | Mounted with data | Click "Edit" on first row | Router navigates to `/vocabularies/1/edit` |
| FE-UT-0011 | Delete confirmation | Mounted with data | Click "Delete" → Confirm | API called, list refreshed |
| FE-UT-0012 | Delete cancel | Mounted with data | Click "Delete" → Cancel | API NOT called, list unchanged |

#### VocabularyFormPage — Unit Tests

| TC ID | Test Case | Arrange | Act | Assert |
|-------|-----------|---------|-----|--------|
| FE-UT-013 | Create mode init | Mounted in create mode | Component mounted | Form empty, default status='Publish' |
| FE-UT-014 | Edit mode pre-fill | Mock `fetchVocabulary` returns data | Mounted in edit mode | Form pre-filled with data |
| FE-UT-015 | Edit mode not found | Mock returns 404 | Mounted in edit mode | Shows error + Back to List button |
| FE-UT-016 | Valid form submission | Fill form with valid data | Click "Save" | API called with correct data |
| FE-UT-017 | Invalid form - required fields | Empty form | Click "Save" | Validation errors shown, API NOT called |
| FE-UT-018 | Invalid form - kanji only numbers | Input '123' in kanji | Click "Save" | Validation error on kanji field |
| FE-UT-019 | Invalid form - meaning too long | Input 1001 chars in meaning | Click "Save" | Validation error on meaning field |
| FE-UT-020 | Invalid form - too many tags | Input 11 tags | Click "Save" | Validation error on tags field |
| FE-UT-021 | Invalid form - invalid URL | Input 'not-a-url' in media_url | Click "Save" | Validation error on media_url field |
| FE-UT-022 | Success submission | Valid form | Click "Save" | Success toast shown, navigate to list |
| FE-UT-023 | Failed submission | Valid form, API returns error | Click "Save" | Error toast shown, stay on page |
| FE-UT-024 | Cancel with unsaved changes | Modify form | Click "Cancel" | Confirm dialog shown |
| FE-UT-025 | Cancel without changes | No modifications | Click "Cancel" | Navigate back directly |
| FE-UT-026 | Cancel with changes - cancel dialog | Modify form, confirm dialog open | Click "Hủy" in dialog | Dialog closed, stay on page |
| FE-UT-027 | Cancel with changes - confirm | Modify form, confirm dialog open | Click "Đóng" in dialog | Navigate back |
| FE-UT-028 | Tab navigation - to Audit | Mounted | Click "Audit" tab | TabAudit component visible |
| FE-UT-029 | Tab navigation - to Analytics | Mounted | Click "Analytics" tab | TabAnalytics component visible |
| FE-UT-030 | Relation MultiSelect renders | Mounted | Check TabInfo | 3 MultiSelect components rendered |
| FE-UT-031 | Relation options loaded | Mounted | Check MultiSelect options | Options populated from API |

#### TabInfo — Form Validation Tests

| TC ID | Test Case | Arrange | Act | Assert |
|-------|-----------|---------|-----|--------|
| FE-UT-032 | Kanji field required | Empty form | Click "Save" | Error: "Kanji là bắt buộc" |
| FE-UT-033 | Kanji field min length | Input 0 chars in kanji | Click "Save" | Error: "Kanji phải có ít nhất 1 ký tự" |
| FE-UT-034 | Kanji field max length | Input 256 chars in kanji | Click "Save" | Error: "Kanji tối đa 255 ký tự" |
| FE-UT-035 | Kanji field no numbers only | Input '12345' in kanji | Click "Save" | Error: "Kanji không được chỉ chứa số" |
| FE-UT-036 | Hiragana valid hiragana | Input 'たべる' in hiragana | Click "Save" | No error on hiragana field |
| FE-UT-037 | Hiragana invalid chars | Input 'たべ1る' in hiragana | Click "Save" | Error: "Hiragana chỉ chứa ký tự Nhật" |
| FE-UT-038 | Hiragana max length | Input 256 chars in hiragana | Click "Save" | Error: "Hiragana tối đa 255 ký tự" |
| FE-UT-039 | Romaji valid | Input 'taberu' in romaji | Click "Save" | No error on romaji field |
| FE-UT-040 | Romaji invalid chars | Input 'tabe1u' in romaji | Click "Save" | Error: "Romaji chỉ chứa a-z" |
| FE-UT-041 | Romaji max length | Input 256 chars in romaji | Click "Save" | Error: "Romaji tối đa 255 ký tự" |
| FE-UT-042 | Meaning_vi required | Empty form | Click "Save" | Error: "Nghĩa tiếng Việt là bắt buộc" |
| FE-UT-043 | Meaning_vi min length | Input '' in meaning_vi | Click "Save" | Error: "Nghĩa tiếng Việt phải có ít nhất 1 ký tự" |
| FE-UT-044 | Meaning_vi max length | Input 1001 chars in meaning_vi | Click "Save" | Error: "Nghĩa tiếng Việt tối đa 1000 ký tự" |
| FE-UT-045 | On_yomi max length | Input 256 chars in on_yomi | Click "Save" | Error: "Âm hán việt tối đa 255 ký tự" |
| FE-UT-046 | Level valid enum | Select 'N3' in level | Click "Save" | No error on level field |
| FE-UT-047 | Level invalid value | Select 'N99' in level | Click "Save" | Error: "Cấp độ không hợp lệ" |
| FE-UT-048 | Media_url valid http | Input 'https://example.com/audio.mp3' | Click "Save" | No error on media_url field |
| FE-UT-049 | Media_url valid https | Input 'https://example.com/image.png' | Click "Save" | No error on media_url field |
| FE-UT-050 | Media_url invalid format | Input 'not a url' in media_url | Click "Save" | Error: "Media URL không hợp lệ" |
| FE-UT-051 | Media_url empty string | Input '' in media_url | Click "Save" | No error (empty allowed) |
| FE-UT-052 | Note max length | Input 2001 chars in note | Click "Save" | Error: "Note tối đa 2000 ký tự" |
| FE-UT-053 | Tags empty array | Input no tags | Click "Save" | No error (tags optional) |
| FE-UT-054 | Tags exactly 10 | Input 10 tags | Click "Save" | No error (max 10 allowed) |
| FE-UT-055 | Tags 11 items | Input 11 tags | Click "Save" | Error: "Tối đa 10 tags" |
| FE-UT-056 | Tags single tag too long | Input tag 51 chars | Click "Save" | Error: "Mỗi tag tối đa 50 ký tự" |
| FE-UT-057 | Tags valid single | Input ['JLPT-N3'] | Click "Save" | No error |
| FE-UT-058 | Tags valid multiple | Input ['JLPT-N3', 'động từ', 'thông dụng'] | Click "Save" | No error |
| FE-UT-059 | Status valid Publish | Select 'Publish' | Click "Save" | No error |
| FE-UT-060 | Status valid Hide | Select 'Hide' | Click "Save" | No error |
| FE-UT-061 | Status valid Delete | Select 'Delete' | Click "Save" | No error |
| FE-UT-062 | All required fields valid | Fill kanji + meaning_vi | Click "Save" | Form valid, API called |
| FE-UT-063 | All fields valid with relations | Fill all + select relations | Click "Save" | API called with relations array |
| FE-UT-064 | Duplicate kanji+meaning client check | Fill existing kanji+meaning | Click "Save" | Error: "Từ vựng này đã tồn tại" |
| FE-UT-065 | Form dirty state on input | Mount create form, type in kanji | Check dirty state | Form dirty = true |
| FE-UT-066 | Form pristine state no input | Mount create form, no input | Check dirty state | Form dirty = false |
| FE-UT-067 | Save button disabled when invalid | Empty form | Check button state | Save button disabled |
| FE-UT-068 | Save button enabled when valid | Valid form | Check button state | Save button enabled |
| FE-UT-069 | Save button disabled while submitting | Valid form, mock loading | Click "Save" | Save button disabled + spinner |
| FE-UT-070 | MultiSelect related renders | Mounted | Check VocabRelationSelect | Component renders with label |
| FE-UT-071 | MultiSelect synonyms renders | Mounted | Check VocabRelationSelect | Component renders with label |
| FE-UT-072 | MultiSelect antonyms renders | Mounted | Check VocabRelationSelect | Component renders with label |
| FE-UT-073 | MultiSelect excludes self | Edit vocab id=5, open related select | Check options | Vocab id=5 not in options |
| FE-UT-074 | MultiSelect pre-selected values | Edit vocab with existing relations | Check MultiSelect | Existing relation IDs selected |
| FE-UT-075 | TabInfo form reset on create | Mounted in create mode | Click "Cancel" → Confirm | Form reset to empty |

#### Composable Tests — `useVocabularies.test.ts`

| TC ID | Test Case | Arrange | Act | Assert |
|-------|-----------|---------|-----|--------|
| COMP-UT-001 | fetchVocabularies success | Mock api service | `useVocabularies().fetchVocabularies({})` | Returns paginated result |
| COMP-UT-002 | fetchVocabularies with filters | Mock api service | `useVocabularies().fetchVocabularies({ level: 'N3' })` | API called with correct params |
| COMP-UT-003 | fetchVocabulary success | Mock api service | `useVocabularies().fetchVocabulary(1)` | Returns vocabulary detail |
| COMP-UT-004 | createVocabulary success | Mock api service | `useVocabularies().createVocabulary(dto)` | Returns created vocabulary |
| COMP-UT-005 | updateVocabulary success | Mock api service | `useVocabularies().updateVocabulary(1, dto)` | Returns updated vocabulary |
| COMP-UT-006 | deleteVocabulary success | Mock api service | `useVocabularies().deleteVocabulary(1)` | API called, no return |
| COMP-UT-007 | fetchRelationOptions success | Mock api service | `useVocabularies().fetchRelationOptions()` | Returns vocab list options |
| COMP-UT-008 | fetchAnalytics success | Mock api service | `useVocabularies().fetchAnalytics(1)` | Returns analytics data |

---

## 2. Performance Considerations

### 2.1 Database

| Concern | Target | Strategy |
|---------|--------|----------|
| List page load time | < 200ms for 1000 vocabularies | Indexes on `kanji`, `level`, `status`, `created_by` |
| Filter query performance | < 300ms with all filters | Composite index on `(status, level)` |
| Relation query | < 100ms per vocabulary | Index on `vocab_id`, `target_vocab_id` |
| Change log query | < 200ms per vocabulary | Index on `vocab_id` |
| Pagination | O(1) per page | Use `LIMIT` + `OFFSET` with reasonable page size |

### 2.2 Frontend

| Concern | Target | Strategy |
|---------|--------|----------|
| List page initial load | < 1s | Lazy load route, skeleton loading |
| Filter debounce | 300ms | Debounce filter input |
| Relation MultiSelect options | < 500ms | Cache in store, load once |
| Form validation | < 50ms | Zod synchronous validation |
| Tab switching | < 50ms | Lazy load TabAudit/TabAnalytics data |

---

## 3. Security Considerations

| Concern | Severity | Mitigation |
|---------|----------|------------|
| SQL Injection | Critical | Parameterized queries (Knex.js/TypeORM) |
| XSS via kanji/meaning | High | Vue auto-escaping, no `v-html` on user input |
| Unauthorized access | Critical | Admin role middleware on all write endpoints |
| Mass assignment | Medium | Explicit DTO validation, no raw request body to DB |
| Relation injection | Medium | Validate relation IDs exist, prevent self-reference |
| Tag injection | Low | Max 10 tags, 50 chars each, sanitize input |
| API rate limiting | Medium | Rate limiter on `/api/vocabularies` endpoints |
| Soft delete bypass | High | All queries filter `status != 'Delete'` except admin |
| CSRF | Medium | CSRF token for state-changing requests |
