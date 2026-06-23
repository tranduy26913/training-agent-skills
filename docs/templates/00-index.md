```markdown
---
title: [Feature Design Title]
version: [e.g., 1.0]
author: [Team or Owner]
date: [YYYY-MM-DD]
---

# [Feature Design Title]

## Executive Summary

Provide a concise summary of the feature objective, business value, and expected outcome.

---

## Changelog

| Version | Date | Author | Summary |
|---------|------|--------|---------|
| 1.0 | [YYYY-MM-DD] | [Author] | Initial design |

---

## 1. Objective & Scope

### Purpose

Describe the main goal of this feature and its intended users.

### In Scope

- [List features included in this delivery]
- [...]

### Out of Scope

- [List features explicitly excluded from this delivery]
- [...]

---

## 2. Architecture Overview
```text
[Client Application]
      |
   HTTP/REST
      |
[Backend API]
  - Controller
  - Service
  - Repository
  - Validation
      |
    ORM (Prisma)
      |
[Database]
  - Existing tables
  - New tables
```

> Note: Nếu project dùng ORM khác (TypeORM, Sequelize, Drizzle, ...) thay "Prisma" bằng tên ORM tương ứng. Nguyên tắc chung: **mô tả schema theo dạng khai báo model/ORM**, không viết raw `CREATE TABLE` SQL.

---

## 3. Spec File Index

| File | Description |
|------|-------------|
| [01-backend.md](./01-backend.md) | API endpoints, request/response contracts, validation rules, error handling. Schema mô tả dạng Prisma; types chỉ liệt kê property (không code block) |
| [02-frontend.md](./02-frontend.md) | UI layout, wireframes, component tree, screen item specs, store/composable. Types chỉ liệt kê property |
| [03-behavior.md](./03-behavior.md) | Page behavior: events, UI states, navigation flows, confirm dialogs, sequence diagrams |
| [04-quality.md](./04-quality.md) | Testing strategy, performance, security, accessibility, logging & audit |

---

## Quy ước chung (áp dụng cho toàn bộ spec package)

- **TypeScript types:** Mô tả chỉ liệt kê tên + property (không dùng code block). Trỏ file thực tế để tra cứu khi cần.
- **Database schema:** Mô tả dạng Prisma model (bảng property) — không viết raw `CREATE TABLE` SQL.
- **Response/request JSON examples:** Code block được phép (chỉ thể hiện contract, không phải type definition).
- **File structure tree, sequence diagram ASCII:** Code block được phép (visual representation).
- **Nội dung:** Tiếng Việt; headers/section titles giữ tiếng Anh.

---
```
