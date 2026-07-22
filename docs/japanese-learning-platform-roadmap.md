# Lộ trình xây dựng nền tảng học tiếng Nhật

Giữ nguyên stack Vue 3/Vite/TypeScript/Pinia/PrimeVue/Tailwind CSS và Express/TypeScript/Zod/Prisma. Database dùng Supabase PostgreSQL; frontend tiếp tục gọi REST API của Express.

Mặc định mỗi phase chỉ bắt đầu sau khi phase trước được duyệt và nghiệm thu. Riêng MVP learner-first, Phase 7–10 được ưu tiên trước Phase 5–6; nội dung được nạp trực tiếp vào database cho đến khi CMS được triển khai.

## Thứ tự triển khai

### Phase 0 — Chốt phạm vi và kiến trúc

**Trạng thái: Đã nghiệm thu**

- Supabase chỉ cung cấp PostgreSQL trong MVP.
- Giữ Express, Prisma và JWT; chưa dùng Supabase Auth/Storage.
- Xây nội dung N5 trước.
- Loại bỏ Project, Script và AI provider cũ.

### Phase 1 — Dọn hệ thống cũ

**Trạng thái: Đã nghiệm thu**

- Xóa Python service, COBOL, Project, Script và cấu hình liên quan.
- Chuẩn hóa cấu trúc workspace, env, tài liệu và encoding.
- Client và server build thành công.

### Phase 2 — Chuyển sang Supabase PostgreSQL

**Trạng thái: Đã nghiệm thu**

- Chuyển Prisma provider/adapter sang PostgreSQL.
- Tạo baseline migration mới và triển khai lên Supabase.
- Runtime và Prisma CLI dùng Supavisor Session pooler.
- Env được nạp từ `server/.env`.

### Phase 3 — Thiết kế schema học tập

**Trạng thái: Đang thực hiện**

- Giữ các bảng Course/Lesson hiện hữu cho hướng mở rộng nhưng learner MVP hiện tại không phụ thuộc chúng.
- Ưu tiên schema learner MVP: LearningItem với hai subtype Vocabulary/Kanji, CurriculumLesson/Entry, UserLearningItem, FlashcardSession, LearningQuizAttempt/Answer và LearningReview/Log.
- Hoàn thiện index, subtype integrity, publish state và soft delete; import metadata 25 bài Elementary I cùng Vocabulary/Kanji N5 theo bài.
- Grammar, Example library, question bank tổng quát, Note và Media được hoãn đến sau Vocabulary/Kanji MVP.

### Phase 4 — Tài khoản, phân quyền và onboarding

- Hoàn thiện lifecycle tài khoản, reset password, profile, locale, timezone và mục tiêu học.
- Chuẩn hóa role admin/editor/learner và authorization.

### Phase 5 — CMS khóa học

**Trạng thái: Tạm hoãn sau Phase 10**

- CRUD Course/Unit/Lesson/Section, sắp xếp nội dung, preview và publish.
- Audit mọi thay đổi quan trọng.

### Phase 6 — CMS nội dung tiếng Nhật

**Trạng thái: Tạm hoãn sau Phase 10**

- Vocabulary, Kanji, Grammar, Example, furigana, audio, tag và import/export.
- Gắn nội dung tái sử dụng vào bài học.

### Phase 7 — Lesson hub và học bằng Flashcard

**Trạng thái: Đã có spec — ưu tiên triển khai**

- Luôn có đúng 5 trình độ N5–N1 và bài theo edition/quyển Minna no Nihongo.
- Hai nhóm Từ vựng/Hán tự trong mỗi bài; cả hai học mới bằng Flashcard.

### Phase 8 — Vocabulary Quiz và Kanji Quiz

**Trạng thái: Đã có spec — ưu tiên triển khai**

- Quiz riêng theo nhóm vừa học: Vocabulary meaning/reading và Kanji meaning/reading.
- Chấm điểm backend, pass/fail, retry và lưu item sai.

### Phase 9 — Flashcard SRS cho Vocabulary/Kanji

**Trạng thái: Đã có spec — ưu tiên triển khai**

- Một review queue cho cả Vocabulary/Kanji, lọc type/level/bài, Again/Hard/Good/Easy và history.
- Unit test thuật toán scheduling.

### Phase 10 — Vocabulary/Kanji dashboard và streak

**Trạng thái: Đã có spec — ưu tiên triển khai**

- Bài/nhóm tiếp theo, mục tiêu learning items, review đến hạn, streak và tiến độ riêng hai nhóm trên 5 level.

Chi tiết Phase 7–10: [Learner MVP specification](./learner-mvp/specs/phase-7-10-design/00-index.md).

### Phase 11 — Media, tìm kiếm và thư viện cá nhân

- Supabase Storage nếu được duyệt.
- Search, dictionary, favorite, note và bộ lọc JLPT/mastery.

### Phase 12 — Quản trị và báo cáo

- Báo cáo tiến độ, nội dung khó, câu hỏi có tỷ lệ sai cao và audit/export.

### Phase 13 — i18n, accessibility và UX

- Chuẩn hóa Việt/Nhật/Anh, keyboard, focus, contrast, responsive và các trạng thái UI.

### Phase 14 — Bảo mật, hiệu năng và test

- Security headers, rate limit, CORS, validation, query/index và logging.
- Unit, integration, E2E, accessibility và performance test.

### Phase 15 — Dữ liệu, staging và production

- Dry-run migration, staging, backup/restore, smoke test, rollback và monitoring.

### Phase 16 — Sau MVP

- JLPT mock test, luyện viết Kanji, speech recognition, AI có kiểm duyệt, PWA, payment và classroom mode.

## Phạm vi MVP

MVP hiện tại chỉ gồm trải nghiệm học Vocabulary và Kanji bằng Flashcard/Quiz của Phase 7–10 cùng các yêu cầu bắt buộc về bảo mật, accessibility, test và vận hành. Grammar, course platform tổng quát, CMS, AI, speech recognition, payment và social learning không thuộc MVP.
