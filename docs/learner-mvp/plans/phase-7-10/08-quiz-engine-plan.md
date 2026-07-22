# Phase 8 Plan — Quiz Vocabulary và Kanji

**Spec:** [Phase 8](../../specs/phase-7-10-design/08-quiz-engine.md)  
**Release goal:** mỗi lesson tab có quiz riêng, chấm backend và quay lại đúng bài/nhóm.

## P8.1 — Attempt model và typed quiz engine

| ID | Task | Output | Depends on |
|---|---|---|---|
| P8-DB-01 | Tạo LearningQuizAttempt/Answer có lessonId/itemType/date snapshot | Migration | Phase 7 |
| P8-BE-01 | Vocabulary reading normalizer/scorer | Pure scorer | P8-DB-01 |
| P8-BE-02 | Meaning choice generator dùng Vocabulary/Kanji subtype | Typed generator | P8-BE-01 |
| P8-BE-03 | Kanji reading choice generator On/Kun/accepted readings | Typed generator | P8-BE-02 |
| P8-BE-04 | Immutable snapshot từ unseen/all lesson items hoặc source Flashcard set | Snapshot service | P8-BE-03 |
| P8-TEST-01 | Unicode, duplicate distractor, subtype và deterministic tests | Unit suite | P8-BE-04 |

Gate: đủ 4 question types; snapshot không đổi khi content update; generator không trộn subtype.

## P8.2 — Attempt lifecycle

| ID | Task | Output | Depends on |
|---|---|---|---|
| P8-BE-05 | Start/resume theo lesson+itemType | POST attempt | P8.1 |
| P8-BE-06 | Sanitized attempt detail | GET attempt | P8-BE-05 |
| P8-BE-07 | Answer upsert + firstSeen idempotent với type validation | PUT answer | P8-BE-06 |
| P8-BE-08 | Transaction submit/score/pass | POST submit | P8-BE-07 |
| P8-BE-09 | Typed result và attempt history summary | GET result | P8-BE-08 |
| P8-TEST-02 | Ownership, no-answer leak, incomplete/double submit, 69/70/100 | Integration suite | P8-BE-09 |

Gate: quiz hoạt động độc lập Flashcard, chỉ lấy introduced items đúng lesson/type; attempt chưa answer không tăng progress; refresh/retry idempotent.

## P8.3 — Quiz UI

| ID | Task | Output | Depends on |
|---|---|---|---|
| P8-FE-01 | Quiz route/service/store/types | Client foundation | P8.2 |
| P8-FE-02 | Vocabulary meaning/reading renderers | Vocabulary Quiz | P8-FE-01 |
| P8-FE-03 | Kanji meaning/reading renderers | Kanji Quiz | P8-FE-01 |
| P8-FE-04 | Shared player save/progress/retry | Player shell | P8-FE-02–03 |
| P8-FE-05 | Typed result, wrong items, retry và back-to-tab | Result screen | P8-FE-04 |
| P8-TEST-03 | FE units + E2E riêng Vocabulary Quiz/Kanji Quiz | Release suite | P8-FE-05 |

## Exit criteria

- Phase 8 acceptance criteria pass cho 4 question types.
- DTO/client không thấy answer key trước submit.
- Result giữ lesson/itemType và wrong learningItem IDs cho SRS.
- Subtype mismatch bị chặn bằng stable error code.
