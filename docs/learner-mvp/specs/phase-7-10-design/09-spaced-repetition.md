# Phase 9 — Vocabulary/Kanji Flashcard SRS

**Mục tiêu:** learner ôn đúng Vocabulary và Kanji đến hạn bằng Flashcard Again/Hard/Good/Easy.

## 1. Review item lifecycle

- Khi Phase 9 deploy, backfill mọi `UserLearningItem` đã học thành `LearningReview` trạng thái `new`; reveal mới sẽ upsert trực tiếp.
- Backfill quiz answers sai. Với submit mới, item sai được upsert và đặt `nextReviewAt=min(current, now)` nhưng không xóa history.
- Một user-learningItem chỉ có một scheduling record.
- Learner có thể suspend/unsuspend item; favorite độc lập với review state.

## 2. Review screens

`/learn/review` hiển thị due now, new available, reviewed today và CTA `Bắt đầu ôn`. Filter: `Tất cả`, `Từ vựng`, `Hán tự`, level hoặc lesson.

`/learn/review/:sessionId`:

- Vocabulary card dùng front/back như Phase 7.
- Kanji card dùng front/back như Phase 7.
- Back luôn có origin `N5 · Bài 3`; nếu nhiều bài, ưu tiên lesson nơi item được introduced trong active release.
- Chỉ sau khi reveal mới bật `Again`, `Hard`, `Good`, `Easy` và shortcut 1–4.
- Nút hiển thị preview lịch tiếp theo.
- Session tối đa 20 thẻ; due cũ nhất trước, rồi learning, rồi new.
- Resume sau refresh; undo rating gần nhất trong 10 giây.

## 3. Scheduler MVP

Initial: `new`, interval 0, ease 2.50, nextReviewAt now.

| Rating | New/learning | Review |
|---|---|---|
| Again | +10 phút, interval 0, ease −0.20 | +10 phút, interval 0, ease −0.20 |
| Hard | +1 ngày, interval 1 | `round(interval × 1.2)` ngày, ease −0.15 |
| Good | +3 ngày, interval 3 | `round(interval × ease)` ngày |
| Easy | +7 ngày, interval 7, ease +0.15 | `round(interval × ease × 1.3)` ngày, ease +0.15 |

Ease clamp `[1.30, 3.00]`; interval `[0, 3650]`. Scheduler chạy backend với injected clock và không random trong MVP.

`mastered` là computed state khi interval ≥ 30 ngày; không làm item ngừng xuất hiện khi đến hạn.

## 4. API

| Method | Endpoint | Mục đích |
|---|---|---|
| GET | `/api/v1/learner/reviews/summary` | Due/new/reviewedToday/nextDueAt |
| POST | `/api/v1/learner/review-sessions` | Tạo/resume; optional `itemType`, `level` hoặc `lessonId` |
| GET | `/api/v1/learner/review-sessions/:id` | Session/card hiện tại |
| POST | `/api/v1/learner/review-sessions/:id/items/:vocabularyId/rating` | Rate idempotent |
| POST | `/api/v1/learner/review-sessions/:id/undo` | Undo latest rating |
| PUT | `/api/v1/learner/learning-items/:id/suspension` | Suspend/unsuspend |

Rating request có `rating` và UUID `idempotencyKey`; server dùng receipt time để schedule.

## 5. Data requirements

| Model | Fields chính |
|---|---|
| `LearningReview` | userId, learningItemId, state, intervalDays, easeFactor, repetitions, lapses, nextReviewAt, lastReviewedAt, suspendedAt; unique user-item |
| `LearningReviewSession` | userId, filter snapshot, status, startedAt, completedAt |
| `LearningReviewSessionItem` | sessionId, learningItemId, position, ratedAt |
| `LearningReviewLog` | reviewId, sessionId, rating, before/after JSON, idempotencyKey, reviewedAt, activityDate/timezone snapshot, undoneAt |

## 6. Acceptance criteria

1. Một learning item chỉ có một scheduling record/user.
2. Backfill và event mới không tạo duplicate hoặc reset history; queue ordering/session limits đúng.
3. Scheduler pass table-driven tests cho mọi rating/state và clamp.
4. Retry idempotency key không schedule hai lần.
5. Concurrent tab chỉ một rating thắng; tab còn lại refresh.
6. Undo trong 10 giây khôi phục snapshot; quá hạn bị từ chối.
7. Unpublished item không vào session mới nhưng không phá history.
8. Filter type/level/lesson đúng phạm vi và vẫn giữ queue ordering.
