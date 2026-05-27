# 02 — Frontend: Vocabulary Management

> Related: [00-index.md](./00-index.md) | [01-backend.md](./01-backend.md) | [03-behavior.md](./03-behavior.md) | [04-quality.md](./04-quality.md)

---

## 1. File Structure

```
client/src/
├── types/
│   └── vocabularies.types.ts             ← Entity, DTO, Filter types
├── services/
│   └── vocabularies.service.ts           ← Mở rộng BaseApiClient
├── stores/
│   └── vocabularies.store.ts             ← Pinia store
└── pages/vocabularies/
    ├── vocabularies.routes.ts            ← Route definitions (admin guard)
    ├── VocabularyListPage.vue            ← Trang danh sách
    ├── VocabularyCreatePage.vue          ← Trang tạo mới
    ├── VocabularyEditPage.vue            ← Trang chỉnh sửa
    ├── composables/
    │   └── useVocabularies.ts            ← API composable
    └── components/
        ├── VocabularyTable.vue           ← DataTable + sort + pagination
        ├── VocabularyFilters.vue         ← Filter bar
        ├── VocabularyForm.vue            ← Container TabView (3 tab)
        ├── VocabularyInfoTab.vue         ← Tab 1: Thông tin
        ├── VocabularyAuditTab.vue        ← Tab 2: Audit
        └── VocabularyAnalyticsTab.vue    ← Tab 3: Analytics
```

---

## 2. Layout & Wireframes

### 2.1 Application Layout

Tất cả trang nằm trong `AdminLayout` (layout hiện có), với breadcrumb `Từ vựng > [Tên trang]`.

### 2.2 Component Tree

```
VocabularyListPage
  ├── VocabularyFilters
  ├── Button [+ Tạo mới]
  ├── VocabularyTable
  │     ├── DataTable (PrimeVue)
  │     ├── Column: Kanji, Nghĩa TV, Level (Badge), Status (Tag), Tags, CreatedAt
  │     └── Column: Actions (Edit, Delete)
  └── ConfirmDialog

VocabularyCreatePage / VocabularyEditPage
  └── VocabularyForm
        ├── TabView
        │     ├── TabPanel "Thông tin"  → VocabularyInfoTab
        │     ├── TabPanel "Audit"      → VocabularyAuditTab
        │     └── TabPanel "Analytics" → VocabularyAnalyticsTab
        └── Button [Lưu] [Hủy]
```

### 2.3 Wireframe — VocabularyListPage

```
┌─────────────────────────────────────────────────────┐
│ Quản lý từ vựng                    [+ Tạo từ vựng]  │
├─────────────────────────────────────────────────────┤
│ [🔍 Tìm kiếm...]  [Level ▼]  [Trạng thái ▼] [Tag▼] │
├────────────┬────────────┬───────┬────────┬──────────┤
│ Kanji      │ Nghĩa TV   │ Level │ Status │ Tags     │
├────────────┼────────────┼───────┼────────┼──────────┤
│ 食べる      │ ăn         │ N5    │Publish │ động từ  │  [✎][🗑]
│ ...        │ ...        │ ...   │ ...    │ ...      │
├─────────────────────────────────────────────────────┤
│                   Pagination                        │
└─────────────────────────────────────────────────────┘
```

### 2.4 Wireframe — VocabularyCreatePage / EditPage

```
┌─────────────────────────────────────────────────────┐
│ Tạo từ vựng / Chỉnh sửa từ vựng                    │
├──────────────┬────────────┬─────────────────────────┤
│ [Thông tin]  │  [Audit]   │     [Analytics]         │
├──────────────┴────────────┴─────────────────────────┤
│ Tab 1 — Thông tin:                                  │
│  Nghĩa TV*    [_______________]                     │
│  Hira/Kana    [_______________]                     │
│  Romaji       [_______________]                     │
│  Kanji        [_______________]                     │
│  Âm hán việt  [_______________]                     │
│  Cấp độ*      [N5 ▼]                                │
│  URL hình ảnh [_______________]                     │
│  Note         [____________________________]        │
│  Tag          [tag1 ×] [tag2 ×] [+ gõ để thêm]     │
│  Từ liên quan [__multiselect__________________]     │
│  Từ đồng nghĩa[__multiselect__________________]     │
│  Từ trái nghĩa[__multiselect__________________]     │
│  Trạng thái*  [Publish ▼]                           │
├─────────────────────────────────────────────────────┤
│                        [Hủy]  [Lưu từ vựng]        │
└─────────────────────────────────────────────────────┘
```

---

## 3. Screen Item Specifications

### 3.1 VocabularyListPage

| # | ItemName | Control | Type | Required | Validation | Placeholder | DisplayText | Description | Notes |
|---|----------|---------|------|----------|------------|-------------|-------------|-------------|-------|
| 1 | **—** | **VocabularyFilters** | | | | | | | **Component** |
| 2 | searchInput | TextInput | string | No | — | `vocabularies.searchPlaceholder` | — | Full-text search | debounce 400ms, triggers `handleFilterChange` |
| 3 | levelFilter | Dropdown | `VocabularyLevel\|''` | No | — | — | `vocabularies.filterLevel` | Filter theo cấp độ JLPT | Options: All, N5, N4, N3, N2, N1 |
| 4 | statusFilter | Dropdown | `VocabularyStatus\|''` | No | — | — | `vocabularies.filterStatus` | Filter theo trạng thái | Options: All, Publish, Hide, Delete |
| 5 | tagFilter | AutoComplete | string | No | — | `vocabularies.filterTag` | — | Filter theo tag | Gọi `/api/tags/suggest?q=` |
| 6 | createButton | Button | — | — | — | — | `vocabularies.createNew` | Điều hướng tới CreatePage | icon: `pi pi-plus` |
| 7 | **—** | **VocabularyTable** | | | | | | | **Component** |
| 8 | kanjiColumn | Column | string | — | — | — | `vocabularies.col.kanji` | Hiển thị kanji | sortable |
| 9 | meaningViColumn | Column | string | — | — | — | `vocabularies.col.meaningVi` | Hiển thị nghĩa TV | sortable |
| 10 | levelColumn | Column | Badge | — | — | — | `vocabularies.col.level` | Level badge (màu theo cấp) | sortable |
| 11 | statusColumn | Column | Tag | — | — | — | `vocabularies.col.status` | Status chip | publish=green, hide=orange, delete=red |
| 12 | tagsColumn | Column | Chips | — | — | — | `vocabularies.col.tags` | Danh sách tags | Hiển thị tối đa 3, "+ N more" |
| 13 | createdAtColumn | Column | string | — | — | — | `vocabularies.col.createdAt` | Ngày tạo | sortable, format `dd/MM/yyyy` |
| 14 | editAction | Button | — | — | — | — | — | Điều hướng Edit | icon: `pi pi-pencil`, text |
| 15 | deleteAction | Button | — | — | — | — | — | Xóa mềm từ vựng | icon: `pi pi-trash`, severity=danger, xem `03-behavior.md` |
| 16 | pagination | Paginator | — | — | — | — | — | Phân trang | rows options: [10, 20, 50] |

### 3.2 VocabularyInfoTab (Tab 1)

| # | ItemName | Control | Type | Required | Validation | Placeholder | DisplayText | Description | Notes |
|---|----------|---------|------|----------|------------|-------------|-------------|-------------|-------|
| 1 | meaningViField | TextInput | string | Yes | min 1, max 500 | `vocabularies.form.meaningViPlaceholder` | `vocabularies.form.meaningVi` | Nghĩa tiếng Việt | VeeValidate field |
| 2 | hiraganaField | TextInput | string | No | max 200 | `vocabularies.form.hiraganaPlaceholder` | `vocabularies.form.hiragana` | Hira/Kana | |
| 3 | romajiField | TextInput | string | No | max 200 | `vocabularies.form.romajiPlaceholder` | `vocabularies.form.romaji` | Romaji | |
| 4 | kanjiField | TextInput | string | No | max 200 | `vocabularies.form.kanjiPlaceholder` | `vocabularies.form.kanji` | Kanji | |
| 5 | sinoVietnameseField | TextInput | string | No | max 200 | `vocabularies.form.sinoViPlaceholder` | `vocabularies.form.sinoVi` | Âm hán việt | |
| 6 | levelField | Select | `VocabularyLevel` | Yes | enum | — | `vocabularies.form.level` | Cấp độ JLPT | Options: N5, N4, N3, N2, N1 |
| 7 | mediaUrlField | TextInput | string | No | valid URL, max 500 | `vocabularies.form.mediaUrlPlaceholder` | `vocabularies.form.mediaUrl` | URL hình ảnh | |
| 8 | noteField | Textarea | string | No | max 5000 | `vocabularies.form.notePlaceholder` | `vocabularies.form.note` | Ghi chú | rows=4 |
| 9 | tagField | AutoComplete | string[] | No | each max 100 | `vocabularies.form.tagPlaceholder` | `vocabularies.form.tags` | Tags tự do | multiple/chips mode, gọi `/api/tags/suggest?q=` |
| 10 | relatedWordsField | MultiSelect | number[] | No | — | `vocabularies.form.relatedPlaceholder` | `vocabularies.form.relatedWords` | Từ liên quan | search gọi `/api/vocabularies/search?q=`, display `kanji (meaning_vi)` |
| 11 | synonymsField | MultiSelect | number[] | No | — | `vocabularies.form.synonymPlaceholder` | `vocabularies.form.synonyms` | Từ đồng nghĩa | search gọi `/api/vocabularies/search?q=`, display `kanji (meaning_vi)` |
| 12 | antonymsField | MultiSelect | number[] | No | — | `vocabularies.form.antonymPlaceholder` | `vocabularies.form.antonyms` | Từ trái nghĩa | search gọi `/api/vocabularies/search?q=`, display `kanji (meaning_vi)` |
| 13 | statusField | Select | `VocabularyStatus` | Yes | enum | — | `vocabularies.form.status` | Trạng thái | Options: Publish, Hide, Delete |

### 3.3 VocabularyAuditTab (Tab 2)

| # | ItemName | Control | Type | Required | Validation | Placeholder | DisplayText | Description | Notes |
|---|----------|---------|------|----------|------------|-------------|-------------|-------------|-------|
| 1 | createdByLabel | Label | string | — | — | — | `vocabularies.audit.createdBy` | Tên admin tạo | readonly |
| 2 | updatedByLabel | Label | string | — | — | — | `vocabularies.audit.updatedBy` | Tên admin sửa cuối | readonly |
| 3 | versionLabel | Label | number | — | — | — | `vocabularies.audit.version` | Phiên bản | readonly |
| 4 | createdAtLabel | Label | string | — | — | — | `vocabularies.audit.createdAt` | Ngày tạo | readonly, format `dd/MM/yyyy HH:mm` |
| 5 | updatedAtLabel | Label | string | — | — | — | `vocabularies.audit.updatedAt` | Ngày sửa cuối | readonly |
| 6 | changeLogTimeline | Timeline | `VocabularyChangeLog[]` | — | — | — | `vocabularies.audit.changeLog` | Lịch sử thay đổi | PrimeVue Timeline. Hiển thị: `field: old→new by admin on date` |
| 7 | reportsTable | DataTable | `VocabularyReport[]` | — | — | — | `vocabularies.audit.reports` | Bảng báo cáo từ user | Columns: Lý do, User, Ngày, Status chip |
| 8 | reportStatusChip | Tag | `ReportStatus` | — | — | — | — | Trạng thái báo cáo | pending=orange, resolved=green |
| 9 | resolveButton | Button | — | — | — | — | `vocabularies.audit.resolve` | Đánh dấu Resolved | Gọi `PATCH .../reports/:id` |
| 10 | pendingButton | Button | — | — | — | — | `vocabularies.audit.pending` | Đặt lại Pending | Gọi `PATCH .../reports/:id` |

### 3.4 VocabularyAnalyticsTab (Tab 3)

| # | ItemName | Control | Type | Required | Validation | Placeholder | DisplayText | Description | Notes |
|---|----------|---------|------|----------|------------|-------------|-------------|-------------|-------|
| 1 | learnCountCard | Card/Statistic | number | — | — | — | `vocabularies.analytics.learnCount` | Số lần học | readonly, hiển thị số nguyên |
| 2 | favoriteCountCard | Card/Statistic | number | — | — | — | `vocabularies.analytics.favoriteCount` | Số lần yêu thích | readonly, hiển thị số nguyên |

---

## 4. Component Details

### 4.1 `VocabularyTable.vue`

**Props:**
```typescript
interface Props {
  items: VocabularyRow[];
  loading: boolean;
  totalRecords: number;
  page: number;
  pageSize: number;
  sortField: string;
  sortOrder: 1 | -1;
}
```

**Emits:**
```typescript
interface Emits {
  edit: [id: number];
  delete: [id: number];
  pageChange: [page: number];
  sortChange: [field: string, order: 1 | -1];
}
```

### 4.2 `VocabularyFilters.vue`

**Props:** `modelValue: VocabularyFilters`

**Emits:** `update:modelValue: [filters: VocabularyFilters]`

### 4.3 `VocabularyForm.vue`

**Props:**
```typescript
interface Props {
  mode: 'create' | 'edit';
  initialData?: VocabularyDetail | null;
  loading: boolean;
}
```

**Emits:**
```typescript
interface Emits {
  submit: [data: CreateVocabularyDto];
  cancel: [];
}
```

### 4.4 `VocabularyInfoTab.vue`

**Props:** `modelValue: Partial<CreateVocabularyDto>`, `loading: boolean`

**Emits:** `update:modelValue: [data: Partial<CreateVocabularyDto>]`

### 4.5 `VocabularyAuditTab.vue`

**Props:** `vocabulary: VocabularyDetail`, `changeLogs: VocabularyChangeLog[]`, `reports: VocabularyReport[]`, `loadingLogs: boolean`, `loadingReports: boolean`

**Emits:** `resolveReport: [reportId: number]`, `pendingReport: [reportId: number]`

### 4.6 `VocabularyAnalyticsTab.vue`

**Props:** `learnCount: number`, `favoriteCount: number`

**Emits:** _(không có)_

---

## 5. Composable

### `useVocabularies.ts`

```typescript
// client/src/pages/vocabularies/composables/useVocabularies.ts
export function useVocabularies() {
  async function fetchList(filters: VocabularyFilters): Promise<PaginatedData<VocabularyRow>>
  async function fetchDetail(id: number): Promise<VocabularyDetail>
  async function createVocabulary(dto: CreateVocabularyDto): Promise<VocabularyDetail>
  async function updateVocabulary(id: number, dto: UpdateVocabularyDto): Promise<VocabularyDetail>
  async function deleteVocabulary(id: number): Promise<void>
  async function fetchChangeLogs(id: number): Promise<VocabularyChangeLog[]>
  async function fetchReports(id: number): Promise<VocabularyReport[]>
  async function updateReportStatus(vocabId: number, reportId: number, status: ReportStatus): Promise<VocabularyReport>
  async function suggestTags(q: string): Promise<string[]>
  async function searchVocabularies(q: string, excludeId?: number): Promise<VocabSummary[]>
}
```

---

## 6. Store

### `vocabularies.store.ts`

```typescript
// Pinia store — state shape
interface VocabulariesState {
  items: VocabularyRow[];
  currentVocabulary: VocabularyDetail | null;
  changeLogs: VocabularyChangeLog[];
  reports: VocabularyReport[];
  filters: VocabularyFilters;
  pagination: PaginationInfo;
  loading: boolean;
  loadingDetail: boolean;
  loadingLogs: boolean;
  loadingReports: boolean;
  error: string | null;
}

// Actions
fetchVocabularies(filters?: Partial<VocabularyFilters>): Promise<void>
fetchVocabulary(id: number): Promise<void>
createVocabulary(dto: CreateVocabularyDto): Promise<void>
updateVocabulary(id: number, dto: UpdateVocabularyDto): Promise<void>
deleteVocabulary(id: number): Promise<void>
fetchChangeLogs(id: number): Promise<void>
fetchReports(id: number): Promise<void>
updateReportStatus(vocabId: number, reportId: number, status: ReportStatus): Promise<void>
clearCurrent(): void
```

---

## 7. TypeScript Models (`client/src/types/vocabularies.types.ts`)

```typescript
import type { PaginationParams, SortParams } from './api.types';

export type VocabularyLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
export type VocabularyStatus = 'publish' | 'hide' | 'delete';
export type RelationshipType = 'related' | 'synonym' | 'antonym';
export type ReportStatus = 'pending' | 'resolved';

export interface VocabSummary {
  id: number;
  kanji: string | null;
  hiragana: string | null;
  meaning_vi: string;
}

export interface VocabularyRow {
  id: number;
  meaning_vi: string;
  hiragana: string | null;
  romaji: string | null;
  kanji: string | null;
  sino_vietnamese: string | null;
  level: VocabularyLevel;
  media_url: string | null;
  note: string | null;
  status: VocabularyStatus;
  learn_count: number;
  favorite_count: number;
  version: number;
  tags: string[];
  created_by: number;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface VocabularyDetail extends VocabularyRow {
  related_words: VocabSummary[];
  synonyms: VocabSummary[];
  antonyms: VocabSummary[];
  created_by_name: string;
  updated_by_name: string | null;
}

export interface CreateVocabularyDto {
  meaning_vi: string;
  hiragana?: string;
  romaji?: string;
  kanji?: string;
  sino_vietnamese?: string;
  level: VocabularyLevel;
  media_url?: string;
  note?: string;
  status: VocabularyStatus;
  tags?: string[];
  related_ids?: number[];
  synonym_ids?: number[];
  antonym_ids?: number[];
}

export type UpdateVocabularyDto = CreateVocabularyDto;

export interface VocabularyFilters extends PaginationParams, SortParams {
  search?: string;
  level?: VocabularyLevel;
  status?: VocabularyStatus;
  tag?: string;
}

export interface VocabularyChangeLog {
  id: number;
  vocabulary_id: number;
  changed_by: number;
  changed_by_name: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_at: string;
}

export interface VocabularyReport {
  id: number;
  vocabulary_id: number;
  reported_by: number;
  reported_by_name: string;
  reason: string;
  status: ReportStatus;
  resolved_by: number | null;
  resolved_by_name: string | null;
  resolved_at: string | null;
  created_at: string;
}
```

---

## 8. Database Schema Reference

Xem chi tiết schema tại [01-backend.md — Section 1.1](./01-backend.md#11-database-schema).
