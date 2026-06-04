---
title: Admin Vocabulary Management - Frontend Specification
version: 1.0
author: Admin Team
date: 2026-06-04
---

# Admin Vocabulary Management - Frontend Specification

> Related: [00-index.md](./00-index.md) | [01-backend.md](./01-backend.md) | [03-behavior.md](./03-behavior.md) | [04-quality.md](./04-quality.md)

---

## 1. File Structure

```
client/src/pages/vocabularies/
├── VocabularyListPage.vue          # List page with table, filters, pagination, bulk actions
├── VocabularyFormPage.vue          # Create/Edit page with 3 tabs (All-in-One Form)
├── components/
│   ├── VocabularyTable.vue         # Reusable table component
│   ├── VocabularyFilters.vue       # Filter panel (Status, Level, Tag, Search, etc.)
│   ├── VocabularyInformationTab.vue # Tab 1: Information form (editable)
│   ├── VocabularyAuditTab.vue      # Tab 2: Audit trail (read-only)
│   └── VocabularyAnalyticsTab.vue  # Tab 3: Analytics (read-only)
├── composables/
│   └── useVocabularies.ts          # API calls for CRUD and export
├── vocabularies.routes.ts           # Route definitions

client/src/stores/
├── vocabularies.store.ts            # Pinia store for vocabulary state

client/src/types/
├── vocabularies.types.ts            # TypeScript types and interfaces
```

---

## 2. Layout & Wireframes

### 2.1 Application Layout

```
┌────────────────────────────────────────────────────────┐
│ DefaultLayout (Sidebar + Header + Content)             │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Page Routing:                                         │
│  ├── /vocabularies          → VocabularyListPage      │
│  ├── /vocabularies/create   → VocabularyFormPage      │
│  └── /vocabularies/:id/edit → VocabularyFormPage      │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### 2.2 Component Tree

```
VocabularyListPage
├── Header (Title + Create Button)
├── VocabularyFilters
│   ├── FilterGroup (Status, Level, Tag)
│   ├── FilterGroup (Search, Created By)
│   ├── FilterGroup (Date Range)
│   └── FilterActions (Clear, Apply)
├── VocabularyTable
│   ├── PrimeVue DataTable
│   │   ├── Column (ID, Hiragana, Romaji, Level, Status, Tags, Created At)
│   │   ├── RowActions (View, Edit, Delete)
│   │   └── SelectCheckbox (for bulk export)
│   └── Pagination (10/20/50 items per page)
├── BulkActions (Export CSV Button)
└── ConfirmDialog (for delete confirmation)

VocabularyFormPage
├── TabView (PrimeVue TabView)
│   ├── TabPanel (Information)
│   │   └── VocabularyInformationTab
│   │       ├── TextInput (meaning_vi, hiragana, romaji, kanji, han_viet)
│   │       ├── Dropdown (level, status)
│   │       ├── FileUpload (media_url)
│   │       ├── Textarea (note)
│   │       ├── MultiSelect (tags)
│   │       ├── MultiSelect (relatedWords)
│   │       ├── MultiSelect (synonyms)
│   │       ├── MultiSelect (antonyms)
│   │       └── ActionButtons (Save, Cancel)
│   ├── TabPanel (Audit)
│   │   └── VocabularyAuditTab (read-only)
│   │       ├── Display (Created By, Updated By, Version, Dates)
│   │       ├── Table (Change Log)
│   │       └── Table (Report Info)
│   └── TabPanel (Analytics)
│       └── VocabularyAnalyticsTab (read-only)
│           ├── Display (Learn Count, Favorite Count)
│           └── Charts (optional)
└── ConfirmDialog (for discard unsaved changes)
```

### 2.3 VocabularyListPage Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│ Vocabularies                              [+ Create] Button │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Filters:                                                     │
│  Status: [___________▼] Level: [___________▼]               │
│  Tag: [___________▼]    Search: [search box___________]    │
│  Created By: [___________▼]  Date: [from] - [to]           │
│  [Clear All]  [Apply Filters]                              │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ [Checkbox] ID │ Hiragana  │ Romaji │ Level │ Status │ ...  │
├─────────────────────────────────────────────────────────────┤
│ [ ]      1    │ にほん    │ nihon  │ N5    │ publish│ ...  │
│ [ ]      2    │ せかい    │ sekai  │ N4    │ hide   │ ...  │
│ ...                                                          │
├─────────────────────────────────────────────────────────────┤
│ [Export Selected as CSV] Button                             │
│ Showing 1-20 of 145 | [< Prev] 1 2 3 ... 8 [Next >]       │
│ Items per page: [20 ▼]                                     │
└─────────────────────────────────────────────────────────────┘
```

### 2.4 VocabularyFormPage Wireframe (All-in-One Form)

```
┌────────────────────────────────────────────────────────────┐
│ Vocabulary Management (Create / Edit: にほん)              │
├────────────────────────────────────────────────────────────┤
│                                                             │
│ [Information]  [Audit]  [Analytics]                       │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ TAB 1: INFORMATION (editable)                        │  │
│ │                                                       │  │
│ │ Meaning (VI):    [日本_________________________]     │  │
│ │ Hiragana:        [にほん_______________________]     │  │
│ │ Romaji:          [nihon________________________]     │  │
│ │ Kanji:           [日本_________________________]     │  │
│ │ Han Viet:        [Nhật Bản_____________________]     │  │
│ │ Level:           [N5____________▼]                  │  │
│ │ Media URL:       [Choose File...]                   │  │
│ │ Note:            [                                  │  │
│ │                  多行テキスト                       │  │
│ │                  ]                                  │  │
│ │ Tags:            [N5-basic, country____________]    │  │
│ │ Related Words:   [Select from list:                │  │
│ │                  ☑ せかい ☑ 国 ☐ ...]              │  │
│ │ Synonyms:        [☑ 日本国 ☐ ...]                  │  │
│ │ Antonyms:        [☐ ...]                           │  │
│ │ Status:          [publish______▼]                  │  │
│ │                                                     │  │
│ │ [Save]  [Cancel]  [Delete]                         │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ TAB 2: AUDIT (read-only)                             │  │
│ │                                                       │  │
│ │ Created By:   Admin User (2026-01-15 10:30:00)      │  │
│ │ Updated By:   Admin User (2026-03-20 14:45:00)      │  │
│ │ Version:      3                                      │  │
│ │                                                       │  │
│ │ Change Log:                                          │  │
│ │ Version │ Fields Changed │ Description │ By │ Date   │  │
│ │ 1       │ meaning, hira  │ Initial...  │    │ ...    │  │
│ │ 2       │ note           │ note upd... │    │ ...    │  │
│ │ 3       │ status         │ status...   │    │ ...    │  │
│ │                                                       │  │
│ │ Reports:                                             │  │
│ │ [1 pending report] - "Incorrect meaning"             │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ TAB 3: ANALYTICS (read-only)                         │  │
│ │                                                       │  │
│ │ Learn Count:     156 times                           │  │
│ │ Favorite Count:  45 times                            │  │
│ │                                                       │  │
│ │ [Optional: Charts/Graphs]                            │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## 3. Screen Item Specifications

### 3.1 VocabularyListPage Screen Items

| # | ItemName | Control | Type | Required | Validation | Placeholder | DisplayText | Description | Notes |
|---|----------|---------|------|----------|-----------|-------------|-------------|-------------|-------|
| 1 | **VocabularyListPage** | | | | | | | **Component** | Page container |
| 2 | Page Title | Label | string | Yes | — | — | `vocab.list.title` | "Vocabularies" heading | Static text |
| 3 | Create Button | Button | — | Yes | — | — | `vocab.list.createBtn` | "Create Vocabulary" button | Navigate to VocabularyFormPage (create mode) |
| 4 | **VocabularyFilters** | | | | | | | **Component** | Filter panel |
| 5 | Status Filter | Dropdown | string | No | — | `vocab.filter.statusPlaceholder` | `vocab.filter.status` | Filter by status enum | Select: Publish, Hide, Deleted |
| 6 | Level Filter | Dropdown | string | No | — | `vocab.filter.levelPlaceholder` | `vocab.filter.level` | Filter by JLPT level | Select: N5/N4/N3/N2/N1/other |
| 7 | Tag Filter | MultiSelect | string[] | No | — | `vocab.filter.tagPlaceholder` | `vocab.filter.tag` | Filter by tag (load from DB) | Load all unique tags from database |
| 8 | Keyword Search | TextInput | string | No | Max 200 chars | `vocab.filter.searchPlaceholder` | `vocab.filter.search` | Search meaning, hiragana, romaji | Real-time or on Apply |
| 9 | Created By Filter | Dropdown | number | No | — | `vocab.filter.createdByPlaceholder` | `vocab.filter.createdBy` | Filter by creator (admin user list) | Load admin users from DB |
| 10 | Date From | DatePicker | date | No | — | `vocab.filter.dateFromPlaceholder` | `vocab.filter.dateFrom` | Filter from date | ISO 8601 format |
| 11 | Date To | DatePicker | date | No | — | `vocab.filter.dateToPlaceholder` | `vocab.filter.dateTo` | Filter to date | ISO 8601 format |
| 12 | Clear Filters Button | Button | — | No | — | — | `vocab.filter.clearBtn` | Clear all filters | Reset all filter values |
| 13 | Apply Filters Button | Button | — | Yes | — | — | `vocab.filter.applyBtn` | Apply filters | Trigger fetch with current filters, reset page to 1 |
| 14 | **VocabularyTable** | | | | | | | **Component** | Data table |
| 15 | Checkbox Column | Checkbox | boolean | No | — | — | — | Select rows for bulk actions | Allow multi-select |
| 16 | ID Column | Label | number | — | — | — | `vocab.table.id` | Display vocabulary ID | Sortable |
| 17 | Hiragana Column | Label | string | — | — | — | `vocab.table.hiragana` | Display hiragana reading | Sortable |
| 18 | Romaji Column | Label | string | — | — | — | `vocab.table.romaji` | Display romaji reading | Sortable |
| 19 | Level Column | Label | string | — | — | — | `vocab.table.level` | Display JLPT level | Sortable |
| 20 | Status Column | Badge | string | — | — | — | `vocab.table.status` | Display status (publish/hide/deleted) | Color-coded |
| 21 | Tags Column | Label | string[] | — | — | — | `vocab.table.tags` | Display tags as comma-separated | Truncate if > 30 chars |
| 22 | Created At Column | Label | date | — | — | — | `vocab.table.createdAt` | Display creation date (formatted) | Sortable |
| 23 | Actions Menu | Button | — | — | — | — | — | 3-dot menu with View/Edit/Delete | Row action button |
| 24 | View Action | MenuItem | — | — | — | — | `vocab.table.view` | Open vocabulary detail (read-only form) | Navigate to VocabularyFormPage (view mode) |
| 25 | Edit Action | MenuItem | — | — | — | — | `vocab.table.edit` | Edit vocabulary | Navigate to VocabularyFormPage (edit mode) |
| 26 | Delete Action | MenuItem | — | — | — | — | `vocab.table.delete` | Delete vocabulary (soft delete) | Show confirmation dialog |
| 27 | **Pagination** | | | | | | | **Component** | Pagination controls |
| 28 | Current Page Info | Label | string | — | — | — | — | "Showing X-Y of Z" | Display pagination info |
| 29 | Items Per Page | Dropdown | number | No | — | — | `vocab.pagination.itemsPerPage` | Select: 10, 20, 50 | Trigger re-fetch with new limit |
| 30 | Previous Button | Button | — | No | — | — | `vocab.pagination.prev` | Previous page | Disable on first page |
| 31 | Page Numbers | Button Group | number | No | — | — | — | Page number buttons | Highlight current page |
| 32 | Next Button | Button | — | No | — | — | `vocab.pagination.next` | Next page | Disable on last page |
| 33 | Export CSV Button | Button | — | No | — | — | `vocab.list.exportBtn` | Export selected as CSV | Export selected rows or all based on selection |
| 34 | ConfirmDialog | Dialog | — | — | — | — | — | Delete confirmation | See 03-behavior.md for dialog content |

---

### 3.2 VocabularyFormPage Screen Items

| # | ItemName | Control | Type | Required | Validation | Placeholder | DisplayText | Description | Notes |
|---|----------|---------|------|----------|-----------|-------------|-------------|-------------|-------|
| 1 | **VocabularyFormPage** | | | | | | | **Component** | Form container (create/edit mode) |
| 2 | Page Title | Label | string | Yes | — | — | `vocab.form.title.create` or `vocab.form.title.edit` | "Create Vocabulary" or "Edit: [hiragana]" | Dynamic based on mode |
| 3 | **TabView** | | | | | | | **Component** | 3-tab interface |
| 4 | **VocabularyInformationTab** | | | | | | | **Component** | Tab 1: Editable form |
| 5 | Meaning (VI) Input | TextInput | string | Yes | Max 500, no HTML | `vocab.form.meaningViPlaceholder` | `vocab.form.meaningVi` | Vietnamese translation | Required, trimmed on submit |
| 6 | Hiragana Input | TextInput | string | Yes | Max 100, hiragana only | `vocab.form.hiraganaPlaceholder` | `vocab.form.hiragana` | Hiragana/Katakana reading | Required, Japanese characters |
| 7 | Romaji Input | TextInput | string | Yes | Max 100, alphanumeric + dash | `vocab.form.romajiPlaceholder` | `vocab.form.romaji` | Romaji romanization | Required, latin characters |
| 8 | Kanji Input | TextInput | string | No | Max 100 | `vocab.form.kanjiPlaceholder` | `vocab.form.kanji` | Kanji characters | Optional |
| 9 | Han Viet Input | TextInput | string | No | Max 100 | `vocab.form.hanVietPlaceholder` | `vocab.form.hanViet` | Sino-Vietnamese reading | Optional |
| 10 | Level Dropdown | Dropdown | string | Yes | Enum validation | — | `vocab.form.level` | Select from N5/N4/N3/N2/N1/other | Required enum |
| 11 | Media URL Input | FileUpload or TextInput | string | No | Valid URL if provided | `vocab.form.mediaUrlPlaceholder` | `vocab.form.mediaUrl` | Image/audio file URL | Optional, validate URL format |
| 12 | Note Textarea | Textarea | string | No | Max 2000 chars | `vocab.form.notePlaceholder` | `vocab.form.note` | Additional notes | Optional, multi-line |
| 13 | Tags MultiSelect | MultiSelect | string[] | No | Max 10 items | `vocab.form.tagsPlaceholder` | `vocab.form.tags` | Tag list (comma-separated or selected) | Allow add new tags or select from existing |
| 14 | Related Words MultiSelect | MultiSelect | Vocabulary[] | No | Check IDs exist | `vocab.form.relatedWordsPlaceholder` | `vocab.form.relatedWords` | Select related vocabulary items | Load all vocabularies (except self) |
| 15 | Synonyms MultiSelect | MultiSelect | Vocabulary[] | No | Check IDs exist | `vocab.form.synonymsPlaceholder` | `vocab.form.synonyms` | Select synonym vocabulary items | Load all vocabularies (except self) |
| 16 | Antonyms MultiSelect | MultiSelect | Vocabulary[] | No | Check IDs exist | `vocab.form.antonymsPlaceholder` | `vocab.form.antonyms` | Select antonym vocabulary items | Load all vocabularies (except self) |
| 17 | Status Dropdown | Dropdown | string | Yes | Enum validation | — | `vocab.form.status` | Select: publish, hide, deleted | Required enum |
| 18 | Save Button | Button | — | Yes | — | — | `vocab.form.saveBtn` | Save vocabulary | Validate form, POST/PUT to API |
| 19 | Cancel Button | Button | — | Yes | — | — | `vocab.form.cancelBtn` | Cancel and go back | Show confirmation if form is dirty |
| 20 | Delete Button | Button | — | No | — | — | `vocab.form.deleteBtn` | Delete vocabulary (soft delete) | Only show in edit mode; confirm before delete |
| 21 | **VocabularyAuditTab** | | | | | | | **Component** | Tab 2: Read-only audit info |
| 22 | Created By Display | Label | string | — | — | — | `vocab.form.createdBy` | "Created by: Admin User" | Read-only, display user name + link |
| 23 | Created At Display | Label | string | — | — | — | `vocab.form.createdAt` | "Created: 2026-01-15 10:30:00" | Read-only, formatted timestamp |
| 24 | Updated By Display | Label | string | — | — | — | `vocab.form.updatedBy` | "Updated by: Admin User" | Read-only, display user name (null if no update) |
| 25 | Updated At Display | Label | string | — | — | — | `vocab.form.updatedAt` | "Updated: 2026-03-20 14:45:00" | Read-only, formatted timestamp |
| 26 | Version Display | Label | number | — | — | — | `vocab.form.version` | "Version: 3" | Read-only, integer |
| 27 | Change Log Table | DataTable | ChangeLog[] | — | — | — | `vocab.form.changeLog` | Table with: Version, Fields Changed, Description, Changed By, Date | Read-only table, sortable by date |
| 28 | Reports Table | DataTable | Report[] | — | — | — | `vocab.form.reports` | Table with: Type, Reason, Status, Reporter, Reported At | Read-only table, show 5 latest by default |
| 29 | **VocabularyAnalyticsTab** | | | | | | | **Component** | Tab 3: Read-only analytics |
| 30 | Learn Count Display | Label | number | — | — | — | `vocab.form.learnCount` | "Learned: 156 times" | Read-only, integer |
| 31 | Favorite Count Display | Label | number | — | — | — | `vocab.form.favoriteCount` | "Favorited: 45 times" | Read-only, integer |
| 32 | ConfirmDialog (Save) | Dialog | — | — | — | — | — | Unsaved changes confirmation | See 03-behavior.md |
| 33 | ConfirmDialog (Delete) | Dialog | — | — | — | — | — | Delete confirmation | See 03-behavior.md |

---

## 4. Component Details

### 4.1 VocabularyTable Component

**Props:**
```typescript
interface VocabularyTableProps {
  vocabularies: Vocabulary[];
  loading: boolean;
  pagination: PaginationInfo;
  sortField?: string;
  sortOrder?: 1 | -1;
}
```

**Emits:**
```typescript
interface VocabularyTableEmits {
  'edit': (id: number) => void;
  'delete': (id: number) => void;
  'page-change': (page: number) => void;
  'limit-change': (limit: number) => void;
  'sort-change': (field: string, order: 1 | -1) => void;
  'selection-change': (ids: number[]) => void;
}
```

---

### 4.2 VocabularyFilters Component

**Props:**
```typescript
interface VocabularyFiltersProps {
  loading?: boolean;
}
```

**Emits:**
```typescript
interface VocabularyFiltersEmits {
  'filter-change': (filters: VocabularyFilters) => void;
  'clear-filters': () => void;
}
```

---

### 4.3 VocabularyInformationTab Component

**Props:**
```typescript
interface VocabularyInformationTabProps {
  vocabulary?: Vocabulary | null;
  loading: boolean;
  isEditMode: boolean;
  relatedVocabularies?: Vocabulary[];
  synonymVocabularies?: Vocabulary[];
  antonymVocabularies?: Vocabulary[];
}
```

**Emits:**
```typescript
interface VocabularyInformationTabEmits {
  'save': (data: CreateVocabularyDto | UpdateVocabularyDto) => void;
  'cancel': () => void;
  'delete': () => void;
  'form-dirty': (isDirty: boolean) => void;
}
```

---

### 4.4 VocabularyAuditTab Component

**Props:**
```typescript
interface VocabularyAuditTabProps {
  vocabulary: Vocabulary;
  changeLogs: VocabularyChangeLog[];
  reports: VocabularyReport[];
  loading?: boolean;
}
```

**Emits:** None (read-only)

---

### 4.5 VocabularyAnalyticsTab Component

**Props:**
```typescript
interface VocabularyAnalyticsTabProps {
  learnCount: number;
  favoriteCount: number;
  loading?: boolean;
}
```

**Emits:** None (read-only)

---

## 5. Composable

### useVocabularies

```typescript
interface UseVocabularies {
  // API calls
  listVocabularies(filters: VocabularyFilters): Promise<ListResponse>;
  getVocabulary(id: number): Promise<VocabularyDetailDto>;
  createVocabulary(data: CreateVocabularyDto): Promise<Vocabulary>;
  updateVocabulary(id: number, data: UpdateVocabularyDto): Promise<Vocabulary>;
  deleteVocabulary(id: number): Promise<void>;
  exportCsv(filters: VocabularyFilters): Promise<Blob>;
  getAllVocabularies(): Promise<Vocabulary[]>; // For multiselect dropdowns
}
```

---

## 6. Store (Pinia)

### useVocabulariesStore

State:
```typescript
{
  vocabularies: Vocabulary[];
  currentVocabulary: Vocabulary | null;
  pagination: PaginationInfo;
  filters: VocabularyFilters;
  loading: boolean;
  loadingDetail: boolean;
  error: string | null;
  formDirty: boolean;
}
```

Actions:
```typescript
{
  fetchVocabularies(filters?: VocabularyFilters): Promise<void>;
  fetchVocabulary(id: number): Promise<void>;
  createVocabulary(data: CreateVocabularyDto): Promise<Vocabulary>;
  updateVocabulary(id: number, data: UpdateVocabularyDto): Promise<Vocabulary>;
  deleteVocabulary(id: number): Promise<void>;
  exportCsv(filters: VocabularyFilters): Promise<Blob>;
  setFilters(filters: VocabularyFilters): void;
  setFormDirty(dirty: boolean): void;
  reset(): void;
}
```

Getters:
```typescript
{
  totalVocabularies: () => number;
  hasVocabularies: () => boolean;
  isLastPage: () => boolean;
  filteredCount: () => number;
}
```

---

## 7. TypeScript Models

See `types/vocabularies.types.ts`:

```typescript
// Database entities
interface Vocabulary {
  id: number;
  meaning_vi: string;
  hiragana: string;
  romaji: string;
  kanji?: string;
  han_viet?: string;
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | 'other';
  media_url?: string;
  note?: string;
  status: 'publish' | 'hide' | 'deleted';
  version: number;
  learn_count: number;
  favorite_count: number;
  created_by: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
  createdByUser?: User;
  updatedByUser?: User;
  tags: string[];
  relatedWords: Vocabulary[];
  synonyms: Vocabulary[];
  antonyms: Vocabulary[];
}

interface VocabularyChangeLog {
  id: number;
  vocabulary_id: number;
  version: number;
  changed_fields: string; // "field1, field2, field3"
  change_description: string;
  changed_by: number;
  changedByUser?: User;
  created_at: string;
}

interface VocabularyReport {
  id: number;
  vocabulary_id: number;
  report_type: 'incorrect_meaning' | 'offensive_content' | 'duplicate' | 'other';
  report_reason: string;
  status: 'pending' | 'resolved' | 'rejected';
  reporter_id: number;
  reporter?: User;
  created_at: string;
  resolved_at?: string;
}

// Request/Response DTOs
interface CreateVocabularyDto {
  meaning_vi: string;
  hiragana: string;
  romaji: string;
  kanji?: string;
  han_viet?: string;
  level: string;
  media_url?: string;
  note?: string;
  status: string;
  tags?: string[];
  relatedWordIds?: number[];
  synonymIds?: number[];
  antonymIds?: number[];
}

interface UpdateVocabularyDto {
  meaning_vi?: string;
  hiragana?: string;
  romaji?: string;
  kanji?: string;
  han_viet?: string;
  level?: string;
  media_url?: string;
  note?: string;
  status?: string;
  tags?: string[];
  relatedWordIds?: number[];
  synonymIds?: number[];
  antonymIds?: number[];
}

interface VocabularyFilters {
  page?: number;
  limit?: number;
  status?: string;
  level?: string;
  tag?: string;
  search?: string;
  created_by?: number;
  dateFrom?: string;
  dateTo?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface ListResponse {
  data: Vocabulary[];
  pagination: PaginationInfo;
}

interface VocabularyDetailDto extends Vocabulary {
  changeLogs: VocabularyChangeLog[];
  reports: VocabularyReport[];
}
```

---

## 8. Database Schema Reference

See [01-backend.md](./01-backend.md#11-database-schema) for:
- `vocabularies` table definition
- `vocabulary_tags` table definition
- `vocabulary_related_words` table definition
- `vocabulary_synonyms` table definition
- `vocabulary_antonyms` table definition
- `vocabulary_change_logs` table definition
- `vocabulary_reports` table definition

---
