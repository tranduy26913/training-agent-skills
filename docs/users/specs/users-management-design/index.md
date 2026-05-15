---
title: User Management Feature Design
version: 1.2
author: Admin Team
date: 2026-04-20
status: Draft
---

# User Management Feature Design

## Executive Summary

Tính năng User Management cho phép admin quản lý toàn bộ vòng đời tài khoản người dùng trong hệ thống nội bộ, bao gồm xem danh sách, tìm kiếm, lọc, tạo mới, chỉnh sửa, xem lịch sử thay đổi và xóa tài khoản. Mục tiêu là cung cấp một luồng quản trị nhất quán, an toàn và có audit trail đầy đủ cho mọi thao tác quan trọng.

## Changelog

| Version | Date | Author | Summary |
|---------|------|--------|---------|
| 1.0 | 2026-04-15 | Admin Team | Initial design |
| 1.1 | 2026-04-16 | Admin Team | Add sortable columns and skeleton loading to user table |
| 1.2 | 2026-04-20 | Admin Team | [UPDATE - CR-USERS-001] Add last login, points, note, birthday, email duplicate check, and clear filters |

### Summary of Changes

Phiên bản hiện tại mở rộng phạm vi quản trị user theo hướng thực dụng hơn cho admin: bảng danh sách hiển thị thêm `last_login_at` và `points`, form create/edit hỗ trợ `note` và `birthday`, client kiểm tra trùng email theo debounce để giảm lỗi submit, và trang list có thêm hành động `Clear Filters` để reset nhanh toàn bộ điều kiện lọc.

---

## 1. Objective & Scope

### Purpose

Cung cấp giao diện quản lý user account toàn diện cho admin với CRUD cơ bản, theo dõi lịch sử thay đổi, và các guard cần thiết để giảm sai sót vận hành.

### Problem Statement

Hệ thống cần một màn hình quản trị user tập trung để admin có thể tìm kiếm, cập nhật và kiểm soát trạng thái tài khoản mà không phải thao tác trực tiếp trên database hoặc qua nhiều màn hình rời rạc. Nếu không có thiết kế rõ ràng cho validation, authorization và audit trail, các thao tác quản trị dễ gây sai lệch dữ liệu hoặc khó truy vết.

### Success Criteria

- Admin có thể xem danh sách user với filter, sort và pagination ở server side.
- Admin có thể tạo mới và chỉnh sửa user với validation nhất quán giữa frontend và backend.
- Mọi thao tác create, update, delete đều ghi audit log.
- Hệ thống chặn việc admin tự xóa chính mình.
- Lỗi email trùng lặp được phát hiện trước submit ở client và vẫn được enforce ở server.

### In Scope

- Xem danh sách user với phân trang.
- Tìm kiếm user theo tên hoặc email.
- Lọc user theo role, status và date range.
- Sort danh sách theo các cột được whitelist.
- Tạo user mới với mật khẩu mặc định sinh từ email username.
- Chỉnh sửa các field quản trị: `name`, `email`, `role`, `status`, `note`, `birthday`.
- Hiển thị `last_login_at` và `points` ở list và detail phù hợp.
- Xóa user với guard chặn self-delete.
- Xem lịch sử audit log của từng user.
- Kiểm tra email trùng lặp với debounce ở client.

### Out of Scope

- Reset password hoặc forgot password.
- Bulk import/export users.
- Fine-grained permission management.
- User groups hoặc departments.
- Chỉnh sửa `points` từ giao diện admin trong phiên bản này.

### Assumptions

- Chỉ admin mới được truy cập toàn bộ feature này.
- Bảng `users` đã tồn tại và hỗ trợ các cột mới `last_login_at`, `points`, `note`, `birthday`.
- Bảng `audit_logs` có thể ghi nhận create, update, delete cho user management.
- Frontend và backend đều dùng chuẩn response/error chung của project.

### Dependencies

- JWT authentication middleware ở backend.
- Users module ở backend theo layered architecture.
- PrimeVue DataTable, form controls, dialog, toast ở frontend.
- Database migration cho `audit_logs` và các cột bổ sung ở `users`.

---

## 2. Document Map

| File | Purpose |
|------|---------|
| `architecture-data.md` | Kiến trúc hệ thống, data model, state transitions, sequence diagrams |
| `frontend-spec.md` | Hành vi UI, page flows, component responsibilities, client state |
| `backend-api.md` | Endpoint contracts, validation, authorization, error contract, business rules |
| `quality-operations.md` | Testing, performance, observability, rollout, risks, acceptance |

---

## 3. Cross-Cutting Decisions

### Business Rules Ownership

- Rule về quyền truy cập, uniqueness email, self-delete guard, audit trail và edit constraints được định nghĩa chuẩn trong `backend-api.md`.
- Rule về UX filter, debounce, inline error, loading state và navigation flow được định nghĩa chuẩn trong `frontend-spec.md`.
- Rule về state transitions của user record và audit lifecycle được định nghĩa chuẩn trong `architecture-data.md`.
- Rule về testing coverage, operational visibility và release considerations được định nghĩa chuẩn trong `quality-operations.md`.

### Terminology

- `Admin`: user có quyền quản trị toàn bộ user accounts.
- `Audit Log`: bản ghi lịch sử thao tác create, update, delete trên user.
- `Current User`: user đang được load trên edit page.
- `Email Duplicate Check`: API nhẹ dùng để xác nhận email đã tồn tại hay chưa trước khi submit form.

### Open Questions

- Endpoint `GET /api/users/check-email` có nên yêu cầu auth token để giảm abuse hay giữ public trong phạm vi nội bộ.
- Trong tương lai nếu xuất hiện `super-admin`, rule nâng cấp role cho admin thường có cần giới hạn thêm hay không.
- Sau khi tạo user thành công, có nên hiển thị mật khẩu tạm thời một lần duy nhất hay chỉ áp dụng cơ chế email invitation ở phiên bản sau.

---

## 4. Approval Sign-off

| Role | Name | Status | Date | Notes |
|------|------|--------|------|-------|
| Product Owner | [Pending] | Pending | [YYYY-MM-DD] | Review scope and workflows |
| Engineering | [Pending] | Pending | [YYYY-MM-DD] | Review architecture and API ownership |
| QA | [Pending] | Pending | [YYYY-MM-DD] | Review testability and acceptance criteria |