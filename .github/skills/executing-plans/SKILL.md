---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session
---

# Tổng Quan
Load kế hoạch, review mang tính phê bình, thực thi tất cả phases và tasks tuần tự, báo cáo khi hoàn thành.

**Thông báo khi bắt đầu:** "Tôi đang sử dụng skill executing-plans để triển khai kế hoạch này."

**Required skills:** Luôn reference các skill sau khi thực thi kế hoạch:
- **test-driven-development** - REQUIRED: Sử dụng cho mọi task triển khai liên quan đến viết code (TDD)
- **coding-guidelines** - REQUIRED: Sử dụng cho mọi task triển khai liên quan đến viết code
- **vue-best-practices** - REQUIRED: Sử dụng cho mọi task triển khai Vue.js
- **prime-vue** - REQUIRED: Sử dụng cho mọi component PrimeVue trong triển khai Vue.js
- **vueuse-functions** - REQUIRED: Sử dụng cho mọi function VueUse trong triển khai Vue.js
- **vue-testing-best-practices** - REQUIRED: Sử dụng cho mọi task testing Vue.js
- **vue-router-best-practices** - REQUIRED: Sử dụng cho mọi task triển khai Vue Router

# Nguyên Tắc Cấu Trúc Tài Liệu
- Tuân theo file chung: `project_structure_spec.md` và `common-system-guide.md`
- Tuân theo các đặc tả trong design spec (`docs/<topic>/specs/<topic>-design/`) — đây là source of truth cho cách triển khai

# Quy Trình (PHẢI TUÂN THEO CHÍNH XÁC)
## Bước 1: Load và Review Kế Hoạch
1. Chỉ một kế hoạch được load và thực thi tại một thời điểm.
2. Review mang tính phê bình — xác định các hard blocker sẽ ngăn việc thực thi hoàn toàn
3. Tự giải quyết mọi ambiguity bằng codebase context; **không** hỏi người dùng trừ khi blocker không thể giải quyết bằng bất kỳ cách nào
4. Tạo TodoWrite và tiến hành ngay lập tức

## Bước 2: Thực Thi Phase và Tasks (tất cả tuần tự)
**Các phase là tuần tự. Các task trong cùng một phase cũng được thực thi tuần tự, cái này sau cái kia.**

Quy tắc thực thi:
1. Trong mỗi phase, thực thi từng task theo thứ tự.
2. Theo dõi các task đã hoàn thành trước khi chuyển sang task tiếp theo.
3. Khi tất cả các task trong một phase hoàn thành, verify build và tests — không có syntax errors hoặc failing toàn bộ test suite nào được phép trước khi tiến hành phase tiếp theo.
4. Khi một phase hoàn thành, chuyển bước 1 của phase tiếp theo thành TodoWrite và thực thi nó

Với mỗi task:
1. Thực thi các hướng dẫn của task chính xác như đã viết
2. Đọc các spec liên quan, load các skill liên quan, và reference chúng khi cần

Khi tất cả phases và tasks đã hoàn thành, tiến hành post-completion review.

## Bước 3: Post-Completion Review

Sau khi **TẤT CẢ** tasks đã hoàn thành, dispatch review:

**Xác định vị trí design spec package trước:** `docs/<topic>/specs/<topic>-design/`

#### A — Code Review
Load skill: `code-review`

Cung cấp:
- `WHAT_WAS_IMPLEMENTED`: tóm tắt một dòng về những gì đã được build
- `SPEC_FILES`: paths đến `01-backend.md`, `02-frontend.md`, `03-behavior.md` trong spec package

#### B — UT Coverage Review
Load skill: `ut-review`

Cung cấp:
- `QUALITY_SPEC`: path đến `04-quality.md` trong spec package
- Focus: **Chỉ UT** — không thêm hoặc chạy E2E tests

#### Sau khi tất cả hoàn thành:
1. Sửa tất cả các vấn đề **Critical** và **Important** từ báo cáo code review
2. Thêm tất cả các UT cases còn thiếu được xác định bởi UT coverage review
3. Chạy lại `npx vitest run` — tất cả UT tests phải pass

## Khi Nào Dừng và Xin Trợ Giúp
**DỪNG thực thi ngay lập tức khi:**
- Gặp blocker (dependency thiếu, test fail, hướng dẫn không rõ ràng)
- Kế hoạch có gaps quan trọng ngăn việc bắt đầu
- Bạn không hiểu một hướng dẫn
- Verification fail nhiều lần

## Khi có next-step suggestions
**Nếu bạn có next-step suggestion cho người dùng, sử dụng tool vscode_askQuestions:**

## Nhớ
- Review kế hoạch mang tính phê bình trước
- Tuân theo các bước kế hoạch chính xác
- Không bỏ qua verifications
- Reference skills khi kế hoạch yêu cầu
- Phases là tuần tự; tasks trong cùng một phase cũng tuần tự
- Nếu một phase chỉ có một task, thực thi trực tiếp
- Dừng khi bị blocker, không đoán
- Không bao giờ bắt đầu triển khai trên branch main/master nếu không có sự đồng ý rõ ràng từ người dùng
