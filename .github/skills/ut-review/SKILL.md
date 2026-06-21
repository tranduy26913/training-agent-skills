---
name: ut-review
description: Unit test coverage review against 04-quality.md spec. Finds gaps, adds missing tests, and keeps spec in sync.
argument-hint: "Optional: path to 04-quality.md spec file (e.g. docs/users/specs/users-design/04-quality.md)"
context: fork
---

# UT Review

**Thông báo khi bắt đầu:** "Tôi đang sử dụng skill ut-review."

## Tổng Quan

Skill này audit unit test coverage và giữ test suite cùng design spec (`04-quality.md`) đồng bộ.

**When `04-quality.md` path is provided — Spec-Driven mode (Phase 0):**
- **Step 0-A (spec → code)**: đọc mọi row trong các bảng UT (`# | Test Case | Arrange | Act | Assert`), tìm các test cases nào còn thiếu trong codebase, thêm chúng theo đúng Arrange/Act/Assert từ spec, sau đó chạy `npx vitest run` để verify tất cả pass.
- **Step 0-B (code → spec)**: tìm các test cases đã được viết trong quá trình triển khai nhưng chưa có trong `04-quality.md`, và thêm chúng vào bảng đúng — giữ file spec đồng bộ với test suite thực tế.

**Khi không có spec được cung cấp — General mode (Phase 1–5):**
Khám phá tất cả unit test files, audit coverage theo các tiêu chí UT chuẩn (happy path, edge cases, error paths, auth guards), thêm các tests thiếu, sửa các tests đang fail, và verify toàn bộ suite pass.

**Scope:** Chỉ UT — không thêm hoặc chạy E2E tests.

---

## Required Skills — Load Trước

Trước khi thực thi bất kỳ bước nào, load các skills sau:

- `vue-testing-best-practices` — cho Vue/Vitest patterns
- `test-driven-development` — cho TDD discipline
- `systematic-debugging` — khi sửa failing tests
- `verification-before-completion` — trước khi tuyên bố done

---

## Phase 0 — Spec-Driven Audit _(khi path 04-quality.md được cung cấp)_

> Sử dụng phase này khi một design spec tồn tại cho feature đang được review.

### Step 0-A: Gap Detection (spec → code)
1. Đọc `04-quality.md` tại path được cung cấp.
2. Với mỗi bảng trong section UT (`# | Test Case | Arrange | Act | Assert`):
   - Tìm file test tương ứng trong codebase
   - Kiểm tra xem mỗi test case đã được triển khai chưa (khớp theo test name hoặc described behavior)
3. Xây dựng **gap list**: các test cases trong spec nhưng thiếu trong code.
4. Thêm mỗi missing test theo đúng các cột `Arrange / Act / Assert` từ bảng spec.
5. Chạy `npx vitest run` — tất cả tests phải pass.

### Step 0-B: Sync-Back (code → spec)
> **Khi các test cases mới đã được viết trong quá trình triển khai mà chưa có trong 04-quality.md:**

1. Với mỗi test case trong code không có row tương ứng trong `04-quality.md`:
   - Xác định section bảng đúng (page hoặc composable)
   - Thêm một row mới: `| N | [Test Case name] | [Arrange] | [Act] | [Assert] |`
2. Lưu `04-quality.md` — spec phải đồng bộ với test suite thực tế.
3. Báo cáo: spec cases (trước/sau), code cases (trước/sau), rows đã thêm vào spec.

---

## Phase 1 — Khám Phá

1. Xác định test runner từ `package.json` (Vitest, Jest…).
2. Tìm tất cả unit test files: `**/*.{test,spec}.{ts,js,vue}`.
3. Chạy tests hiện có và capture baseline output:
   - `npm run test` hoặc `npx vitest run`
4. Ghi nhận: tổng tests, passing, failing, skipped.

---

## Phase 2 — Audit Coverage

Với mỗi module / component đang được review:

| Kiểm tra | Bắt buộc |
|----------|----------|
| Happy path | ✅ |
| Edge cases (empty, null, boundary values) | ✅ |
| Error / failure paths | ✅ |
| Auth / permission guards | ✅ |
| UI interactions (click, submit, navigate) | ✅ component test |
| API calls | ✅ mock tại boundary |

Đánh dấu bất kỳ tests **thiếu** hoặc **yếu** nào (ví dụ: tests chỉ check snapshots mà không có assertions).

---

## Phase 3 — Thêm Tests Thiếu

### Unit Tests (Vitest + Vue Test Utils)

- Tuân theo cách tiếp cận **black-box**: test behavior, không phải implementation.
- Sử dụng `createTestingPinia()` cho stores.
- Sử dụng `flushPromises()` sau các async operations.
- Không bao giờ snapshot-only tests — luôn bao gồm các assertions có ý nghĩa.
- Nhóm với `describe` blocks khớp với file đang test.
- Một `it` / `test` cho mỗi behavior.

---

## Phase 4 — Fix Failing Tests

For each failing test:

1. Read the error message carefully — do not guess.
3. Determine root cause:
   - **Test is broken** → fix the test assertion or setup.
   - **Implementation is broken** → fix the source code (follow TDD red→green cycle).
4. Never delete a failing test to make CI green.
5. Re-run the specific test file after each fix to verify.

---

## Phase 5 — Verify Tất Cả Pass

1. Chạy toàn bộ unit test suite:
   ```
   npx vitest run
   ```
2. Tất cả tests phải **xanh** trước khi tuyên bố done.
3. Thêm một summary ngắn: tests đã thêm, tests đã sửa, coverage delta (nếu có).

---

## Quy Tắc

- **Không bao giờ disable hoặc skip một test** nếu không có comment giải thích tại sao và một linked issue.
- **Không bao giờ mock implementation details** — mock boundaries (HTTP, DB, file system).
- **Giữ tests nhanh** — unit tests < 100 ms mỗi cái; E2E chỉ cho các flows mà unit tests không thể cover.
- Tuân theo các naming conventions hiện có trong codebase.
- Áp dụng các skills `clean-code` và `vue-best-practices` khi viết các test files mới.
