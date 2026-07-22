# Phase 7 — Lesson hub và học bằng Flashcard

**Mục tiêu:** learner chọn level/bài, chuyển giữa hai tab Từ vựng/Hán tự và học nội dung mới bằng Flashcard.

## 1. Screens

| Route | Screen | Chức năng |
|---|---|---|
| `/learn/levels` | Level selector | Luôn có N5→N1 và progress |
| `/learn/levels/:level` | Lesson list | Bài theo Minna release/position |
| `/learn/lessons/:lessonId?tab=vocabulary` | Lesson hub | Tab Từ vựng/Hán tự, counts, progress, actions |
| `/learn/vocabularies/:slug` | Vocabulary detail | Cách đọc, nghĩa, examples, lesson origins |
| `/learn/kanji/:character` | Kanji detail | Âm On/Kun, nghĩa, example words, origins |
| `/learn/flashcards/:sessionId` | Flashcard player | Học mới theo item type và lesson |

## 2. Lesson hub

- Header: `N5 · Minna no Nihongo · Bài 1`, edition và total progress.
- Hai tab cố định:
  - `Từ vựng (learned/total)`.
  - `Hán tự (learned/total)`.
- URL lưu tab để refresh/deep-link đúng nhóm.
- Mỗi tab có danh sách theo group position, filter chưa học/đã học/favorite và hai CTA:
  - `Học bằng Flashcard`.
  - `Học bằng Quiz` (Phase 8; có thể bắt đầu ngay cả khi item chưa học bằng Flashcard).
- Nếu tab không có published item: empty state riêng, tab còn lại vẫn dùng được.
- Không linear lock; learner mở bất kỳ bài published nào.

## 3. Flashcard nội dung mới

Start request chọn `itemType=vocabulary|kanji`, lessonId và mặc định tối đa 10 item introduced chưa học.

### Vocabulary card

- Front: kanji/kana của từ.
- Back: hiragana, romaji optional, meaningVi, example optional.

### Kanji card

- Front: một character lớn.
- Back: meaningVi, onYomi, kunYomi và tối đa 3 example vocabulary published.
- Không dạy viết nét trong MVP.

### Shared behavior

- CTA `Hiện đáp án` rồi `Tiếp tục`.
- Reveal lưu `firstSeenAt` idempotent; progress `x/n`.
- Session thuộc đúng một lesson và một itemType; không trộn Vocabulary/Kanji.
- Mỗi user chỉ có một active flashcard session. Chuyển bài/nhóm yêu cầu complete hoặc xác nhận abandon.
- Refresh resume đúng card.
- Summary: learned count, `Làm Quiz`, `Học tiếp` nếu còn unseen và `Về bài`.

## 4. Detail screens

- Vocabulary detail có furigana/romaji toggle, favorite và lesson origins.
- Kanji detail có character, On/Kun, nghĩa, example words, favorite và origins.
- Favorite lưu trên `UserLearningItem`; không tạo hai favorite stores.
- Một item xuất hiện nhiều bài vẫn chỉ có một learned/favorite state.

## 5. API

| Method | Endpoint | Mục đích |
|---|---|---|
| GET | `/api/v1/learner/levels` | 5 levels + vocabulary/kanji progress |
| GET | `/api/v1/learner/levels/:level/lessons` | Lessons + progress từng nhóm |
| GET | `/api/v1/learner/lessons/:id` | Lesson hub hai nhóm |
| GET | `/api/v1/learner/vocabularies/:slug` | Vocabulary detail |
| GET | `/api/v1/learner/kanji/:character` | Kanji detail |
| PUT | `/api/v1/learner/learning-items/:id/favorite` | Favorite idempotent |
| POST | `/api/v1/learner/lessons/:id/flashcard-sessions` | Start/resume; body `itemType` |
| GET | `/api/v1/learner/flashcard-sessions/:id` | Session/current card |
| PUT | `/api/v1/learner/flashcard-sessions/:id/items/:itemId` | Reveal idempotent |
| POST | `/api/v1/learner/flashcard-sessions/:id/complete` | Complete + next actions |
| POST | `/api/v1/learner/flashcard-sessions/:id/abandon` | Explicit abandon |

## 6. Data requirements

Ngoài shared models trong index:

| Model | Fields chính |
|---|---|
| `FlashcardSession` | userId, lessonId, itemType, status, currentIndex, timestamps |
| `FlashcardSessionItem` | sessionId, learningItemId, position, revealedAt; unique session-item/position |
| `KanjiVocabularyExample` | kanjiItemId, vocabularyItemId, position; unique pair/position |

Import validation:

- Kanji `character` đúng một Unicode Han character cho MVP.
- Ít nhất một trong onYomi/kunYomi có giá trị; meaningVi bắt buộc.
- Lesson introduced item phải cùng JLPT level với lesson.
- Example link phải nối Kanji → Vocabulary published và không self/duplicate.

## 7. Progress

- Item learned khi có `UserLearningItem.firstSeenAt`.
- Group progress: learned introduced items / published introduced items của type trong lesson.
- Lesson progress hiển thị hai nhóm riêng; total có thể tính `(learned vocabulary + learned kanji)/(total vocabulary + total kanji)`.
- Level progress luôn trả riêng Vocabulary và Kanji; item reference không tính mẫu số.

## 8. Acceptance criteria

1. Level list luôn đúng N5→N1; lesson hub luôn có hai tab.
2. Flashcard Vocabulary và Kanji render đúng front/back khác nhau.
3. Session không trộn item type hoặc item ngoài lesson.
4. Refresh/double reveal/complete không mất hoặc duplicate progress.
5. Một item nhiều bài có một UserLearningItem/favorite.
6. Draft/deleted/subtype sai và session user khác bị chặn.
7. E2E riêng cho Vocabulary Flashcard và Kanji Flashcard.
