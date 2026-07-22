# Vocabulary & Kanji Learning MVP — Specification

**Phiên bản:** 2.2  
**Ngày:** 2026-07-22  
**Trạng thái:** Draft — user-first

## 1. Product goal

Ứng dụng có đúng 5 trình độ `N5`, `N4`, `N3`, `N2`, `N1`. Trong mỗi trình độ, nội dung được chia theo bài của giáo trình Minna no Nihongo và thành hai nhóm riêng:

```text
Trình độ → Bài học
              ├─ Từ vựng ── Flashcard | Quiz
              └─ Hán tự   ── Flashcard | Quiz
```

Flashcard và Quiz là hai cách học ngang hàng: learner có thể bắt đầu bằng bất kỳ cách nào. Flashcard cũng được dùng lại khi ôn SRS. Nội dung được import trực tiếp vào PostgreSQL; CMS làm sau.

## 2. User navigation

- `Hôm nay` — `/learn`
- `Trình độ` — `/learn/levels`
- `Ôn tập` — `/learn/review`
- `Tiến độ` — `/learn/progress`

Flow chính:

```text
/learn/levels/N5
  └─ /learn/lessons/:lessonId
       ├─ tab Từ vựng → Học Flashcard | Làm Quiz
       └─ tab Hán tự   → Học Flashcard | Làm Quiz
```

## 3. Scope theo phase

| Phase | User outcome | Spec | Plan |
|---:|---|---|---|
| 7 | Chọn level/bài/nhóm và học mới bằng Flashcard | [Phase 7](./07-learning-experience.md) | [Plan 7](../../plans/phase-7-10/07-learning-experience-plan.md) |
| 8 | Làm Quiz Từ vựng hoặc Quiz Hán tự | [Phase 8](./08-quiz-engine.md) | [Plan 8](../../plans/phase-7-10/08-quiz-engine-plan.md) |
| 9 | Ôn Flashcard SRS chung, lọc theo nhóm/level/bài | [Phase 9](./09-spaced-repetition.md) | [Plan 9](../../plans/phase-7-10/09-spaced-repetition-plan.md) |
| 10 | Dashboard bài tiếp theo và tiến độ riêng hai nhóm | [Phase 10](./10-dashboard-streak.md) | [Plan 10](../../plans/phase-7-10/10-dashboard-streak-plan.md) |

Kế hoạch tổng: [Implementation plan](../../plans/phase-7-10/00-index.md).

## 4. Content taxonomy

`JLPT level` và `curriculum lesson` là hai chiều độc lập. Một learning item có một type:

- `vocabulary`: một từ/cụm từ tiếng Nhật với cách đọc và nghĩa.
- `kanji`: một Hán tự với âm On, âm Kun, nghĩa và từ ví dụ.

Một item có thể xuất hiện ở nhiều lesson/edition. Lesson entry có:

- `introduced`: nội dung mới của bài, được tính vào học mới/progress.
- `reference`: xuất hiện lại để tham khảo, không làm tăng mẫu số progress.

Trong một active curriculum release, mỗi item có tối đa một introduced lesson.

## 5. Minna no Nihongo mapping

| Curriculum | Lessons | App level |
|---|---:|---|
| Elementary I | 1–25 | N5 |
| Elementary II | 26–50 | N4 |
| Intermediate I | 12 chapters | Curator gán N3–N1 theo nguồn kiểm chứng |
| Intermediate II | 12 chapters | Curator gán N3–N1 theo nguồn kiểm chứng |

UI luôn có đủ N5–N1. Level chưa có published lesson hiển thị `Nội dung đang được cập nhật`. Không tuyên bố Intermediate I/II tương đương chính thức một JLPT level cụ thể.

Edition/release là bắt buộc (`2e`, `3e`, …). Import không trộn nội dung từ nhiều edition trong cùng release.

## 6. Shared data model direction

Dùng một base identity `LearningItem` cho pipeline chung:

| Model | Vai trò |
|---|---|
| `LearningItem` | id, type `vocabulary|kanji`, jlptLevel, status/isDeleted; nguồn publish state cho learner |
| `Vocabulary` | one-to-one LearningItem; kanji/kana, hiragana, romaji, meaningVi, examples; dữ liệu status cũ được migrate |
| `Kanji` | one-to-one LearningItem; character, onYomi, kunYomi, meaningVi, examples |
| `CurriculumLesson` | release, lesson number, position, jlptLevel, status |
| `LessonLearningItem` | lessonId, learningItemId, groupPosition, entryType |
| `UserLearningItem` | userId, learningItemId, favorite, firstSeen timestamps |

DB/service phải đảm bảo đúng subtype: item `vocabulary` có đúng một Vocabulary; item `kanji` có đúng một Kanji. Thiết kế này cho phép Flashcard/Quiz/SRS dùng chung pipeline nhưng UI và dữ liệu chi tiết vẫn tách nhóm.

## 7. Data import khi chưa có CMS

- Upsert theo curriculum+edition, lesson slug và item stable key.
- Kanji stable key là character; Vocabulary stable key là slug do dataset cung cấp.
- Import theo thứ tự: release → lessons → learning items/subtypes → lesson entries → Kanji example vocabulary links.
- Position duy nhất theo `(lesson, itemType, groupPosition)` và không có khoảng trống trong từng tab.
- Dataset phải có quyền sử dụng; không scrape/sao chép nội dung giáo trình nếu chưa được cấp phép.
- Không seed learner progress/history trong production.

Fixture nghiệm thu:

- 5 level cards N5–N1.
- 25 lesson metadata Elementary I của edition được chọn.
- Ít nhất 3 bài N5 có ≥10 Vocabulary và ≥5 Kanji introduced để chạy E2E.

## 8. Shared product rules

- `jlptLevel` chỉ nhận N5–N1; `itemType` chỉ nhận vocabulary/kanji.
- Backend là nguồn sự thật cho publish state, progress, quiz, SRS và streak.
- JWT bắt buộc; user isolation ở mọi session/attempt/history.
- UTC cho timestamp; activity date lưu cùng timezone snapshot.
- Write endpoint idempotent; refresh không mất session.
- API base `/api/v1/learner`; error `{ message, code, details? }`.
- Mobile-first, keyboard accessible.

## 9. Không thuộc MVP

- Grammar, hội thoại và bài tập ngữ pháp.
- Viết nét/thứ tự nét, handwriting recognition và phát âm.
- Generic Course/Unit/Lesson/enrollment platform.
- CMS/import UI, note, media upload, social và AI.
- Quiz bank tổng quát, active-time tracking và leaderboard.

## 10. Definition of Done

- E2E Vocabulary: N5 → Bài 1 → Từ vựng → Flashcard → Quiz → Review.
- E2E Kanji: N5 → Bài 1 → Hán tự → Flashcard → Quiz → Review.
- Level selector luôn đúng 5 level/order.
- Một item ở nhiều bài chỉ có một user progress/SRS schedule.
- Progress đúng ở item, nhóm, lesson và level.
- Import rerun không duplicate/reorder; draft/deleted content không lộ.
- Build, migration, validation và tests pass.

## 11. Curriculum references

- [3A Corporation — Third Edition announcement](https://www.3anet.co.jp/en/minnanonihongo_dai3pan.html): Elementary I khoảng N5, Elementary II khoảng N4.
- [3A Plus — Elementary I structure](https://plus.3anet.co.jp/mnc/touser_en/): Elementary I có 25 lessons.
- [3A Corporation — Elementary II](https://www.3anet.co.jp/np/en/books/1400/): Elementary II có 25 lessons.
- [Intermediate I](https://www.3anet.co.jp/np/en/books/2800/) và [Intermediate II](https://www.3anet.co.jp/np/en/books/2900/): mỗi quyển có 12 chapters, mô tả theo lower/upper intermediate.
