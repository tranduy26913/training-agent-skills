# Lộ trình xây dựng nền tảng học tiếng Nhật

Giữ nguyên stack Vue 3/Vite/TypeScript/Pinia/PrimeVue/Tailwind CSS và Express/TypeScript/Zod/Prisma. Database dùng Supabase PostgreSQL; frontend tiếp tục gọi REST API của Express.

Mỗi phase chỉ bắt đầu sau khi phase trước được duyệt và nghiệm thu.

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

- Đã có nền tảng Course, Unit, Lesson, Section, Enrollment, Progress, Quiz, Question, Attempt và LearningSession.
- Cần bổ sung Kanji, Grammar, Example, QuestionOption/AttemptAnswer, ReviewItem, Favorite, Note và Media.
- Hoàn thiện index, cascade, publish state, soft delete, ERD và seed N5.

### Phase 4 — Tài khoản, phân quyền và onboarding

- Hoàn thiện lifecycle tài khoản, reset password, profile, locale, timezone và mục tiêu học.
- Chuẩn hóa role admin/editor/learner và authorization.

### Phase 5 — CMS khóa học

- CRUD Course/Unit/Lesson/Section, sắp xếp nội dung, preview và publish.
- Audit mọi thay đổi quan trọng.

### Phase 6 — CMS nội dung tiếng Nhật

- Vocabulary, Kanji, Grammar, Example, furigana, audio, tag và import/export.
- Gắn nội dung tái sử dụng vào bài học.

### Phase 7 — Trải nghiệm học bài

- Course catalog, enrollment, learning path và lesson player.
- Lưu vị trí, tiến độ, favorite và note.

### Phase 8 — Quiz engine

- Question bank, nhiều loại câu hỏi, chấm điểm backend và lưu câu trả lời.
- Pass/fail, unlock và ôn lại câu sai.

### Phase 9 — Flashcard và spaced repetition

- Review queue, Again/Hard/Good/Easy, lịch ôn và review history.
- Unit test thuật toán scheduling.

### Phase 10 — Dashboard và streak

- Bài đang học, mục tiêu hôm nay, review đến hạn, streak và thống kê thực.

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

MVP gồm Phase 0–10 cùng các yêu cầu bắt buộc về bảo mật, accessibility, test và vận hành của Phase 11–15. AI, speech recognition, payment và social learning không thuộc MVP.
