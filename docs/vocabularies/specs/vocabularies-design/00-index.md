---
title: Admin Vocabulary Management
version: 1.0
author: Admin Team
date: 2026-06-04
---

# Admin Vocabulary Management

## Executive Summary

Tính năng Admin Vocabulary Management cung cấp cho quản trị viên công cụ quản lý từ vựng tiếng Nhật toàn diện. Quản trị viên có thể xem danh sách từ vựng với bộ lọc và phân trang, tạo mới từ vựng với thông tin chi tiết (nghĩa, cách đọc, mức độ, v.v.), xem lịch sử thay đổi, phân tích số liệu học tập, và xuất dữ liệu. Tính năng này cải thiện khả năng quản lý nội dung học tập và theo dõi chất lượng từ vựng.

---

## Changelog

| Version | Date | Author | Summary |
|---------|------|--------|---------|
| 1.0 | 2026-06-04 | Admin Team | Initial design - All-in-One Form approach with unified create/edit page |

---

## 1. Objective & Scope

### Purpose

Cung cấp giao diện quản lý từ vựng tiếng Nhật cho admin, cho phép tạo, chỉnh sửa, xóa từ vựng với thông tin đa chiều (thông tin cơ bản, lịch sử thay đổi, phân tích).

### In Scope

- Trang danh sách từ vựng (VocabularyListPage) với bộ lọc theo: Status, Mức độ (N5/N4/...), Tag, Tìm kiếm từ khóa, Người tạo, Khoảng thời gian
- Trang tạo/chỉnh sửa từ vựng (VocabularyFormPage) với 3 tab: Thông tin, Audit, Analytics
  - Tab Thông tin: Nghĩa, Hira/Kana, Romaji, Kanji, Âm Hán Việt, Mức độ, Media URL, Note, Tag, Từ liên quan, Từ đồng nghĩa, Từ trái nghĩa, Status
  - Tab Audit: Created By, Updated By, Version, CreatedAt, UpdatedAt, Change Log, Report Info (đọc-chỉ)
  - Tab Analytics: Learn Count, Favorite Count (đọc-chỉ)
- Hành động bulk: Xuất CSV
- Hành động trên item: Xem, Chỉnh sửa, Xóa

### Out of Scope

- Import từ vựng từ file
- MultiSelect với tìm kiếm và phân trang cho từ liên quan/đồng nghĩa/trái nghĩa (MVP: load toàn bộ từ database)
- Thay đổi dữ liệu trong Tab Audit/Analytics (chỉ đọc)
- Tính năng rollback version
- I18n cho nội dung từ vựng (chỉ hỗ trợ tiếng Nhật)

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│              Vue.js 3 Frontend (Client)                 │
│                                                          │
│  VocabularyListPage        VocabularyFormPage           │
│  ├── VocabularyTable       ├── Tab 1: Information      │
│  ├── VocabularyFilters     ├── Tab 2: Audit (RO)       │
│  └── Actions               └── Tab 3: Analytics (RO)   │
│                                                          │
│  Store: useVocabulariesStore (Pinia)                   │
│  Composable: useVocabularies (API calls)               │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/REST
                       ↓
┌──────────────────────────────────────────────────────────┐
│         Express.js Backend API (Node.js)                │
│                                                          │
│  VocabulariesController                                 │
│  ├── list()      → service.listVocabularies()          │
│  ├── get()       → service.getVocabulary()             │
│  ├── create()    → service.createVocabulary()          │
│  ├── update()    → service.updateVocabulary()          │
│  ├── delete()    → service.deleteVocabulary()          │
│  └── export()    → service.exportVocabularies()        │
│                                                          │
│  VocabulariesService (Business logic)                   │
│  VocabulariesRepository (Data access)                   │
│  VocabulariesValidation (Zod schemas)                  │
└──────────────────────┬──────────────────────────────────┘
                       │ SQL
                       ↓
┌──────────────────────────────────────────────────────────┐
│         MySQL Database                                   │
│                                                          │
│  - vocabularies (main table)                            │
│  - vocabulary_related_words (junction)                  │
│  - vocabulary_synonyms (junction)                       │
│  - vocabulary_antonyms (junction)                       │
│  - vocabulary_reports (user reports)                    │
│  - vocabulary_change_logs (audit trail)                │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Spec File Index

| File | Description |
|------|-------------|
| [01-backend.md](./01-backend.md) | DB schema, TypeScript DTOs, API endpoints, validation rules, error handling |
| [02-frontend.md](./02-frontend.md) | File structure, wireframes, component tree, screen items, composables, stores, TS types |
| [03-behavior.md](./03-behavior.md) | Page events & handlers, UI states, confirm dialogs, navigation flows, sequence diagrams |
| [04-quality.md](./04-quality.md) | Unit tests, integration tests, performance, security, accessibility, logging & audit |

---
