# 02 — Frontend: Vocabulary FlashCard

> Related: [00-index.md](./00-index.md) | [01-backend.md](./01-backend.md) | [03-behavior.md](./03-behavior.md) | [04-quality.md](./04-quality.md)

---

## 1. File Structure

```
client/src/
├── types/
│   └── learn.types.ts                     ← Entity, DTO, Filter, Session types
├── services/
│   └── learn.service.ts                   ← API calls (extends BaseApiClient)
├── stores/
│   └── learn.store.ts                     ← Pinia store (session state, progress cache)
└── pages/learn/
    ├── learn.routes.ts                    ← Route definitions (user guard)
    ├── LearnLevelPage.vue                 ← Trang chọn cấp độ JLPT
    ├── LearnVocabListPage.vue             ← Trang danh sách từ theo level
    ├── LearnSessionPage.vue               ← Trang phiên học FlashCard
    └── components/
        ├── LevelCard.vue                  ← Card thống kê 1 cấp độ
        ├── LearnVocabTable.vue            ← Bảng danh sách từ (DataTable)
        ├── LearnFilters.vue               ← Filter bar (status, search)
        ├── FlashCard.vue                  ← Thẻ flip đơn lẻ (front/back)
        ├── CardConfigPanel.vue            ← Panel cấu hình field ẩn/hiện + hướng lật
        ├── SessionProgress.vue            ← Thanh tiến độ phiên học
        └── SessionSummary.vue             ← Màn hình tóm tắt kết thúc phiên
```

---

## 2. Layout & Wireframes

### 2.1 Application Layout

Tất cả trang học (`/learn/*`) sử dụng `DefaultLayout` hiện có (cùng sidebar + topbar với các trang User khác). Breadcrumb: `Học từ vựng > [Tên trang]`.

### 2.2 Component Tree

```
LearnLevelPage
  ├── PageTitle "Chọn cấp độ để học"
  └── Grid (5 cột — N5 đến N1)
        └── LevelCard (×5)
              └── ProgressBar (PrimeVue)

LearnVocabListPage
  ├── PageTitle "Từ vựng [Level]"
  ├── LearnFilters
  │     ├── SelectButton [Tất cả | Mới | Đang học | Đã biết]
  │     └── InputText [🔍 Tìm kiếm...]
  ├── LearnVocabTable
  │     ├── DataTable (PrimeVue) — checkbox select
  │     ├── Column: Kanji, Hiragana, Romaji, Nghĩa TV, Trạng thái (Badge), Yêu thích
  │     └── Pagination
  └── ActionBar (sticky bottom)
        ├── Button [Học tất cả (N từ)]
        ├── Button [Học chưa thuộc (N từ)]
        └── Button [Học đã chọn (N từ)] — disabled nếu không có lựa chọn

LearnSessionPage
  ├── SessionProgress              ← thanh tiến độ: N/Total
  ├── CardConfigPanel              ← toggle ẩn/hiện fields, hướng lật
  ├── FlashCard                    ← thẻ lật chính
  │     ├── [Mặt trước] cấu hình hiển thị field
  │     └── [Mặt sau]   cấu hình hiển thị field còn lại
  ├── ActionButtons
  │     ├── Button [✓ Đã biết]
  │     └── Button [✗ Chưa biết]
  └── SessionSummary (khi xong)
        ├── Thống kê: đã biết / chưa biết
        └── Button [Học lại] [Về danh sách]
```

### 2.3 Wireframe — LearnLevelPage

```
┌─────────────────────────────────────────────────────┐
│  Học từ vựng — Chọn cấp độ                          │
├─────────────┬─────────────┬───────────────────────────┤
│     N5      │     N4      │       N3     ...           │
│  120 từ     │  200 từ     │    350 từ                  │
│ ■■■□□ 37%   │ ■□□□□  5%  │   □□□□□  0%               │
│  [Bắt đầu] │  [Bắt đầu] │   [Bắt đầu]               │
└─────────────┴─────────────┴───────────────────────────┘
```

### 2.4 Wireframe — LearnVocabListPage

```
┌─────────────────────────────────────────────────────┐
│  Từ vựng N5 (120 từ)                                │
├─────────────────────────────────────────────────────┤
│ [Tất cả][Mới][Đang học][Đã biết]  [🔍 Tìm...]      │
├──┬────────┬──────────┬────────┬──────────┬──────────┤
│☐ │ Kanji  │ Hiragana │ Romaji │ Nghĩa TV │ Trạng thái│
├──┼────────┼──────────┼────────┼──────────┼──────────┤
│☐ │ 食べる  │ たべる    │ taberu │ ăn       │ ■ Đã biết │
│☐ │ 飲む    │ のむ      │ nomu   │ uống     │ ○ Mới     │
│☐ │ 行く    │ いく      │ iku    │ đi       │ ◎ Đang học│
├─────────────────────────────────────────────────────┤
│ Pagination                                          │
├─────────────────────────────────────────────────────┤
│ [Học tất cả (120)]  [Học chưa thuộc (55)]  [Học đã chọn (0)] │
└─────────────────────────────────────────────────────┘
```

### 2.5 Wireframe — LearnSessionPage (đang học)

```
┌─────────────────────────────────────────────────────┐
│  Phiên học N5          [Cấu hình thẻ ⚙]             │
│  Tiến độ: 3 / 20  ■■■□□□□□□□□□□□□□□□□□             │
├─────────────────────────────────────────────────────┤
│                                                     │
│              ┌───────────────────┐                  │
│              │                   │                  │
│   [Mặt trước]│    食べる           │  [★ Yêu thích]   │
│              │    たべる           │                  │
│              │                   │                  │
│              │   [ Lật thẻ ▼ ]   │                  │
│              └───────────────────┘                  │
│                                                     │
│         [✗ Chưa biết]      [✓ Đã biết]             │
└─────────────────────────────────────────────────────┘
```

### 2.6 Wireframe — SessionSummary

```
┌─────────────────────────────────────────────────────┐
│  Kết thúc phiên học!                                │
│                                                     │
│   ✓ Đã biết:    12 từ                               │
│   ✗ Chưa biết:   8 từ                               │
│   ★ Yêu thích:   3 từ mới đánh dấu                  │
│                                                     │
│         [Học lại]        [Về danh sách]             │
└─────────────────────────────────────────────────────┘
```

### 2.7 Wireframe — CardConfigPanel (slide-in panel)

```
┌──────────────────────────────┐
│  Cấu hình FlashCard      [✕] │
├──────────────────────────────┤
│  Hướng lật:                  │
│  ○ Kanji → Nghĩa             │
│  ● Nghĩa → Kanji             │
│                              │
│  Mặt trước hiển thị:         │
│  ☑ Kanji    ☑ Hiragana       │
│  ☐ Romaji   ☐ Nghĩa TV       │
│                              │
│  Mặt sau hiển thị:           │
│  ☑ Nghĩa TV  ☑ Romaji        │
│  ☑ Kanji     ☑ Hiragana      │
│                              │
│         [Áp dụng]            │
└──────────────────────────────┘
```

---

## 3. Screen Item Specifications

### 3.1 LearnLevelPage

| # | ItemName | Control | Type | Required | Validation | Placeholder | DisplayText | Description | Notes |
|---|----------|---------|------|----------|-----------|-------------|-------------|-------------|-------|
| 1 | pageTitle | Label | — | — | — | — | `learn.levelPage.title` | Tiêu đề trang | — |
| **—** | **LevelCard** | | | | | | | | **Component** |
| 2 | levelLabel | Label | string | — | — | — | `N5` / `N4` / ... | Hiển thị tên level | — |
| 3 | totalCount | Label | number | — | — | — | `learn.level.totalWords` | Tổng số từ | — |
| 4 | knownCount | Label | number | — | — | — | `learn.level.knownWords` | Số từ đã biết | — |
| 5 | progressBar | ProgressBar | number | — | — | — | — | % tiến độ known/total | PrimeVue ProgressBar |
| 6 | startButton | Button | — | — | — | — | `learn.level.start` | Navigate tới `/learn/:level/list` | onClick → navigate |

### 3.2 LearnVocabListPage

| # | ItemName | Control | Type | Required | Validation | Placeholder | DisplayText | Description | Notes |
|---|----------|---------|------|----------|-----------|-------------|-------------|-------------|-------|
| 1 | pageTitle | Label | — | — | — | — | `learn.listPage.title` | Tiêu đề trang kèm level | — |
| **—** | **LearnFilters** | | | | | | | | **Component** |
| 2 | statusFilter | SelectButton | string | No | enum: all/new/learning/known | — | `learn.filter.*` | Filter theo trạng thái học | onChange → reload |
| 3 | searchInput | InputText | string | No | max 100 ký tự | `learn.filter.searchPlaceholder` | — | Tìm kiếm từ | debounce 300ms |
| **—** | **LearnVocabTable** | | | | | | | | **Component** |
| 4 | selectCheckbox | Checkbox | boolean | — | — | — | — | Chọn từ để học | Bulk select |
| 5 | kanjiCol | Label | string | — | — | — | `learn.table.kanji` | Hiển thị Kanji | — |
| 6 | hiraganaCol | Label | string | — | — | — | `learn.table.hiragana` | Hiển thị Hiragana | — |
| 7 | romajiCol | Label | string | — | — | — | `learn.table.romaji` | Hiển thị Romaji | — |
| 8 | meaningCol | Label | string | — | — | — | `learn.table.meaning` | Nghĩa tiếng Việt | — |
| 9 | statusBadge | Badge/Tag | string | — | — | — | — | Badge: Mới / Đang học / Đã biết | Màu khác nhau theo status |
| 10 | favoriteIcon | Button | — | — | — | — | — | Icon ★ toggle favorite | onClick → toggleFavorite |
| 11 | pagination | Paginator | — | — | — | — | — | Phân trang kết quả | PrimeVue Paginator |
| 12 | studyAllBtn | Button | — | — | — | — | `learn.list.studyAll` | Học tất cả N từ | onClick → startSession('all') |
| 13 | studyUnknownBtn | Button | — | — | — | — | `learn.list.studyUnknown` | Học chưa thuộc N từ | onClick → startSession('unknown') |
| 14 | studySelectedBtn | Button | — | — | — | — | `learn.list.studySelected` | Học đã chọn N từ | disabled nếu không chọn gì |

### 3.3 LearnSessionPage

| # | ItemName | Control | Type | Required | Validation | Placeholder | DisplayText | Description | Notes |
|---|----------|---------|------|----------|-----------|-------------|-------------|-------------|-------|
| 1 | sessionTitle | Label | — | — | — | — | `learn.session.title` | Tiêu đề phiên học | — |
| 2 | configButton | Button | — | — | — | — | `learn.session.config` | Mở CardConfigPanel | onClick → openConfig |
| **—** | **SessionProgress** | | | | | | | | **Component** |
| 3 | progressLabel | Label | string | — | — | — | — | Hiển thị `3 / 20` | — |
| 4 | progressBar | ProgressBar | number | — | — | — | — | % hoàn thành phiên | PrimeVue |
| **—** | **FlashCard** | | | | | | | | **Component** |
| 5 | cardFront | Panel | — | — | — | — | — | Mặt trước thẻ | Hiển thị fields theo cấu hình |
| 6 | cardBack | Panel | — | — | — | — | — | Mặt sau thẻ | Hiển thị sau khi lật |
| 7 | flipButton | Button | — | — | — | — | `learn.card.flip` | Lật thẻ | onClick → flipCard |
| 8 | favoriteBtn | Button | — | — | — | — | — | Icon ★ trong thẻ | onClick → toggleFavorite |
| 9 | knownBtn | Button | — | — | — | — | `learn.card.known` | Đánh dấu Đã biết | onClick → markKnown; next card |
| 10 | unknownBtn | Button | — | — | — | — | `learn.card.unknown` | Đánh dấu Chưa biết | onClick → markUnknown; next card |
| **—** | **CardConfigPanel** | | | | | | | | **Component** |
| 11 | flipDirectionRadio | RadioButton | string | Yes | kanji_to_meaning / meaning_to_kanji | — | `learn.config.direction.*` | Chọn hướng lật thẻ | — |
| 12 | frontFieldsCheck | Checkbox | boolean[] | No | — | — | `learn.config.fields.*` | Chọn fields hiện mặt trước | kanji, hiragana, romaji, meaning_vi |
| 13 | backFieldsCheck | Checkbox | boolean[] | No | — | — | `learn.config.fields.*` | Chọn fields hiện mặt sau | kanji, hiragana, romaji, meaning_vi |
| 14 | applyConfigBtn | Button | — | — | — | — | `learn.config.apply` | Áp dụng cấu hình | đóng panel |
| **—** | **SessionSummary** | | | | | | | | **Component** |
| 15 | knownStat | Label | number | — | — | — | `learn.summary.known` | Số từ đã biết trong phiên | — |
| 16 | unknownStat | Label | number | — | — | — | `learn.summary.unknown` | Số từ chưa biết trong phiên | — |
| 17 | favoriteStat | Label | number | — | — | — | `learn.summary.favorite` | Số từ mới đánh dấu favorite | — |
| 18 | retryBtn | Button | — | — | — | — | `learn.summary.retry` | Học lại cùng bộ từ | onClick → restartSession |
| 19 | backToListBtn | Button | — | — | — | — | `learn.summary.backToList` | Về danh sách | onClick → navigate to list |

---

## 4. Component Details

### 4.1 LevelCard

| Props | Type | Default | Mô tả |
|-------|------|---------|-------|
| `level` | `VocabularyLevel` | required | Cấp độ JLPT |
| `stats` | `LevelStatsDto` | required | Dữ liệu thống kê |

| Emits | Payload | Mô tả |
|-------|---------|-------|
| `start` | `level: VocabularyLevel` | Nhấn nút Bắt đầu |

### 4.2 FlashCard

| Props | Type | Default | Mô tả |
|-------|------|---------|-------|
| `vocab` | `LearnVocabularyItem` | required | Từ vựng đang hiển thị |
| `config` | `CardConfig` | required | Cấu hình field ẩn/hiện |
| `isFlipped` | `boolean` | `false` | Trạng thái lật |

| Emits | Payload | Mô tả |
|-------|---------|-------|
| `flip` | — | Lật thẻ |
| `toggleFavorite` | `vocabularyId: number` | Toggle favorite |

### 4.3 CardConfigPanel

| Props | Type | Default | Mô tả |
|-------|------|---------|-------|
| `visible` | `boolean` | required | Hiển thị panel |
| `modelValue` | `CardConfig` | required | Cấu hình hiện tại |

| Emits | Payload | Mô tả |
|-------|---------|-------|
| `update:modelValue` | `CardConfig` | Khi cấu hình thay đổi |
| `update:visible` | `boolean` | Đóng panel |

### 4.4 SessionProgress

| Props | Type | Default | Mô tả |
|-------|------|---------|-------|
| `current` | `number` | required | Thẻ hiện tại (1-based) |
| `total` | `number` | required | Tổng số thẻ trong phiên |

### 4.5 SessionSummary

| Props | Type | Default | Mô tả |
|-------|------|---------|-------|
| `results` | `SessionResults` | required | Kết quả phiên học |

| Emits | Payload | Mô tả |
|-------|---------|-------|
| `retry` | — | Học lại |
| `backToList` | — | Về danh sách |

---

## 5. Composable

### `useLearnSession` (`pages/learn/composables/useLearnSession.ts`)

**Mục đích:** Quản lý vòng đời một phiên học FlashCard.

```typescript
interface UseLearnSessionReturn {
  // State
  cards: Ref<LearnVocabularyItem[]>;        // Danh sách thẻ trong phiên
  currentIndex: Ref<number>;               // Vị trí thẻ hiện tại
  isFlipped: Ref<boolean>;                 // Trạng thái lật thẻ hiện tại
  cardConfig: Ref<CardConfig>;             // Cấu hình ẩn/hiện field
  sessionResults: Ref<SessionResults>;     // Kết quả phiên (known/unknown count)
  isSessionComplete: Ref<boolean>;         // Phiên đã kết thúc?

  // Computed
  currentCard: ComputedRef<LearnVocabularyItem | null>;
  progress: ComputedRef<number>;           // % hoàn thành (0–100)

  // Actions
  flipCard(): void;
  markKnown(): Promise<void>;             // Đánh dấu biết → next card
  markUnknown(): Promise<void>;           // Đánh dấu chưa biết → next card
  toggleFavorite(vocabId: number): Promise<void>;
  updateCardConfig(config: CardConfig): void;
  restartSession(): void;
  finishSession(): Promise<void>;         // Gọi batch update API
}
```

---

## 6. Store

### `learn.store.ts` (Pinia)

```typescript
interface LearnState {
  // Level stats cache
  levelStats: LevelStatsDto[];
  levelStatsLoading: boolean;

  // Vocab list state
  vocabList: LearnVocabularyItem[];
  vocabListLoading: boolean;
  vocabListFilter: VocabListFilter;
  vocabListPagination: PaginationMeta;

  // Session state
  sessionCards: LearnVocabularyItem[];     // Các thẻ trong phiên hiện tại
  sessionLevel: VocabularyLevel | null;
}

// Actions
fetchLevelStats(): Promise<void>
fetchVocabList(level, filter): Promise<void>
startSession(cards: LearnVocabularyItem[]): void
clearSession(): void
updateLocalProgress(vocabId, status): void
toggleLocalFavorite(vocabId): void
```

---

## 7. TypeScript Models (`client/src/types/learn.types.ts`)

```typescript
import type { VocabularyLevel } from './vocabularies.types';

export type ProgressStatus = 'new' | 'learning' | 'known';
export type FlipDirection = 'kanji_to_meaning' | 'meaning_to_kanji';

export interface UserProgressDto {
  status: ProgressStatus;
  review_count: number;
  last_reviewed: string | null;
  is_favorite: boolean;
}

export interface LearnVocabularyItem {
  id: number;
  kanji: string | null;
  hiragana: string | null;
  romaji: string | null;
  meaning_vi: string;
  level: VocabularyLevel;
  tags: string[];
  media_url: string | null;
  note: string | null;
  progress: UserProgressDto | null;
}

export interface LevelStatsDto {
  level: VocabularyLevel;
  total: number;
  known: number;
  learning: number;
  new_count: number;
}

export interface CardConfig {
  flipDirection: FlipDirection;
  frontFields: {
    kanji: boolean;
    hiragana: boolean;
    romaji: boolean;
    meaning_vi: boolean;
  };
  backFields: {
    kanji: boolean;
    hiragana: boolean;
    romaji: boolean;
    meaning_vi: boolean;
  };
}

export interface SessionResults {
  knownCount: number;
  unknownCount: number;
  newFavoriteCount: number;
}

export interface VocabListFilter {
  progressStatus: 'all' | ProgressStatus;
  search: string;
  page: number;
  limit: number;
}
```

---

## 8. Database Schema Reference

Xem chi tiết: [01-backend.md § 1. Data Models](./01-backend.md)

Bảng liên quan: `vocabularies` (read), `user_vocabulary_progress` (read/write).
