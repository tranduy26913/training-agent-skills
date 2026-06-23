# Project Management — Frontend Implementation Plan
> **For agentic workers:** REQUIRED SKILL: Use skill `executing-plans` to implement this plan.

## Plan Structure

## Phase 3 — Frontend

### Task 3.1 — Create service, composable, and store

**Spec Reference:** `docs/projects/specs/projects-design/02-frontend.md — Sections 5, 6`

**Files:**
- Create: `client/src/services/projects.service.ts`
- Create: `client/src/pages/projects/composables/useProjects.ts`
- Create: `client/src/stores/projects.store.ts`

- **Step 1:** Create `client/src/services/projects.service.ts`:
  - Class `ProjectsApiClient extends BaseApiClient<Project, CreateProjectDto, UpdateProjectDto>`
  - Constructor with `super('/admin/projects')`
  - Export singleton `projectsApiService`

- **Step 2:** Create `client/src/pages/projects/composables/useProjects.ts`:
  - Import `projectsApiService`
  - Export `useProjects()` function with methods: `getProjects`, `getProject`, `createProject`, `updateProject`, `deleteProject`
  - Re-export types: `Project`, `CreateProjectDto`, `UpdateProjectDto`

- **Step 3:** Create `client/src/stores/projects.store.ts`:
  - State: `projects` (ref<Project[]>, default []), `currentProject` (ref<Project | null>, default null), `loading` (shallowRef, default false), `error` (shallowRef<string | null>, default null)
  - Actions: `fetchProjects`, `fetchProject(id)`, `createProject(data)`, `updateProject(id, data)`, `deleteProject(id)`, `clearCurrentProject`
  - `deleteProject` auto-calls `fetchProjects` after success; `createProject` and `updateProject` do NOT auto-reload

- **Step 4:** Commit
  - `git add client/src/services/projects.service.ts client/src/pages/projects/composables/useProjects.ts client/src/stores/projects.store.ts`
  - `git commit -m "feat(projects): add service, composable, and store"`

### Task 3.2 — Create routes and sidebar menu

**Spec Reference:** `docs/projects/specs/projects-design/02-frontend.md — Section 2 (Route Definitions)`

**Files:**
- Create: `client/src/pages/projects/projects.routes.ts`
- Modify: `client/src/router/routes.ts` (import projectRoutes)
- Modify: `client/src/components/layout/AppSidebar.vue` (add menu item)

- **Step 1:** Create `client/src/pages/projects/projects.routes.ts`:
  - Path `/projects` with DefaultLayout, meta: requiresAuth + roles: ['admin']
  - Children: `''` → ProjectList, `:id` → ProjectDetail

- **Step 2:** Import and spread `projectRoutes` in `client/src/router/routes.ts`

- **Step 3:** Add menu item to `AppSidebar.vue`:
  - `{ labelKey: 'sidebar.projects', icon: 'pi pi-folder', to: '/projects', roles: ['admin'] }`

- **Step 4:** Commit
  - `git add client/src/pages/projects/projects.routes.ts client/src/router/routes.ts client/src/components/layout/AppSidebar.vue`
  - `git commit -m "feat(projects): add routes and sidebar menu"`

### Task 3.3 — Create ProjectCard component

**Spec Reference:** `docs/projects/specs/projects-design/02-frontend.md — Section 4 (ProjectCard.vue)`

**Files:**
- Create: `client/src/pages/projects/components/ProjectCard.vue`

- **Step 1:** Create `ProjectCard.vue` with:
  - Props: `project` (Project, required)
  - Emits: `click` (id), `edit` (id), `delete` (id)
  - Template: PrimeVue Card with:
    - Header: project name (bold, text-lg, truncate 2 lines)
    - Body: description (text-sm, text-gray-600, truncate 3 lines, hidden if null), prompt preview (text-xs, italic, text-gray-400, truncate 2 lines, hidden if null)
    - Footer: updatedAt formatted + action button (PiDotsThreeVertical icon) with OverlayPanel containing "Chỉnh sửa" and "Xoá" actions
  - Click on card body emits `click` with project id
  - Click on action items emits `edit` or `delete` with project id

- **Step 2:** Commit
  - `git add client/src/pages/projects/components/ProjectCard.vue`
  - `git commit -m "feat(projects): add ProjectCard component"`

### Task 3.4 — Create ProjectFormDialog component

**Spec Reference:** `docs/projects/specs/projects-design/02-frontend.md — Sections 3.3, 4 (ProjectFormDialog.vue)`

**Files:**
- Create: `client/src/pages/projects/components/ProjectFormDialog.vue`

- **Step 1:** Create `ProjectFormDialog.vue` with:
  - Props: `visible` (boolean), `mode` ('create' | 'edit'), `project` (Project | null)
  - Emits: `saved` (CreateProjectDto | UpdateProjectDto), `closed`
  - Uses PrimeVue Dialog component
  - Form fields: name (InputText, required, vee-validate + Zod: min 2, max 200), description (Textarea, max 2000, character counter), projectPrompt (Textarea, max 10000, character counter)
  - Actions: Cancel button (emits closed), Save button (disabled when loading, shows spinner)
  - On mount / watch project prop: populate form in edit mode, clear in create mode
  - On submit: validate, emit `saved` with form data

- **Step 2:** Commit
  - `git add client/src/pages/projects/components/ProjectFormDialog.vue`
  - `git commit -m "feat(projects): add ProjectFormDialog component"`

### Task 3.5 — Create ProjectDeleteDialog component

**Spec Reference:** `docs/projects/specs/projects-design/02-frontend.md — Sections 3.4, 4 (ProjectDeleteDialog.vue)`

**Files:**
- Create: `client/src/pages/projects/components/ProjectDeleteDialog.vue`

- **Step 1:** Create `ProjectDeleteDialog.vue` with:
  - Props: `visible` (boolean), `projectName` (string)
  - Emits: `confirmed`, `cancelled`
  - Uses PrimeVue Dialog with confirm message: "Bạn có chắc muốn xoá Project **{projectName}**?"
  - Actions: "Không" (emits cancelled), "Xoá" (severity danger, emits confirmed)

- **Step 2:** Commit
  - `git add client/src/pages/projects/components/ProjectDeleteDialog.vue`
  - `git commit -m "feat(projects): add ProjectDeleteDialog component"`

### Task 3.6 — Create ProjectListPage

**Spec Reference:** `docs/projects/specs/projects-design/02-frontend.md — Sections 3.1, 4; 03-behavior.md — Sections 1.1, 2`

**Files:**
- Create: `client/src/pages/projects/ProjectListPage.vue`

- **Step 1:** Create `ProjectListPage.vue` with:
  - On mount: call `projectsStore.fetchProjects()`
  - Template:
    - Page header with title "Quản lý Project" + "Tạo Project" button (PiPlus icon)
    - Loading state: 3 PrimeVue Skeleton cards in grid
    - Empty state: PiFolderOpen icon + "Chưa có Project nào" + "Tạo Project" button
    - Card grid: responsive grid (1 col mobile, 2 col tablet, 3 col desktop) of ProjectCard components
  - Handlers:
    - `handleCreateClick`: open ProjectFormDialog with mode='create'
    - `handleCardClick(id)`: router.push to ProjectDetail
    - `handleEditClick(id)`: open ProjectFormDialog with mode='edit' + project data
    - `handleDeleteClick(id)`: open ProjectDeleteDialog with projectName
    - `handleFormSaved(data)`: if create → createProject, if edit → updateProject, then close dialog + reload list
    - `handleFormClosed`: close dialog
    - `handleDeleteConfirmed(id)`: deleteProject, close dialog + reload list
    - `handleDeleteCancelled`: close dialog

- **Step 2:** Commit
  - `git add client/src/pages/projects/ProjectListPage.vue`
  - `git commit -m "feat(projects): add ProjectListPage with card grid"`

### Task 3.7 — Create ProjectDetailPage

**Spec Reference:** `docs/projects/specs/projects-design/02-frontend.md — Sections 3.2; 03-behavior.md — Sections 1.2, 2`

**Files:**
- Create: `client/src/pages/projects/ProjectDetailPage.vue`

- **Step 1:** Create `ProjectDetailPage.vue` with:
  - On mount: fetch project by route param id, redirect to list if 404
  - On unmount: clearCurrentProject
  - Template:
    - Back button (PiArrowLeft icon + "Quay lại")
    - Page title "Chi tiết Project"
    - Read-only display of: name, description, projectPrompt, ownerName, createdAt, updatedAt
    - Loading state: form skeleton
  - Handler: handleBackClick → router.push to ProjectList

- **Step 2:** Commit
  - `git add client/src/pages/projects/ProjectDetailPage.vue`
  - `git commit -m "feat(projects): add ProjectDetailPage"`

### Task 3.8 — Write frontend tests

**Spec Reference:** `docs/projects/specs/projects-design/04-quality.md — Section 1.2`

**Files:**
- Create: `client/src/pages/projects/ProjectListPage.test.ts`
- Create: `client/src/pages/projects/ProjectDetailPage.test.ts`
- Create: `client/src/pages/projects/components/ProjectCard.test.ts`
- Create: `client/src/pages/projects/components/ProjectFormDialog.test.ts`
- Create: `client/src/pages/projects/components/ProjectDeleteDialog.test.ts`
- Create: `client/src/pages/projects/composables/useProjects.test.ts`
- Create: `client/src/stores/projects.store.test.ts`

- **Step 1:** Write tests per spec tables in `04-quality.md`:
  - `ProjectListPage.test.ts`: 10 test cases (loading, loaded, empty, create/edit/delete dialog triggers, card click navigation, form saved handlers)
  - `ProjectDetailPage.test.ts`: 5 test cases (loading, loaded, 404 redirect, back click, clearCurrentProject)
  - `ProjectCard.test.ts`: 8 test cases (name, description, prompt display/hide, click/edit/delete emits)
  - `ProjectFormDialog.test.ts`: 13 test cases (empty form, pre-fill, validation rules, emit saved, disable save, emit closed, character counters)
  - `ProjectDeleteDialog.test.ts`: 3 test cases (project name display, confirmed emit, cancelled emit)
  - `useProjects.test.ts`: 4 test cases (getProjects, createProject, updateProject, deleteProject)
  - `projects.store.test.ts`: 8 test cases (fetchProjects, loading flag, error, create/update no reload, delete auto reload, clearCurrentProject, fetchProject)

- **Step 2:** Run tests:
  - `cd client && npx vitest run src/pages/projects/`
  - Expected: all tests pass

- **Step 3:** Commit
  - `git add client/src/pages/projects/ client/src/stores/projects.store.test.ts`
  - `git commit -m "test(projects): add frontend unit tests"`
