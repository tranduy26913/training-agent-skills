---
title: Project Management - Quality & Operations
version: 1.0
author: Admin Team
date: 2026-06-23
---

# Project Management — Quality & Operations

> Related: [00-index.md](./00-index.md) | [01-backend.md](./01-backend.md) | [02-frontend.md](./02-frontend.md) | [03-behavior.md](./03-behavior.md)

---

## 1. Testing Strategy

### 1.1 Backend Tests

> **Rule:** Tất cả backend tests trong 1 file: `server/src/modules/admin/projects/projects.controller.test.ts`
> Sử dụng database test, chạy migrations trước tests.

#### Unit Tests (service layer)

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Create project - success | Valid input (name, description, projectPrompt) | Call create method | Returns entity with id, ownerId set |
| 2 | Create project - validation error (name too short) | name = "A" | Call create method | Throws validation error |
| 3 | Create project - validation error (name too long) | name = "A".repeat(201) | Call create method | Throws validation error |
| 4 | Get project by ID - found | Existing project ID | Call getById method | Returns correct project |
| 5 | Get project by ID - not found | Non-existing ID | Call getById method | Throws 404 error |
| 6 | Get project by ID - soft deleted | Deleted project ID | Call getById method | Throws 404 error |
| 7 | Update project - success | Valid update data | Call update method | Modifies and returns entity |
| 8 | Update project - not found | Non-existing ID | Call update method | Throws 404 error |
| 9 | Update project - partial update | Only update name | Call update method | Only name changed, other fields unchanged |
| 10 | Delete project - success (soft delete) | Existing project ID | Call delete method | Sets isDeleted = true |
| 11 | Delete project - already deleted | Deleted project ID | Call delete method | Throws 404 error |
| 12 | List projects - returns only non-deleted | 3 projects (1 deleted) | Call list method | Returns 2 projects, sorted by updatedAt desc |

#### Integration Tests (HTTP endpoints)

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | GET list — authenticated, returns data | Mock authenticated admin | GET `/api/admin/projects` | 200 with data[] |
| 2 | GET list — unauthenticated, 401 | No auth header | GET `/api/admin/projects` | 401 |
| 3 | GET list — non-admin, 403 | Mock user with role "user" | GET `/api/admin/projects` | 403 |
| 4 | POST create — valid body, 201 | Mock admin with valid body | POST `/api/admin/projects` | 201 with created project |
| 5 | POST create — invalid body (short name), 400 | Mock admin, name = "A" | POST `/api/admin/projects` | 400 with validation errors |
| 6 | POST create — invalid body (empty name), 400 | Mock admin, name = "" | POST `/api/admin/projects` | 400 with validation errors |
| 7 | GET by id — existing, 200 | Mock admin, existing project | GET `/api/admin/projects/1` | 200 with project data |
| 8 | GET by id — non-existing, 404 | Mock admin, unknown ID | GET `/api/admin/projects/999` | 404 |
| 9 | GET by id — soft deleted, 404 | Mock admin, deleted project | GET `/api/admin/projects/2` | 404 |
| 10 | PUT update — existing, 200 | Mock admin, valid update | PUT `/api/admin/projects/1` | 200 with updated project |
| 11 | PUT update — non-existing, 404 | Mock admin, unknown ID | PUT `/api/admin/projects/999` | 404 |
| 12 | PUT update — invalid body, 400 | Mock admin, name too long | PUT `/api/admin/projects/1` | 400 |
| 13 | DELETE — existing, 200 | Mock admin, existing project | DELETE `/api/admin/projects/1` | 200 with success message |
| 14 | DELETE — non-existing, 404 | Mock admin, unknown ID | DELETE `/api/admin/projects/999` | 404 |
| 15 | DELETE — already deleted, 404 | Mock admin, deleted project | DELETE `/api/admin/projects/2` | 404 |

#### Authorization Tests

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Admin can access list | Mock user with role "admin" | GET `/api/admin/projects` | 200 |
| 2 | User cannot access list | Mock user with role "user" | GET `/api/admin/projects` | 403 |
| 3 | Admin can create | Mock user with role "admin" | POST `/api/admin/projects` | 201 |
| 4 | User cannot delete | Mock user with role "user" | DELETE `/api/admin/projects/1` | 403 |

---

### 1.2 Frontend Tests

#### ProjectListPage (`ProjectListPage.test.ts`)

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Hiển thị skeleton khi loading | `projectsStore.loading = true` | render | Skeleton cards visible |
| 2 | Hiển thị danh sách cards khi loaded | `projectsStore.projects = [mockProject1, mockProject2]` | render | 2 ProjectCard components rendered |
| 3 | Hiển thị empty state khi không có projects | `projectsStore.projects = []` | render | Empty state message + create button visible |
| 4 | Mở create dialog khi click "Tạo Project" | — | Click create button | ProjectFormDialog visible với mode="create" |
| 5 | Mở edit dialog khi click "Chỉnh sửa" | projects có 1 item | Click edit action | ProjectFormDialog visible với mode="edit" + project data |
| 6 | Mở delete dialog khi click "Xoá" | projects có 1 item | Click delete action | ProjectDeleteDialog visible với projectName |
| 7 | handleCardClick điều hướng đến detail | — | Click ProjectCard | `router.push({ name: 'ProjectDetail', params: { id } })` |
| 8 | handleFormSaved (create) gọi createProject | mock store | ProjectFormDialog emit saved | `projectsStore.createProject(data)` được gọi |
| 9 | handleFormSaved (edit) gọi updateProject | mock store | ProjectFormDialog emit saved | `projectsStore.updateProject(id, data)` được gọi |
| 10 | handleDeleteConfirmed gọi deleteProject | mock store | ProjectDeleteDialog emit confirmed | `projectsStore.deleteProject(id)` được gọi |

#### ProjectDetailPage (`ProjectDetailPage.test.ts`)

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Hiển thị loading khi đang fetch | `projectsStore.loading = true` | render | Skeleton visible |
| 2 | Hiển thị thông tin project khi loaded | `projectsStore.currentProject = mockProject` | render | Tất cả fields hiển thị đúng |
| 3 | Redirect về list khi project not found | `fetchProject` trả về 404 | mount | `router.push({ name: 'ProjectList' })` |
| 4 | handleBackClick quay về list | — | Click Back button | `router.push({ name: 'ProjectList' })` |
| 5 | clearCurrentProject on unmount | — | unmount | `projectsStore.clearCurrentProject()` được gọi |

#### ProjectCard.vue (`ProjectCard.test.ts`)

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Hiển thị tên Project | `project = { name: 'Test' }` | render | Tên "Test" hiển thị |
| 2 | Hiển thị mô tả | `project = { description: 'Desc' }` | render | Mô tả hiển thị |
| 3 | Ẩn mô tả khi null | `project = { description: null }` | render | Mô tả không hiển thị |
| 4 | Hiển thị prompt preview | `project = { projectPrompt: 'Prompt...' }` | render | Prompt preview hiển thị |
| 5 | Ẩn prompt preview khi null | `project = { projectPrompt: null }` | render | Prompt preview không hiển thị |
| 6 | Emit click khi click card | — | Click card | emit `click` với project id |
| 7 | Emit edit khi click "Chỉnh sửa" | — | Click edit action | emit `edit` với project id |
| 8 | Emit delete khi click "Xoá" | — | Click delete action | emit `delete` với project id |

#### ProjectFormDialog.vue (`ProjectFormDialog.test.ts`)

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Hiển thị form rỗng ở create mode | `mode="create", project=null` | render | Tất cả fields rỗng |
| 2 | Pre-fill form ở edit mode | `mode="edit", project=mockProject` | render | Fields populated với project data |
| 3 | Validation: name required | name = '' | Click Save | Inline error "Tên phải từ 2 ký tự" |
| 4 | Validation: name min 2 | name = 'A' | Click Save | Inline error "Tên phải từ 2 ký tự" |
| 5 | Validation: name max 200 | name = 'A'.repeat(201) | Click Save | Inline error "Tên không quá 200 ký tự" |
| 6 | Validation: description max 2000 | description = 'A'.repeat(2001) | Click Save | Inline error "Mô tả không quá 2000 ký tự" |
| 7 | Validation: prompt max 10000 | prompt = 'A'.repeat(10001) | Click Save | Inline error "Prompt không quá 10000 ký tự" |
| 8 | Emit saved với data hợp lệ | Form filled valid | Click Save | emit `saved` với form data |
| 9 | Không emit saved khi form invalid | Form có field invalid | Click Save | emit `saved` NOT called |
| 10 | Disable save button khi loading | `loading=true` | render | Save button disabled |
| 11 | Emit closed khi click Cancel | — | Click Cancel | emit `closed` |
| 12 | Character counter cho description | description = 'Hello' | render | Hiển thị '5/2000' |
| 13 | Character counter cho prompt | prompt = 'Hello' | render | Hiển thị '5/10000' |

#### ProjectDeleteDialog.vue (`ProjectDeleteDialog.test.ts`)

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | Hiển thị tên Project trong message | `projectName = "Test Project"` | render | Message chứa "Test Project" |
| 2 | Emit confirmed khi click "Xoá" | — | Click Delete button | emit `confirmed` |
| 3 | Emit cancelled khi click "Không" | — | Click Cancel button | emit `cancelled` |

#### useProjects.ts (`useProjects.test.ts`)

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | getProjects gọi API và trả về danh sách | mock projectsApiService | Call `getProjects()` | `projectsApiService.getList()` được gọi |
| 2 | createProject gọi API với data | mock projectsApiService | Call `createProject(data)` | `projectsApiService.create(data)` được gọi |
| 3 | updateProject gọi API với id và data | mock projectsApiService | Call `updateProject(1, data)` | `projectsApiService.update(1, data)` được gọi |
| 4 | deleteProject gọi API với id | mock projectsApiService | Call `deleteProject(1)` | `projectsApiService.delete(1)` được gọi |

#### projects.store.ts (`projects.store.test.ts`)

| # | Test Case | Arrange | Act | Assert |
|---|-----------|---------|-----|--------|
| 1 | fetchProjects: cập nhật projects | mock useProjects.getProjects | Call `fetchProjects()` | `projects` được set |
| 2 | fetchProjects: loading flag | — | Trong khi fetch | `loading=true`; sau đó `loading=false` |
| 3 | fetchProjects: set error khi fail | mock getProjects throw | Call `fetchProjects()` | `error` được set |
| 4 | createProject: gọi composable, KHÔNG reload list | mock createProject | Call `createProject(data)` | Composable được gọi; `fetchProjects` KHÔNG được gọi |
| 5 | updateProject: gọi composable, KHÔNG reload list | mock updateProject | Call `updateProject(1, data)` | Composable được gọi; `fetchProjects` KHÔNG được gọi |
| 6 | deleteProject: tự động reload fetchProjects | mock deleteProject resolve | Call `deleteProject(1)` | `fetchProjects` được gọi lại |
| 7 | clearCurrentProject: clear state | `currentProject = mockProject` | Call `clearCurrentProject()` | `currentProject = null` |
| 8 | fetchProject: set currentProject | mock getProject | Call `fetchProject(1)` | `currentProject` được set |

---

## 2. Performance Considerations

| Concern | Strategy |
|---------|----------|
| List query | Không phân trang (danh sách Project dự kiến nhỏ, < 100 items) |
| Database indexes | Index on `ownerId` và `isDeleted` |
| Soft delete filter | Mọi query đều filter `isDeleted = false` |
| Lazy loading | Dynamic import cho ProjectListPage và ProjectDetailPage |

---

## 3. Security Considerations

| Concern | Control |
|---------|---------|
| Authentication | All endpoints require valid JWT token |
| Authorization | Role-based: chỉ admin mới được truy cập |
| Input Validation | Server-side validation trên tất cả request body fields (Zod) |
| SQL Injection | Sử dụng Prisma ORM (parameterized queries) |
| Soft Delete | Dữ liệu không bao giờ bị xoá vật lý qua API |
| Audit Trail | Ghi audit log cho tất cả CREATE/UPDATE/DELETE actions |
| Owner tracking | `ownerId` tự động gán từ authenticated user, không nhận từ client |
