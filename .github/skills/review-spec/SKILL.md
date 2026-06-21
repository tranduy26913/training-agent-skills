---
name: review-spec
description: Review the specified specification document against the provided checklist and template. Identify missing information, inconsistencies, ambiguities, violations of standards, and template deviations.
---

Tạo báo cáo review chứa tất cả findings.

## Đầu Vào
Người dùng phải cung cấp:
* Một hoặc nhiều file specification cần review.
* Yêu cầu của feature hoặc hệ thống đang được specify (nếu không rõ ràng từ tài liệu).

# Quy Trình Review

1. Đọc tất cả các file specification được chỉ định.
2. Review tài liệu theo từng quy tắc trong checklist.
3. Chỉ báo cáo các vấn đề có thể được chứng minh bởi nội dung tài liệu.
4. Cung cấp hướng dẫn chỉnh sửa có thể hành động cho mọi vấn đề được phát hiện.

# Checklist Review
- Yêu cầu mơ hồ đủ để khiến ai đó build sai thứ
- Specification phải khớp với cấu trúc và định dạng template được cung cấp
Template trong folder: `.github/skills/brainstorming/reference/`
- Mâu thuẫn nội bộ, yêu cầu xung đột
- Specifications không được chứa mâu thuẫn nội bộ hoặc yêu cầu xung đột.
- Đủ tập trung cho một kế hoạch duy nhất — không bao gồm nhiều subsystem độc lập
- Tài liệu specification không được phép mô tả source code.

# Quy Tắc Báo Cáo

* Mọi finding phải bao gồm:
  * Mô tả lỗi
  * Vị trí file
  * Hướng chỉnh sửa được đề xuất
* Sử dụng file path và line number khi có sẵn.
* Tránh các findings trùng lặp.
* Hợp nhất các findings chia sẻ cùng root cause.
* Sắp xếp findings theo thứ tự xuất hiện trong tài liệu.
* Nếu không tìm thấy vấn đề nào, nêu rõ rằng review đã pass.

# Định Dạng Output
Chỉ respond với báo cáo review theo định dạng output được yêu cầu. Không bao gồm bất kỳ bình luận hoặc giải thích bổ sung nào.
Nếu không tìm thấy vấn đề nào:

```text
Không phát hiện lỗi theo checklist.
```
If issues are found, generate the report using the following Vietnamese template:

| No | Nội dung lỗi                                                       | Vị trí (file-line)      | Hướng chỉnh sửa                                                  |
| -- | ------------------------------------------------------------------ | ----------------------- | ---------------------------------------------------------------- |
| 1  | Thiếu mô tả điều kiện xử lý khi người dùng chưa nhập mã khách hàng | 02-frontend.md:125 | Bổ sung mô tả hành vi hệ thống khi trường mã khách hàng để trống |
| 2  | Typescript model đang viết toàn bộ code của các trường | 01-backend.md:43 | Chỉ mô tả tên model và các field, không viết code chi tiết |
| 3  | Tên trường không nhất quán giữa màn hình và API                    | docs/member-spec.md:248 | Sử dụng cùng một tên trường hoặc bổ sung mapping rõ ràng         |