---
title: Project Management - Index
version: 1.0
author: Admin Team
date: 2026-06-23
---

# Project Management — Index

> Related: [01-backend.md](./01-backend.md) | [02-frontend.md](./02-frontend.md) | [03-behavior.md](./03-behavior.md) | [04-quality.md](./04-quality.md)

---

## 1. Executive Summary

Tính năng quản lý Project cho phép admin tạo và quản lý các Project AI Content Generation. Mỗi Project lưu trữ thông tin cấu hình như tên, mô tả, system prompt riêng biệt để AI hiểu chủ đề và tạo nội dung đồng nhất với brand voice. Giao diện sử dụng Card grid thay vì DataTable truyền thống, với Modal CRUD thay vì page riêng cho create/edit.

---

## 2. Changelog

| Version | Date | Author | Summary |
|---------|------|--------|---------|
| 1.0 | 2026-06-23 | Admin Team | Initial design |

---

## 3. Objective & Scope

### Purpose

Cung cấp giao diện quản lý Project cho admin, cho phép CRUD các Project AI Content Generation với giao diện Card-based, Modal CRUD, và soft delete.

### In Scope

- Xem danh sách Project dạng Card grid (không filter, không phân trang)
- Tạo Project mới qua Modal Dialog
- Chỉnh sửa Project qua Modal Dialog (cả 3 trường chính: name, description, projectPrompt)
- Xoá Project (soft delete) với Confirm Dialog
- Xem chi tiết Project ở trang riêng (read-only)
- Các trường ẩn: headline, caption, subtext (mặc định rỗng, dự trữ cho tương lai)
- Audit log cho tất cả hành động CREATE/UPDATE/DELETE

### Out of Scope

- Filter và phân trang danh sách Project
- Tính năng AI generation gắn với Project
- Quản lý member trong Project
- Import/export Project
- Các trường ẩn (headline, caption, subtext) — chỉ tạo trong DB, chưa có UI

---

## 4. Architecture Overview

### System Diagram

```
┌─────────────────────────────────────────────┐
│              Vue.js Frontend                │
│  ProjectListPage / ProjectDetailPage        │
│  ProjectCard / ProjectFormDialog            │
└──────────────────┬──────────────────────────┘
                   │ HTTP/REST (Axios)
┌──────────────────▼──────────────────────────┐
│            Express.js Backend               │
│  ┌────────────────────────────────────────┐ │
│  │  Projects Module (admin/)             │ │
│  │  Route → Controller → Service → Repo  │ │
│  │  asyncHandler + authMiddleware + Zod  │ │
│  └────────────────────────────────────────┘ │
│  errorMiddleware (central error handler)     │
└──────────────────┬──────────────────────────┘
                   │ Prisma Client
┌──────────────────▼──────────────────────────┐
│              MySQL Database                 │
│  projects table                             │
└─────────────────────────────────────────────┘
```

### Data Model Summary

| Table | Purpose |
|-------|---------|
| `projects` | Lưu thông tin Project AI Content Generation; soft delete qua flag `is_deleted` |

Schema khai báo bằng **Prisma** tại `server/prisma/schema.prisma` (xem chi tiết tại [01-backend.md → Section 1.1](./01-backend.md)). Server-side sử dụng Prisma Client để truy cập DB; client-side gọi API qua `projectsApiService` (`client/src/services/projects.service.ts`).

TypeScript types mô tả property (không code block) — xem tại [01-backend.md → Section 1.2](./01-backend.md) cho server + [02-frontend.md → Section 7](./02-frontend.md) cho client.

---

## 5. Spec File Index

| File | Nội dung |
|------|----------|
| [01-backend.md](./01-backend.md) | DB schema (Prisma), TypeScript DTOs, 5 API endpoints (SV-001–SV-005), validation rules, error handling |
| [02-frontend.md](./02-frontend.md) | File structure, component tree, wireframes, screen item specs, composable, store, TypeScript types |
| [03-behavior.md](./03-behavior.md) | Page events & handlers, UI states, confirm dialogs, navigation flows, sequence diagrams |
| [04-quality.md](./04-quality.md) | Backend unit + integration tests, frontend UT tables, performance, security, logging |

---

## Quy ước chung (áp dụng cho toàn bộ spec package)

- **TypeScript types:** Mô tả chỉ liệt kê tên + property (không dùng code block). Trỏ file thực tế để tra cứu khi cần.
- **Database schema:** Mô tả dạng Prisma model (bảng property) — không viết raw `CREATE TABLE` SQL.
- **Response/request JSON examples:** Code block được phép (chỉ thể hiện contract, không phải type definition).
- **File structure tree, sequence diagram ASCII:** Code block được phép (visual representation).
- **Nội dung:** Tiếng Việt; headers/section titles giữ tiếng Anh.
