# Phase 9 Plan — Flashcard SRS Vocabulary/Kanji

**Spec:** [Phase 9](../../specs/phase-7-10-design/09-spaced-repetition.md)  
**Release goal:** một SRS queue cho cả hai groups, render đúng card và lọc được type/level/lesson.

## P9.1 — Scheduling foundation

| ID | Task | Output | Depends on |
|---|---|---|---|
| P9-DB-01 | Tạo LearningReview/Session/SessionItem/Log | Migration + unique/index/date/type joins | Phase 8 |
| P9-DB-02 | Backfill UserLearningItem và wrong QuizAnswer | Idempotent data command | P9-DB-01 |
| P9-TEST-01 | Scheduler matrix tests trước implementation | Failing tests | P9-DB-01 |
| P9-BE-01 | Pure scheduler với injected clock | Deterministic module | P9-TEST-01 |
| P9-TEST-02 | Clamp/invariant/fake-clock tests | Scheduler suite | P9-BE-01 |

Gate: backfill rerun an toàn; một user-item có một schedule; scheduler độc lập subtype.

## P9.2 — Activation và filtered queue

| ID | Task | Output | Depends on |
|---|---|---|---|
| P9-BE-02 | Upsert LearningReview khi reveal item mới | Phase 7 integration | P9.1 |
| P9-BE-03 | Wrong quiz item về due now, giữ history | Phase 8 integration | P9-BE-02 |
| P9-BE-04 | Summary grouped by Vocabulary/Kanji | GET summary | P9-BE-03 |
| P9-BE-05 | Queue due→learning→new; type/level/lesson filters | Selection service | P9-BE-04 |
| P9-TEST-03 | Duplicate, ordering/limit/filter/subtype tests | Integration suite | P9-BE-05 |

Gate: filter không làm sai ordering; global/type counts nhất quán; wrong answer replay không reset schedule.

## P9.3 — Session API/UI

| ID | Task | Output | Depends on |
|---|---|---|---|
| P9-BE-06 | Start/resume với filter snapshot | Session API | P9.2 |
| P9-BE-07 | Rating transaction/idempotency/row lock | POST rating | P9-BE-01, P9-BE-06 |
| P9-BE-08 | Undo latest trong 10 giây | POST undo | P9-BE-07 |
| P9-BE-09 | LearningItem suspend/unsuspend | PUT suspension | P9-BE-06 |
| P9-FE-01 | Review home, counts và filters | `/learn/review` | P9-BE-06 |
| P9-FE-02 | Shared player + Vocabulary/Kanji renderers/origin | Review player | P9-BE-07 |
| P9-FE-03 | Resume/undo/suspend/summary | Complete UX | P9-BE-08–09 |
| P9-TEST-04 | Concurrent/retry/undo + E2E cho hai types | Release suite | P9-FE-03 |

## Exit criteria

- Phase 9 acceptance criteria pass cho Vocabulary và Kanji.
- Một scheduling algorithm, hai typed renderers, không polymorphic ID yếu.
- Refresh/retry/concurrent tab không rate hai lần.
- Queue/filter queries không N+1 qua subtype/origin joins.
