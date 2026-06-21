--- 
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code 
--- 

# Viết Kế Hoạch Triển Khai

**Lưu kế hoạch vào:** `docs/<topic>/plans/YYYY-MM-DD-<topic>.md`

## Tổng Quan

Viết các kế hoạch sẵn sàng thực thi cho skill `executing-plans`. Đối tượng: các developer có kinh nghiệm nhưng không có context về codebase hoặc lĩnh vực bài toán của chúng ta. DRY. YAGNI. TDD. Commit thường xuyên.

Với các task coding, tuân theo thứ tự TDD khi có thể: viết một test thất bại reference đến spec, triển khai vừa đủ để test pass, verify test pass, rồi commit. Đối với các task không phải coding (ví dụ: schema migrations, config changes), TDD không bắt buộc.

## Kiểm Tra Phạm Vi

Nếu spec bao gồm nhiều subsystem độc lập, tách thành các kế hoạch riêng — mỗi subsystem một kế hoạch. Mỗi kế hoạch phải tạo ra phần mềm hoạt động được và có thể test được một cách độc lập.

## Cấu Trúc Phase

Tổ chức các task thành **Phases**. Các phase là tuần tự — mỗi phase chỉ bắt đầu sau khi phase trước hoàn thành. Các task trong cùng một phase cũng được thực thi tuần tự.

Quy tắc:
- Nhóm các task có liên quan logic với nhau vào cùng một phase.
- Chỉ bắt đầu phase mới khi các task phụ thuộc vào output từ phase trước.
- Nếu kế hoạch chỉ có một phase, sử dụng duy nhất heading `## Phase 1 — [Tên]` với các task lồng bên trong.

## Cấu Trúc File

Trước khi định nghĩa các task, lập bản đồ các file sẽ được tạo hoặc sửa đổi và mỗi file chịu trách nhiệm gì. Đây là nơi các quyết định phân rã được khóa lại.

- Thiết kế các unit với boundaries rõ ràng và interfaces được định nghĩa tốt. Mỗi file nên có một trách nhiệm rõ ràng duy nhất.
- Bạn suy luận tốt nhất về code có thể giữ trong context cùng một lúc, và các edit đáng tin cậy hơn khi files tập trung. Ưu tiên các file nhỏ, tập trung hơn các file lớn làm quá nhiều việc.
- Các file thay đổi cùng nhau nên sống cùng nhau. Tách theo trách nhiệm, không theo technical layer.
- Trong codebase hiện có, tuân theo các pattern đã thiết lập. Nếu codebase sử dụng file lớn, không tự ý tái cấu trúc - nhưng nếu file bạn đang sửa đã phát triển cồng kềnh, việc bao gồm một phần tách trong kế hoạch là hợp lý.

Cấu trúc này thông báo cho việc phân rã task. Mỗi task nên tạo ra các thay đổi độc lập có ý nghĩa.

## Nguyên Tắc Lập Kế Hoạch (KHÔNG phải Template Task cố định!)

### Nguyên Tắc 1: Giữ NGẮN GỌN
- Tối đa 5-10 task rõ ràng
- Chỉ các mục có thể hành động
- Giữ phần mô tả task trong spec. Không có code trong phần thân task.

### Nguyên Tắc 2: Reference Design Spec trong Mọi Task
> **Mọi task triển khai phải trace trực tiếp đến nguồn spec của nó. Không bao giờ triển khai từ bộ nhớ hoặc giả định.**
- Triển khai theo `01-backend.md` — SV-002"
- Xây dựng `[ListPage]` theo `02-frontend.md` — Section 3.1
- Viết unit tests theo `04-quality.md` — bảng [CreatePage] Unit Tests
- Xử lý validation form theo các quy tắc trong `01-backend.md` — Section 3. Validation Rules

> **Quy tắc:** Mỗi task phải bao gồm trường `**Spec Reference:**` liên kết đến file spec và section chính xác. Một executor chưa từng thấy feature phải có thể mở spec và biết chính xác cần build gì.

### Nguyên Tắc 3: Tests được nhúng trong task, không trì hoãn
- Tests sống trong cùng task với code mà chúng test.

### Nguyên Tắc 4: Không Placeholders hoặc Ngôn Ngữ Mơ Hồ
- Không `[TODO]`, `TBD`, đường dẫn mơ hồ (`path/to/file.ts`), hoặc các bước không có kết quả có thể verify. Mọi command phải có kết quả mong đợi.
> **Quy tắc:** Nếu một bước yêu cầu executor phải hỏi câu hỏi trước khi hành động, nó phải được viết lại.

## Nguyên Tắc 5: Tách Phases qua nhiều file
- Tách phases thành 4 files, Không tạo bất kỳ file nào khác ngoài 4 file dưới đây:
`2024-06-15-vocabularies-01-migration.md`: DB schema + migration tasks. Mô tả ngắn gọn
`2024-06-17-vocabularies-02-backend.md`: Backend API tasks + Test tasks liên quan đến backend + Build success/test verification
`2024-06-19-vocabularies-03-frontend.md`: Frontend store + UI tasks + Test tasks liên quan đến frontend, Build success/test verification
`2024-06-20-vocabularies-04-review.md`: review tests + review code

## Header của Kế Hoạch
**Mọi kế hoạch PHẢI bắt đầu với header này:**

````markdown
# [Feature Name] Implementation Plan
> **For agentic workers:** REQUIRED SKILL: Use skill `executing-plans` to implement this plan.
> **Execution mode:** Phases are sequential. Tasks within a phase are executed sequentially.

## Plan Structure
````markdown
## Phase 1 — [Tên]
### Task N: [Tên Task]

**Spec Reference:** `docs/<topic>/specs/<topic>-design/01-backend.md — Section X.Y`

**Files:**
- Create: `exact/path/to/file.ts`
- Modify: `exact/path/to/existing.ts`
- Test: `exact/path/to/test.spec.ts` _(bỏ qua nếu task không có tests)_

- **Bước 1:** [Mô tả cần làm gì — ví dụ: chạy migration, triển khai endpoint, viết tests trong Section X.Y của 01-backend.md, v.v.]
[Không mô tả cách làm — executor sẽ đọc spec và tự tìm ra chi tiết triển khai. Task nên rõ ràng và có thể hành động được mà không cần giải thích thêm.]
  - Run: `[command]`
  - Expected: [kết quả có thể verify]

- **Bước 2: Commit**
  - `git add [files]`
  - `git commit -m "feat: [mô tả]"`

````
## Self-Review (chạy trước khi lưu)

1. **Spec coverage** — mọi yêu cầu spec map đến một task. Thêm các task còn thiếu.
2. **Placeholder scan** — không có đường dẫn mơ hồ, command thiếu, hoặc kết quả không thể verify.
3. **Type consistency** — types và method names khớp nhau xuyên suốt các task.
4. **Dependency check** — các task phụ thuộc vào output của phase trước nằm trong phase sau.
5. **Test coverage check** — mọi task viết logic bao gồm tests trong cùng task. Không task nào trì hoãn tests cho phase sau. Các task không có logic (migrations, config, type files) có thể bỏ qua tests.
