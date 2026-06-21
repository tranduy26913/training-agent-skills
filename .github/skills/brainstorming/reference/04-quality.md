```markdown
---
title: [Feature] - Quality & Operations
version: [e.g., 1.0]
author: [Team or Owner]
date: [YYYY-MM-DD]
---

# [Feature] - Quality & Operations

> Related: [00-index.md](./00-index.md) | [01-backend.md](./01-backend.md) | [02-frontend.md](./02-frontend.md) | [03-behavior.md](./03-behavior.md)

---

## 1. Testing Strategy

### 1.1 Backend Tests

> **Rule**: Tất cả **backend tests** nên nằm trong **chỉ 1 file**: `server/src/modules/[feature]/[feature].controller.test.ts`
- Sử dụng Database test để test. Không sử dụng in-memory mocks hoặc fake implementations. Sử dụng cùng test database và chạy migrations trước khi tests.

#### Unit Tests

| Test Case | Description |
|-----------|-------------|
| Create [resource] - thành công | Input hợp lệ tạo record và trả về entity |
| Create [resource] - lỗi validation | Input không hợp lệ ném lỗi validation |
| Create [resource] - trùng lặp | Duplicate key ném lỗi conflict |
| Get [resource] by ID - tìm thấy | Trả về entity chính xác |
| Get [resource] by ID - không tìm thấy | Ném lỗi 404 |
| Update [resource] - thành công | Update hợp lệ sửa đổi và trả về entity |
| Update [resource] - không tìm thấy | Ném lỗi 404 |
| Delete [resource] - thành công | Xóa record và trả về thành công |
| Delete [resource] - constraint | Business rule ngăn chặn xóa, ném lỗi |
| List [resource] - filtered | Trả về kết quả đã filter, phân trang |

#### Integration Tests

| Test Case | HTTP Method | Endpoint |
|-----------|-------------|----------|
| GET list — authenticated, trả về data | GET | `/api/[resource]` |
| GET list — unauthenticated, 401 | GET | `/api/[resource]` |
| GET list — no permission, 403 | GET | `/api/[resource]` |
| POST create — valid body, 201 | POST | `/api/[resource]` |
| POST create — invalid body, 400 | POST | `/api/[resource]` |
| PUT update — existing id, 200 | PUT | `/api/[resource]/:id` |
| PUT update — non-existing id, 404 | PUT | `/api/[resource]/:id` |
| DELETE — existing id, 200 | DELETE | `/api/[resource]/:id` |
| DELETE — non-existing id, 404 | DELETE | `/api/[resource]/:id` |

#### Authorization Tests

| Test Case | Role | Expected |
|-----------|------|----------|
| [Role A] có thể truy cập list | [RoleA] | 200 |
| [Role B] không thể truy cập list | [RoleB] | 403 |
| [Role A] có thể create | [RoleA] | 201 |
| [Role B] không thể delete | [RoleB] | 403 |

---

### 1.2 Frontend Tests

#### [ListPage] — Unit Tests

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Hiển thị items trong table khi mount | Mock `fetchItems` trả về 2 items | Mount `[ListPage]` | Table hiển thị 2 rows |
| 2 | Hiển thị loading skeleton khi fetching | Mock `fetchItems` đang pending | Mount `[ListPage]` | Loading skeleton visible; table rows hidden |
| 3 | Hiển thị empty state khi không có items | Mock `fetchItems` trả về `[]` | Mount `[ListPage]` | Empty state message shown |
| 4 | Trigger fetch khi search input thay đổi | Mount `[ListPage]` | Type trong search input (debounced) | `fetchItems` called với search filter đã cập nhật |
| 5 | Trigger fetch khi filter thay đổi | Mount `[ListPage]` | Select [Filter A] option | `fetchItems` called với filter đã cập nhật, page reset về 1 |
| 6 | Trigger fetch khi page thay đổi | Mount `[ListPage]` | Click next page | `fetchItems` called với page number đã cập nhật |
| 7 | Navigate đến create page khi click Add | Mount `[ListPage]` | Click nút Add | Router push called với `/path/create` |
| 8 | Navigate đến edit page khi click Edit | Mount `[ListPage]` với 1 item | Click Edit trên row | Router push called với `/path/1/edit` |
| 9 | Hiển thị delete confirm dialog khi click Delete | Mount `[ListPage]` với 1 item | Click Delete trên row | Confirm dialog shown với item name |
| 10 | Xóa item và làm mới list khi confirm | Mock `deleteItem` resolves | Confirm delete dialog | `deleteItem` called; `fetchItems` called lại; success toast shown |
| 11 | Hiển thị error toast khi fetch thất bại | Mock `fetchItems` rejects | Mount `[ListPage]` | Error message/banner shown |

---

#### [CreatePage] — Unit Tests

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Hiển thị form rỗng khi mount | Mount `[CreatePage]` | — | Tất cả fields empty; nút Save enabled |
| 2 | Hiển thị inline error khi required field empty | Mount `[CreatePage]` | Click Save mà không điền fields | Validation error shown trên required fields |
| 3 | Hiển thị inline error khi [Field A] quá ngắn | Mount `[CreatePage]` | Enter giá trị 1 ký tự trong [Field A] | Validation error "Min 2 characters" shown |
| 4 | Gọi `createItem` với form data hợp lệ | Mock `createItem` resolves | Điền form, click Save | `createItem` called với payload chính xác |
| 5 | Navigate đến list sau khi create thành công | Mock `createItem` resolves | Điền form, click Save | Router push called với `/path`; success toast shown |
| 6 | Hiển thị error toast khi API thất bại | Mock `createItem` rejects | Điền form, click Save | Error toast shown; ở lại trang create |
| 7 | Cancel không có changes navigate về | Mount `[CreatePage]` | Click Cancel (form chưa touched) | Router push called với `/path` |
| 8 | Cancel có changes hiển thị confirm dialog | Mount `[CreatePage]` | Điền field, sau đó click Cancel | Unsaved-changes confirm dialog shown |
| 9 | Ở lại trang khi cancel dialog dismissed | Điền field, click Cancel, dismiss dialog | Dismiss confirm dialog | Ở lại trang create; form không đổi |

---

#### [EditPage] — Unit Tests

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Pre-fills form với existing item data | Mock `fetchItem` trả về item | Mount `[EditPage]` với id=1 | Form fields populated với item values |
| 2 | Hiển thị loading khi fetching item | Mock `fetchItem` pending | Mount `[EditPage]` | Form skeleton/spinner visible |
| 3 | Redirect về list khi item not found | Mock `fetchItem` trả về 404 | Mount `[EditPage]` với unknown id | Router push called với `/path`; warning toast shown |
| 4 | Hiển thị inline error trên field không hợp lệ | Mount `[EditPage]`, item loaded | Clear required field, click Save | Validation error shown trên field |
| 5 | Gọi `updateItem` với data đã sửa đổi | Mock `updateItem` resolves | Change field, click Save | `updateItem` called với id và payload đã cập nhật |
| 6 | Hiển thị success toast và ở lại trang sau khi save | Mock `updateItem` resolves | Change field, click Save | Success toast shown; vẫn ở lại trang edit |
| 7 | Hiển thị error toast khi API thất bại | Mock `updateItem` rejects | Change field, click Save | Error toast shown; ở lại trang edit |
| 8 | Cancel không có changes navigate về | Mount `[EditPage]`, item loaded | Click Cancel (no changes) | Router push called với `/path` |
| 9 | Cancel có changes hiển thị confirm dialog | Mount `[EditPage]`, item loaded | Change field, click Cancel | Unsaved-changes confirm dialog shown |

---

#### [Form].vue — Unit Tests

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Hiển thị tất cả fields trong create mode | Mount `<Form mode="create">` | — | Tất cả fields visible và empty |
| 2 | Pre-fills fields trong edit mode | Mount `<Form mode="edit" :initialData="item">` | — | Fields populated với initialData values |
| 3 | Emit `submit` với data hợp lệ | Mount form, điền tất cả required fields | Click Save | `submit` event emitted với form payload |
| 4 | Không emit `submit` khi validation thất bại | Mount form, leave required field empty | Click Save | `submit` event NOT emitted |
| 5 | Emit `cancel` khi click Cancel | Mount form | Click Cancel | `cancel` event emitted |
| 6 | Disable nút Save khi `loading=true` | Mount `<Form :loading="true">` | — | Nút Save disabled |

---

#### Composable Tests — `use[Feature].ts`

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | `fetchItems` sets `items` và `pagination` | Mock API trả về paginated list | Call `fetchItems()` | `items.value` và `pagination.value` updated |
| 2 | `fetchItems` sets `loading` during call | Mock API pending | Call `fetchItems()` | `loading.value` is `true` during call, `false` after |
| 3 | `fetchItems` sets `error` on failure | Mock API rejects | Call `fetchItems()` | `error.value` contains message |
| 4 | `createItem` calls API và returns entity | Mock API resolves với new item | Call `createItem(data)` | Trả về item đã tạo |
| 5 | `updateItem` calls API với correct id và data | Mock API resolves | Call `updateItem(1, data)` | API called với `PUT /api/[resource]/1` |
| 6 | `deleteItem` calls API với correct id | Mock API resolves | Call `deleteItem(1)` | API called với `DELETE /api/[resource]/1` |

---

## 2. Performance Considerations

| Concern | Strategy |
|---------|----------|
| List query | Server-side pagination (mặc định limit: 10) |
| Search | Debounced input (300ms) để giảm API calls |
| Database indexes | Index trên `[searchable_field]` và `[filter_field]` |
| Filtering | Chỉ sử dụng indexed columns trong WHERE clause |
| Caching | [Nếu applicable: cache strategy, TTL] |
| Lazy loading | [Nếu applicable: component lazy load, image lazy] |

---

## 3. Security Considerations

| Concern | Control |
|---------|---------|
| Authentication | Tất cả endpoints yêu cầu JWT token hợp lệ |
| Authorization | Role-based access control (RBAC) cho mỗi endpoint |
| Input Validation | Server-side validation trên tất cả request body fields |
| SQL Injection | Sử dụng parameterized queries / ORM (không raw string concat) |
| Sensitive Data | Không bao giờ trả về passwords hoặc tokens trong responses |
| Audit Trail | Log tất cả create/update/delete actions với user + timestamp |
| Rate Limiting | Áp dụng rate limiting trên write endpoints (POST, PUT, DELETE) |

---

```
