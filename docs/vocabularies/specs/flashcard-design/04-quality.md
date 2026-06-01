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
| 3 | Props đúng cho từng LevelCard | Mock 2 level stats | render | `level` và `stats` props khớp store data |
| 4 | Navigate khi nhấn Bắt đầu | Stub router.push | emit `start('N5')` từ LevelCard | `router.push` được gọi với `/learn/N5/list` |
| 5 | ProgressBar đúng % | known=45, total=120 | render | ProgressBar value = 38 (Math.round(37.5) = 38) |
| 6 | Hiển thị lỗi khi store.error được set | store.error='Lỗi' | render | Thông báo lỗi hiển thị |
| 7 | Gọi fetchLevelStats khi mounted | Mock store action | render | `fetchLevelStats` được gọi 1 lần |

#### LearnVocabListPage

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Gọi fetchVocabList khi mounted | Mock service | render | `fetchVocabList` được gọi với đúng level |
| 2 | Filter change reload danh sách | Render xong | Thay đổi SelectButton sang 'known' | `fetchVocabList` được gọi lại |
| 3 | startSession gọi navigate | Mock store, router | click [Học tất cả] | store.startSession và router.push được gọi |
| 4 | Empty state khi filter không có kết quả | vocabList=[], filter=known | render | Empty state message hiển thị |

> **Ghi chú:** Search debounce, studySelectedBtn disabled/enabled, Toast warning khi list rỗng không được implement — loại bỏ khỏi phạm vi test.

#### LearnSessionPage

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Redirect về list nếu sessionCards rỗng | store.sessionCards=[] | render | `router.push` được gọi tới list page |
| 2 | knownBtn/unknownBtn disabled trước khi lật | isFlipped=false | render | Cả 2 nút disabled |
| 3 | knownBtn/unknownBtn enabled sau khi lật | isFlipped=true | render | Cả 2 nút enabled |
| 4 | SessionSummary hiển thị khi hết thẻ | cards=[1 thẻ] | markKnown() | `isSessionComplete=true`, SessionSummary hiển thị |
| 5 | finishSession gọi batch API | Mock service | hết thẻ | `service.batchUpdateProgress` được gọi với đúng payload |
| 6 | retry từ SessionSummary reset session | isSessionComplete=true, knownCount=5 | emit retry | SessionSummary ẩn, FlashCard hiển thị lại |

#### CardConfigPanel

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Emit `update:visible` khi Drawer đóng | Panel mở | Drawer emit `update:visible` false | Component emit `update:visible` false |
| 2 | Drawer header hiển thị title đúng | Panel mở, i18n: en | render | Drawer `header` prop = 'Card Settings' |
| 3 | Drawer visible=true khi prop visible=true | visible=true | render | Drawer `visible` prop = true, `position` = 'right' |
| 4 | Drawer exists khi render | visible=true | render | 1 Drawer component tồn tại trong tree |
| 5 | Drawer visible=false khi prop visible=false | visible=false | render | Drawer `visible` prop = false |

#### Composable Tests — `useLearnSession`

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Khởi tạo đúng state ban đầu | cards=[2 thẻ] | init | index=0, isFlipped=false, isSessionComplete=false |
| 2 | currentCard trả về thẻ đầu tiên | cards=[v1, v2] | computed | currentCard = v1 |
| 3 | totalCards = độ dài mảng cards | cards=[3 thẻ] | computed | totalCards = 3 |
| 4 | progress bắt đầu từ 1 (hiển thị 1-based) | index=0 | computed | progress = 1 |
| 5 | flip: isFlipped false → true | isFlipped=false | flip() | isFlipped = true |
| 6 | flip: isFlipped true → false | isFlipped=true | flip() | isFlipped = false |
| 7 | markKnown tăng knownCount | knownCount=0 | markKnown() | knownCount = 1 |
| 8 | markKnown chuyển sang thẻ tiếp | index=0 | markKnown() | index = 1 |
| 9 | markKnown reset isFlipped | isFlipped=true | markKnown() | isFlipped = false |
| 10 | markKnown set isSessionComplete khi thẻ cuối | 1 thẻ, index=0 | markKnown() | isSessionComplete = true |
| 11 | markUnknown tăng unknownCount | unknownCount=0 | markUnknown() | unknownCount = 1 |
| 12 | markUnknown chuyển thẻ và reset isFlipped | index=0, isFlipped=true | markUnknown() | index=1, isFlipped=false |
| 13 | progress = currentIndex + 1 | index=2 | computed | progress = 3 |
| 14 | currentCard giữ nguyên thẻ cuối khi session xong | 2 thẻ | markKnown() × 2 | isSessionComplete=true, currentCard != null |
| 15 | progressUpdates chứa đúng payload known | markKnown(v1) | computed | updates=[{vocab_id, status:'known', ...}] |
| 16 | recordFavorite: tăng newFavoriteCount khi thêm | is_favorite=false | recordFavorite(id, true) | newFavoriteCount = 1 |
| 17 | recordFavorite: không tăng khi bỏ favorite đã thêm trong session | is_favorite → true → false | recordFavorite(id, false) | newFavoriteCount = 1 (không đổi) |
| 18 | recordFavorite: không tăng cho pre-existing favorite | is_favorite=true (ban đầu) | recordFavorite(id, true) | newFavoriteCount = 0 |
| 19 | resetSession: reset toàn bộ state | knownCount=3, index=2 | resetSession() | index=0, knownCount=0, isSessionComplete=false |

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
