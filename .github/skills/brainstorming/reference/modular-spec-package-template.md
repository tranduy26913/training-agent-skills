# Modular Spec Package Template

This document defines the required structure for all spec deliverables written using the **brainstorming** skill.

---

## Package Structure

Every spec deliverable is a **multi-file package** saved to:

```text
docs/<topic>/specs/<topic>-design/
├── 00-index.md         ← REQUIRED: canonical entry point
├── 01-backend.md       ← REQUIRED: API and data
├── 02-frontend.md      ← REQUIRED: UI and components
├── 03-behavior.md      ← REQUIRED: events, flows, UI states
└── 04-quality.md       ← REQUIRED: testing, NFRs, logging
```

Use the file templates in this folder as the starting point:
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

- Do not include implementation details or source code in any file; focus on specifications, contracts, and design
- Use Vietnamese for content; headers may remain English
- **TypeScript types:** Mô tả chỉ liệt kê tên + property (không dùng code block). Trỏ file thực tế để tra cứu khi cần
- **Database schema:** Mô tả dạng Prisma model (bảng property với `@@map`, indexes, relations, FK cascade) — không viết raw `CREATE TABLE` SQL
- **Response/request JSON examples:** Code block được phép (chỉ thể hiện contract, không phải type definition)
- **File structure tree, sequence diagram ASCII:** Code block được phép (visual representation)

---

## Ordering & Naming Rules

- Files MUST be numbered `00–04` with the names above
- `00-index.md` is the canonical entry point — always start here
- Each file must include a `> Related:` line linking to all other 4 files
- Content language: Vietnamese (headers/section titles may remain English)
- All required sections must be present; mark inapplicable sections as "Not applicable — [reason]"

---

## Screen Item Specification Table Format

The unified column set for all screen item tables in `02-frontend.md`:

| Column | Purpose |
|--------|---------|
| `#` | Row number |
| `ItemName` | Item or component name; **bold** for component boundary rows |
| `Control` | Control type: `Label`, `TextInput`, `Dropdown`, `Textarea`, `Button`, `Pagination`, etc. Empty for component boundary rows |
| `Type` | Data type (`string`, `number`, `boolean`, etc.) or `—` for non-data controls |
| `Required` | `Yes` / `No` / `—` |
| `Validation` | Validation rules or `—` |
| `Placeholder` | i18n key for placeholder text, or `—` |
| `DisplayText` | i18n key for visible text on Labels, Buttons, page titles, etc. Use `—` for controls with no static display text |
| `Description` | What this item does |
| `Notes` | Events, references to `03-behavior.md`, or special behaviors |

> Component boundary rows use: `| **—** | **[ComponentName]** | | | | | | | | **Component** |`

---
