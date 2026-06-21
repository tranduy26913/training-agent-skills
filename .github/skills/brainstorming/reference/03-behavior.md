```markdown
---
title: [Feature] - Behavior Specification
version: [e.g., 1.0]
author: [Team or Owner]
date: [YYYY-MM-DD]
---

# [Feature] - Behavior Specification

> Related: [00-index.md](./00-index.md) | [01-backend.md](./01-backend.md) | [02-frontend.md](./02-frontend.md) | [04-quality.md](./04-quality.md)

---

## 1. Page Events & Handlers

### 1.1 [ListPage]

#### onMounted
1. Khởi tạo trạng thái filter mặc định
2. Gọi `fetchItems()` với pagination mặc định
3. Render table với các items đã load hoặc empty state

#### handleFilterChange(filters)
1. Reset `page` về 1
2. Cập nhật trạng thái filter
3. Gọi `fetchItems()` với filters mới
4. Cập nhật URL query params (tùy chọn)

#### handlePageChange(page)
1. Cập nhật trang hiện tại trong trạng thái pagination
2. Gọi `fetchItems()` với trang đã cập nhật

#### handleEditClick(id)
1. Điều hướng đến route `[EditPage]`: `/path/:id/edit`

#### handleDeleteClick(id)
1. Hiển thị hộp thoại confirm (xem [Confirm Dialogs](#3-confirm-dialogs))
2. Khi confirm: gọi `deleteItem(id)`
3. Khi thành công: hiển thị toast thành công, làm mới danh sách
4. Khi lỗi: hiển thị toast lỗi

---

### 1.2 [CreatePage]

#### onMounted
1. Khởi tạo trạng thái form rỗng
2. Focus vào ô input đầu tiên

#### handleSubmit(formData)
1. Validate tất cả các fields của form phía client-side
2. Nếu không hợp lệ: highlight các fields lỗi, dừng lại
3. Nếu hợp lệ: gọi `createItem(formData)`
4. Khi thành công: hiển thị toast thành công -> điều hướng đến list
5. Khi lỗi: hiển thị toast lỗi, ở lại trang

#### handleCancel()
1. Kiểm tra form có thay đổi chưa lưu (dirty state)
2. Nếu dirty: hiển thị hộp thoại confirm (xem [Confirm Dialogs](#3-confirm-dialogs))
3. Khi confirm (hoặc not dirty): điều hướng về list

---

### 1.3 [EditPage]

#### onMounted
1. Lấy `id` từ route params
2. Gọi `fetchItem(id)`
3. Điền form với dữ liệu hiện có
4. Nếu item không tìm thấy: redirect về 404 hoặc list page

#### handleSubmit(formData)
1. Validate tất cả các fields của form client-side
2. Nếu không hợp lệ: highlight các fields lỗi, dừng lại
3. Nếu hợp lệ: gọi `updateItem(id, formData)`
4. Khi thành công: hiển thị toast thành công, ở lại trang edit
5. Khi lỗi: hiển thị toast lỗi, ở lại trang

#### handleCancel()
1. Kiểm tra form có thay đổi chưa lưu (dirty state)
2. Nếu dirty: hiển thị hộp thoại confirm (xem [Confirm Dialogs](#3-confirm-dialogs))
3. Khi confirm (hoặc not dirty): điều hướng về list

---

## 2. UI States

### 2.1 Loading States

| Page / Component | Trigger | UI Behavior |
|-----------------|---------|-------------|
| [ListPage] | Đang fetch items | Hiển thị skeleton rows trong table |
| [CreatePage] / [EditPage] | Đang submit form | Vô hiệu hóa nút submit, hiển thị spinner |
| [EditPage] | Đang load dữ liệu item | Hiển thị form skeleton / spinner |
| [OptionalViewer] | Đang load activity | Hiển thị spinner trong panel |

### 2.2 Empty States

| Page / Component | Condition | UI Behavior |
|-----------------|-----------|-------------|
| [ListPage] - Table | Không tìm thấy items (0 results) | Hiển thị thông báo "No [resource] found" với optional CTA |
| [ListPage] - Table | Search/filter trả về 0 results | Hiển thị thông báo "No results match your filter" |
| [OptionalViewer] | Không có lịch sử activity | Hiển thị thông báo "No activity recorded yet" |

### 2.3 Error States

| Page / Component | Condition | UI Behavior |
|-----------------|-----------|-------------|
| [ListPage] | Fetch items thất bại | Hiển thị error banner: "Failed to load [resource]. Try again." |
| [CreatePage] / [EditPage] | Submit thất bại (server error) | Hiển thị error toast: "An error occurred. Please try again." |
| [EditPage] | Item not found (404) | Redirect về list + hiển thị warning toast: "[Resource] not found" |
| Form field | Client validation thất bại | Highlight field đỏ + hiển thị inline error message |

### 2.4 Success States

| Action | UI Behavior |
|--------|-------------|
| Create successful | Toast: "[Resource] created successfully" -> redirect về list |
| Update successful | Toast: "[Resource] updated successfully" -> ở lại trang edit |
| Delete successful | Toast: "[Resource] deleted successfully" -> làm mới list |

---

## 3. Confirm Dialogs

### 3.1 Delete Confirmation

| Property | Value |
|----------|-------|
| Trigger | Click nút Delete trên list row |
| Title | "Delete [Resource]" |
| Message | "Are you sure you want to delete **[item name]**? This action cannot be undone." |
| Confirm button | "Delete" (destructive / red) |
| Cancel button | "Cancel" |
| On confirm | Thực thi delete flow |
| On cancel | Đóng dialog, không có hành động |

### 3.2 Unsaved Changes Confirmation

| Property | Value |
|----------|-------|
| Trigger | Click Cancel / navigate away khi form is dirty |
| Title | "Unsaved Changes" |
| Message | "You have unsaved changes. Are you sure you want to leave?" |
| Confirm button | "Leave" |
| Cancel button | "Stay" |
| On confirm | Navigate away without saving |
| On cancel | Đóng dialog, ở lại trang |

---

## 4. Navigation Flows

| Action | From | To | Condition |
|--------|------|----|-----------|
| Click nút "Add" | [ListPage] | [CreatePage] | Always |
| Click "Edit" trên row | [ListPage] | [EditPage] `/:id/edit` | Always |
| Create thành công | [CreatePage] | [ListPage] | Sau khi lưu thành công |
| Update thành công | [EditPage] | [EditPage] (stay) | Sau khi lưu thành công |
| Cancel (form sạch) | [CreatePage] / [EditPage] | [ListPage] | No dirty state |
| Cancel (form dirty) | [CreatePage] / [EditPage] | [ListPage] | Sau khi confirm dialog |
| Item not found | [EditPage] | [ListPage] | API trả về 404 |
| Unauthorized | Any page | Login page | 401 response |

---

## 5. Sequence Diagrams

### 5.1 Create Flow

```text
User         [CreatePage]    use[Feature].ts    Backend       Database
  |               |                |               |              |
  |-- Điền form ->|                |               |              |
  |-- Submit ---->|                |               |              |
  |               |-- validate --->|               |              |
  |               |   (invalid) <--|               |              |
  |<-- show err --|                |               |              |
  |               |   (valid)      |               |              |
  |               |-- createItem ->|               |              |
  |               |                |-- POST ------>|              |
  |               |                |               |-- INSERT --->|
  |               |                |               |<-- result ---|
  |               |                |<-- 201 -------|              |
  |               |<-- success ----|               |              |
  |<-- toast -----|                |               |              |
  |<-- redirect ->|                |               |              |
```

### 5.2 Update Flow

```text
User         [EditPage]      use[Feature].ts    Backend       Database
  |               |                |               |              |
  |-- onMounted ->|                |               |              |
  |               |-- fetchItem -->|               |              |
  |               |                |-- GET ------->|              |
  |               |                |               |-- SELECT --->|
  |               |                |<-- data ------|              |
  |               |<-- item data --|               |              |
  |-- Chỉnh form ->|               |               |              |
  |-- Submit ---->|                |               |              |
  |               |-- updateItem ->|               |              |
  |               |                |-- PUT ------->|              |
  |               |                |               |-- UPDATE --->|
  |               |                |<-- 200 -------|              |
  |               |<-- success ----|               |              |
  |<-- toast -----|                |               |              |
```

### 5.3 Delete Flow

```text
User         [ListPage]      use[Feature].ts    Backend       Database
  |               |                |               |              |
  |-- Delete ---->|                |               |              |
  |<-- confirm ---|                |               |              |
  |-- Confirm --->|                |               |              |
  |               |-- deleteItem ->|               |              |
  |               |                |-- DELETE ---->|              |
  |               |                |               |-- DELETE --->|
  |               |                |<-- 200 -------|              |
  |               |<-- success ----|               |              |
  |<-- toast -----|                |               |              |
  |               |-- fetchItems ->|               |              |
```

---
```
