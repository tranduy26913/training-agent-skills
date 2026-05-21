---
title: Vocabulary Management - Frontend
version: 1.0
date: 2026-05-20
---

# Vocabulary Management — Frontend

> Related: [00-index.md](./00-index.md) | [01-backend.md](./01-backend.md) | [03-behavior.md](./03-behavior.md) | [04-quality.md](./04-quality.md)

---

## 1. File Structure

```
client/src/
├── types/
│   └── vocabularies.types.ts              # Entity types, DTOs, filter types
│
├── services/
│   └── vocabularies.service.ts            # Extends BaseApiClient
│
├── stores/
│   └── vocabularies.store.ts              # Pinia store
│
└── pages/
    └── vocabularies/
        ├── vocabularies.routes.ts          # Route definitions
        ├── VocabularyListPage.vue          # List page
        ├── VocabularyCreatePage.vue        # Create page (Tab 1 only)
        ├── VocabularyEditPage.vue          # Edit page (Tab 1, 2, 3)
        ├── composables/
        │   └── useVocabularies.ts          # API composable
        └── components/
            ├── VocabularyTable.vue         # Bảng danh sách + pagination
            ├── VocabularyFilters.vue       # Filter bar
            ├── VocabularyInfoTab.vue       # Tab 1: Thông tin (form fields)
            ├── VocabularyAuditTab.vue      # Tab 2: Audit log + reports
            └── VocabularyAnalyticsTab.vue  # Tab 3: Analytics (read-only)
```

---

## 2. Layout & Wireframes

### 2.1 Application Layout

Sử dụng layout Admin hiện có (sidebar + header), giống các module Users/Employees.

### 2.2 Component Tree

```
AdminLayout
└── VocabularyListPage
    ├── VocabularyFilters
    └── VocabularyTable
        └── [Paginator]

AdminLayout
└── VocabularyCreatePage
    └── [PrimeVue Tabs]
        └── Tab "Thông tin": VocabularyInfoTab

AdminLayout
└── VocabularyEditPage
    └── [PrimeVue Tabs]
        ├── Tab "Thông tin": VocabularyInfoTab
        ├── Tab "Audit":     VocabularyAuditTab
        └── Tab "Analytics": VocabularyAnalyticsTab
```

### 2.3 VocabularyListPage Wireframe

```
┌─────────────────────────────────────────────────────────┐
│  Vocabulary Management               [+ Tạo từ vựng]    │
├─────────────────────────────────────────────────────────┤
│  [Search: kanji/hiragana/nghĩa...]  [Level ▼] [Status ▼]│
│  [Tag: nhập tag...]                            [Clear]  │
├─────────────────────────────────────────────────────────┤
│ Kanji    │ Hiragana │ Nghĩa TV  │ Level │ Status │ Tags │ Actions │
│ 日本語   │ にほんご │ Tiếng Nhật│ [N5]  │[Pub]   │[言語]│ ✎ 🗑   │
│ ...      │ ...      │ ...       │ ...   │ ...    │ ...  │ ✎ 🗑   │
├─────────────────────────────────────────────────────────┤
│                  [Paginator]                             │
└─────────────────────────────────────────────────────────┘
```

### 2.4 VocabularyCreatePage / VocabularyEditPage Wireframe

```
┌─────────────────────────────────────────────────────────┐
│  Tạo từ vựng / Chỉnh sửa từ vựng                       │
├──────────────┬──────────────────────────────────────────┤
│ [Thông tin] │ [Audit] (Edit only) │ [Analytics] (Edit only) │
├─────────────────────────────────────────────────────────┤
│  (Tab 1)                                                │
│  Nghĩa TV*:    [_________________________________]       │
│  Hiragana*:    [_________________________________]       │
│  Romaji:       [_________________________________]       │
│  Kanji:        [_________________________________]       │
│  Âm HV:        [_________________________________]       │
│  Cấp độ*:      [N5 ▼]          Status*: [Publish ▼]    │
│  Image URL:    [_________________________________]       │
│  Note:         [_________________________________]       │
│  Tags:         [tag1 ×] [tag2 ×] [_nhập tag..._]        │
│  Từ liên quan: [MultiSelect từ vựng...]                 │
│  Đồng nghĩa:   [MultiSelect từ vựng...]                 │
│  Trái nghĩa:   [MultiSelect từ vựng...]                 │
│                            [Hủy]  [Lưu]                │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Screen Item Specifications

### 3.1 VocabularyListPage

| # | ItemName | Control | Type | Required | Validation | Placeholder | DisplayText | Description | Notes |
|---|----------|---------|------|----------|------------|-------------|-------------|-------------|-------|
| 1 | PageTitle | Label | — | — | — | — | `vocab.pageTitle` | Tiêu đề trang | |
| 2 | CreateButton | Button | — | — | — | — | `vocab.createBtn` | Điều hướng sang CreatePage | navigate to VocabularyCreate |
| **—** | **VocabularyFilters** | | | | | | | | **Component** |
| 3 | SearchInput | TextInput | string | No | max 100 | `vocab.searchPlaceholder` | — | Full-text search | debounce 300ms |
| 4 | LevelSelect | Dropdown | string | No | — | `vocab.allLevels` | — | Lọc theo JLPT level | Options: All/N5/N4/N3/N2/N1 |
| 5 | StatusSelect | Dropdown | string | No | — | `vocab.allStatuses` | — | Lọc theo status | Options: All/Publish/Hide/Deleted |
| 6 | TagInput | TextInput | string | No | max 50 | `vocab.tagPlaceholder` | — | Lọc theo tag | onEnter trigger filter |
| 7 | ClearButton | Button | — | — | — | — | `common.clearFilters` | Reset tất cả filters | |
| **—** | **VocabularyTable** | | | | | | | | **Component** |
| 8 | KanjiCol | Column | string | — | — | — | `vocab.kanji` | Hiển thị kanji | |
| 9 | HiraganaCol | Column | string | — | — | — | `vocab.hiragana` | Hiển thị hiragana | |
| 10 | MeaningViCol | Column | string | — | — | — | `vocab.meaningVi` | Nghĩa tiếng Việt | |
| 11 | LevelCol | Column | badge | — | — | — | `vocab.level` | Badge màu theo level | N5=green, N4=blue, N3=yellow, N2=orange, N1=red |
| 12 | StatusCol | Column | badge | — | — | — | `vocab.status` | Badge publish/hide/deleted | |
| 13 | TagsCol | Column | chips | — | — | — | `vocab.tags` | Hiển thị max 3 tags | overflow → "+n" |
| 14 | EditAction | Button | — | — | — | — | — | Icon button chỉnh sửa | navigate to VocabularyEdit/:id |
| 15 | DeleteAction | Button | — | — | — | — | — | Icon button xóa mềm | trigger ConfirmDialog |
| 16 | Paginator | Paginator | — | — | — | — | — | Server-side pagination | |

---

### 3.2 VocabularyInfoTab (Tab 1 — dùng trong cả Create và Edit)

| # | ItemName | Control | Type | Required | Validation | Placeholder | DisplayText | Description | Notes |
|---|----------|---------|------|----------|------------|-------------|-------------|-------------|-------|
| 1 | MeaningViInput | TextInput | string | Yes | min 1, max 500 | `vocab.meaningViPlaceholder` | `vocab.meaningVi` | Nghĩa tiếng Việt | utf8mb4 |
| 2 | HiraganaInput | TextInput | string | Yes | min 1, max 200 | `vocab.hiraganaPlaceholder` | `vocab.hiragana` | Hiragana / Katakana | utf8mb4, required |
| 3 | RomajiInput | TextInput | string | No | max 200 | `vocab.romajiPlaceholder` | `vocab.romaji` | Romaji phiên âm Latin | |
| 4 | KanjiInput | TextInput | string | No | max 200 | `vocab.kanjiPlaceholder` | `vocab.kanji` | Ký tự Kanji | utf8mb4 |
| 5 | SinoVietnameseInput | TextInput | string | No | max 200 | `vocab.sinoViPlaceholder` | `vocab.sinoVi` | Âm Hán Việt | utf8mb4 |
| 6 | LevelSelect | Dropdown | string | Yes | enum N5-N1 | — | `vocab.level` | Cấp độ JLPT | Options: N5, N4, N3, N2, N1 |
| 7 | StatusSelect | Dropdown | string | Yes | enum publish/hide/deleted | — | `vocab.status` | Trạng thái từ vựng | default: publish |
| 8 | ImageUrlInput | TextInput | string | No | URL format hoặc empty | `vocab.imageUrlPlaceholder` | `vocab.imageUrl` | URL ảnh minh họa | |
| 9 | NoteTextarea | Textarea | string | No | max 2000 | `vocab.notePlaceholder` | `vocab.note` | Ghi chú bổ sung | rows=4 |
| 10 | TagsInput | InputChips | string[] | No | max 20 tags, mỗi tag max 50 | `vocab.tagsPlaceholder` | `vocab.tags` | Free-text tags | PrimeVue InputChips |
| 11 | RelatedVocabSelect | MultiSelect | number[] | No | — | `vocab.relatedPlaceholder` | `vocab.related` | Chọn từ liên quan | load từ /list/simple |
| 12 | SynonymSelect | MultiSelect | number[] | No | — | `vocab.synonymPlaceholder` | `vocab.synonyms` | Chọn từ đồng nghĩa | load từ /list/simple |
| 13 | AntonymSelect | MultiSelect | number[] | No | — | `vocab.antonymPlaceholder` | `vocab.antonyms` | Chọn từ trái nghĩa | load từ /list/simple |
| 14 | CancelButton | Button | — | — | — | — | `common.cancel` | Hủy, về ListPage | |
| 15 | SaveButton | Button | — | — | — | — | `common.save` | Submit form | disabled khi loading |

---

### 3.3 VocabularyAuditTab (Tab 2 — chỉ EditPage)

| # | ItemName | Control | Type | Required | Validation | Placeholder | DisplayText | Description | Notes |
|---|----------|---------|------|----------|------------|-------------|-------------|-------------|-------|
| 1 | CreatedByField | Label | string | — | — | — | `vocab.createdBy` | Tên admin tạo | read-only |
| 2 | UpdatedByField | Label | string | — | — | — | `vocab.updatedBy` | Tên admin cập nhật cuối | read-only |
| 3 | VersionField | Label | number | — | — | — | `vocab.version` | Số phiên bản | read-only |
| 4 | CreatedAtField | Label | datetime | — | — | — | `vocab.createdAt` | Thời gian tạo | formatted display |
| 5 | UpdatedAtField | Label | datetime | — | — | — | `vocab.updatedAt` | Thời gian cập nhật | formatted display |
| 6 | AuditLogList | List | — | — | — | — | `vocab.changeLog` | Danh sách audit log entries | giống AuditLogViewer |
| 7 | ReportsTable | DataTable | — | — | — | — | `vocab.reports` | Danh sách user reports | |
| 8 | ReportStatus | Badge | string | — | — | — | — | pending/resolved/rejected | màu sắc theo status |
| 9 | ResolveButton | Button | — | — | — | — | `vocab.resolve` | Resolve report | hiện khi status = pending |
| 10 | RejectButton | Button | — | — | — | — | `vocab.reject` | Reject report | hiện khi status = pending |

---

### 3.4 VocabularyAnalyticsTab (Tab 3 — chỉ EditPage)

| # | ItemName | Control | Type | Required | Validation | Placeholder | DisplayText | Description | Notes |
|---|----------|---------|------|----------|------------|-------------|-------------|-------------|-------|
| 1 | LearnCountField | Label | number | — | — | — | `vocab.learnCount` | Số lượt học | read-only |
| 2 | FavoriteCountField | Label | number | — | — | — | `vocab.favoriteCount` | Số lượt yêu thích | read-only |

---

## 4. Component Details

### 4.1 VocabularyTable

**Props:**
```typescript
defineProps<{
  vocabularies: Vocabulary[];
  loading: boolean;
  pagination: PaginationInfo;
  sortField: string;
  sortOrder: 1 | -1;
}>()
```

**Emits:**
```typescript
defineEmits<{
  edit: [id: number];
  delete: [id: number];
  pageChange: [page: number];
  sortChange: [field: string, order: 1 | -1];
}>()
```

---

### 4.2 VocabularyFilters

**Props:**
```typescript
defineProps<{
  modelValue: VocabularyFilters;
}>()
```

**Emits:**
```typescript
defineEmits<{
  'update:modelValue': [filters: VocabularyFilters];
  filter: [filters: VocabularyFilters];
}>()
```

---

### 4.3 VocabularyInfoTab

**Props:**
```typescript
defineProps<{
  mode: 'create' | 'edit';
  initialData?: Vocabulary | null;
  loading?: boolean;
  vocabularyOptions: VocabularySimple[];   // cho MultiSelect
}>()
```

**Emits:**
```typescript
defineEmits<{
  submit: [data: CreateVocabularyDto];
  cancel: [];
}>()
```

---

### 4.4 VocabularyAuditTab

**Props:**
```typescript
defineProps<{
  vocabulary: VocabularyDetail;
  auditLogs: VocabularyAuditLog[];
  reports: VocabularyReport[];
  loadingLogs: boolean;
  loadingReports: boolean;
}>()
```

**Emits:**
```typescript
defineEmits<{
  resolveReport: [reportId: number];
  rejectReport: [reportId: number];
}>()
```

---

### 4.5 VocabularyAnalyticsTab

**Props:**
```typescript
defineProps<{
  analytics: VocabularyAnalytics | null;
  loading: boolean;
}>()
```

---

## 5. Composable

```typescript
// client/src/pages/vocabularies/composables/useVocabularies.ts

export function useVocabularies() {
  return {
    getVocabularies: (filters: VocabularyFilters) => vocabulariesApiService.getList(filters),
    getVocabulary: (id: number) => vocabulariesApiService.getById(id),
    getSimpleList: () => vocabulariesApiService.getSimpleList(),
    createVocabulary: (dto: CreateVocabularyDto) => vocabulariesApiService.create(dto),
    updateVocabulary: (id: number, dto: UpdateVocabularyDto) => vocabulariesApiService.update(id, dto),
    deleteVocabulary: (id: number) => vocabulariesApiService.delete(id),
    getAuditLogs: (id: number) => vocabulariesApiService.getAuditLogs(id),
    resolveReport: (reportId: number) => vocabulariesApiService.resolveReport(reportId),
    rejectReport: (reportId: number) => vocabulariesApiService.rejectReport(reportId),
  };
}
```

---

## 6. Store

```typescript
// client/src/stores/vocabularies.store.ts
// State: vocabularies[], currentVocabulary, simpleList, auditLogs, reports, analytics
// Actions: fetchVocabularies, fetchVocabulary, fetchSimpleList, createVocabulary,
//          updateVocabulary, deleteVocabulary, fetchAuditLogs, resolveReport, rejectReport
// Getters: totalVocabularies, hasVocabularies
```

---

## 7. TypeScript Models

```typescript
// client/src/types/vocabularies.types.ts

export type VocabularyLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
export type VocabularyStatus = 'publish' | 'hide' | 'deleted';
export type RelationType = 'related' | 'synonym' | 'antonym';
export type ReportStatus = 'pending' | 'resolved' | 'rejected';

export interface VocabularySimple {
  id: number;
  kanji: string | null;
  hiragana: string;
  meaning_vi: string;
}

export interface VocabularyAnalytics {
  learn_count: number;
  favorite_count: number;
}

export interface VocabularyReport {
  id: number;
  vocab_id: number;
  reporter_id: number;
  reason: string;
  status: ReportStatus;
  resolved_by: number | null;
  resolved_at: string | null;
  created_at: string;
  reporter_name?: string;
  resolved_by_name?: string;
}

export interface VocabularyAuditLog {
  id: number;
  vocab_id: number;
  admin_id: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  changed_fields: Record<string, { old: unknown; new: unknown }> | null;
  timestamp: string;
  admin_name: string;
}

export interface Vocabulary {
  id: number;
  meaning_vi: string;
  hiragana: string;
  romaji: string | null;
  kanji: string | null;
  sino_vietnamese: string | null;
  level: VocabularyLevel;
  image_url: string | null;
  note: string | null;
  tags: string[] | null;
  status: VocabularyStatus;
  version: number;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
}

export interface VocabularyDetail extends Vocabulary {
  relations: {
    related: VocabularySimple[];
    synonym: VocabularySimple[];
    antonym: VocabularySimple[];
  };
  reports: VocabularyReport[];
  analytics: VocabularyAnalytics;
  created_by_name: string;
  updated_by_name: string;
}

export interface CreateVocabularyDto {
  meaning_vi: string;
  hiragana: string;
  romaji?: string;
  kanji?: string;
  sino_vietnamese?: string;
  level: VocabularyLevel;
  image_url?: string;
  note?: string;
  tags?: string[];
  status: VocabularyStatus;
  related_ids?: number[];
  synonym_ids?: number[];
  antonym_ids?: number[];
}

export type UpdateVocabularyDto = Partial<CreateVocabularyDto>;

export interface VocabularyFilters {
  search?: string;
  level?: string;
  status?: string;
  tag?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
```

---

## 8. Database Schema Reference

Xem chi tiết tại [01-backend.md — Data Models](./01-backend.md#1-data-models).
