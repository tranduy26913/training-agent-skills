---
title: Vocabulary Management - Quality
version: 1.0
date: 2026-05-20
---

# Vocabulary Management — Quality

> Related: [00-index.md](./00-index.md) | [01-backend.md](./01-backend.md) | [02-frontend.md](./02-frontend.md) | [03-behavior.md](./03-behavior.md)

---

## 1. Testing Strategy

### 1.1 Backend Tests

> **Quy ước**: Toàn bộ backend test được tập hợp vào **1 file duy nhất**:  
> `server/src/modules/vocabularies/vocabularies.controller.test.ts`  
> File này bao gồm: validation tests, service logic tests, repository tests (mocked), và authorization tests — tổ chức theo `describe` blocks.

---

#### `describe('Validation — POST /api/vocabularies')`

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| V-1 | Thiếu meaning_vi | body = `{}` (không có meaning_vi) | POST `/api/vocabularies` với admin token | 400; error.details chứa field 'meaning_vi' |
| V-2 | meaning_vi rỗng | body = `{ meaning_vi: '' }` | POST | 400; error code VALIDATION_ERROR |
| V-3 | meaning_vi vượt 500 ký tự | body = `{ meaning_vi: 'a'.repeat(501) }` | POST | 400; message chứa 'meaning_vi' |
| V-4 | Thiếu hiragana | body = `{ meaning_vi: 'test' }` (không có hiragana) | POST | 400; error.details chứa field 'hiragana' |
| V-5 | hiragana rỗng | body = `{ meaning_vi: 'test', hiragana: '' }` | POST | 400 |
| V-6 | hiragana vượt 200 ký tự | body với hiragana 201 chars | POST | 400 |
| V-7 | Thiếu level | body không có level | POST | 400; error.details chứa field 'level' |
| V-8 | level không hợp lệ | body = `{ level: 'N6' }` | POST | 400 |
| V-9 | Thiếu status | body không có status | POST | 400 |
| V-10 | status không hợp lệ | body = `{ status: 'archived' }` | POST | 400 |
| V-11 | image_url không phải URL | body = `{ image_url: 'not-a-url' }` | POST | 400 |
| V-12 | note vượt 2000 ký tự | body với note 2001 chars | POST | 400 |
| V-13 | tags vượt 20 phần tử | body với tags array 21 items | POST | 400 |
| V-14 | Một tag vượt 50 ký tự | body với tags = ['a'.repeat(51)] | POST | 400 |
| V-15 | related_ids chứa non-number | body = `{ related_ids: ['abc'] }` | POST | 400 |
| V-16 | Body hợp lệ tối thiểu — chỉ required fields | body = `{ meaning_vi: 'テスト', hiragana: 'てすと', level: 'N5', status: 'publish' }` | POST | 201 |
| V-17 | Body hợp lệ đầy đủ — tất cả fields | body đầy đủ tất cả optional fields | POST | 201 |

---

#### `describe('Validation — PUT /api/vocabularies/:id')`

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| V-18 | meaning_vi rỗng trong update | body = `{ meaning_vi: '' }` | PUT `/api/vocabularies/1` | 400 |
| V-19 | hiragana rỗng trong update | body = `{ hiragana: '' }` | PUT | 400 |
| V-20 | level không hợp lệ trong update | body = `{ level: 'N0' }` | PUT | 400 |
| V-21 | Update từ vựng không tồn tại | body hợp lệ; id=9999 | PUT `/api/vocabularies/9999` | 404; code NOT_FOUND |
| V-22 | Body partial hợp lệ | body = `{ note: 'updated note' }` | PUT `/api/vocabularies/1` | 200 |

---

#### `describe('Service Logic')`

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| S-1 | Tạo từ vựng thành công | Mock repository.create trả về VocabularyRow; mock auditLog.insert | POST với valid dto | 201; repository.create called once; auditLog.insert action='CREATE' |
| S-2 | Tạo từ vựng với relations — insert 2 chiều | Mock insertRelationPair | POST với `{ related_ids: [2, 3] }` | insertRelationPair gọi cho cả 2 cặp thuận/nghịch |
| S-3 | Self-relation bị reject | related_ids chứa ID của vocab vừa tạo | POST | 400; code SELF_RELATION_NOT_ALLOWED |
| S-4 | Cập nhật — version tự tăng | Mock findById vocab(version=1) | PUT `/api/vocabularies/1` | version trong DB update call = 2 |
| S-5 | Cập nhật — ghi changed_fields vào audit log | Mock findById vocab cũ; update meaning_vi | PUT với `{ meaning_vi: 'mới' }` | auditLog.insert chứa changed_fields.meaning_vi = `{ old: 'cũ', new: 'mới' }` |
| S-6 | Cập nhật relations — xóa toàn bộ cũ, insert mới | Mock existing relations; mock delete+insert | PUT với synonym_ids=[5] | deleteRelationsByVocabId called; insertPair called cho cặp (1,5) và (5,1) |
| S-7 | Xóa mềm — set status='deleted' | Mock findById vocab tồn tại | DELETE `/api/vocabularies/1` | repository.update với status='deleted'; auditLog action='DELETE' |
| S-8 | Xóa từ vựng không tồn tại | Mock findById null | DELETE `/api/vocabularies/9999` | 404; code NOT_FOUND |
| S-9 | Resolve report — success | Mock findReport status='pending' | PATCH `.../reports/3/resolve` | updateReport status='resolved'; resolved_by=adminId |
| S-10 | Resolve report đã xử lý | Mock findReport status='resolved' | PATCH | 409; code REPORT_ALREADY_RESOLVED |
| S-11 | Reject report — success | Mock findReport status='pending' | PATCH `.../reports/3/reject` | updateReport status='rejected' |
| S-12 | getSimpleList trả về đúng fields | Mock findAllSimple | GET `/list/simple` | Response data chỉ chứa id, kanji, hiragana, meaning_vi |

---

#### `describe('Repository — Query Logic')` *(mocked DB pool)*

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| R-1 | findAllWithFilters — search | Mock DB pool | GET `?search=こんにちは` | SQL LIKE trên meaning_vi, kanji, hiragana, romaji |
| R-2 | findAllWithFilters — filter level | Mock DB pool | GET `?level=N3` | SQL WHERE level = 'N3' |
| R-3 | findAllWithFilters — filter status | Mock DB pool | GET `?status=publish` | SQL WHERE status = 'publish' |
| R-4 | findAllWithFilters — filter tag | Mock DB pool | GET `?tag=日常` | SQL JSON_CONTAINS(tags, ...) |
| R-5 | insertRelationPair — 2 rows | Mock DB pool | `repo.insertRelationPair(1, 2, 'synonym')` | 2 INSERT: (1,2,'synonym') + (2,1,'synonym') |
| R-6 | Sort column whitelist — SQL injection | Mock DB pool | GET `?sortBy=id;DROP TABLE` | Fallback sortColumn = 'created_at' |
| R-7 | Pagination — offset tính đúng | Mock DB pool | GET `?page=3&limit=10` | OFFSET = 20 |

---

#### `describe('Authorization')`

| # | Endpoint | Role | Expected |
|---|----------|------|---------|
| A-1 | GET `/api/vocabularies` | admin | 200 |
| A-2 | GET `/api/vocabularies` | user (non-admin) | 403 |
| A-3 | POST `/api/vocabularies` | admin | 201 |
| A-4 | POST `/api/vocabularies` | user | 403 |
| A-5 | PUT `/api/vocabularies/:id` | admin | 200 |
| A-6 | PUT `/api/vocabularies/:id` | user | 403 |
| A-7 | DELETE `/api/vocabularies/:id` | admin | 200 |
| A-8 | DELETE `/api/vocabularies/:id` | user | 403 |
| A-9 | PATCH `.../reports/:id/resolve` | admin | 200 |
| A-10 | PATCH `.../reports/:id/resolve` | user | 403 |
| A-11 | GET `/api/vocabularies` | unauthenticated | 401 |
| A-12 | GET `/api/vocabularies/list/simple` | admin | 200 |
| A-13 | GET `/api/vocabularies/list/simple` | unauthenticated | 401 |

---

### 1.2 Frontend Tests

#### VocabularyListPage

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Fetch vocabularies on mount | Mock store.fetchVocabularies | Mount VocabularyListPage | store.fetchVocabularies called once |
| 2 | Hiển thị skeleton khi loading | store.loading = true | Mount | VocabularyTable nhận loading=true; skeleton visible |
| 3 | Hiển thị empty state | store.vocabularies = [] | Mount | Empty state message visible |
| 4 | Navigate sang CreatePage khi click Tạo | Mock router | Click button "Tạo từ vựng" | router.push called với name='VocabularyCreate' |
| 5 | Navigate sang EditPage khi click Edit | Mock router; emit 'edit' từ VocabularyTable | Trigger handleEdit(5) | router.push({ name: 'VocabularyEdit', params: { id: 5 } }) |
| 6 | Mở ConfirmDialog khi click Delete | Mock useConfirm | Trigger handleDelete(5) | confirm.require called |
| 7 | Gọi deleteVocabulary khi confirm xóa | Mock store.deleteVocabulary; trigger accept | Click confirm trong dialog | store.deleteVocabulary(5) called; fetchVocabularies called lại |
| 8 | handleFilterChange reset page về 1 | Mock store | Trigger filterChange với filters | fetchVocabularies called với page=1 |

---

#### VocabularyCreatePage

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Load simple list on mount | Mock store.fetchSimpleList | Mount | fetchSimpleList called |
| 2 | Submit tạo thành công | Mock store.createVocabulary resolve | Fill form + submit | createVocabulary called; toast success; router.push ListPage |
| 3 | Submit thất bại — toast error | Mock store.createVocabulary reject | Fill form + submit | toast.add severity='error' |
| 4 | Cancel → navigate ListPage | Mock router | Click Hủy | router.push({ name: 'VocabularyList' }) |

---

#### VocabularyEditPage

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Load vocabulary, auditLogs, simpleList on mount | Mock store; route.params.id=5 | Mount | fetchVocabulary(5), fetchAuditLogs(5), fetchSimpleList called |
| 2 | clearCurrentVocabulary on unmount | Mock store | Unmount | clearCurrentVocabulary called |
| 3 | Submit update thành công — ở lại trang | Mock store.updateVocabulary resolve | Fill form + submit | updateVocabulary called; toast success; không navigate |
| 4 | Resolve report mở ConfirmDialog | Mock confirm | Click Resolve trên report row | confirm.require called |
| 5 | Gọi resolveReport khi confirm | Mock store.resolveReport | Accept dialog | resolveReport(reportId) called |
| 6 | Reject report gọi rejectReport | Mock store.rejectReport | Click Reject + accept dialog | rejectReport(reportId) called |

---

#### VocabularyInfoTab — Behavior Tests

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| IT-1 | Form prefill khi mode='edit' | initialData = vocabulary object | Mount | Tất cả fields có giá trị từ initialData |
| IT-2 | MultiSelect hiển thị vocabOptions | vocabularyOptions = [item1, item2] | Mount | MultiSelect options có 2 items |
| IT-3 | Emit submit với đúng data | Fill valid form | Submit | emit('submit') với CreateVocabularyDto hợp lệ |
| IT-4 | Emit cancel khi click Hủy | — | Click Hủy | emit('cancel') fired |

---

#### VocabularyInfoTab — Validation Tests (Client-side Zod)

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| FV-1 | meaning_vi bắt buộc | form rỗng | Submit | Error message "Nghĩa TV là bắt buộc" hiển thị |
| FV-2 | meaning_vi rỗng (khoảng trắng) | meaning_vi = '   ' | Submit | Validation fail; error visible |
| FV-3 | meaning_vi vượt 500 ký tự | meaning_vi = 'a'.repeat(501) | Submit | Error message max length visible |
| FV-4 | hiragana bắt buộc | form không có hiragana | Submit | Error message "Hiragana là bắt buộc" hiển thị |
| FV-5 | hiragana rỗng | hiragana = '' | Submit | Error visible |
| FV-6 | hiragana vượt 200 ký tự | hiragana 201 chars | Submit | Error max length visible |
| FV-7 | level bắt buộc | form không chọn level | Submit | Error "Cấp độ là bắt buộc" visible |
| FV-8 | status bắt buộc (default không bị thiếu) | Form mount, status chưa chọn | Mount | status mặc định là 'publish' (không trigger error) |
| FV-9 | image_url không hợp lệ | image_url = 'not-a-url' | Submit | Error URL format visible |
| FV-10 | image_url hợp lệ | image_url = 'https://example.com/img.png' | Submit | Không có lỗi image_url |
| FV-11 | image_url trống — allowed | image_url = '' | Submit | Không có lỗi image_url |
| FV-12 | note vượt 2000 ký tự | note = 'a'.repeat(2001) | Submit | Error max length visible |
| FV-13 | note tối đa đúng 2000 ký tự — allowed | note = 'a'.repeat(2000) | Submit | Không có lỗi note |
| FV-14 | Tags — tag đơn lẻ vượt 50 ký tự | tag = 'a'.repeat(51) | Press Enter add tag | Error tag length visible |
| FV-15 | Tags — số lượng vượt 20 | Thêm 21 tags | Submit | Error max tags visible |
| FV-16 | Tags — đúng 20 tags — allowed | 20 tags | Submit | Không có lỗi tags |
| FV-17 | romaji optional — form hợp lệ không có romaji | form không có romaji | Submit | Submit thành công, không có lỗi |
| FV-18 | kanji optional — form hợp lệ không có kanji | form không có kanji | Submit | Submit thành công, không có lỗi |
| FV-19 | related_ids và synonym_ids trùng nhau — allowed (khác relation type) | related=[1] và synonym=[1] | Submit | Không có lỗi (cùng vocab có thể có nhiều loại relation) |
| FV-20 | Form valid hoàn toàn — emit submit | Fill tất cả required fields đúng | Submit | emit('submit') với đúng CreateVocabularyDto |

---

#### Composable Tests — useVocabularies

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | getVocabularies gọi đúng endpoint | Mock api | `getVocabularies({ page: 1 })` | GET `/api/vocabularies?page=1` |
| 2 | getSimpleList gọi đúng endpoint | Mock api | `getSimpleList()` | GET `/api/vocabularies/list/simple` |
| 3 | createVocabulary post đúng payload | Mock api | `createVocabulary(dto)` | POST với body = dto |
| 4 | resolveReport gọi đúng endpoint | Mock api | `resolveReport(3)` | PATCH `/api/vocabularies/reports/3/resolve` |

---

## 2. Performance Considerations

- **Pagination server-side**: luôn dùng LIMIT/OFFSET, không load toàn bộ table vào client
- **Simple list cho MultiSelect**: endpoint `/list/simple` chỉ fetch `id, kanji, hiragana, meaning_vi` — không fetch full rows. Cân nhắc cache trong store (load 1 lần per session)
- **Search debounce**: Filter search input debounce 300ms trước khi gọi API
- **Relations transaction**: insert/delete relations nằm trong 1 DB transaction để tránh inconsistent state
- **Index DB**: Thêm index trên `vocabularies.level`, `vocabularies.status`, `vocabularies.created_at`; index full-text nếu search volume cao

---

## 3. Security Considerations

- **Authorization middleware**: Tất cả `/api/vocabularies/*` routes phải require `role = admin` (RBAC middleware hiện có)
- **SQL Injection**: sortBy column dùng whitelist (giống pattern users.repository.ts); tất cả query params dùng parameterized queries
- **Input sanitization**: Zod schema validate tất cả input trước khi đến service layer
- **Image URL**: Validate URL format; không cho phép `javascript:` scheme hay data URL
- **Tags**: Validate mỗi tag string (max 50 chars, trim whitespace); strip HTML/script tags nếu cần
- **Relations**: Validate related_vocab_id tồn tại trong DB trước khi insert; ngăn self-relation

---

## 4. Accessibility (a11y)

- Form labels liên kết đúng với input qua `for`/`id` hoặc `aria-label`
- Màu badge level (N5=green...N1=red) cần đủ contrast ratio (WCAG AA)
- Badge status kết hợp màu + text (không chỉ dựa vào màu)
- ConfirmDialog focus trap khi mở
- Bảng có `aria-label`; các action buttons có `aria-label` mô tả hành động cụ thể (e.g., "Chỉnh sửa 日本語")
- Loading skeleton có `aria-busy="true"` trên container

---

## 5. Logging & Audit

| Event | Ghi vào | Thông tin |
|-------|---------|-----------|
| Admin tạo từ vựng | `vocabulary_audit_logs` | action='CREATE', admin_id, vocab_id, timestamp |
| Admin cập nhật từ vựng | `vocabulary_audit_logs` | action='UPDATE', admin_id, vocab_id, changed_fields={field: {old, new}}, version mới |
| Admin xóa mềm từ vựng | `vocabulary_audit_logs` | action='DELETE', admin_id, vocab_id, timestamp |
| Admin resolve report | `vocabulary_reports` | status='resolved', resolved_by, resolved_at |
| Admin reject report | `vocabulary_reports` | status='rejected', resolved_by, resolved_at |
| API 4xx/5xx errors | Server log (stdout) | Request method, URL, status, error message |
