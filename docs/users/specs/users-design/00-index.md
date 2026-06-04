---
title: User Management - Index
version: 1.2
author: Admin Team
date: 2026-05-17
---

# User Management — Index

> Related: [01-backend.md](./01-backend.md) | [02-frontend.md](./02-frontend.md) | [03-behavior.md](./03-behavior.md) | [04-quality.md](./04-quality.md)

---

## 1. Executive Summary

Tính năng quản lý user cho phép admin xem danh sách toàn bộ user, tìm kiếm/lọc, tạo user mới, chỉnh sửa thông tin user, thay đổi vai trò và trạng thái, và xóa user. Mỗi thao tác được ghi lại trong audit log để theo dõi và tuân thủ.

---

## 2. Changelog

| Version | Date | Author | Summary |
|---------|------|--------|---------|
| 1.0 | 2026-04-15 | Admin Team | Initial design |
| 1.1 | 2026-04-16 | Admin Team | Add sortable columns và skeleton loading cho UserTable |
| 1.2 | 2026-04-20 | Admin Team | [CR] Thêm Last Login, Points columns; thêm Note & Birthday fields; email duplicate check; nút Clear Filters |

---

## 3. Objective & Scope

### Purpose

Cung cấp giao diện quản lý toàn diện cho admin quản lý user account trong hệ thống, bao gồm các thao tác CRUD cơ bản và tracking lịch sử thay đổi.

### In Scope

- Xem danh sách user với phân trang, tìm kiếm, lọc, sắp xếp server-side
- Lọc theo role, status, date range; nút Clear Filters reset tất cả
- Tạo user mới (auto-generate password, không hiển thị)
- Chỉnh sửa thông tin user: name (2–50), email (unique), role, status, note (max 500), birthday (no future)
- Xóa user (không thể xóa chính mình)
- Xem lịch sử audit log cho mỗi user (max 10 entries)
- Hiển thị Last Login, Points trong bảng user
- Email duplicate check với debounce 500ms
- Tracking audit log cho tất cả hành động (CREATE/UPDATE/DELETE)

### Out of Scope

- Quên mật khẩu / đặt lại mật khẩu
- Bulk import/export
- Permission management chi tiết
- User groups/departments

---

## 4. Architecture Overview

### System Diagram

```
┌─────────────────────────────────────────────┐
│               Vue.js Frontend               │
│  UserListPage / UserCreatePage / UserEditPage│
└──────────────────┬──────────────────────────┘
                   │ HTTP/REST
┌──────────────────▼──────────────────────────┐
│            Express.js Backend               │
│  ┌────────────────────────────────────────┐ │
│  │  Users Module                          │ │
│  │  Controller → Service → Repository    │ │
│  └────────────────────────────────────────┘ │
│  Auth Middleware (JWT + admin role check)    │
└──────────────────┬──────────────────────────┘
                   │ SQL
┌──────────────────▼──────────────────────────┐
│              MySQL Database                 │
│  users table  +  audit_logs table           │
└─────────────────────────────────────────────┘
```

### Data Model Summary

| Table | Purpose |
|-------|---------|
| `users` | Tất cả user accounts; các cột mới: `note`, `birthday`, `points`, `last_login_at` |
| `audit_logs` | Lịch sử CREATE/UPDATE/DELETE do admin thực hiện |

Chi tiết schema xem tại [01-backend.md → Section 1](./01-backend.md).

---

## 5. Spec File Index

| File | Nội dung |
|------|----------|
| [01-backend.md](./01-backend.md) | DB schema, TypeScript DTOs, 7 API endpoints (SV-001–SV-007), validation rules, error handling |
| [02-frontend.md](./02-frontend.md) | File structure, component tree, screen item specs, composable, store, TypeScript types |
| [03-behavior.md](./03-behavior.md) | Page events & handlers, UI states, confirm dialogs, navigation flows, sequence diagrams |
| [04-quality.md](./04-quality.md) | Backend unit + integration tests, frontend UT tables, performance, security, logging |
