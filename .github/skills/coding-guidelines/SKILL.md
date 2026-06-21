---
name: coding-guidelines
description: Hướng dẫn hành vi để giảm các lỗi lập trình phổ biến của LLM. Sử dụng khi viết, review, hoặc refactor code để tránh phức tạp hóa, thực hiện các thay đổi có chọn lọc, làm rõ giả định, và định nghĩa tiêu chí thành công có thể kiểm chứng.
---

# Clean Code - Tiêu Chuẩn Lập Trình AI Thực Dụng

> **SKILL QUAN TRỌNG** - Hãy **ngắn gọn, trực tiếp, và tập trung vào giải pháp**.

---

## Nguyên Tắc Cốt Lõi
| Nguyên tắc | Quy tắc |
|-----------|---------|
| **SRP** | Single Responsibility - mỗi function/class làm MỘT việc |
| **DRY** | Don't Repeat Yourself - trích xuất các đoạn trùng lặp, tái sử dụng |
| **KISS** | Keep It Simple - giải pháp đơn giản nhất hoạt động được |
| **YAGNI** | You Aren't Gonna Need It - không xây dựng tính năng không dùng |
| **Boy Scout** | Để code sạch hơn so với lúc bạn tìm thấy nó |

---

## Hướng Dẫn Comment
**QUAN TRỌNG** comment bằng tiếng Anh và tiếng Nhật.
### 1. Sử dụng cả comment tiếng Anh và tiếng Nhật
Comments nên được viết bằng cả tiếng Anh và tiếng Nhật để đảm bảo sự rõ ràng cho tất cả các thành viên trong team. Sử dụng ngôn ngữ ngắn gọn.

### 2. Comment trong tất cả functions, classes, và logic phức tạp
- Mọi function và class nên có một comment giải thích mục đích, parameters, và return value của nó.
- Logic phức tạp nên được giải thích bằng comments để làm rõ ý định và lý do.

### 3. Không Để Code Đã Comment
- Không để lại code đã được comment trong codebase
- Sử dụng version control nếu bạn cần lấy lại code cũ

### 4. Sử dụng TODO và FIXME
```
// TODO: Optimize query when table exceeds 100k records
// FIXME: Memory leak on logout (see issue #789)
```

### 5. JSDoc cho Public APIs
Document các public functions, classes, và APIs với JSDoc comments bao gồm parameters, return types, và examples.


## Quy Tắc Đặt Tên

| Element | Convention |
|---------|------------|
| **Variables** | Thể hiện ý định: `userCount` thay vì `n` |
| **Functions** | Động từ + danh từ: `getUserById()` không phải `user()` |
| **Booleans** | Dạng câu hỏi: `isActive`, `hasPermission`, `canEdit` |
| **Constants** | SCREAMING_SNAKE: `MAX_RETRY_COUNT` |

> **Quy tắc:** Nếu bạn cần một comment để giải thích một tên, hãy đổi tên nó.

---

## Quy Tắc Function

| Quy tắc | Mô tả |
|---------|-------|
| **Small** | Tối đa 20 dòng, lý tưởng 5-10 |
| **One Thing** | Làm một việc, làm tốt việc đó |
| **One Level** | Một level of abstraction cho mỗi function |
| **Few Args** | Tối đa 3 arguments, ưu tiên 0-2 |
| **No Side Effects** | Không mutate inputs bất ngờ |

---

## Suy Nghĩ Trước Khi Code

**Đừng giả định. Đừng che giấu sự bối rối. Làm rõ các tradeoffs.**

Trước khi triển khai:
- Phát biểu các giả định của bạn một cách rõ ràng. Nếu không chắc chắn, hãy hỏi.
- Nếu có nhiều cách diễn giải, hãy trình bày chúng - đừng chọn im lặng.
- Nếu một cách tiếp cận đơn giản hơn tồn tại, hãy nói ra. Phản đối khi được đảm bảo.
- Nếu điều gì đó không rõ ràng, hãy dừng lại. Nêu rõ điều gây bối rối. Hỏi.

## Đơn Giản Trước

**Code tối thiểu giải quyết vấn đề. Khng có gì suy đoán.**

- Không có tính năng nào ngoài những gì được yêu cầu.
- Không có abstractions cho code dùng một lần.
- Không có "flexibility" hoặc "configurability" không được yêu cầu.
- Không có error handling cho các scenarios không thể xảy ra.
- Nếu bạn viết 200 dòng và nó có thể chỉ cần 50 dòng, hãy viết lại.

Tự hỏi mình: "Một senior engineer có nói điều này quá phức tạp không?" Nếu có, hãy đơn giản hóa.

## Thay Đổi Có Chọn Lọc

**Chỉ chạm vào những gì bạn phải. Chỉ dọn dẹp mớ hỗn độn của chính bạn.**

Khi edit code hiện có:
- Đừng "cải thiện" adjacent code, comments, hoặc formatting.
- Đừng refactor những thứ không bị broken.
- Khớp với style hiện có, ngay cả khi bạn sẽ làm khác.
- Nếu bạn nhận thấy dead code không liên quan, hãy đề cập - đừng xóa nó.

Khi các thay đổi của bạn tạo ra orphans:
- Xóa imports/variables/functions mà các thay đổi CỦA BẠN làm cho không dùng nữa.
- Không xóa pre-existing dead code trừ khi được yêu cầu.

Kiểm tra: Mọi dòng đã thay đổi phải trace trực tiếp đến yêu cầu của người dùng.

## Thực Thi Hướng Mục Tiêu

**Định nghĩa tiêu chí thành công. Lặp cho đến khi verified.**

Biến đổi các task thành các mục tiêu có thể kiểm chứng:
- "Thêm validation" → "Viết tests cho invalid inputs, sau đó làm cho chúng pass"
- "Sửa bug" → "Viết một test tái tạo nó, sau đó làm cho nó pass"
- "Refactor X" → "Đảm bảo tests pass trước và sau"

Đối với các task nhiều bước, nêu một kế hoạch ngắn:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Tiêu chí thành công mạnh cho phép bạn lặp độc lập. Tiêu chí yếu ("make it work") đòi hỏi sự làm rõ liên tục.