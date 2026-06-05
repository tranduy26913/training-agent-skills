---
name: review-spec
description: Review the specified specification document against the provided checklist and template. Identify missing information, inconsistencies, ambiguities, violations of standards, and template deviations.
---

Generate a review report containing all findings.

## Inputs
The user must provide:
* One or more specification files to review.
* Requirements of the feature or system being specified (if not clear from the document).

# Review Process

1. Read all specified specification files.
2. Review the document against each rule in the checklist.
3. Report only issues that can be justified by the document content.
4. Provide actionable correction guidance for every issue found.

# Review checklist
- Requirements ambiguous enough to cause someone to build the wrong thing
- Specification must match the provided template structure and formatting
Template in folder: `.github/skills/brainstorming/reference/`
- Internal contradictions, conflicting requirements
- The specifications must not contain internal contradictions or conflicting requirements.
- Focused enough for a single plan — not covering multiple independent subsystems
- Specification documents are not allowed to describe source code.

# Reporting Rules

* Every finding must include:
  * Error description
  * File location
  * Recommended correction
* Use file path and line number whenever available.
* Avoid duplicate findings.
* Merge findings that share the same root cause.
* Sort findings according to their appearance in the document.
* If no issue is found, explicitly state that the review passed.

# Output Format
Only respond with a review report following the required output format. Do not include any additional commentary or explanation.
If no issue is found:

```text
Không phát hiện lỗi theo checklist.
```
If issues are found, generate the report using the following Vietnamese template:

| No | Nội dung lỗi                                                       | Vị trí (file-line)      | Hướng chỉnh sửa                                                  |
| -- | ------------------------------------------------------------------ | ----------------------- | ---------------------------------------------------------------- |
| 1  | Thiếu mô tả điều kiện xử lý khi người dùng chưa nhập mã khách hàng | 02-frontend.md:125 | Bổ sung mô tả hành vi hệ thống khi trường mã khách hàng để trống |
| 2  | Typescript model đang viết toàn bộ code của các trường | 01-backend.md:43 | Chỉ mô tả tên model và các field, không viết code chi tiết |
| 3  | Tên trường không nhất quán giữa màn hình và API                    | docs/member-spec.md:248 | Sử dụng cùng một tên trường hoặc bổ sung mapping rõ ràng         |