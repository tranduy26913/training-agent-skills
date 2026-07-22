# Phase 8 — Vocabulary Quiz và Kanji Quiz

**Mục tiêu:** Quiz là một cách học độc lập cho từng nhóm Từ vựng/Hán tự; learner không bắt buộc học Flashcard trước.

## 1. Quiz types

### Vocabulary Quiz

| Type | Ví dụ | Scoring |
|---|---|---|
| `vocabulary_meaning_choice` | 猫 có nghĩa là gì? | Một meaning đúng |
| `vocabulary_reading_input` | Cách đọc của 猫? | Normalize, exact accepted hiragana |

Vocabulary không có kanji riêng chỉ sinh meaning choice.

### Kanji Quiz

| Type | Ví dụ | Scoring |
|---|---|---|
| `kanji_meaning_choice` | 猫 có nghĩa chính là gì? | Một meaning đúng |
| `kanji_reading_choice` | Chọn một cách đọc của 猫 | Option thuộc accepted On/Kun readings |

Kanji reading dùng choice thay vì free text vì một Hán tự có thể có nhiều cách đọc. Prompt phải nói rõ nếu đang hỏi On hay Kun; nếu dataset không đủ phân loại thì hỏi `một cách đọc hợp lệ`.

## 2. Flow

- Learner bắt đầu quiz trực tiếp từ lesson tab hoặc summary Flashcard.
- Request có `lessonId`, `itemType` và optional scope `unseen|all`. Mặc định chọn tối đa 10 unseen introduced items; nếu không còn unseen thì chuyển thành practice với items đã học.
- Nếu đi từ Flashcard summary, quiz dùng chính item set của session đó.
- Tối đa 10 câu, một item/câu. Chỉ trả `QUIZ_NOT_READY` khi lesson tab không có published introduced item.
- Question type và distractors deterministic trong attempt snapshot.
- Answer được lưu từng câu; không feedback đúng/sai cho tới submit cuối.
- Result hiển thị score, pass/fail, câu sai, item detail link và CTA về đúng lesson/tab.
- Retry dùng cùng item set nhưng tạo attempt/snapshot mới; result hiển thị score của từng attempt, không dùng best score để đại diện toàn bài.
- Khi learner lưu answer đầu tiên cho một item unseen, backend upsert `UserLearningItem.firstSeenAt`; mở quiz rồi thoát mà chưa trả lời không tính là đã học.

## 3. Distractor rules

- Ưu tiên items cùng type, JLPT level và lesson; thiếu mới mở rộng sang cùng level.
- Không duplicate label/options trong một question.
- Meaning distractor không được trùng normalized meaning đúng.
- Kanji reading option lấy từ readings của Kanji khác, không trộn meaning.
- Nếu không tạo được ít nhất 3 options hợp lệ, generator đổi question type hoặc bỏ item; attempt phải còn ít nhất một question.

## 4. API

| Method | Endpoint | Mục đích |
|---|---|---|
| POST | `/api/v1/learner/lessons/:id/quiz-attempts` | Start/resume; body `itemType`, optional `scope`/`sourceFlashcardSessionId` |
| GET | `/api/v1/learner/quiz-attempts/:id` | Sanitized questions/answers |
| PUT | `/api/v1/learner/quiz-attempts/:id/answers/:itemId` | Upsert answer |
| POST | `/api/v1/learner/quiz-attempts/:id/submit` | Score idempotent |
| GET | `/api/v1/learner/quiz-attempts/:id/result` | Result sau submit |

Payload trước submit không chứa answer key/correct option/isCorrect.

## 5. Scoring

- Mỗi câu 1 điểm; `floor(correct/total*100)`; pass ≥70.
- Vocabulary input: Unicode NFKC, trim/gom whitespace, exact accepted answer.
- Choice: option ID phải thuộc snapshot question; exact single match.
- Chỉ submit khi mọi câu có answer hợp lệ.
- Backend chấm từ immutable snapshot, không tin prompt/options từ client.
- Retry request không tạo answer/result/activity trùng.

## 6. Data requirements

| Model | Fields chính |
|---|---|
| `LearningQuizAttempt` | userId, lessonId, itemType, sourceFlashcardSessionId optional, status, questionSnapshot JSON, score/passed/best context, timestamps/date/timezone |
| `LearningQuizAnswer` | attemptId, learningItemId, questionType, response JSON, isCorrect, answeredAt; unique attempt-item |

Snapshot giữ subtype fields cần chấm tại thời điểm start. Content import sau đó không thay đổi kết quả lịch sử.

## 7. Acceptance criteria

1. Mỗi lesson tab khởi tạo đúng quiz type, không trộn Vocabulary/Kanji.
2. Bốn question types sinh/chấm đúng và distractors hợp lệ.
3. Quiz chỉ dùng published introduced items đúng lesson/type; không yêu cầu Flashcard trước.
4. Refresh giữ đề/answers; payload trước submit không lộ đáp án.
5. Score 69/70/100, double-submit và ownership đúng.
6. Result/Retry/Back deep-link đúng lesson và tab.
7. Wrong answers lưu learningItemId/isCorrect=false để Phase 9 backfill.
8. Answer item unseen tạo đúng một UserLearningItem; attempt chưa answer không tăng progress.
