# Phase 7 Plan — Lesson hub và Flashcard Vocabulary/Kanji

**Spec:** [Phase 7](../../specs/phase-7-10-design/07-learning-experience.md)  
**Release goal:** learner mở Bài 1 và hoàn thành một Flashcard session cho từng nhóm Từ vựng/Hán tự.

## P7.1 — Learning item/curriculum schema

| ID | Task | Output | Depends on |
|---|---|---|---|
| P7-DB-02 | Tạo LearningItem type/level/status và migrate Vocabulary hiện hữu | Migration/backfill | Prerequisite |
| P7-DB-03 | Tạo Kanji subtype và KanjiVocabularyExample | Migration + integrity rules | P7-DB-02 |
| P7-DB-04 | Tạo Curriculum/Release/Lesson/LessonLearningItem | Migration + grouped positions | P7-DB-03 |
| P7-DB-05 | Tạo UserLearningItem và FlashcardSession/Item | Migration + ownership/index | P7-DB-04 |
| P7-BE-11 | Cập nhật admin Vocabulary write path để tạo/cập nhật LearningItem cùng transaction | Backward-compatible admin service | P7-DB-02 |
| P7-DATA-01 | Định nghĩa versioned import contract cho hai subtypes | Input schema | P7-DATA-00 |
| P7-DATA-02 | Validate subtype, level, edition, introduced/reference, positions/examples | Fail-fast validator | P7-DATA-01 |
| P7-DATA-03 | Import 25 N5 lesson metadata; ≥3 bài có ≥10 Vocabulary/≥5 Kanji | Idempotent fixture | P7-DATA-02 |
| P7-TEST-01 | Migration/backfill/import rerun/rollback/subtype tests | DB evidence | P7-DATA-03 |

Gate: mỗi LearningItem có đúng subtype; import rerun giữ count/order; không trộn edition/type; admin Vocabulary flow hiện hữu vẫn pass.

## P7.2 — Level, lessons và two-tab hub

| ID | Task | Output | Depends on |
|---|---|---|---|
| P7-BE-01 | Five-level summary với progress tách type | GET levels | P7.1 |
| P7-BE-02 | Lesson list có counts/progress hai nhóm | GET lessons | P7-BE-01 |
| P7-BE-03 | Lesson hub DTO hai ordered groups | GET lesson | P7-BE-02 |
| P7-FE-01 | N5–N1 selector và lesson list | Discovery UI | P7-BE-01–02 |
| P7-FE-02 | Lesson hub tabs, URL state, filters và CTAs | Lesson UI | P7-BE-03 |
| P7-TEST-02 | Fixed levels, empty tab, group order, progress/no-N+1 tests | BE + FE suite | P7-FE-02 |

Gate: level/bài đúng order; hai tabs độc lập; một tab rỗng không làm hỏng tab còn lại.

## P7.3 — Details và favorite

| ID | Task | Output | Depends on |
|---|---|---|---|
| P7-BE-04 | Vocabulary detail + origins | GET vocabulary | P7.1 |
| P7-BE-05 | Kanji detail + examples/origins | GET kanji | P7.1 |
| P7-BE-06 | LearningItem favorite idempotent | PUT favorite | P7-DB-05 |
| P7-FE-03 | Vocabulary detail renderer | Page | P7-BE-04,06 |
| P7-FE-04 | Kanji detail renderer | Page | P7-BE-05,06 |
| P7-TEST-03 | Subtype mismatch, origins/examples, ownership tests | BE + FE suite | P7-FE-04 |

Gate: detail URL/DTO không thể render sai subtype; favorite dùng một user-item record.

## P7.4 — Flashcard sessions

| ID | Task | Output | Depends on |
|---|---|---|---|
| P7-BE-07 | Select unseen introduced items theo lesson/type/position | Selection service | P7-BE-03 |
| P7-BE-08 | Start/resume/abandon one active session | Session API | P7-BE-07 |
| P7-BE-09 | Reveal idempotent + first-seen activity date | PUT item | P7-BE-08 |
| P7-BE-10 | Complete + quiz/continue/back actions | POST complete | P7-BE-09 |
| P7-FE-05 | Shared player shell + Vocabulary card renderer | UI | P7-BE-09 |
| P7-FE-06 | Kanji card renderer + example words | UI | P7-FE-05 |
| P7-FE-07 | Resume/conflict/abandon/summary UX | Reliable flow | P7-BE-10 |
| P7-TEST-04 | Concurrent/idempotency + Vocabulary/Kanji E2E | Release suite | P7-FE-07 |

## Exit criteria

- Phase 7 acceptance criteria pass cho cả hai groups.
- Session/type/subtype integrity được test ở backend.
- Progress item/group/lesson/level đúng, reference không tính mẫu số.
- Không high/critical issue trong level→lesson→tab→Flashcard journey.
