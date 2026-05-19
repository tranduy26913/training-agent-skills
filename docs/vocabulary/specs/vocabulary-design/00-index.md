---
title: Vocabulary Management - Index
version: 1.0
author: Admin Team
date: 2026-05-19
status: Draft
---

# Vocabulary Management — Index

> Related: [01-backend.md](./01-backend.md) | [02-frontend.md](./02-frontend.md) | [03-behavior.md](./03-behavior.md) | [04-quality.md](./04-quality.md)

---

## 1. Executive Summary

Module Vocabulary Management cho phép admin tạo và quản trị từ vựng tiếng Nhật theo một luồng thống nhất gồm danh sách, tạo mới, chỉnh sửa, xem audit và xem analytics.
Người dùng nhập thông tin từ vựng ở tab Thông tin, còn tab Audit và Analytics hiển thị dữ liệu chỉ đọc để theo dõi lịch sử thay đổi, báo cáo từ user và số liệu học tập.

Điểm nhấn của thiết kế này là các trường quan hệ từ vựng (`Từ liên quan`, `Từ đồng nghĩa`, `Từ trái nghĩa`) được load từ database qua lookup API riêng, loại trừ bản ghi hiện tại khi đang edit.

---

## 2. Changelog

| Version | Date | Author | Summary |
|---------|------|--------|---------|
| 1.0 | 2026-05-19 | Admin Team | Initial design for Vocabulary management admin module |

---

## 3. Objective & Scope

### Purpose

Thiết kế một module admin nhất quán để quản lý vocabulary tiếng Nhật, đảm bảo dữ liệu chuẩn hóa, hỗ trợ quan hệ từ vựng, theo dõi audit/report và hiển thị analytics đọc בלבד cho từng record.

### In Scope

- Danh sách vocabulary cho admin với tìm kiếm, lọc, phân trang server-side và thao tác mở trang sửa.
- Trang create/edit dùng chung cấu trúc 3 tab: Thông tin, Audit, Analytics.
- Tab Thông tin gồm Nghĩa TV, Hira/Kana, Romaji, Kanji, Âm hán việt, Cấp độ, MediaURL, Note, Tag, 3 multiSelect cho quan hệ từ vựng và Status.
- Tab Audit hiển thị Created By, Updated By, Version, CreatedAt, UpdatedAt, Change Log và Report Info.
- Tab Analytics hiển thị Learn Count và Favorite Count chỉ đọc.
- Soft delete thông qua Status = `Delete`.
- Lookup API để load options cho các multiSelect từ database.

### Out of Scope

- Luồng học từ vựng cho người học cuối.
- Import/export hàng loạt.
- Gợi ý tự động bằng AI/NLP cho dịch nghĩa, romaji, hay quan hệ từ.
- Quản lý media storage/upload pipeline riêng.
- Đồng bộ sang hệ thống khác ngoài database nội bộ.

---

## 4. Architecture Overview

### System Diagram

```text
[Admin UI]
  VocabularyListPage
  VocabularyCreatePage / VocabularyEditPage
      |
      | HTTP/REST
      v
[Express API]
  Vocabulary module
  - list/detail/create/update
  - lookup options for relations
  - audit payload
  - analytics snapshot
      |
      | SQL
      v
[MySQL]
  vocabularies
  vocabulary_relations
  vocabulary_reports
  vocabulary_metrics
  audit_logs (generic, target_type='VOCABULARY')
      |
      v
[Existing Admin/Auth]
  JWT + admin role guard
```

### Data Model Summary

| Table | Purpose |
|-------|---------|
| `vocabularies` | Bảng chính lưu nội dung từ vựng, status, version và metadata người tạo/cập nhật |
| `vocabulary_relations` | Lưu các liên kết `related / synonym / antonym` giữa các vocabulary |
| `vocabulary_reports` | Lưu report từ user để hiển thị trong tab Audit |
| `vocabulary_metrics` | Lưu số liệu `learn_count` và `favorite_count` chỉ đọc |
| `audit_logs` | Lưu change log chuẩn hóa cho CREATE/UPDATE/DELETE với `target_type='VOCABULARY'` |

Chi tiết schema, DTO và API xem tại [01-backend.md](./01-backend.md).

---

## 5. Spec File Index

| File | Nội dung |
|------|----------|
| [01-backend.md](./01-backend.md) | DB schema, DTOs, API endpoints, validation rules, error handling |
| [02-frontend.md](./02-frontend.md) | File structure, wireframes, component tree, screen item specs, composables, store, TS types |
| [03-behavior.md](./03-behavior.md) | Page events & handlers, UI states, confirm dialogs, navigation flows, sequence diagrams |
| [04-quality.md](./04-quality.md) | Backend integration tests, frontend UT cases, performance, security, accessibility, logging |
