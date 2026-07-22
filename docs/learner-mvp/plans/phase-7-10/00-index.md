# Vocabulary & Kanji Learning MVP — Implementation Plan

**Phiên bản:** 2.2  
**Spec:** [MVP specification](../../specs/phase-7-10-design/00-index.md)

## 1. Release sequence

```text
P7 Level/Bài → Vocabulary hoặc Kanji → Flashcard
                              ↓
P8 Quiz theo đúng item type
                              ↓
P9 Flashcard SRS chung, filter theo type
                              ↓
P10 Dashboard/progress riêng hai nhóm
```

| Phase | Outcome | Plan |
|---:|---|---|
| 7 | Hai lesson tabs và Flashcard cho Vocabulary/Kanji | [Plan 7](./07-learning-experience-plan.md) |
| 8 | Quiz riêng cho Vocabulary/Kanji | [Plan 8](./08-quiz-engine-plan.md) |
| 9 | SRS chung, filter type/level/lesson | [Plan 9](./09-spaced-repetition-plan.md) |
| 10 | Next action và progress hai nhóm N5–N1 | [Plan 10](./10-dashboard-streak-plan.md) |

## 2. Prerequisite

| ID | Task | Output |
|---|---|---|
| P7-DB-00 | Chuẩn hóa role admin/editor/learner | Role behavior nhất quán |
| P7-DB-01 | Thêm User.timezone và dailyLearningItemGoal | Preferences |
| P7-BE-00 | Chuẩn hóa API error `{message, code, details?}` | Shared errors |
| P7-FE-00 | Learner mặc định `/learn`; admin giữ `/dashboard` | Role routing |
| P7-DATA-00 | Chốt Minna edition và quyền dùng dataset Vocabulary/Kanji | Provenance rõ ràng |

## 3. Architecture decisions

- Dùng `LearningItem` base identity với hai subtype `Vocabulary` và `Kanji`.
- User progress, Flashcard session, Quiz và SRS tham chiếu LearningItem.
- Subtype detail/renderer/scorer tách riêng; không dùng một JSON blob chung cho mọi content.
- CurriculumLesson và LessonLearningItem thay cho Lesson course platform cũ.
- Một lesson có hai ordered groups; introduced/reference được lưu trên entry.
- JLPT allowlist cố định N5–N1; curriculum/edition/lesson là chiều riêng.
- Phase 7–10 chỉ enable hai item types. Thêm Grammar sau này cần migration/subtype mới và review riêng, không chỉ gửi một string mới từ client.

## 4. Scope guard

- Chỉ Vocabulary và Kanji; chưa có grammar/hội thoại.
- Kanji gồm character, On/Kun, nghĩa và example vocabulary; không có stroke/handwriting.
- Quiz chỉ 4 dạng đã chốt trong Phase 8.
- CMS/import UI, event bus, heartbeat và leaderboard ngoài MVP.

## 5. Working rules

1. Migration có DB integration test; subtype integrity được test.
2. Import idempotent theo release/lesson/item stable key và không đảo group position.
3. API verify item type từ DB, không tin `itemType` do client gửi khi truy cập item.
4. Learner DTO explicit select; chỉ published content.
5. Write retry có unique/idempotency protection.
6. Mỗi phase là vertical slice DB → API → UI → E2E cho cả hai item types.

## 6. Program Definition of Done

- E2E Vocabulary và E2E Kanji đều đi qua Flashcard → Quiz → SRS → Dashboard.
- Level list luôn đúng N5→N1; lesson hub luôn có hai tabs.
- Item xuất hiện nhiều bài chỉ có một user progress/review schedule.
- Type không bị trộn trong session/quiz/rendering.
- Import rerun, isolation, migration, build và tests pass.
