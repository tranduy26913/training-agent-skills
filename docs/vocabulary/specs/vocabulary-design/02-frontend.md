---
title: Vocabulary Management - Frontend
version: 1.0
author: Admin Team
date: 2026-05-19
status: Draft
---

# Vocabulary Management — Frontend

> Related: [00-index.md](./00-index.md) | [01-backend.md](./01-backend.md) | [03-behavior.md](./03-behavior.md) | [04-quality.md](./04-quality.md)

---

## 1. File Structure

```text
client/src/
├── pages/vocabulary/
│   ├── VocabularyListPage.vue
│   ├── VocabularyCreatePage.vue
│   ├── VocabularyEditPage.vue
│   ├── vocabulary.routes.ts
│   ├── components/
│   │   ├── VocabularyTable.vue
│   │   ├── VocabularyFilters.vue
│   │   ├── VocabularyForm.vue
│   │   ├── VocabularyAuditTab.vue
│   │   ├── VocabularyAnalyticsTab.vue
│   │   └── VocabularyLookupMultiSelect.vue
│   └── composables/
│       └── useVocabulary.ts
├── stores/
│   └── vocabulary.store.ts
└── types/
    └── vocabulary.types.ts
```

---

## 2. Layout & Wireframes

### Application Layout

Tất cả trang vocabulary render trong `DefaultLayout` giống các feature admin khác.

```text
DefaultLayout
├── AppTopbar
├── AppSidebar (Vocabulary menu item highlighted)
└── <router-view>
    ├── VocabularyListPage        ← /admin/vocabularies
    ├── VocabularyCreatePage      ← /admin/vocabularies/create
    └── VocabularyEditPage        ← /admin/vocabularies/:id/edit
```

### Page Shell

```text
VocabularyListPage
  ├── VocabularyFilters
  └── VocabularyTable

VocabularyCreatePage / VocabularyEditPage
  ├── TabView
  │   ├── VocabularyForm         (Tab: Thông tin)
  │   ├── VocabularyAuditTab     (Tab: Audit)
  │   └── VocabularyAnalyticsTab (Tab: Analytics)
  └── Action bar: Save / Cancel
```

### Route Definitions (`vocabulary.routes.ts`)

```typescript
[
  { path: '', name: 'VocabularyList', component: () => import('./VocabularyListPage.vue'), meta: { title: 'Vocabulary' } },
  { path: 'create', name: 'VocabularyCreate', component: () => import('./VocabularyCreatePage.vue'), meta: { title: 'Create Vocabulary' } },
  { path: ':id/edit', name: 'VocabularyEdit', component: () => import('./VocabularyEditPage.vue'), meta: { title: 'Edit Vocabulary' } },
]
```

---

## 3. Screen Item Specifications

### 3.1 VocabularyListPage (`/admin/vocabularies`)

| # | ItemName | Control | Type | Required | Validation | Placeholder | DisplayText | Description | Notes |
|---|----------|---------|------|----------|------------|-------------|-------------|-------------|-------|
| **—** | **VocabularyFilters** | | | | | | | **Component** | |
| 1 | searchInput | TextInput | string | No | — | `vocabulary.searchPlaceholder` | — | Tìm theo nghĩa TV, Hira/Kana, Romaji, Kanji | Debounce 300ms |
| 2 | levelFilter | Dropdown | string | No | enum | — | `vocabulary.level` | Lọc theo level | N5-N1 |
| 3 | statusFilter | Dropdown | string | No | enum | — | `vocabulary.status` | Lọc theo publish/hide/delete | Include clear option |
| 4 | tagFilter | TextInput | string | No | — | `vocabulary.tagPlaceholder` | — | Lọc theo tag | Optional |
| 5 | clearFiltersBtn | Button | — | — | — | — | `common.clearFilters` | Reset toàn bộ filter | Reload page 1 |
| **—** | **VocabularyTable** | | | | | | | **Component** | |
| 6 | colMeaning | Column | string | — | — | — | `vocabulary.meaningVi` | Nghĩa tiếng Việt | Sortable |
| 7 | colKana | Column | string | — | — | — | `vocabulary.hiraganaKana` | Hira/Kana | Sortable |
| 8 | colRomaji | Column | string | — | — | — | `vocabulary.romaji` | Romaji | Sortable |
| 9 | colKanji | Column | string | — | — | — | `vocabulary.kanji` | Kanji | Sortable |
| 10 | colLevel | Column | string | — | — | — | `vocabulary.level` | Badge level | Sortable |
| 11 | colStatus | Column | string | — | — | — | `vocabulary.status` | Badge publish/hide/delete | Sortable |
| 12 | colUpdatedAt | Column | string | — | — | — | `vocabulary.updatedAt` | Ngày cập nhật | Default sort desc |
| 13 | editBtn | Button | — | — | — | — | `common.edit` | Điều hướng đến edit page | emits edit(id) |
| 14 | deleteBtn | Button | — | — | — | — | `common.delete` | Soft delete bằng status | emits delete(id) |
| 15 | pagination | Pagination | — | — | — | — | — | Server-side pagination | 10/25/50 per page |

### 3.2 VocabularyCreatePage (`/admin/vocabularies/create`)

| # | ItemName | Control | Type | Required | Validation | Placeholder | DisplayText | Description | Notes |
|---|----------|---------|------|----------|------------|-------------|-------------|-------------|-------|
| **—** | **VocabularyForm (Tab: Thông tin)** | | | | | | | **Component** | |
| 1 | meaningViInput | TextInput | string | Yes | 1-255 | `vocabulary.meaningViPlaceholder` | `vocabulary.meaningVi` | Nghĩa tiếng Việt | Inline error |
| 2 | hiraganaKanaInput | TextInput | string | Yes | 1-255 | `vocabulary.hiraganaKanaPlaceholder` | `vocabulary.hiraganaKana` | Hira/Kana | Inline error |
| 3 | romajiInput | TextInput | string | Yes | 1-255 | `vocabulary.romajiPlaceholder` | `vocabulary.romaji` | Romaji | Inline error |
| 4 | kanjiInput | TextInput | string | No | max 255 | `vocabulary.kanjiPlaceholder` | `vocabulary.kanji` | Kanji | Optional |
| 5 | sinoVietnameseInput | TextInput | string | No | max 255 | `vocabulary.sinoVietnamesePlaceholder` | `vocabulary.sinoVietnamese` | Âm hán việt | Optional |
| 6 | levelSelect | Dropdown | string | Yes | enum | — | `vocabulary.level` | Cấp độ N5-N1 | Default `N4` hoặc `N5` tùy config |
| 7 | mediaUrlInput | TextInput | string | No | URL valid | `vocabulary.mediaUrlPlaceholder` | `vocabulary.mediaUrl` | MediaURL | Optional |
| 8 | noteInput | Textarea | string | No | max 1000 | `vocabulary.notePlaceholder` | `vocabulary.note` | Ghi chú | Character counter |
| 9 | tagChipsInput | Chips/TagInput | string[] | No | max 20 tags | `vocabulary.tagPlaceholder` | `vocabulary.tag` | Tag tự do | Trim + dedupe |
| 10 | relatedMultiSelect | MultiSelect | number[] | No | items from DB | — | `vocabulary.relatedWords` | Từ liên quan | Load options remote từ DB |
| 11 | synonymMultiSelect | MultiSelect | number[] | No | items from DB | — | `vocabulary.synonyms` | Từ đồng nghĩa | Load options remote từ DB |
| 12 | antonymMultiSelect | MultiSelect | number[] | No | items from DB | — | `vocabulary.antonyms` | Từ trái nghĩa | Load options remote từ DB |
| 13 | statusSelect | Dropdown | string | Yes | enum | — | `vocabulary.status` | Publish/Hide/Delete | Default `hide` |
| 14 | saveBtn | Button | — | — | — | — | `common.save` | Submit form | Disabled when invalid |
| 15 | cancelBtn | Button | — | — | — | — | `common.cancel` | Quay lại list | No confirm |
| **—** | **VocabularyAuditTab** | | | | | | | **Component** | |
| 16 | emptyAuditState | Text | — | — | — | — | `vocabulary.auditNotAvailableYet` | Hiển thị trước lần lưu đầu tiên | Disabled/empty in create mode |
| **—** | **VocabularyAnalyticsTab** | | | | | | | **Component** | |
| 17 | emptyAnalyticsState | Text | — | — | — | — | `vocabulary.analyticsNotAvailableYet` | Hiển thị trước lần lưu đầu tiên | Disabled/empty in create mode |

### 3.3 VocabularyEditPage (`/admin/vocabularies/:id/edit`)

| # | ItemName | Control | Type | Required | Validation | Placeholder | DisplayText | Description | Notes |
|---|----------|---------|------|----------|------------|-------------|-------------|-------------|-------|
| **—** | **VocabularyForm (Tab: Thông tin)** | | | | | | | **Component** | |
| 1 | meaningViInput | TextInput | string | Yes | 1-255 | — | `vocabulary.meaningVi` | Nghĩa tiếng Việt | Pre-populated |
| 2 | hiraganaKanaInput | TextInput | string | Yes | 1-255 | — | `vocabulary.hiraganaKana` | Hira/Kana | Pre-populated |
| 3 | romajiInput | TextInput | string | Yes | 1-255 | — | `vocabulary.romaji` | Romaji | Pre-populated |
| 4 | kanjiInput | TextInput | string | No | max 255 | — | `vocabulary.kanji` | Kanji | Optional |
| 5 | sinoVietnameseInput | TextInput | string | No | max 255 | — | `vocabulary.sinoVietnamese` | Âm hán việt | Optional |
| 6 | levelSelect | Dropdown | string | Yes | enum | — | `vocabulary.level` | Level | Editable |
| 7 | mediaUrlInput | TextInput | string | No | URL valid | — | `vocabulary.mediaUrl` | MediaURL | Optional |
| 8 | noteInput | Textarea | string | No | max 1000 | — | `vocabulary.note` | Note | Optional |
| 9 | tagChipsInput | Chips/TagInput | string[] | No | max 20 tags | — | `vocabulary.tag` | Tag | Optional |
| 10 | relatedMultiSelect | MultiSelect | number[] | No | items from DB | — | `vocabulary.relatedWords` | Từ liên quan | Exclude current id from options |
| 11 | synonymMultiSelect | MultiSelect | number[] | No | items from DB | — | `vocabulary.synonyms` | Từ đồng nghĩa | Exclude current id from options |
| 12 | antonymMultiSelect | MultiSelect | number[] | No | items from DB | — | `vocabulary.antonyms` | Từ trái nghĩa | Exclude current id from options |
| 13 | statusSelect | Dropdown | string | Yes | enum | — | `vocabulary.status` | Publish/Hide/Delete | Editable |
| 14 | saveBtn | Button | — | — | — | — | `common.save` | Submit form | Loading while saving |
| 15 | cancelBtn | Button | — | — | — | — | `common.cancel` | Quay lại list | No confirm |
| **—** | **VocabularyAuditTab** | | | | | | | **Component** | |
| 16 | createdByDisplay | Text | string | — | — | — | `vocabulary.createdBy` | Tạo bởi ai | Read-only |
| 17 | updatedByDisplay | Text | string | — | — | — | `vocabulary.updatedBy` | Cập nhật bởi ai | Read-only |
| 18 | versionDisplay | Text | number | — | — | — | `vocabulary.version` | Phiên bản | Read-only |
| 19 | createdAtDisplay | Text | string | — | — | — | `vocabulary.createdAt` | Thời điểm tạo | Read-only |
| 20 | updatedAtDisplay | Text | string | — | — | — | `vocabulary.updatedAt` | Thời điểm cập nhật | Read-only |
| 21 | changeLogList | List | VocabularyChangeLog[] | — | — | — | `vocabulary.changeLog` | Lịch sử thay đổi | Max 10 items mặc định |
| 22 | reportInfoList | List | VocabularyReport[] | — | — | — | `vocabulary.reportInfo` | Báo cáo từ user | Max 10 items mặc định |
| **—** | **VocabularyAnalyticsTab** | | | | | | | **Component** | |
| 23 | learnCountDisplay | Text | number | — | — | — | `vocabulary.learnCount` | Số lần được học | Read-only |
| 24 | favoriteCountDisplay | Text | number | — | — | — | `vocabulary.favoriteCount` | Số lần được yêu thích | Read-only |

---

## 4. Component Details

### VocabularyTable.vue

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| vocabularies | `VocabularyDto[]` | Yes | Danh sách data |
| loading | `boolean` | Yes | Hiển thị skeleton |
| pagination | `PaginationInfo` | Yes | Metadata phân trang |

**Emits:**

| Event | Payload | Description |
|-------|---------|-------------|
| edit | `id: number` | Mở VocabularyEditPage |
| delete | `id: number` | Soft delete bằng confirm dialog |
| pageChange | `page: number` | Đổi trang |
| sortChange | `{ sortBy, sortOrder }` | Đổi sort |

### VocabularyForm.vue

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| mode | `'create' \| 'edit'` | Yes | Xác định trạng thái form |
| initialData | `VocabularyDto \| null` | No | Dữ liệu ban đầu khi edit |
| relationOptions | `VocabularyLookupItemDto[]` | Yes | Options cho 3 multiSelect |
| loading | `boolean` | Yes | Loading state |

**Emits:**

| Event | Payload | Description |
|-------|---------|-------------|
| submit | `CreateVocabularyDto \| UpdateVocabularyDto` | Dữ liệu đã validate |
| cancel | — | Quay lại list |

### VocabularyAuditTab.vue

**Props:** `audit: VocabularyAuditDto | null`, `loading: boolean`, `mode: 'create' | 'edit'`

### VocabularyAnalyticsTab.vue

**Props:** `analytics: VocabularyAnalyticsDto | null`, `loading: boolean`, `mode: 'create' | 'edit'`

### VocabularyLookupMultiSelect.vue

Component bọc `MultiSelect` để hiển thị label có status badge, hỗ trợ remote search và `excludeId`.

---

## 5. Composable

### useVocabulary.ts (`pages/vocabulary/composables/`)

```typescript
export function useVocabulary() {
  const getVocabularies = (filters) => apiClient.get('/api/admin/vocabularies', { params: filters });
  const getVocabulary = (id: number) => apiClient.get(`/api/admin/vocabularies/${id}`);
  const createVocabulary = (data) => apiClient.post('/api/admin/vocabularies', data);
  const updateVocabulary = (id: number, data) => apiClient.put(`/api/admin/vocabularies/${id}`, data);
  const getLookupVocabulary = (params) => apiClient.get('/api/admin/vocabularies/lookup', { params });
  const getVocabularyAudit = (id: number) => apiClient.get(`/api/admin/vocabularies/${id}/audit`);
  const getVocabularyAnalytics = (id: number) => apiClient.get(`/api/admin/vocabularies/${id}/analytics`);
  return { getVocabularies, getVocabulary, createVocabulary, updateVocabulary, getLookupVocabulary, getVocabularyAudit, getVocabularyAnalytics };
}
```

### Form Validation Convention

`VocabularyForm.vue` dùng `vee-validate + zod` giống các form admin khác. Các field liên quan dùng `watchDebounced` để gọi lookup search và cập nhật options độc lập, không làm ảnh hưởng toàn form.

---

## 6. Store

### vocabulary.store.ts (`stores/`)

State tối thiểu:

- `vocabularies`
- `currentVocabulary`
- `relationOptions`
- `audit`
- `analytics`
- `pagination`
- `filters`
- `loading`
- `loadingDetail`
- `loadingAudit`
- `loadingAnalytics`
- `loadingLookup`
- `error`

Store chịu trách nhiệm cache data cho list/detail/tab data để page component mỏng và dễ test.
