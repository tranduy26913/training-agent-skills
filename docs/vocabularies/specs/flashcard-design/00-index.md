---
title: Vocabulary FlashCard — User Learning
version: 1.0
author: Team
date: 2026-06-01
status: Draft
---

# Vocabulary FlashCard — User Learning

> Related: [01-backend.md](./01-backend.md) | [02-frontend.md](./02-frontend.md) | [03-behavior.md](./03-behavior.md) | [04-quality.md](./04-quality.md)

---

## Executive Summary

Tính năng **Vocabulary FlashCard** cho phép User (role `user`) tự học từ vựng tiếng Nhật thông qua giao diện thẻ lật (flip card). User chọn cấp độ JLPT, xem danh sách từ vựng kèm trạng thái tiến độ cá nhân, chọn các từ muốn học, sau đó vào phiên học với FlashCard tùy chỉnh (ẩn/hiện field, hướng lật). Sau mỗi thẻ, User đánh dấu Biết / Chưa biết. Toàn bộ tiến độ được lưu lâu dài vào DB.

---

## Changelog

| Version | Ngày | Tác giả | Tóm tắt |
|---------|------|---------|---------|
| 1.0 | 2026-06-01 | Team | Thiết kế ban đầu |

---

## 1. Objective & Scope

### Purpose

Cung cấp cho User giao diện học từ vựng tiếng Nhật theo cấp độ JLPT bằng phương pháp FlashCard: tự do cấu hình các trường ẩn/hiện, lựa chọn hướng lật, đánh dấu tiến độ từng từ (Biết / Đang học), và bookmark từ yêu thích.

### In Scope

- Trang chọn cấp độ JLPT (`LearnLevelPage`): hiển thị thống kê tiến độ theo từng level.
- Trang danh sách từ vựng (`LearnVocabListPage`): filter theo status (Mới / Đang học / Đã biết), chọn từ để học.
- Trang phiên học FlashCard (`LearnSessionPage`): flip card, cấu hình field hiển thị, đánh dấu Biết/Chưa biết, bookmark favorite.
- Màn hình tóm tắt kết thúc phiên học (trong `LearnSessionPage`).
- Backend API phục vụ User: lấy từ vựng kèm progress, cập nhật progress, toggle favorite.
- Bảng DB mới `user_vocabulary_progress` lưu trạng thái học của từng User–từ.

### Out of Scope

- Thuật toán Spaced Repetition (SRS / SM-2) — có thể bổ sung ở phiên bản sau.
- Chế độ Quiz (trắc nghiệm).
- Import/Export tiến độ học.
- Thống kê tổng hợp toàn hệ thống cho Admin từ dữ liệu học của User.
- Hard delete tiến độ học.

---

## 2. Architecture Overview

### 2.1 System Architecture

```text
[Frontend — Vue 3 + PrimeVue]
  LearnLevelPage
  LearnVocabListPage
  LearnSessionPage
       |
learn.store.ts  ←→  learn.service.ts
       |
  HTTP/REST (JWT — user role)
       |
[Backend — Express + TypeScript]
  learn.routes.ts
  → learn.controller.ts
  → learn.service.ts
  → learn.repository.ts
       |
    MySQL2 pool
       |
[Database — MySQL]
  vocabularies (read-only từ góc độ học)
  user_vocabulary_progress  ← bảng mới
```

### 2.2 Data Model Summary

**Bảng mới:** `user_vocabulary_progress`

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `user_id` | INT UNSIGNED (PK) | FK → `users.id` |
| `vocabulary_id` | INT UNSIGNED (PK) | FK → `vocabularies.id` |
| `status` | ENUM('new','learning','known') | Trạng thái học |
| `review_count` | INT UNSIGNED | Số lần đã ôn |
| `last_reviewed` | TIMESTAMP NULL | Lần cuối ôn |
| `is_favorite` | TINYINT(1) | Bookmark yêu thích |
| `created_at` | TIMESTAMP | Lần đầu ghi nhận |
| `updated_at` | TIMESTAMP | Cập nhật cuối |

Chi tiết: [01-backend.md § 1. Data Models](./01-backend.md)

### 2.3 URL Structure

| URL | Component | Mô tả |
|-----|-----------|-------|
| `/learn` | `LearnLevelPage` | Chọn cấp độ JLPT |
| `/learn/:level/list` | `LearnVocabListPage` | Danh sách từ theo level |
| `/learn/:level/session` | `LearnSessionPage` | Phiên FlashCard |

---

## 3. Spec File Index

| File | Nội dung |
|------|---------|
| [01-backend.md](./01-backend.md) | DB schema, DTOs, API endpoints, validation, error handling |
| [02-frontend.md](./02-frontend.md) | Cấu trúc file, wireframes, component tree, screen items, store, types |
| [03-behavior.md](./03-behavior.md) | Events, UI states, navigation flows, sequence diagrams |
| [04-quality.md](./04-quality.md) | Unit tests, integration tests, performance, security, a11y, logging |
