---
title: Vocabulary Management — Admin
version: 1.0
author: Team
date: 2026-05-27
status: Draft
---

# Vocabulary Management — Admin

> Related: [01-backend.md](./01-backend.md) | [02-frontend.md](./02-frontend.md) | [03-behavior.md](./03-behavior.md) | [04-quality.md](./04-quality.md)

---

## Executive Summary

Tính năng **Vocabulary Management** cho phép Admin quản lý toàn bộ kho từ vựng tiếng Nhật của hệ thống. Admin có thể xem danh sách từ vựng (có filter và phân trang), tạo mới / chỉnh sửa từ vựng với đầy đủ thông tin (nghĩa, phiên âm, cấp độ JLPT, tags, mối quan hệ từ vựng), xem lịch sử thay đổi, xử lý báo cáo từ user, và theo dõi thống kê tương tác.

---

## Changelog

| Version | Ngày | Tác giả | Tóm tắt |
|---------|------|---------|---------|
| 1.0 | 2026-05-27 | Team | Thiết kế ban đầu |

---

## 1. Objective & Scope

### Purpose

Cung cấp cho Admin một giao diện quản lý từ vựng tiếng Nhật đầy đủ: CRUD từ vựng, quản lý mối quan hệ giữa các từ (liên quan, đồng nghĩa, trái nghĩa), tag, theo dõi lịch sử chỉnh sửa, và xử lý báo cáo từ người dùng.

### In Scope

- Trang danh sách từ vựng: filter (search, level, status, tag), phân trang, sort, xóa mềm.
- Trang tạo mới từ vựng (3 tab: Thông tin, Audit, Analytics).
- Trang chỉnh sửa từ vựng (3 tab).
- Backend CRUD API cho từ vựng, bao gồm quản lý tags, relationships.
- Tự động ghi `vocabulary_change_logs` khi update.
- Admin có thể xem và Resolve/Pending `vocabulary_reports`.
- Autocomplete tag từ tags đã có, tự tạo tag mới khi lưu.
- MultiSelect tìm kiếm từ liên quan/đồng nghĩa/trái nghĩa (search cross-field).

### Out of Scope

- Giao diện quản lý từ vựng phía người dùng (user-facing flashcard, quiz, v.v.).
- Hard delete từ vựng.
- Import/Export hàng loạt (bulk import từ CSV/Excel).
- Quản lý báo cáo qua trang riêng biệt (nằm trong tab Audit của từ vựng).
- Thống kê tổng hợp toàn bộ kho từ (dashboard-level analytics).

---

## 2. Architecture Overview

### 2.1 System Architecture

```text
[Frontend — Vue 3 + PrimeVue]
  VocabularyListPage
  VocabularyCreatePage / VocabularyEditPage (3 tabs)
       |
vocabularies.store.ts  ←→  vocabularies.service.ts
       |
  HTTP/REST (JWT — admin only)
       |
[Backend — Express + TypeScript]
  vocabularies.routes.ts
  → vocabularies.controller.ts
  → vocabularies.service.ts
  → vocabularies.repository.ts
  + vocabulary_change_logs (auto-diff on update)
       |
    MySQL2 pool
       |
[Database — MySQL]
  vocabularies
  tags
  vocabulary_tags
  vocabulary_relationships
  vocabulary_change_logs
  vocabulary_reports
```

### 2.2 Data Model Summary

#### vocabularies (NEW)
```sql
vocabularies {
  id: INT UNSIGNED (PK)
  meaning_vi: VARCHAR(500) NOT NULL
  hiragana: VARCHAR(200) NULL
  romaji: VARCHAR(200) NULL
  kanji: VARCHAR(200) NULL
  sino_vietnamese: VARCHAR(200) NULL
  level: ENUM('N5','N4','N3','N2','N1') NOT NULL
  media_url: VARCHAR(500) NULL
  note: TEXT NULL
  status: ENUM('publish','hide','delete') NOT NULL DEFAULT 'publish'
  learn_count: INT UNSIGNED DEFAULT 0
  favorite_count: INT UNSIGNED DEFAULT 0
  version: INT UNSIGNED DEFAULT 1
  created_by: INT UNSIGNED FK→users
  updated_by: INT UNSIGNED FK→users NULL
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

#### tags (NEW)
```sql
tags { id: INT UNSIGNED PK, name: VARCHAR(100) UNIQUE }
```

#### vocabulary_tags (NEW)
```sql
vocabulary_tags { vocabulary_id FK, tag_id FK — PK composite }
```

#### vocabulary_relationships (NEW)
```sql
vocabulary_relationships {
  vocabulary_id FK,
  related_id FK,
  type: ENUM('related','synonym','antonym') — PK composite
}
```

#### vocabulary_change_logs (NEW)
```sql
vocabulary_change_logs {
  id PK, vocabulary_id FK, changed_by FK→users,
  field_name, old_value, new_value, changed_at
}
```

#### vocabulary_reports (NEW)
```sql
vocabulary_reports {
  id PK, vocabulary_id FK, reported_by FK→users,
  reason TEXT, status ENUM('pending','resolved'),
  resolved_by FK→users NULL, resolved_at NULL, created_at
}
```

---

## 3. Spec File Index

| File | Mô tả |
|------|-------|
| [01-backend.md](./01-backend.md) | DB schema, TypeScript DTOs, API endpoints, validation, error handling |
| [02-frontend.md](./02-frontend.md) | Cấu trúc file, wireframes, component tree, screen items, types, store, composable |
| [03-behavior.md](./03-behavior.md) | Events, UI states, confirm dialogs, navigation flows, sequence diagrams |
| [04-quality.md](./04-quality.md) | Unit tests, integration tests, performance, security, accessibility, logging |
