# Vocabulary Management — Frontend Specification

> Related: [00-index.md](./00-index.md) | [01-backend.md](./01-backend.md) | [03-behavior.md](./03-behavior.md) | [04-quality.md](./04-quality.md)

---

## 1. File Structure

```
client/src/
├── pages/
│   └── vocabularies/                    # Vocabulary page module
│       ├── vocabularies.routes.ts       # Route definitions
│       ├── VocabularyListPage.vue       # List page
│       ├── VocabularyFormPage.vue       # Create/Edit form page (3 tabs)
│       ├── components/
│       │   ├── VocabularyTable.vue      # DataTable wrapper
│       │   ├── VocabularyFilter.vue     # Filter form
│       │   ├── VocabularyForm.vue       # Main form (3 tabs)
│       │   ├── TabInfo.vue              # Tab 1: Thông tin
│       │   ├── TabAudit.vue             # Tab 2: Audit
│       │   ├── TabAnalytics.vue         # Tab 3: Analytics
│       │   └── VocabRelationSelect.vue  # MultiSelect for relations
│       ├── composables/
│       │   └── useVocabularies.ts       # API composable
│       └── vocabularies.types.ts        # TS types
├── services/
│   └── vocabularies.service.ts          # API client
├── stores/
│   └── vocabularies.store.ts            # Pinia store (optional)
└── types/
    └── vocabularies.types.ts            # Shared TS types
```

---

## 2. Layout & Wireframes

### 2.1 Application Layout

Sử dụng `DefaultLayout.vue` (sidebar + header + content) như các trang admin khác.

### 2.2 Component Tree

```
VocabularyListPage
├── VocabularyFilter
├── VocabularyTable
│   ├── DataTable (PrimeVue)
│   ├── Column (kanji, hiragana, level, status, actions)
│   └── Pagination
└── AppDialog (confirm delete)

VocabularyFormPage
├── TabView (PrimeVue)
│   ├── TabPanel: Thông tin
│   │   └── VocabularyForm
│   │       ├── TabInfo
│   │       │   ├── FormItem (kanji, hiragana, romaji, meaning_vi)
│   │       │   ├── FormItem (on_yomi, level, media_url)
│   │       │   ├── FormItem (note)
│   │       │   ├── VocabRelationSelect (related, synonyms, antonyms)
│   │       │   └── FormItem (tags, status)
│   │       ├── TabAudit
│   │       │   └── TabAudit (read-only info)
│   │       └── TabAnalytics
│   │           └── TabAnalytics (read-only stats)
│   └── FormActions
│       ├── Button (Save)
│       └── Button (Cancel)
```

### 2.3 Wireframes

#### VocabularyListPage

```
┌─────────────────────────────────────────────────────┐
│  VOCABULARY MANAGEMENT                              │
├─────────────────────────────────────────────────────┤
│  [+ Create New]  [Filter ▼]                         │
├─────────────────────────────────────────────────────┤
│  Filter: [Kanji____] [Level ▼] [Status ▼] [Search] │
├─────────────────────────────────────────────────────┤
│  ┌───┬────────┬─────────┬──────┬────────┬────────┐ │
│  │ # │ Kanji  │ Hiragana│Level │ Status │ Actions│ │
│  ├───┼────────┼─────────┼──────┼────────┼────────┤ │
│  │ 1 │ 食べる │ たべる  │  N3  │ Publish│ ✏️ 🗑️ │ │
│  │ 2 │ 飲む   │ のむ    │  N4  │ Publish│ ✏️ 🗑️ │ │
│  │ ...│...     │ ...     │ ...  │ ...    │ ...   │ │
│  └───┴────────┴─────────┴──────┴────────┴────────┘ │
│                     [◀ 1 2 3 ▶]                     │
└─────────────────────────────────────────────────────┘
```

#### VocabularyFormPage (Create/Edit)

```
┌─────────────────────────────────────────────────────┐
│  < Back  CREATE VOCABULARY                         │
├─────────────────────────────────────────────────────┤
│  [Thông tin] [Audit] [Analytics]                    │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐   │
│  │ Kanji *          [____________]             │   │
│  │ Hiragana/Kana    [____________]             │   │
│  │ Romaji           [____________]             │   │
│  │ Nghĩa TV *       [____________]             │   │
│  │ Âm hán việt      [____________]             │   │
│  │ Cấp độ           [N3 ▼]                     │   │
│  │ Media URL        [____________]             │   │
│  │ Note             [____________]             │   │
│  │ Tags             [tag1, tag2 ___]           │   │
│  │ Status           [Publish ▼]                │   │
│  │                                                     │
│  │ Từ liên quan       [MultiSelect ▼]              │   │
│  │ Từ đồng nghĩa      [MultiSelect ▼]              │   │
│  │ Từ trái nghĩa      [MultiSelect ▼]              │   │
│  └─────────────────────────────────────────────┘   │
│                              [Save]  [Cancel]       │
└─────────────────────────────────────────────────────┘
```

---

## 3. Screen Item Specifications

### 3.1 VocabularyListPage

| # | ItemName | Control | Type | Required | Validation | Placeholder | DisplayText | Description | Notes |
|---|----------|---------|------|----------|------------|-------------|-------------|-------------|-------|
| 1 | **VocabularyListPage** | — | — | — | — | — | — | — | **Component** |
| 2 | Title | Label | string | — | — | — | `vocab.title.list` | Tiêu đề trang | — |
| 3 | Create Button | Button | — | — | — | — | `vocab.btn.create` | Nút tạo mới | Navigate to `/vocabularies/create` |
| 4 | Filter Kanji | TextInput | string | No | — | `vocab.placeholder.kanji` | — | Filter theo Kanji | Debounce 300ms |
| 5 | Filter Level | Dropdown | string | No | — | `vocab.placeholder.level` | — | Filter theo JLPT level | Options: N5-N1 |
| 6 | Filter Status | Dropdown | string | No | — | `vocab.placeholder.status` | — | Filter theo status | Options: Publish/Hide/Delete |
| 7 | Search Button | Button | — | — | — | — | `vocab.btn.search` | Nút tìm kiếm | Apply filters |
| 8 | Reset Button | Button | — | — | — | — | `vocab.btn.reset` | Nút reset filter | Clear all filters |
| 9 | VocabularyTable | Component | — | — | — | — | — | Bảng danh sách từ vựng | — |
| 10 | Column Kanji | DataTableColumn | string | — | — | — | `vocab.col.kanji` | Cột Kanji | Click to navigate |
| 11 | Column Hiragana | DataTableColumn | string | — | — | — | `vocab.col.hiragana` | Cột Hiragana | — |
| 12 | Column Level | DataTableColumn | string | — | — | — | `vocab.col.level` | Cột Level | Badge color by level |
| 13 | Column Status | DataTableColumn | string | — | — | — | `vocab.col.status` | Cột Status | Badge color by status |
| 14 | Actions | DataTableColumn | — | — | — | — | `vocab.col.actions` | Cột hành động | Edit/Delete buttons |
| 15 | Pagination | Pagination | — | — | — | — | — | Phân trang | Page/limit controls |

### 3.2 VocabularyFormPage — Tab Thông tin

| # | ItemName | Control | Type | Required | Validation | Placeholder | DisplayText | Description | Notes |
|---|----------|---------|------|----------|------------|-------------|-------------|-------------|-------|
| 1 | **TabInfo** | — | — | — | — | — | — | — | **Component** |
| 2 | Kanji | TextInput | string | Yes | 1-255 chars, không chỉ số | `vocab.placeholder.kanji` | `vocab.label.kanji` | Trường Kanji | Required |
| 3 | Hiragana/Kana | TextInput | string | No | 1-255 chars | `vocab.placeholder.hiragana` | `vocab.label.hiragana` | Trường Hira/Kana | — |
| 4 | Romaji | TextInput | string | No | 1-255 chars, a-z | `vocab.placeholder.romaji` | `vocab.label.romaji` | Trường Romaji | — |
| 5 | Nghĩa TV | Textarea | string | Yes | 1-1000 chars | `vocab.placeholder.meaning` | `vocab.label.meaning_vi` | Nghĩa tiếng Việt | Required, rows=3 |
| 6 | Âm hán việt | TextInput | string | No | 1-255 chars | `vocab.placeholder.on_yomi` | `vocab.label.on_yomi` | Trường On'yomi | — |
| 7 | Cấp độ | Dropdown | string | No | Must be N5/N4/N3/N2/N1 | `vocab.placeholder.level` | `vocab.label.level` | JLPT Level | Options: N5-N1 |
| 8 | Media URL | TextInput | string | No | Valid URL | `vocab.placeholder.media_url` | `vocab.label.media_url` | URL media | — |
| 9 | Note | Textarea | string | No | Max 2000 chars | `vocab.placeholder.note` | `vocab.label.note` | Ghi chú | rows=3 |
| 10 | Tags | TagInput | string[] | No | Max 10 tags, 50 chars/tag | `vocab.placeholder.tags` | `vocab.label.tags` | Tags | Comma-separated |
| 11 | Status | Dropdown | string | No | Publish/Hide/Delete | `vocab.placeholder.status` | `vocab.label.status` | Trạng thái | Default: Publish |
| 12 | **VocabRelationSelect** | — | — | — | — | — | — | — | **Component** |
| 13 | Từ liên quan | MultiSelect | number[] | No | Valid vocab IDs | `vocab.placeholder.relations` | `vocab.label.related` | Từ liên quan | Load from DB |
| 14 | Từ đồng nghĩa | MultiSelect | number[] | No | Valid vocab IDs | `vocab.placeholder.synonyms` | `vocab.label.synonyms` | Từ đồng nghĩa | Load from DB |
| 15 | Từ trái nghĩa | MultiSelect | number[] | No | Valid vocab IDs | `vocab.placeholder.antonyms` | `vocab.label.antonyms` | Từ trái nghĩa | Load from DB |
| 16 | Save Button | Button | — | — | — | — | `vocab.btn.save` | Nút lưu | Submit form |
| 17 | Cancel Button | Button | — | — | — | — | `vocab.btn.cancel` | Nút hủy | Navigate back |

### 3.3 VocabularyFormPage — Tab Audit

| # | ItemName | Control | Type | Required | Validation | Placeholder | DisplayText | Description | Notes |
|---|----------|---------|------|----------|------------|-------------|-------------|-------------|-------|
| 1 | **TabAudit** | — | — | — | — | — | — | — | **Component** |
| 2 | Created By | Label | string | — | — | — | `vocab.label.created_by` | Người tạo | Read-only |
| 3 | Updated By | Label | string | — | — | — | `vocab.label.updated_by` | Người cập nhật | Read-only |
| 4 | Version | Label | number | — | — | — | `vocab.label.version` | Phiên bản | Read-only |
| 5 | Created At | Label | date | — | — | — | `vocab.label.created_at` | Ngày tạo | Format: DD/MM/YYYY HH:mm |
| 6 | Updated At | Label | date | — | — | — | — | Ngày cập nhật | Format: DD/MM/YYYY HH:mm |
| 7 | **ChangeLogTable** | — | — | — | — | — | — | — | **Component** |
| 8 | Change Log Table | DataTable | — | — | — | — | `vocab.label.change_log` | Bảng lịch sử thay đổi | Read-only |
| 9 | **ReportTable** | — | — | — | — | — | — | — | **Component** |
| 10 | Report Info Table | DataTable | — | — | — | — | `vocab.label.reports` | Bảng báo cáo | Read-only |
| 11 | Resolve Report Button | Button | — | — | — | — | `vocab.btn.resolve` | Nút xử lý báo cáo | Show confirm dialog |

### 3.4 VocabularyFormPage — Tab Analytics

| # | ItemName | Control | Type | Required | Validation | Placeholder | DisplayText | Description | Notes |
|---|----------|---------|------|----------|------------|-------------|-------------|-------------|-------|
| 1 | **TabAnalytics** | — | — | — | — | — | — | — | **Component** |
| 2 | Learn Count | StatCard | number | — | — | — | `vocab.label.learn_count` | Số lần học | Read-only |
| 3 | Favorite Count | StatCard | number | — | — | — | `vocab.label.favorite_count` | Số lần yêu thích | Read-only |
| 4 | Report Count | StatCard | number | — | — | — | `vocab.label.report_count` | Số báo cáo | Read-only |
| 5 | Relation Count | StatCard | number | — | — | — | `vocab.label.relation_count` | Số quan hệ | Read-only |

---

## 4. Component Details

### 4.1 VocabRelationSelect

**Props:**

- `modelValue: number[]` — Mảng ID từ vựng đã chọn
- `relationType: 'related' | 'synonym' | 'antonym'` — Loại quan hệ
- `label: string` — Nhãn hiển thị
- `excludeIds?: number[]` — Các ID cần loại trừ (tránh circular reference)

**Emits:**

- `update:modelValue: (ids: number[]) => void`

**Description:** MultiSelect component để chọn từ vựng liên quan/đồng nghĩa/trái nghĩa. Load data từ API `/api/vocabularies?limit=1000`.

---

### 4.2 VocabularyTable

**Props:**

- `items: VocabularyResponse[]` — Danh sách từ vựng
- `loading: boolean` — Trạng thái loading
- `pagination: PaginationInfo` — Thông tin phân trang

**Emits:**

- `edit: (id: number) => void`
- `delete: (id: number) => void`
- `page-change: (page: number) => void`
- `sort: (field: string, order: string) => void`

---

### 4.3 VocabularyFilter

**Props:**

- `kanji: string` — Giá trị filter Kanji
- `level: string` — Giá trị filter Level
- `status: string` — Giá trị filter Status

**Emits:**

- `search: (filters: VocabularyFilter) => void`
- `reset: () => void`

---

## 5. Composable

### `useVocabularies.ts`

**Responsibilities:**

- API calls: `fetchVocabularies()`, `fetchVocabulary()`, `createVocabulary()`, `updateVocabulary()`, `deleteVocabulary()`
- Form validation using Zod schemas
- Relation loading for MultiSelect
- Analytics data fetching

**Exports:**

- `fetchVocabularies(filters: VocabularyFilter): Promise<PaginatedResult<VocabularyResponse>>`
- `fetchVocabulary(id: number): Promise<VocabularyDetail>`
- `createVocabulary(data: CreateVocabularyDto): Promise<VocabularyResponse>`
- `updateVocabulary(id: number, data: UpdateVocabularyDto): Promise<VocabularyResponse>`
- `deleteVocabulary(id: number): Promise<void>`
- `fetchRelationOptions(excludeIds?: number[]): Promise<VocabRelationDto[]>`
- `fetchAnalytics(id: number): Promise<AnalyticsData>`

---

## 6. Store

**Optional** — Nếu cần state management cho danh sách từ vựng (ví dụ: cache danh sách cho MultiSelect), sử dụng Pinia store.

### `vocabularies.store.ts`

**State:**

- `relationOptions: VocabRelationDto[]` — Cache danh sách từ vựng cho MultiSelect
- `loading: boolean`

**Actions:**

- `loadRelationOptions(): Promise<void>`
- `clearRelationOptions(): void`

---

## 7. TypeScript Types & Interfaces

### `client/src/types/vocabularies.types.ts`

**Interfaces:**

- `VocabularyResponse` — Dữ liệu từ vựng trả về từ API
- `VocabularyDetail` — VocabularyResponse + relations + changeLogs + reports
- `VocabRelationDto` — `{ id: number; kanji: string; hiragana?: string; level?: string }`
- `VocabChangeLogDto` — `{ id: number; fieldName: string; oldValue?: string; newValue?: string; changedBy: number; changeReason?: string; createdAt: string }`
- `VocabReportDto` — `{ id: number; reportText: string; status: 'pending' | 'resolved' | 'dismissed'; reportedBy: number; resolvedBy?: number; createdAt: string }`
- `AnalyticsData` — `{ learnCount: number; favoriteCount: number; reportCount: number; relationCount: number }`
- `VocabularyFilter` — `{ kanji?: string; level?: string; status?: string; tag?: string; createdBy?: number; page?: number; limit?: number; sort?: string; order?: string }`

**Enums:**

- `VocabularyStatus` — `'Publish' | 'Hide' | 'Delete'`
- `VocabLevel` — `'N5' | 'N4' | 'N3' | 'N2' | 'N1'`
- `VocabRelationType` — `'related' | 'synonym' | 'antonym'`
- `VocabReportStatus` — `'pending' | 'resolved' | 'dismissed'`
