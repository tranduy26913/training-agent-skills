# 04 — Quality: Vocabulary FlashCard

> Related: [00-index.md](./00-index.md) | [01-backend.md](./01-backend.md) | [02-frontend.md](./02-frontend.md) | [03-behavior.md](./03-behavior.md)

---

## 1. Testing Strategy

### 1.1 Backend Tests

#### Unit Tests — `learn.service.ts`

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | getLevelStats trả về đúng 5 level | Mock repo trả về data N1–N5 | `service.getLevelStats(userId)` | Trả về mảng 5 phần tử đúng level |
| 2 | getLevelStats với user chưa học | Mock repo: `user_vocabulary_progress` rỗng | `service.getLevelStats(userId)` | known=0, learning=0, new_count=total |
| 3 | getVocabularies — filter `level=N5` | Mock vocab repo trả về 10 từ N5 | `service.getVocabularies(userId, {level:'N5'})` | Trả về 10 từ kèm progress |
| 4 | getVocabularies — filter `progress_status=known` | Mock: 3 known, 7 others | `service.getVocabularies(userId, {level:'N5', progressStatus:'known'})` | Chỉ trả về 3 từ |
| 5 | getVocabularies — từ bị ẩn không hiện | Mock: 1 từ status='hide' | `service.getVocabularies(userId, {level:'N5'})` | Từ bị ẩn không có trong kết quả |
| 6 | batchUpdateProgress — upsert mới | User chưa có progress | `service.batchUpdate(userId, [{vocab_id:1, status:'known'}])` | Insert row mới, review_count=1 |
| 7 | batchUpdateProgress — update hiện có | User đã có progress known | `service.batchUpdate(userId, [{vocab_id:1, status:'learning'}])` | Update status, review_count++ |
| 8 | batchUpdateProgress — tăng learn_count | Batch 5 từ | `service.batchUpdate(userId, updates)` | `vocabularies.learn_count` tăng 1 cho mỗi từ trong batch |
| 9 | toggleFavorite — từ chưa có progress | Không có row | `service.toggleFavorite(userId, vocabId)` | Tạo row mới với is_favorite=true, status='new' |
| 10 | toggleFavorite — toggle off | is_favorite=true | `service.toggleFavorite(userId, vocabId)` | Trả về is_favorite=false |
| 11 | toggleFavorite — từ không tồn tại | vocabId không tồn tại | `service.toggleFavorite(userId, 999)` | Throw NotFoundError |
| 12 | toggleFavorite — từ bị ẩn/xóa | status='hide' | `service.toggleFavorite(userId, vocabId)` | Throw NotFoundError |

#### Integration Tests — Endpoints

| # | Endpoint | Kịch bản | Expected |
|---|----------|---------|---------|
| 1 | `GET /api/learn/stats` | Token hợp lệ, role=user | 200 + mảng 5 level stats |
| 2 | `GET /api/learn/stats` | Không có token | 401 |
| 3 | `GET /api/learn/stats` | Role=admin | 403 |
| 4 | `GET /api/learn/vocabularies?level=N5` | Token hợp lệ | 200 + paginated list |
| 5 | `GET /api/learn/vocabularies?level=XX` | level không hợp lệ | 400 |
| 6 | `GET /api/learn/vocabularies` | Thiếu `level` param | 400 |
| 7 | `POST /api/learn/progress/batch` | Body hợp lệ | 200 `{updated: N}` |
| 8 | `POST /api/learn/progress/batch` | `updates` rỗng | 400 |
| 9 | `POST /api/learn/progress/batch` | `updates` > 200 phần tử | 400 |
| 10 | `POST /api/learn/favorite/1` | Token hợp lệ | 200 `{is_favorite: bool}` |
| 11 | `POST /api/learn/favorite/9999` | vocabId không tồn tại | 404 |

#### Authorization Tests

| # | Role | Endpoint | Expected |
|---|------|---------|---------|
| 1 | `admin` | `GET /api/learn/stats` | 403 |
| 2 | `moderator` | `GET /api/learn/vocabularies` | 403 |
| 3 | unauthenticated | `POST /api/learn/progress/batch` | 401 |
| 4 | `user` | `GET /api/learn/stats` | 200 |

---

### 1.2 Frontend Tests

#### LearnLevelPage

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Hiển thị skeleton khi loading | `levelStatsLoading=true` | render | 5 skeleton card hiển thị |
| 2 | Hiển thị 5 LevelCard sau khi load | Mock store data N1–N5 | render | 5 LevelCard với đúng stats |
| 3 | Navigate khi nhấn Bắt đầu | Stub router.push | emit `start('N5')` từ LevelCard | `router.push` được gọi với `/learn/N5/list` |
| 4 | ProgressBar đúng % | known=45, total=120 | render | ProgressBar value = 37 |

#### LearnVocabListPage

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Gọi fetchVocabList khi mounted | Mock service | render | `fetchVocabList` được gọi với đúng level |
| 2 | Filter change reload danh sách | Render xong | Thay đổi SelectButton sang 'known' | `fetchVocabList` được gọi lại |
| 3 | Search debounce | Render xong | Gõ text vào search | `fetchVocabList` chỉ được gọi 1 lần sau 300ms |
| 4 | studySelectedBtn disabled khi chưa chọn | rows.selected=[] | render | Button disabled |
| 5 | studySelectedBtn enabled khi chọn 1 từ | rows.selected=[vocab1] | render | Button enabled với label "Học đã chọn (1)" |
| 6 | startSession gọi navigate | Mock store, router | click [Học tất cả] | store.startSession và router.push được gọi |
| 7 | Toast warning khi list rỗng | sessionCards=[] | click [Học tất cả] | Toast "Không có từ nào để học" |
| 8 | Empty state khi filter không có kết quả | vocabList=[], filter=known | render | Empty state message hiển thị |

#### LearnSessionPage / useLearnSession

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Redirect về list nếu sessionCards rỗng | store.sessionCards=[] | render | `router.push` được gọi tới list page |
| 2 | knownBtn/unknownBtn disabled trước khi lật | isFlipped=false | render | Cả 2 nút disabled |
| 3 | knownBtn/unknownBtn enabled sau khi lật | isFlipped=true | render | Cả 2 nút enabled |
| 4 | Lật thẻ toggle isFlipped | isFlipped=false | click flipButton | isFlipped=true; mặt sau hiện |
| 5 | markKnown tăng knownCount | knownCount=0 | click [✓ Đã biết] | knownCount=1 |
| 6 | markUnknown tăng unknownCount | unknownCount=0 | click [✗ Chưa biết] | unknownCount=1 |
| 7 | Reset isFlipped sau mỗi thẻ | isFlipped=true | click [✓ Đã biết] → thẻ tiếp | isFlipped=false |
| 8 | SessionSummary hiển thị khi hết thẻ | cards=[1 thẻ] | markKnown() | `isSessionComplete=true`, SessionSummary hiển thị |
| 9 | finishSession gọi batch API | Mock service | hết thẻ | `service.batchUpdateProgress` được gọi với đúng payload |
| 10 | restartSession reset state | isSessionComplete=true, knownCount=5 | emit retry | currentIndex=0, knownCount=0, isSessionComplete=false |
| 11 | onBeforeRouteLeave guard kích hoạt | currentIndex=2 | navigate away | ConfirmDialog hiển thị |
| 12 | onBeforeRouteLeave không kích hoạt khi xong | isSessionComplete=true | navigate away | Không có dialog |
| 13 | toggleFavorite tăng newFavoriteCount | progress.is_favorite=false | click ★ | newFavoriteCount++ |
| 14 | toggleFavorite không tăng nếu đã favorite | progress.is_favorite=true | click ★ | newFavoriteCount không đổi |

#### CardConfigPanel

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Emit update:modelValue khi apply | Panel mở | Thay đổi config + click Áp dụng | emit `update:modelValue` với config mới |
| 2 | Emit close khi apply | Panel mở | click Áp dụng | emit `update:visible` false |

#### Composable Tests — `useLearnSession`

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | `progress` computed đúng | currentIndex=5, total=20 | computed | progress = 25 |
| 2 | `currentCard` trả về null khi hết | currentIndex=cards.length | computed | null |

---

## 2. Performance Considerations

- **Phân trang danh sách từ:** Mặc định 50 từ/trang, tối đa 200; tránh load toàn bộ kho.
- **Batch API:** `POST /api/learn/progress/batch` dùng MySQL `INSERT ... ON DUPLICATE KEY UPDATE` để tối ưu, tránh N queries.
- **Cập nhật `learn_count`:** Dùng một câu `UPDATE vocabularies SET learn_count = learn_count + 1 WHERE id IN (...)` sau batch, không update từng row.
- **Level stats query:** Sử dụng LEFT JOIN + GROUP BY; thêm index `idx_uvp_user_status (user_id, status)` trong schema.
- **Debounce search:** 300ms, tránh gọi API quá nhiều khi User gõ nhanh.

---

## 3. Security Considerations

- Tất cả endpoint `/api/learn/*` yêu cầu JWT hợp lệ với role `user` — middleware auth + role guard.
- `user_id` luôn lấy từ JWT payload, không từ request body — ngăn User cập nhật progress của người khác.
- `vocabulary_id` trong batch được validate tồn tại và `status='publish'` trong DB trước khi upsert — ngăn ghi progress cho từ ẩn/xóa.
- `limit` bị clamp về 200 server-side — tránh DoS qua query lớn.
- Input validation bằng Zod/Joi trên server cho tất cả request body và query params.

---

## 4. Accessibility (a11y)

- FlashCard có `aria-label` mô tả trạng thái (mặt trước / mặt sau) và nội dung từ.
- Nút [Lật thẻ], [✓ Đã biết], [✗ Chưa biết] có `aria-label` rõ ràng.
- Icon ★ favorite có `aria-label="Đánh dấu yêu thích"` / `"Bỏ đánh dấu yêu thích"` theo trạng thái.
- Màu badge trạng thái (Mới/Đang học/Đã biết) không dùng màu làm tín hiệu duy nhất — kèm text label.
- Keyboard navigation: Enter/Space trên FlashCard để lật; Tab để di chuyển giữa các nút hành động.
- ProgressBar có `aria-valuenow`, `aria-valuemin`, `aria-valuemax`.

---

## 5. Logging & Audit

| Sự kiện | Log | Ghi chú |
|---------|-----|---------|
| Batch progress update | Server log: `[LEARN] user:{id} batch updated {N} words (level:{level})` | Info level |
| Toggle favorite | Server log: `[LEARN] user:{id} favorite vocab:{id} = {true/false}` | Debug level |
| Auth failure trên learn routes | Server log: `[LEARN] unauthorized access attempt` | Warn level |
| Batch API error | Server log full error stack | Error level |

> **Không ghi log** nội dung từ vựng hay chi tiết học của User vào audit log chung (tránh lộ dữ liệu học cá nhân). Log chỉ phục vụ debugging kỹ thuật.
