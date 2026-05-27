# 04 — Quality: Vocabulary Management

> Related: [00-index.md](./00-index.md) | [01-backend.md](./01-backend.md) | [02-frontend.md](./02-frontend.md) | [03-behavior.md](./03-behavior.md)

---

## 1. Testing Strategy

> **Chiến lược Backend:** Toàn bộ backend tests được viết **tại controller layer** duy nhất (`vocabularies.controller.test.ts`) dùng Supertest với mock service. Không có unit test riêng cho service hay repository.

### 1.1 Backend Tests — `vocabularies.controller.test.ts`

Tất cả test dùng Supertest. Service được mock toàn bộ (`vi.mock('../vocabularies.service')`).

#### Happy Path — CRUD

| # | Test case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | `GET /api/vocabularies` — thành công | Mock `service.getList` trả về `{ data: [...], pagination }` | GET với admin JWT | `200`, body có `data` array và `pagination` |
| 2 | `GET /api/vocabularies/:id` — tìm thấy | Mock `service.getById` trả về `vocabDetail` | GET `/api/vocabularies/1` | `200`, body là `VocabularyDetail` |
| 3 | `GET /api/vocabularies/:id` — không tồn tại | Mock `service.getById` throw `VOCABULARY_NOT_FOUND` | GET `/api/vocabularies/9999` | `404`, body `{ error: 'VOCABULARY_NOT_FOUND' }` |
| 4 | `POST /api/vocabularies` — tạo thành công | Mock `service.create` trả về `vocabDetail` | POST body hợp lệ | `201`, body là `VocabularyDetail` |
| 5 | `PUT /api/vocabularies/:id` — cập nhật thành công | Mock `service.update` trả về updated detail | PUT `/api/vocabularies/1` body hợp lệ | `200`, body là `VocabularyDetail` đã cập nhật |
| 6 | `DELETE /api/vocabularies/:id` — xóa mềm thành công | Mock `service.delete` resolve | DELETE `/api/vocabularies/1` | `204`, no body |
| 7 | `GET /api/vocabularies/:id/change-logs` | Mock `service.getChangeLogs` trả về logs | GET `.../1/change-logs` | `200`, body `{ data: [...] }` |
| 8 | `GET /api/vocabularies/:id/reports` | Mock `service.getReports` trả về reports | GET `.../1/reports` | `200`, body `{ data: [...] }` |
| 9 | `PATCH .../reports/:reportId` — resolve | Mock `service.updateReportStatus` trả về report updated | PATCH `{ "status": "resolved" }` | `200`, body `report.status === 'resolved'` |
| 10 | `GET /api/tags/suggest` | Mock `service.suggestTags` trả về `['động từ']` | GET `?q=độ` | `200`, body `{ data: ['động từ'] }` |
| 11 | `GET /api/vocabularies/search` | Mock `service.searchVocabularies` trả về `[VocabSummary]` | GET `?q=食` | `200`, body `{ data: [{ id, kanji, meaning_vi }] }` |

#### Validation Tests — `POST /api/vocabularies`

| # | Test case | Body gửi | Expected |
|---|-----------|----------|---------|
| 12 | Thiếu `meaning_vi` | `{ level: 'N5', status: 'publish' }` | `400`, `error: 'VALIDATION_ERROR'` |
| 13 | `meaning_vi` rỗng (empty string) | `{ meaning_vi: '', level: 'N5', status: 'publish' }` | `400`, `error: 'VALIDATION_ERROR'` |
| 14 | `meaning_vi` vượt 500 ký tự | `{ meaning_vi: 'a'.repeat(501), ... }` | `400`, `error: 'VALIDATION_ERROR'` |
| 15 | Thiếu `level` | `{ meaning_vi: 'ăn', status: 'publish' }` | `400`, `error: 'VALIDATION_ERROR'` |
| 16 | `level` không hợp lệ (e.g. `'N6'`) | `{ meaning_vi: 'ăn', level: 'N6', status: 'publish' }` | `400`, `error: 'VALIDATION_ERROR'` |
| 17 | Thiếu `status` | `{ meaning_vi: 'ăn', level: 'N5' }` | `400`, `error: 'VALIDATION_ERROR'` |
| 18 | `status` không hợp lệ (e.g. `'active'`) | `{ meaning_vi: 'ăn', level: 'N5', status: 'active' }` | `400`, `error: 'VALIDATION_ERROR'` |
| 19 | `media_url` không phải URL hợp lệ | `{ ..., media_url: 'not-a-url' }` | `400`, `error: 'VALIDATION_ERROR'` |
| 20 | `media_url` hợp lệ (https URL) | `{ ..., media_url: 'https://cdn.example.com/img.jpg' }` | `201` |
| 21 | `kanji` vượt 200 ký tự | `{ ..., kanji: 'a'.repeat(201) }` | `400`, `error: 'VALIDATION_ERROR'` |
| 22 | `tags` chứa tag vượt 100 ký tự | `{ ..., tags: ['a'.repeat(101)] }` | `400`, `error: 'VALIDATION_ERROR'` |
| 23 | `related_ids` chứa ID của chính từ đó (self-reference) | `{ ..., related_ids: [1] }` khi tạo vocab với id=1 | `400`, `error: 'SELF_REFERENCE'` |
| 24 | `related_ids` không phải mảng integer dương | `{ ..., related_ids: [-1] }` | `400`, `error: 'VALIDATION_ERROR'` |
| 25 | `note` vượt 5000 ký tự | `{ ..., note: 'a'.repeat(5001) }` | `400`, `error: 'VALIDATION_ERROR'` |

#### Validation Tests — `PUT /api/vocabularies/:id`

| # | Test case | Body gửi | Expected |
|---|-----------|----------|---------|
| 26 | Thiếu `meaning_vi` | `{ level: 'N5', status: 'publish' }` | `400`, `error: 'VALIDATION_ERROR'` |
| 27 | `synonym_ids` chứa ID của chính từ đó | `{ ..., synonym_ids: [1] }` khi update vocab id=1 | `400`, `error: 'SELF_REFERENCE'` |
| 28 | `antonym_ids` chứa ID của chính từ đó | `{ ..., antonym_ids: [1] }` khi update vocab id=1 | `400`, `error: 'SELF_REFERENCE'` |
| 29 | Vocab không tồn tại | — | `404`, `error: 'VOCABULARY_NOT_FOUND'` |

#### Validation Tests — `PATCH .../reports/:reportId`

| # | Test case | Body gửi | Expected |
|---|-----------|----------|---------|
| 30 | `status` không hợp lệ (e.g. `'closed'`) | `{ "status": "closed" }` | `400`, `error: 'VALIDATION_ERROR'` |
| 31 | Report không tồn tại | `{ "status": "resolved" }` | `404`, `error: 'REPORT_NOT_FOUND'` |

#### Authorization Tests

| # | Route | Role / Token | Expected |
|---|-------|-------------|---------|
| 32 | `GET /api/vocabularies` | Không có token | `401 UNAUTHORIZED` |
| 33 | `POST /api/vocabularies` | `role=user` | `403 FORBIDDEN` |
| 34 | `PUT /api/vocabularies/:id` | `role=moderator` | `403 FORBIDDEN` |
| 35 | `DELETE /api/vocabularies/:id` | `role=admin` | `204` |
| 36 | `GET /api/tags/suggest` | Không có token | `200` (endpoint public) |
| 37 | `GET /api/vocabularies/search` | Không có token | `401` (endpoint protected) |

---

### 1.2 Frontend Tests

#### VocabularyListPage

| # | Test case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Hiển thị skeleton khi loading | `store.loading=true` | Mount | `data-testid="vocab-skeleton"` visible |
| 2 | Hiển thị empty state khi không có dữ liệu | `store.items=[]`, `store.loading=false` | Mount | `data-testid="vocab-empty"` visible |
| 3 | Hiển thị empty state filter khi có filter active và items rỗng | `store.items=[]`, `store.filters.search='xyz'` | Mount | `data-testid="vocab-empty-filter"` visible |
| 4 | Hiển thị danh sách từ vựng | `store.items=[vocab1, vocab2]` | Mount | 2 rows trong table |
| 5 | Click Tạo từ vựng → navigate CreatePage | — | Click `data-testid="create-vocab-btn"` | `router.push` gọi với `{ name: 'VocabularyCreate' }` |
| 6 | Click Edit → navigate EditPage | `store.items=[{id:1,...}]` | Click edit button trên row 1 | `router.push` gọi với `{ name: 'VocabularyEdit', params: { id: 1 } }` |
| 7 | Click Delete → mở ConfirmDialog | — | Click delete button | `ConfirmDialog` visible |
| 8 | Confirm delete → gọi store.deleteVocabulary | — | Confirm dialog | `store.deleteVocabulary(1)` được gọi |
| 9 | Filter search change → gọi store.fetchVocabularies với page=1 | — | Set search input | `store.fetchVocabularies` gọi với `{ search: '...', page: 1 }` |

#### VocabularyCreatePage

| # | Test case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Hiển thị 3 tabs | — | Mount | `TabView` có 3 `TabPanel` |
| 2 | Submit form rỗng → hiển thị lỗi required meaning_vi | — | Click Submit | Error `vocabularies.form.meaningViRequired` hiển thị dưới field |
| 3 | Submit form rỗng → hiển thị lỗi required level | — | Click Submit | Error `vocabularies.form.levelRequired` hiển thị dưới field |
| 4 | Submit form rỗng → hiển thị lỗi required status | — | Click Submit | Error `vocabularies.form.statusRequired` hiển thị dưới field |
| 5 | meaning_vi quá 500 ký tự → validation error | Nhập 501 ký tự | Blur/Submit | Error max length hiển thị |
| 6 | media_url không phải URL hợp lệ → validation error | Nhập `'not-a-url'` | Blur/Submit | Error URL format hiển thị |
| 7 | media_url hợp lệ (https) → không có lỗi | Nhập `'https://cdn.example.com/img.jpg'` | Blur | Không có error message |
| 8 | kanji quá 200 ký tự → validation error | Nhập 201 ký tự | Blur | Error max length hiển thị |
| 9 | Submit form hợp lệ (chỉ required fields) → gọi store.createVocabulary | meaning_vi, level, status hợp lệ | Submit | `store.createVocabulary` gọi với đúng DTO |
| 10 | Submit form hợp lệ (tất cả fields) → DTO đầy đủ | Điền tất cả fields | Submit | `store.createVocabulary` nhận DTO với tags, related_ids, synonym_ids, antonym_ids |
| 11 | Create thành công → navigate về List | `store.createVocabulary` resolve | Submit | `router.push({ name: 'VocabularyList' })` |
| 12 | Create thất bại → hiển thị toast error | `store.createVocabulary` reject | Submit | Toast error visible, không navigate |
| 13 | Click Hủy khi form sạch → navigate về List không cần confirm | — | Click Hủy | Không có ConfirmDialog, navigate thẳng |
| 14 | Click Hủy khi form dirty → mở ConfirmDialog | Đã nhập meaning_vi | Click Hủy | ConfirmDialog hiển thị |
| 15 | Confirm discard → navigate về List | Form dirty + ConfirmDialog mở | Click "Bỏ thay đổi" | Navigate về ListPage |

#### VocabularyEditPage

| # | Test case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | onMounted gọi fetchVocabulary + fetchChangeLogs + fetchReports | Mock store | Mount | 3 store actions được gọi |
| 2 | Hiển thị pre-fill data trên Tab 1 | `store.currentVocabulary = vocabDetail` | Mount | Form fields có giá trị từ `vocabDetail` |
| 3 | Tab 2 hiển thị change log timeline | `store.changeLogs = [log1]` | Mount + click tab Audit | Timeline có 1 entry |
| 4 | Tab 2 hiển thị bảng reports | `store.reports = [report1]` | Mount + click tab Audit | DataTable có 1 row |
| 5 | Click Resolve → gọi store.updateReportStatus | `report1.status='pending'` | Click Resolve | `store.updateReportStatus(vocabId, report1.id, 'resolved')` |
| 6 | Click Pending → gọi store.updateReportStatus với 'pending' | `report1.status='resolved'` | Click Pending | `store.updateReportStatus(vocabId, report1.id, 'pending')` |
| 7 | Tab 3 hiển thị learn_count và favorite_count | `store.currentVocabulary.learn_count=42, favorite_count=10` | Mount + click tab Analytics | Hiển thị `42` và `10` |
| 8 | onUnmounted gọi clearCurrent | — | Unmount | `store.clearCurrent` gọi |
| 9 | Submit form edit hợp lệ → gọi store.updateVocabulary | Pre-fill data, sửa meaning_vi | Submit | `store.updateVocabulary(id, dto)` gọi |
| 10 | Submit thiếu meaning_vi → validation error | Xóa meaning_vi | Submit | Error hiển thị, `store.updateVocabulary` không gọi |
| 11 | Submit thiếu level → validation error | Xóa level | Submit | Error hiển thị |
| 12 | Update thành công → navigate về List | `store.updateVocabulary` resolve | Submit | `router.push({ name: 'VocabularyList' })` |
| 13 | Update thất bại → hiển thị toast error | `store.updateVocabulary` reject | Submit | Toast error visible |

#### VocabularyInfoTab — Validation hiển thị đúng

| # | Test case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Error message meaning_vi hiển thị dưới field | — | Submit rỗng | `data-testid="error-meaning-vi"` visible |
| 2 | Error message level hiển thị khi không chọn | — | Submit rỗng | `data-testid="error-level"` visible |
| 3 | Tag autocomplete gọi suggestTags sau debounce | Mock `composable.suggestTags` | Gõ 'độ' vào tag input | `suggestTags('độ')` gọi sau 300ms |
| 4 | MultiSelect search gọi searchVocabularies với currentId | Mock composable | Gõ '食' | `searchVocabularies('食', currentId)` gọi (loại trừ chính từ đó) |
| 5 | MultiSelect options hiển thị dạng "kanji (meaning_vi)" | Mock trả về `[{id:1, kanji:'食べる', meaning_vi:'ăn'}]` | Mount + search | Option hiển thị `食べる (ăn)` |
| 6 | MultiSelect không có kanji → hiển thị meaning_vi | Mock trả về `[{id:2, kanji:null, hiragana:'たべる', meaning_vi:'ăn'}]` | Mount + search | Option hiển thị `たべる (ăn)` |

---

## 2. Performance Considerations

- **Danh sách vocabulary**: Index trên `level`, `status`. FULLTEXT index trên `meaning_vi, hiragana, romaji, kanji` cho search. Giới hạn `pageSize` tối đa 100 records.
- **Tag suggest**: Query trên indexed `tags.name` LIKE với prefix. Giới hạn 20 kết quả.
- **Vocabulary search (MultiSelect)**: FULLTEXT search, giới hạn 30 kết quả. Debounce 300ms ở client để giảm API calls.
- **Change logs**: Index trên `vocabulary_id`. Không phân trang (số log per vocabulary thường nhỏ).

---

## 3. Security Considerations

- **Authentication**: Tất cả routes `/api/vocabularies/*` yêu cầu JWT token hợp lệ.
- **Authorization**: Chỉ `role='admin'` được phép. Middleware `requireRole('admin')` áp dụng tại `vocabularies.routes.ts`.
- **Input validation**: Zod schema phía server (không tin tưởng dữ liệu từ client). Kiểm tra URL format cho `media_url` để tránh XSS.
- **SQL injection**: Sử dụng parameterized queries (MySQL2 `?` placeholders). Không nối chuỗi SQL.
- **Self-reference check**: Service validate `related_ids`, `synonym_ids`, `antonym_ids` không chứa ID của chính từ đó.
- **Report resolve**: Chỉ Admin mới gọi được `PATCH .../reports/:reportId`. `resolved_by` lấy từ JWT (`req.user.id`), không từ body.

---

## 4. Accessibility (a11y)

- Tất cả form fields có `label` liên kết đúng với input (`for`/`id` hoặc `aria-label`).
- Required fields có visual indicator (`*`) và `aria-required="true"`.
- Error messages liên kết với field qua `aria-describedby`.
- Buttons có text rõ ràng hoặc `aria-label` (icon-only buttons).
- Status chips (Level, Status, Report status) có đủ contrast ratio (≥ 4.5:1).
- DataTable có `aria-label` trên table và column headers.
- ConfirmDialog trap focus khi mở.

---

## 5. Logging & Audit

### Application Logging (Winston — backend)

| Event | Level | Nội dung log |
|-------|-------|-------------|
| Tạo từ vựng | `info` | `{ action: 'VOCAB_CREATE', vocabId, adminId }` |
| Cập nhật từ vựng | `info` | `{ action: 'VOCAB_UPDATE', vocabId, adminId, changedFields: [...] }` |
| Xóa mềm từ vựng | `info` | `{ action: 'VOCAB_DELETE', vocabId, adminId }` |
| Resolve report | `info` | `{ action: 'REPORT_RESOLVE', vocabId, reportId, adminId }` |
| Lỗi validation | `warn` | `{ action: 'VOCAB_VALIDATION_FAIL', errors, adminId }` |
| Lỗi server | `error` | Stack trace đầy đủ |

### Business Audit Trail (Database)

- `vocabulary_change_logs`: Tự động ghi mỗi khi cập nhật từ vựng. Không bao giờ xóa.
- `vocabulary_reports`: Ghi trạng thái xử lý với `resolved_by`, `resolved_at`. Không bao giờ xóa.
