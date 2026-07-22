# Phase 10 Plan — Dashboard Vocabulary/Kanji

**Spec:** [Phase 10](../../specs/phase-7-10-design/10-dashboard-streak.md)  
**Release goal:** dashboard/resume/progress hiển thị đúng Vocabulary và Kanji cho cả N5–N1.

## P10.1 — Daily/progress services

| ID | Task | Output | Depends on |
|---|---|---|---|
| P10-DB-01 | Index source rows theo user/date/item type/lesson | Migration nếu cần | Phase 9 |
| P10-BE-01 | Daily counts từ UserLearningItem/QuizAttempt/ReviewLog grouped type | 7-day service | P10-DB-01 |
| P10-BE-02 | Unique progress theo item type/lesson/level | Progress service | P10-BE-01 |
| P10-BE-03 | Pure streak calculator | Streak service | P10-BE-01 |
| P10-TEST-01 | Duplicate cross-lesson, type totals, threshold/timezone/undo tests | Test suite | P10-BE-03 |

Gate: Vocabulary/Kanji totals cộng lại đúng overall; reference/cross-lesson item không bị đếm lặp.

## P10.2 — Dashboard API

| ID | Task | Output | Depends on |
|---|---|---|---|
| P10-BE-04 | Resume selector giữ lesson/itemType | Resume action | P10.1 |
| P10-BE-05 | Next lesson/group action theo activity gần nhất | Next action | P10-BE-02 |
| P10-BE-06 | Dashboard one-now snapshot + five-level/two-type summary | GET dashboard | P10-BE-04–05 |
| P10-BE-07 | Progress series + level/lesson/type filters | GET progress | P10-BE-01–02 |
| P10-BE-08 | Update learning-item goal 5/10/15/20 | PUT preference | Prerequisite |
| P10-TEST-02 | Clean learner, empty tab/level, priority, no-N+1/p95 | API suite | P10-BE-08 |

Gate: API luôn trả N5→N1 và zero-filled Vocabulary/Kanji metrics; p95 dưới 500 ms trên staging fixture.

## P10.3 — Dashboard UI và final E2E

| ID | Task | Output | Depends on |
|---|---|---|---|
| P10-FE-01 | Store/service/types/invalidation | Client data | P10.2 |
| P10-FE-02 | Resume/due/next action/goal cards có item type | Primary actions | P10-FE-01 |
| P10-FE-03 | Streak + five-level cards tách Vocabulary/Kanji | Summary | P10-FE-01 |
| P10-FE-04 | Progress filters và lesson breakdown | `/learn/progress` | P10-FE-03 |
| P10-FE-05 | Goal/new-day refresh | Preferences | P10-FE-02 |
| P10-TEST-03 | Full E2E Vocabulary và full E2E Kanji | Final suite | P10-FE-05 |
| P10-OPS-01 | Staging import/smoke/rollback/query monitoring | Checklist | P10-TEST-03 |

## Exit criteria

- Phase 10 acceptance criteria pass.
- Deep links luôn về đúng lesson/tab/type.
- Dashboard/progress zero-fill đủ 5 levels × 2 types.
- Chỉ data thật; import/migration rollback được thử; admin flow cũ hoạt động.
