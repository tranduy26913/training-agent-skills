# Modular Spec Package Template

Tài liệu này định nghĩa cấu trúc bắt buộc cho tất cả các spec deliverables được viết bằng skill **brainstorming**.

---

## Package Structure

Mỗi spec deliverable là một **multi-file package** được lưu vào:

```text
docs/<topic>/specs/<topic>-design/
├── 00-index.md         ← BẮT BUỘC: canonical entry point
├── 01-backend.md       ← BẮT BUỘC: API and data
├── 02-frontend.md      ← BẮT BUỘC: UI and components
├── 03-behavior.md      ← BẮT BUỘC: events, flows, UI states
└── 04-quality.md       ← BẮT BUỘC: testing, NFRs, logging
```

Sử dụng các file templates trong folder này làm điểm bắt đầu:
- [00-index.md](./00-index.md)
- [01-backend.md](./01-backend.md)
- [02-frontend.md](./02-frontend.md)
- [03-behavior.md](./03-behavior.md)
- [04-quality.md](./04-quality.md)

---

## File Ownership Rules

| File | Owns | Must NOT contain |
|------|------|-----------------|
| `00-index.md` | Executive summary, objective & scope, changelog, architecture overview, cross-file reference table | Implementation details |
| `01-backend.md` | DB schema, TypeScript Models, API endpoint contracts, validation rules, error handling | UI/component concerns, Implementation source code |
| `02-frontend.md` | File structure, wireframes, component tree, screen item specs, composable/store definitions, TS types | API endpoint detail, DB schema, Implementation source code |
| `03-behavior.md` | Page events & handlers, UI states (loading/empty/error), confirm dialogs, navigation flows, sequence diagrams | Raw API contracts, DB schema, Implementation source code |
| `04-quality.md` | Unit tests per page/component, integration tests, performance, security | Implementation source code |

---

## Required Sections per File

### 00-index.md
1. Executive Summary
2. Changelog
3. Objective & Scope (Purpose, In Scope, Out of Scope)
4. Architecture Overview (system diagram)
5. Spec File Index (table linking to the other 4 files)

### 01-backend.md
1. Data Models (DB schema dạng Prisma model table + TypeScript Models property list)
2. API Endpoints (one subsection per endpoint: request, flow, response, errors)
3. Validation Rules (client-side + server-side + business rules)
4. Error Handling (standard format + error scenarios table)

### 02-frontend.md
1. File Structure
2. Layout & Wireframes (application layout, component tree, per-page wireframe + Components list)
3. Screen Item Specifications (flat unified table per page — columns: `# | ItemName | Control | Type | Required | Validation | Placeholder | DisplayText | Description | Notes`)
4. Component Details (props + emits per component)
5. Composable
6. Store
7. TypeScript Types & Interfaces (property list, không code block)

### 03-behavior.md
1. Page Events & Handlers (onMounted + each handler per page)
2. UI States (loading, empty, error, success tables)
3. Confirm Dialogs (per dialog: trigger, title, message, buttons, outcomes)
4. Navigation Flows (table: action → from → to → condition)
5.  Mermaid Diagrams (create, update, delete Mermaid)

### 04-quality.md
1. Testing Strategy
   - 1.1 Backend Tests (unit, integration, authorization tables)
   - 1.2 Frontend Tests (per-page UT table with Arrange/Act/Assert columns, composable tests)
2. Performance Considerations
3. Security Considerations

---

## Common Rules

- Không bao gồm implementation details hoặc source code trong bất kỳ file nào; tập trung vào specifications, contracts, và design
- Sử dụng tiếng Việt cho nội dung; headers có thể giữ tiếng Anh
- **TypeScript types:** Mô tả chỉ liệt kê tên + property (không dùng code block). Trỏ file thực tế để tra cứu khi cần
- **Database schema:** Mô tả dạng Prisma model (bảng property với `@@map`, indexes, relations, FK cascade) — không viết raw `CREATE TABLE` SQL
- **Response/request JSON examples:** Code block được phép (chỉ thể hiện contract, không phải type definition)
- **File structure tree, sequence diagram ASCII:** Code block được phép (visual representation)

---

## Ordering & Naming Rules

- Files PHẢI được đánh số `00–04` với các tên ở trên
- `00-index.md` là canonical entry point — luôn bắt đầu ở đây
- Mỗi file phải bao gồm một dòng `> Related:` linking đến tất cả 4 files khác
- Content language: Tiếng Việt (headers/section titles có thể giữ tiếng Anh)
- Tất cả các sections bắt buộc phải có mặt; đánh dấu các sections không áp dụng là "Not applicable — [reason]"

---

## Screen Item Specification Table Format

Bộ cột unified cho tất cả các bảng screen item trong `02-frontend.md`:

| Column | Purpose |
|--------|---------|
| `#` | Row number |
| `ItemName` | Item hoặc component name; **bold** cho component boundary rows |
| `Control` | Control type: `Label`, `TextInput`, `Dropdown`, `Textarea`, `Button`, `Pagination`, v.v. Empty cho component boundary rows |
| `Type` | Data type (`string`, `number`, `boolean`, v.v.) hoặc `—` cho non-data controls |
| `Required` | `Yes` / `No` / `—` |
| `Validation` | Validation rules hoặc `—` |
| `Placeholder` | i18n key cho placeholder text, hoặc `—` |
| `DisplayText` | i18n key cho visible text trên Labels, Buttons, page titles, v.v. Sử dụng `—` cho controls không có static display text |
| `Description` | Item này làm gì |
| `Notes` | Events, references đến `03-behavior.md`, hoặc special behaviors |

> Component boundary rows sử dụng: `| **—** | **[ComponentName]** | | | | | | | | **Component** |`

---
