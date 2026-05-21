---
title: Vocabulary Management - Index
version: 1.0
author: Admin Team
date: 2026-05-20
status: Draft
---

# Vocabulary Management — Index

> Related: [01-backend.md](./01-backend.md) | [02-frontend.md](./02-frontend.md) | [03-behavior.md](./03-behavior.md) | [04-quality.md](./04-quality.md)

---

## 1. Executive Summary

Tính năng Vocabulary Management cho phép Admin quản lý toàn bộ kho từ vựng tiếng Nhật trong hệ thống. Admin có thể xem danh sách, tìm kiếm/lọc, tạo mới, chỉnh sửa, và xóa mềm từ vựng. Mỗi từ vựng có thể liên kết với các từ khác qua quan hệ 2 chiều (liên quan / đồng nghĩa / trái nghĩa). Hệ thống tự động ghi audit log mỗi khi có thay đổi, và Admin có thể xử lý các báo cáo từ user (resolve/reject) ngay trong trang chi tiết.

---

## 2. Changelog

| Version | Date | Author | Summary |
|---------|------|--------|---------|
| 1.0 | 2026-05-20 | Admin Team | Initial design |

---

## 3. Objective & Scope

### Purpose

Cung cấp giao diện quản lý toàn diện cho Admin để duy trì kho từ vựng tiếng Nhật, bao gồm các thao tác CRUD, quản lý quan hệ từ vựng, xử lý báo cáo người dùng, và theo dõi analytics.

### In Scope

- Xem danh sách từ vựng với phân trang, tìm kiếm full-text (meaning_vi, kanji, hiragana, romaji), lọc theo level/status/tag, sắp xếp server-side
- Tạo từ vựng mới với đầy đủ thông tin: nghĩa TV, hiragana (bắt buộc), romaji, kanji, âm Hán Việt, cấp độ JLPT, image URL, note, tags, quan hệ từ vựng (liên quan / đồng nghĩa / trái nghĩa), status
- Chỉnh sửa từ vựng hiện có; version tự động tăng mỗi lần update
- Xóa mềm từ vựng (set status = 'deleted'); Admin có thể restore
- Quan hệ từ vựng 2 chiều: thêm/xóa tự động cập nhật cả 2 phía
- Tab Audit: xem created/updated by, version, audit log, xử lý user reports (resolve/reject)
- Tab Analytics: xem learn count, favorite count (read-only)
- Tracking audit log tự động cho tất cả thao tác CREATE/UPDATE/DELETE
- Field ký tự Unicode (utf8mb4) cho tiếng Việt có dấu và tiếng Nhật

### Out of Scope

- Quản lý tags dạng master list (tags là free-text)
- Import/export bulk từ vựng
- Giao diện học từ vựng cho user
- Multi-language vocabulary (chỉ hỗ trợ tiếng Nhật)
- Gợi ý AI cho nghĩa/ví dụ

---

## 4. Architecture Overview

### System Diagram

```
[VocabularyListPage]
    │
    ├── [VocabularyFilters] ──────────────────────────────────────┐
    ├── [VocabularyTable]                                          │
    │       └── Actions (Edit / Delete)                           │
    └── [+ Tạo từ vựng] → VocabularyCreatePage                   │
                                                                   ▼
[VocabularyCreatePage / VocabularyEditPage]          GET /api/vocabularies?{filters}
    │
    ├── Tab 1: VocabularyInfoTab (VocabularyForm)
    │       └── POST /api/vocabularies
    │           PUT  /api/vocabularies/:id
    │
    ├── Tab 2: VocabularyAuditTab          (EditPage only)
    │       └── GET  /api/vocabularies/:id/audit-logs
    │           PATCH /api/vocabularies/reports/:id/resolve|reject
    │
    └── Tab 3: VocabularyAnalyticsTab     (EditPage only)
            └── (included in GET /api/vocabularies/:id response)

[Server]
    ├── vocabularies.controller.ts
    ├── vocabularies.service.ts
    ├── vocabularies.repository.ts
    └── vocabularies.validation.ts

[Database]
    ├── vocabularies                 (main table)
    ├── vocabulary_relations         (bidirectional relations)
    ├── vocabulary_reports           (user reports)
    ├── vocabulary_audit_logs        (change history)
    └── vocabulary_analytics         (learn/favorite counts)
```

### Data Model Summary

| Table | Purpose |
|-------|---------|
| `vocabularies` | Từ vựng chính: thông tin ngôn ngữ, status, version |
| `vocabulary_relations` | Quan hệ 2 chiều: related / synonym / antonym |
| `vocabulary_reports` | Báo cáo từ user: pending / resolved / rejected |
| `vocabulary_audit_logs` | Lịch sử thay đổi do admin thực hiện |
| `vocabulary_analytics` | Thống kê lượt học và yêu thích |

---

## 5. Spec File Index

| File | Nội dung |
|------|---------|
| [01-backend.md](./01-backend.md) | DB schema, TypeScript DTOs, API endpoints, validation rules, error handling |
| [02-frontend.md](./02-frontend.md) | File structure, wireframes, component tree, screen item specs, store/composable, TS types |
| [03-behavior.md](./03-behavior.md) | Page events & handlers, UI states, confirm dialogs, navigation flows, sequence diagrams |
| [04-quality.md](./04-quality.md) | UT test cases (Arrange/Act/Assert), integration tests, security, accessibility, logging |
