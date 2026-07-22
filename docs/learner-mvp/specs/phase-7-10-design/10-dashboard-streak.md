# Phase 10 — Vocabulary/Kanji dashboard và streak

**Mục tiêu:** learner mở `/learn` và biết cần học/ôn Từ vựng hay Hán tự, đồng thời thấy tiến độ riêng từng nhóm.

## 1. Dashboard priority

1. Resume study/quiz/review session nếu đang dở, kèm level/bài.
2. Review due card — ưu tiên cao nếu due > 0.
3. `Bài tiếp theo` trong level học gần nhất.
4. Daily item goal — vocabulary/kanji learned today so với goal.
5. Streak, lịch 7 ngày và tiến độ hai nhóm trong 5 level.

Không theo dõi active minutes hoặc heartbeat trong MVP.

## 2. Daily goal và streak

- Goal mặc định 10 learning items mới/ngày; cho phép 5/10/15/20. UI tách số Vocabulary và Kanji.
- Goal là động lực hiển thị, không phải điều kiện duy nhất giữ streak.
- Một local day đạt streak nếu có ít nhất một điều kiện:
  - Học/reveal ít nhất 5 learning items mới, không phân biệt nhóm.
  - Submit một quiz có ít nhất một câu.
  - Rating ít nhất 5 review cards.
- Nếu hôm nay chưa đạt nhưng hôm qua đạt, current streak vẫn hiển thị cùng nhắc nhở duy trì hôm nay.
- Timezone IANA từ profile; default `Asia/Bangkok`. Đổi timezone chỉ áp dụng event mới.

## 3. Progress screen

`/learn/progress` hiển thị:

- 7 local dates gần nhất với new learned/reviewed counts.
- Tổng `learning`, `review`, `mastered` tách Vocabulary/Kanji.
- Progress riêng hai nhóm cho đúng 5 level N5–N1 và lesson breakdown.
- Quiz attempts và accuracy 7 ngày.
- Không có course progress, active minutes, points hoặc leaderboard.

## 4. API

| Method | Endpoint | Mục đích |
|---|---|---|
| GET | `/api/v1/learner/dashboard` | Due, goal, resume/next lesson, streak, five-level summary |
| GET | `/api/v1/learner/progress?range=7d&level=N5` | Daily series, five-level totals và optional lesson breakdown |
| PUT | `/api/v1/learner/preferences/vocabulary-goal` | Set 5/10/15/20 |

Initial dashboard dùng một aggregate endpoint và một server `now`/timezone snapshot để các card nhất quán ở midnight.

## 5. Activity source

Không cần generic event bus cho MVP. Aggregate được dựng từ các bảng nghiệp vụ:

- New items: `UserLearningItem.firstSeenDate`, grouped by LearningItem.type.
- Quiz: submitted `LearningQuizAttempt.submittedDate`, grouped by itemType.
- Reviews: non-undone `LearningReviewLog.activityDate`, joined itemType.

Các local date trên được chốt cùng timezone snapshot khi write xảy ra; recompute không quy đổi lại bằng timezone hiện tại.

MVP query trực tiếp các source đã index; chưa tạo event bus hoặc daily aggregate table. Nếu dữ liệu thực tế làm endpoint không đạt performance target, daily aggregate mới được bổ sung như một cache có thể rebuild.

## 6. Data requirements

Phase 10 không cần bảng mới mặc định. `User.timezone` và `dailyLearningItemGoal` đã được tạo ở prerequisite; các source row của Phase 7–9 giữ local date/timezone snapshot và cần index theo user/date/type.

Client không có endpoint tự tăng counter/streak. Nếu bổ sung aggregate cache sau này, cache phải rebuild được hoàn toàn từ source records.

## 7. Acceptance criteria

1. Learner sạch thấy CTA mở bài đầu tiên; Vocabulary/Kanji metrics đều bằng 0.
2. Due > 0 đặt review CTA lên ưu tiên đầu.
3. Study/quiz/review write cập nhật dashboard sau invalidate/refetch.
4. Streak đúng tại threshold, midnight và timezone boundary.
5. 7-day chart luôn đủ 7 ngày và tách hai nhóm, dùng 0 khi không có activity.
6. Dashboard không chứa placeholder hoặc dữ liệu Course/Lesson.
7. Aggregate endpoint không N+1 và p95 dưới 500 ms trên staging fixture.
8. Dashboard/progress luôn trả đủ N5–N1 và hai item types, kể cả chưa có content.
