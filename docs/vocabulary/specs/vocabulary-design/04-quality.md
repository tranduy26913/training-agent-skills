---
title: Vocabulary Management - Quality
version: 1.0
author: Admin Team
date: 2026-05-19
status: Draft
---

# Vocabulary Management — Quality

> Related: [00-index.md](./00-index.md) | [01-backend.md](./01-backend.md) | [02-frontend.md](./02-frontend.md) | [03-behavior.md](./03-behavior.md)

---

## 1. Test Coverage

### 1.1 Backend Tests

#### Unit Tests

| # | Test Name | Setup | Action | Assert |
|---|-----------|-------|--------|--------|
| U-BE-01 | normalizeTags loại bỏ trùng | tags có phần tử trùng/lý rỗng | gọi helper | trả về array đã trim/dedupe |
| U-BE-02 | buildChangedFields detect thay đổi | old/new record | gọi diff helper | chỉ field thực sự đổi được đưa vào log |
| U-BE-03 | buildRelationPayload map đúng 3 nhóm | related/synonym/antonym ids | gọi helper | trả về payload theo `relation_type` |
| U-BE-04 | getLookup exclude current id | `excludeId=10` | gọi query builder | SQL không trả record id=10 |
| U-BE-05 | updateVocabulary tăng version | version hiện tại = 3 | update | version mới = 4 |
| U-BE-06 | soft delete giữ record | status đổi sang delete | gọi service | record không bị xóa cứng |
| U-BE-07 | validateField: meaning_vi empty/trim | meaning_vi = "  " hoặc "" | validate | trả lỗi required |
| U-BE-08 | validateField: meaning_vi length | meaning_vi = dài > 255 ký tự | validate | trả lỗi max length |
| U-BE-09 | validateField: hiragana_kana empty/trim | hiragana_kana = "  " | validate | trả lỗi required |
| U-BE-10 | validateField: romaji empty/trim | romaji = "" | validate | trả lỗi required |
| U-BE-11 | validateField: level enum | level = "N0" (invalid) | validate | trả lỗi enum |
| U-BE-12 | validateField: status enum | status = "archived" (invalid) | validate | trả lỗi enum |
| U-BE-13 | validateField: media_url not URL | media_url = "not-a-url" | validate | trả lỗi URL format |
| U-BE-14 | validateField: media_url invalid scheme | media_url = "ftp://example.com" | validate | trả lỗi only HTTP/HTTPS |
| U-BE-15 | validateField: media_url length | media_url dài > 500 ký tự | validate | trả lỗi max length |
| U-BE-16 | validateField: note length | note dài > 1000 ký tự | validate | trả lỗi max length |
| U-BE-17 | validateTags: normalize trim/dedupe | tags = ["  abc  ", "abc"] | normalize | return ["abc"] |
| U-BE-18 | validateTags: max items | tags = [20+ items] | validate | trả lỗi max 20 items |
| U-BE-19 | validateTags: tag length | tag = "tag dài > 50 ký tự" | validate | trả lỗi tag max 50 chars |
| U-BE-20 | validateRelations: dedupe ids | related_ids = [1, 1, 2] | normalize | return [1, 2] |
| U-BE-21 | validateRelations: self-reference | related_ids = [current_id] | validate | trả lỗi cannot self-reference |
| U-BE-22 | validateRelations: non-existent id | related_ids = [999999] | validate + DB | trả lỗi id not exist |
| U-BE-23 | validateRelations: cross-array conflict | related_ids = [5], synonym_ids = [5] | validate | trả lỗi id appears in multiple arrays |

#### Integration Tests

| # | Endpoint | Method | Scenario | Expected Status |
|---|----------|--------|----------|----------------|
| I-BE-01 | `/api/admin/vocabularies` | GET | Admin authenticated, no filters | 200 + data + pagination |
| I-BE-02 | `/api/admin/vocabularies` | GET | Non-admin | 403 |
| I-BE-03 | `/api/admin/vocabularies` | GET | Search + level + status | 200 filtered results |
| I-BE-04 | `/api/admin/vocabularies` | POST | Valid body | 201 + VocabularyDto |
| I-BE-05 | `/api/admin/vocabularies` | POST | Missing required field | 400 |
| I-BE-06 | `/api/admin/vocabularies/:id` | GET | Existing record | 200 |
| I-BE-07 | `/api/admin/vocabularies/:id` | GET | Missing record | 404 |
| I-BE-08 | `/api/admin/vocabularies/:id` | PUT | Valid update | 200 + version increment |
| I-BE-09 | `/api/admin/vocabularies/:id` | PUT | Invalid tag payload | 400 |
| I-BE-10 | `/api/admin/vocabularies/lookup` | GET | Exclude current id | 200 + options without current |
| I-BE-11 | `/api/admin/vocabularies/:id/audit` | GET | Existing record | 200 + metadata/change log/report info |
| I-BE-12 | `/api/admin/vocabularies/:id/analytics` | GET | Existing record | 200 + learn/favorite counts |
| I-BE-13 | `/api/admin/vocabularies/:id` | PUT | Status delete | 200 + soft delete persisted |
| I-BE-14 | `/api/admin/vocabularies` | POST | Invalid `meaning_vi`/`level`/`status` | 400 |
| I-BE-15 | `/api/admin/vocabularies` | POST | Invalid `media_url` | 400 |
| I-BE-16 | `/api/admin/vocabularies` | POST | related_ids contains self id | 400 |

### 1.2 Frontend Tests

#### VocabularyListPage (`VocabularyListPage.test.ts`)

| # | Test Name | Setup | Action | Assert |
|---|-----------|-------|--------|--------|
| F-LIST-01 | fetchVocabularies onMounted | mock store | render | gọi đúng 1 lần |
| F-LIST-02 | filterChange reset page | emit filterChange | handler | fetch lại với page=1 |
| F-LIST-03 | edit navigate | emit edit(id) | handler | router.push sang edit |
| F-LIST-04 | delete confirm | mock confirm | click delete + accept | status update được gọi |

#### VocabularyCreatePage (`VocabularyCreatePage.test.ts`)

| # | Test Name | Setup | Action | Assert |
|---|-----------|-------|--------|--------|
| F-CREATE-01 | load lookup options onMounted | mock store | render | getLookupVocabulary được gọi |
| F-CREATE-02 | submit create success redirect edit | mock create resolve id | submit | router push sang edit |
| F-CREATE-03 | cancel redirect list | — | click cancel | router push list |
| F-CREATE-04 | audit/analytics empty in create mode | mode=create | render | empty state hiển thị |

#### VocabularyEditPage (`VocabularyEditPage.test.ts`)

| # | Test Name | Setup | Action | Assert |
|---|-----------|-------|--------|--------|
| F-EDIT-01 | load detail/audit/analytics/lookup song song | mock store | render | cả 4 call được thực hiện |
| F-EDIT-02 | submit update refresh tabs | mock update resolve | submit | reload detail/audit/analytics |
| F-EDIT-03 | cancel redirect list | — | click cancel | router push list |
| F-EDIT-04 | exclude current id for lookup | route id=5 | render | lookup call có excludeId=5 |

#### VocabularyForm.vue (`VocabularyForm.test.ts`)

| # | Test Name | Setup | Action | Assert |
|---|-----------|-------|--------|--------|
| F-FORM-01 | required fields validation | rỗng meaning/kana/romaji | submit | inline error hiển thị |
| F-FORM-02 | level enum validation | level invalid | submit | error enum |
| F-FORM-03 | mediaUrl phải là URL | mediaUrl invalid | submit | error URL |
| F-FORM-04 | tags trim + dedupe | nhập tags trùng | submit | payload normalized |
| F-FORM-05 | relation selects exclude current id | edit mode | render | current id không xuất hiện |
| F-FORM-06 | submit emits đúng DTO | dữ liệu hợp lệ | click save | emit payload đúng shape |
| F-FORM-07 | status enum validation | status invalid | submit | inline error hiển thị |
| F-FORM-08 | mediaUrl URL validation | mediaUrl invalid | submit | inline error hiển thị |
| F-FORM-09 | relation ids normalize/dedupe | nhập ids trùng | submit | payload relation arrays dedupe |

#### VocabularyAuditTab.vue (`VocabularyAuditTab.test.ts`)

| # | Test Name | Setup | Action | Assert |
|---|-----------|-------|--------|--------|
| F-AUDIT-01 | loading skeleton | loading=true | render | skeleton hiển thị |
| F-AUDIT-02 | empty state create mode | mode=create | render | hiển thị message hướng dẫn |
| F-AUDIT-03 | render change log + report info | data đầy đủ | render | list hiển thị đúng |

#### VocabularyAnalyticsTab.vue (`VocabularyAnalyticsTab.test.ts`)

| # | Test Name | Setup | Action | Assert |
|---|-----------|-------|--------|--------|
| F-AN-01 | loading skeleton | loading=true | render | skeleton hiển thị |
| F-AN-02 | empty state create mode | mode=create | render | message hướng dẫn |
| F-AN-03 | render counts readonly | analytics data | render | learn/favorite count hiển thị |

#### useVocabulary.ts (`useVocabulary.test.ts`)

| # | Test Name | Setup | Action | Assert |
|---|-----------|-------|--------|--------|
| F-COMP-01 | getVocabularies gọi đúng endpoint | mock apiClient | gọi helper | GET `/api/admin/vocabularies` |
| F-COMP-02 | createVocabulary gọi POST | mock apiClient | gọi helper | POST body đúng |
| F-COMP-03 | updateVocabulary gọi PUT | mock apiClient | gọi helper | PUT theo id |
| F-COMP-04 | lookup gọi endpoint riêng | mock apiClient | gọi helper | GET `/lookup` |
| F-COMP-05 | audit gọi endpoint riêng | mock apiClient | gọi helper | GET `/:id/audit` |
| F-COMP-06 | analytics gọi endpoint riêng | mock apiClient | gọi helper | GET `/:id/analytics` |

#### vocabulary.store.ts (`vocabulary.store.test.ts`)

| # | Test Name | Setup | Action | Assert |
|---|-----------|-------|--------|--------|
| F-STORE-01 | fetchVocabularies set list + pagination | mock getVocabularies | gọi action | state cập nhật |
| F-STORE-02 | fetchDetail set currentVocabulary | mock getVocabulary | gọi action | currentVocabulary có data |
| F-STORE-03 | fetchLookup set relationOptions | mock lookup | gọi action | relationOptions cập nhật |
| F-STORE-04 | fetchAudit set audit state | mock audit | gọi action | audit cập nhật |
| F-STORE-05 | fetchAnalytics set analytics state | mock analytics | gọi action | analytics cập nhật |
| F-STORE-06 | clearCurrentState reset tabs | state có data | gọi clear | state detail/tab được reset |

---

## 2. Performance Considerations

| Mục | Yêu cầu |
|-----|---------|
| Server-side pagination | List page không load toàn bộ vocabulary về client |
| Lookup remote search | MultiSelect load dữ liệu theo search/limit thay vì preload toàn bộ |
| Indexed columns | Index cho `meaning_vi`, `hiragana_kana`, `romaji`, `kanji`, `status`, `level` |
| Debounce search | Search filter debounce 300ms |
| Lazy load routes | Route-level code splitting cho list/create/edit pages |

---

## 3. Security Considerations

| Mục | Biện pháp |
|-----|-----------|
| Authentication | JWT cho toàn bộ endpoint admin |
| Authorization | Chỉ role `admin` được truy cập |
| SQL Injection | Parameterized queries + whitelist sortBy |
| XSS | Không render HTML thô từ note/tag/report |
| Soft delete | Không xóa cứng record để giữ audit trail |
| Report data | Hiển thị report info read-only, không cho sửa payload gốc |

---

## 4. Accessibility

| Element | Yêu cầu |
|---------|---------|
| Tab buttons | Điều hướng bằng keyboard, focus visible |
| Form inputs | Có label/aria-label đầy đủ |
| MultiSelect | Hỗ trợ keyboard navigation và clear selection |
| Confirm dialog | Focus trap, Escape để đóng |
| Error messages | `aria-live="polite"` cho validation |

---

## 5. Logging & Audit

### audit_logs

Mọi action thành công phải tạo bản ghi audit:

| Action | Ghi lại |
|--------|---------|
| `CREATE` | `actor_id`, `target_type='VOCABULARY'`, `target_id`, `changed_fields=null` |
| `UPDATE` | Chỉ log các field thay đổi thực sự, bao gồm cả thay đổi status sang `delete` trong soft delete flow |
| `DELETE` | Chỉ dùng nếu sau này có hard delete thật sự; hiện tại không áp dụng |

### report_info

Report info trên tab Audit là read-only và chỉ dùng cho quản trị nội bộ. Không cho sửa trực tiếp từ tab này để tránh mất dấu vết xử lý của user report.
