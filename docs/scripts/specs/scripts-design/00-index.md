---
title: Script Management - Index
version: 1.0
author: Admin Team
date: 2026-06-25
---

# Script Management — Index

> Related: [01-backend.md](./01-backend.md) | [02-frontend.md](./02-frontend.md) | [03-behavior.md](./03-behavior.md) | [04-quality.md](./04-quality.md)

---

## 1. Executive Summary

Tính năng Script Management cho phép admin tạo và quản lý kịch bản (script) cho từng Project. Người dùng nhập các thông tin đầu vào (tên kịch bản, ý tưởng gốc, số nhân vật, số scenes tối thiểu, vibe) và chọn AI Model, click Generate để gọi AI tạo kịch bản theo định dạng JSON free-form. AI Model không lưu vào DB — người dùng chọn lại mỗi lần Generate. Nội dung sau khi gen hiển thị ở bên phải form, có thể lưu dưới dạng draft (chưa gen) hoặc generated (đã gen). Màn hình tạo Script là một Page riêng (không phải Modal), gồm 2 phần: form bên trái, nội dung JSON bên phải. Ở màn hình Chi tiết Project sẽ hiển thị Card Script với số lượng kịch bản và link đến danh sách kịch bản của project.

Đồng thời cập nhật spec Project lên v1.01: thêm Card Script trên ProjectDetailPage và thêm relation 1-N từ Project sang Script.

---

## 2. Changelog

| Version | Date | Author | Summary |
|---------|------|--------|---------|
| 1.0 | 2026-06-25 | Admin Team | Initial design — Script Management + Project spec v1.01 update |

### Summary of Changes

**Tính năng mới (Script Management):**
- **What:** Thêm module Script độc lập (`server/src/modules/admin/scripts/`) cho phép tạo, xem, sửa, xoá kịch bản và generate kịch bản bằng AI.
- **Why:** Admin cần tạo kịch bản nội dung cho từng Project AI Content Generation, tận dụng AI Provider hiện có (Gemini, Zai) để tự động sinh kịch bản.
- **How it affects existing workflows:** Project Detail Page sẽ hiển thị thêm Card Script với số lượng kịch bản. Admin có thể click vào Card để xem danh sách kịch bản của project và tạo kịch bản mới.

**Cập nhật Project spec (v1.01):**
- **What:** Thêm relation 1-N từ Project sang Script (Project có nhiều Scripts). Thêm Card Script trên ProjectDetailPage.
- **Why:** Cần hiển thị kịch bản liên kết với project trên trang chi tiết project.
- **How it affects existing data:** Không ảnh hưởng dữ liệu hiện có — chỉ thêm bảng `scripts` mới với FK `projectId` tham chiếu `projects.id`.

---

## 3. Objective & Scope

### Purpose

Cung cấp giao diện quản lý kịch bản cho admin, cho phép:
- Tạo kịch bản mới cho từng Project thông qua form + AI generate
- Xem danh sách kịch bản của project (card grid)
- Chỉnh sửa kịch bản (sửa input fields + edit JSON content + re-generate)
- Xoá kịch bản (soft delete)
- Generate kịch bản bằng AI (gọi provider, trả về JSON free-form)

### In Scope

- Module Script độc lập: CRUD + generate endpoint
- Bảng `scripts` mới trong DB với FK `projectId` → `projects.id` (quan hệ 1-N)
- Endpoint `GET /api/admin/ai-models` — trả về danh sách AI model từ tất cả provider đã register (static models property)
- Endpoint `POST /api/admin/scripts/generate` — generate kịch bản bằng AI (không lưu DB)
- Trang ScriptListPage (card grid) — danh sách kịch bản theo project
- Trang ScriptFormPage (create/edit chung, phân biệt bằng mode) — 2 phần: form bên trái, JSON content bên phải
- Card Script trên ProjectDetailPage — hiển thị số lượng kịch bản + link đến danh sách
- Vibe: preset tags + custom tags (Chips component, cho phép thêm tag mới)
- Status: `draft` (chưa gen hoặc lưu nháp) | `generated` (đã gen và lưu)
- Soft delete cho Script
- Audit log cho CREATE/UPDATE/DELETE Script
- Cập nhật spec Project lên v1.01

### Out of Scope

- Phân trang và filter danh sách Script
- Tính năng share script giữa nhiều project (N-N) — chỉ 1-N
- Quản lý AI Model CRUD (DB table) — chỉ static models property
- Quản lý vibe tags CRUD (DB table) — chỉ preset + custom inline
- Streaming generate (SSE) — chỉ synchronous generate
- Import/export Script
- Version history cho Script content

---

## 4. Architecture Overview

### System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Vue.js Frontend                          │
│  ScriptListPage / ScriptFormPage                            │
│  ScriptCard / ScriptForm / ScriptContentViewer              │
│  ProjectDetailPage (+ Card Script)                          │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP/REST (Axios)
┌──────────────────▼──────────────────────────────────────────┐
│                   Express.js Backend                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Scripts Module (admin/)                               │ │
│  │  Route → Controller → Service → Repository             │ │
│  │  asyncHandler + authMiddleware + Zod                   │ │
│  │  + Generate endpoint (calls ApiProviderService)         │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  AI Models Endpoint (admin/)                          │ │
│  │  GET /api/admin/ai-models → ApiProviderService         │ │
│  └────────────────────────────────────────────────────────┘ │
│  errorMiddleware (central error handler)                    │
└──────────────────┬──────────────────────────────────────────┘
                   │ Prisma Client
┌──────────────────▼──────────────────────────────────────────┐
│                    MySQL Database                            │
│  projects table (existing)                                  │
│  scripts table (new) — FK projectId → projects.id            │
└─────────────────────────────────────────────────────────────┘
```

### Data Model Summary

| Table | Purpose |
|-------|---------|
| `scripts` | Lưu thông tin kịch bản: input fields, content JSON, status; soft delete qua flag `is_deleted` |
| `projects` (existing) | Thêm relation 1-N: `scripts Script[]` |

Schema khai báo bằng **Prisma** tại `server/prisma/schema/` (xem chi tiết tại [01-backend.md → Section 1.1](./01-backend.md)). Server-side sử dụng Prisma Client để truy cập DB; client-side gọi API qua `scriptsApiService` (`client/src/services/scripts.service.ts`).

TypeScript types mô tả property (không code block) — xem tại [01-backend.md → Section 1.2](./01-backend.md) cho server + [02-frontend.md → Section 7](./02-frontend.md) cho client.

---

## 5. Spec File Index

| File | Nội dung |
|------|----------|
| [01-backend.md](./01-backend.md) | DB schema (Prisma), TypeScript DTOs, 7 API endpoints (SV-001–SV-007), validation rules, error handling, AI provider integration |
| [02-frontend.md](./02-frontend.md) | File structure, component tree, wireframes, screen item specs, composable, store, TypeScript types, Project spec v1.01 update |
| [03-behavior.md](./03-behavior.md) | Page events & handlers, UI states, confirm dialogs, navigation flows, sequence diagrams (generate, create, edit, delete) |
| [04-quality.md](./04-quality.md) | Backend unit + integration tests, frontend UT tables, performance, security, logging |

---

## Quy ước chung (áp dụng cho toàn bộ spec package)

- **TypeScript types:** Mô tả chỉ liệt kê tên + property (không dùng code block). Trỏ file thực tế để tra cứu khi cần.
- **Database schema:** Mô tả dạng Prisma model (bảng property) — không viết raw `CREATE TABLE` SQL.
- **Response/request JSON examples:** Code block được phép (chỉ thể hiện contract, không phải type definition).
- **File structure tree, sequence diagram ASCII:** Code block được phép (visual representation).
- **Nội dung:** Tiếng Việt; headers/section titles giữ tiếng Anh.