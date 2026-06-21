---
name: code-review
description: Code review hai lượt — Technical (rule-based) + Design Spec compliance. Tạo báo cáo findings có cấu trúc.
context: fork
---

# Code Review

**Thông báo khi bắt đầu:** "Tôi đang sử dụng skill code-review."

## Tổng Quan

Skill này thực hiện một code review hai lượt có cấu trúc trên một git diff range:

1. **Lượt 1 — Technical Review**: kiểm tra tất cả files đã thay đổi theo catalog quy tắc trong `review-rules.md`. Mỗi quy tắc có một ID (`R-XXX`) bao gồm Code Quality, Architecture, TypeScript, Vue 3, Security, và Performance. Mọi finding phải cite Rule ID của nó.

2. **Lượt 2 — Design Spec Review** _(khi có spec files được cung cấp)_: verify rằng implementation khớp chính xác với design đã thống nhất — endpoints, DTOs, validation, screen items, i18n keys, event handlers, và UI states như được định nghĩa trong `01-backend.md`, `02-frontend.md`, và `03-behavior.md`.

Sau cả hai lượt, skill tạo ra một **Review Report** với bảng findings (Rule | File:Line | Severity | Description | Fix), một summary theo category, và verdict **Ready to merge?** rõ ràng cùng với checklist required-actions.

**Nguyên tắc cốt lõi:** Mọi finding phải cite một Rule ID (hoặc "spec") và nêu rõ nó có thể được sửa trong session này hay không.

---

## Khi Nào Chạy

- Sau khi hoàn thành một feature hoặc task lớn
- Trước khi merge vào main
- Khi bị stuck (góc nhìn mới)

---

## Đầu Vào

| Đầu vào | Bắt buộc | Mô tả |
|---------|----------|-------|
| `WHAT_WAS_IMPLEMENTED` | ✅ | Tóm tắt một dòng về những gì đã được build |
| `SPEC_FILES` | optional | Paths đến `01-backend.md`, `02-frontend.md`, `03-behavior.md` |

---

## Lượt 1 — Technical Review

Load `code-review/review-rules.md`.

Với mỗi file đã thay đổi, kiểm tra mọi quy tắc áp dụng. Ghi lại mỗi vi phạm như một finding:

| Trường | Giá trị |
|--------|---------|
| Rule | `R-XXX` |
| File:Line | vị trí chính xác |
| Severity | Critical / Important / Minor |
| Description | cái gì sai và tại sao nó quan trọng |
| Fix | `Yes — [how]` hoặc `No — [reason]` |

Áp dụng tất cả các category quy tắc liên quan đến loại file:
- Chạy build và tests trước — bất kỳ failure nào là Critical findings
- Tất cả files: R-001 to R-010 (Code Quality)
- Backend/Express files: R-011 to R-017 (Architecture), R-041 to R-045 (Security), R-051 to R-053 (Performance), R-071 to R-076 (Express)
- Vue component files: R-031 to R-038 (Vue 3), R-052 to R-054 (Performance), R-061 to R-067 (PrimeVue), R-101 to R-106 (i18n)
- TypeScript files: R-021 to R-025 (TypeScript)
- Pinia store files: R-091 to R-096 (Pinia Store)
- Database/SQL files: R-081 to R-086 (MySQL)
- Locale JSON files: R-101 to R-106 (i18n)

---

## Lượt 2 — Design Spec Review

> Bỏ qua nếu `SPEC_FILES` không được cung cấp.

Với mỗi spec file được cung cấp, verify implementation khớp chính xác:

**`01-backend.md`:**
- Tất cả endpoints tồn tại với method, path, request body, response shape đúng
- Tất cả validation rules được áp dụng
- Tất cả error codes được trả về như đã specify

**`02-frontend.md`:**
- Tất cả screen items có mặt (controls, props, emits khớp)
- Tất cả i18n keys được sử dụng (không có raw display strings)
- Component boundary structure khớp

**`03-behavior.md`:**
- Tất cả event handlers được triển khai
- Tất cả UI states được xử lý (loading, empty, error, success)
- Tất cả navigation flows và confirm dialogs có mặt

Ghi lại mỗi deviation như một finding với:
- Severity: Critical (functionality broken) / Important (spec deviated) / Minor (cosmetic)
- Fix: `Yes — [how]` hoặc `No — [reason]`

---

## Định Dạng Báo Cáo

Sau cả hai lượt, output toàn bộ review report:

```
## Code Review Report
**Feature:** {WHAT_WAS_IMPLEMENTED}

---

### Findings

| # | Rule | File:Line | Severity | Description | Fix |
|---|------|-----------|----------|-------------|-----|
| 1 | R-004 | src/services/user.ts:45 | Important | Deep nesting — 4 levels of if/else | Yes — refactor with guard clauses |
| 2 | R-038 | src/pages/UserList.vue:12 | Important | Raw string "Danh sách người dùng" — use i18n key | Yes — use `$t('users.list.pageTitle')` |
| 3 | spec | src/api/users.ts | Critical | POST /users missing `role` field in response DTO | Yes — add to response mapper |

_(Fill with actual findings — remove example rows)_

---

### Summary

| Category | Critical | Important | Minor | Total |
|----------|----------|-----------|-------|-------|
| Technical (R-XXX) | 0 | 1 | 2 | 3 |
| Spec Compliance | 1 | 1 | 0 | 2 |
| **Total** | **1** | **2** | **2** | **5** |

---
```

---

## Sau Báo Cáo

- Sửa tất cả các **Critical** findings ngay lập tức
- Sửa tất cả các **Important** findings trước khi tiếp tục
- Log các **Minor** findings để cải thiện sau
- Nếu một finding sai: push back với technical reasoning và evidence

Xem quy tắc tại: `code-review/review-rules.md`
