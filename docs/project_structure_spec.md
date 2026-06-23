# Project Structure Specification

**Stack**: Vue.js 3 · Express.js · MySQL · TypeScript · PrimeVue · Vite  
**Architecture**: Monorepo · Page-based Frontend · Layered Backend

---

## 1. Monorepo Layout

```
project-root/
├── client/                  # Vue.js frontend (Vite)
├── server/                  # Express.js backend
├── database/                # SQL migrations & seeds
├── .env.example             # Environment variable template
├── .env                     # Local environment variables (git-ignored)
├── .gitignore
├── tsconfig.base.json       # Shared TypeScript config
└── README.md
```

---

## 2. Frontend (`client/`)

### 2.1 Directory Structure

```
client/
├── public/
│   └── favicon.ico
├── src/
│   ├── app/                      # App shell & global setup
│   │   ├── App.vue               # Root component
│   │   ├── main.ts               # App entry point
│   │   └── app.config.ts         # App-level config (PrimeVue, plugins)
│   │
│   ├── assets/                   # Static assets (images, fonts)
│   │   ├── images/
│   │   └── styles/
│   │       ├── _variables.css    # CSS custom properties
│   │       ├── _reset.css        # CSS reset/normalize
│   │       ├── _typography.css   # Font definitions
│   │       └── main.css          # Global styles entry
│   │
│   ├── layouts/                  # Page layout wrappers
│   │   ├── DefaultLayout.vue     # Sidebar + header + content
│   │   ├── AuthLayout.vue        # Centered card (login)
│   │   └── BlankLayout.vue       # No chrome (error pages)
│   │
│   ├── pages/                    # ★ PAGE-BASED MODULES ★
│   │   ├── auth/                 # Auth pages module
│   │   │   ├── LoginPage.vue
│   │   │   ├── components/        # Auth-specific components
│   │   │   │   └── LoginForm.vue
│   │   │   └── auth.routes.ts    # Auth route definitions
│   │   │
│   │   ├── dashboard/            # Dashboard page module
│   │   │   ├── DashboardPage.vue
│   │   │   └── dashboard.routes.ts
│   │   │
│   │   ├── users/                # Users management module
│   │   │   ├── UserListPage.vue
│   │   │   ├── UserCreatePage.vue
│   │   │   ├── UserEditPage.vue
│   │   │   ├── users.routes.ts
│   │   │   ├── components/
│   │   │   │   ├── UserTable.vue
│   │   │   │   ├── UserFilters.vue
│   │   │   │   ├── UserForm.vue
│   │   │   │   └── AuditLogViewer.vue
│   │   │   └── composables/
│   │   │       └── useUsers.ts
│   │   │
│   │   ├── profile/              # Profile module
│   │   │   ├── ProfilePage.vue
│   │   │   ├── profile.routes.ts
│   │   │   └── components/
│   │   │       └── ProfileForm.vue
│   │   │
│   │   └── settings/             # Settings module
│   │       ├── SettingsPage.vue
│   │       └── settings.routes.ts
│   │
│   ├── components/               # ★ GLOBAL SHARED COMPONENTS ★
│   │   ├── AppDataTable.vue      # Generic PrimeVue DataTable wrapper
│   │   └── layout/               # Layout building blocks
│   │       ├── AppSidebar.vue
│   │       ├── AppTopbar.vue
│   │       ├── AppFooter.vue
│   │       ├── AppBreadcrumb.vue
│   │       ├── LanguageSwitcher.vue
│   │       └── AppMenu.vue
│   │
│   ├── composables/              # ★ GLOBAL COMPOSABLES ★
│   │   ├── useEmailValidation.ts # Email duplicate check (debounced)
│   │   ├── useProfile.ts         # Profile update + change password
│   │   └── __tests__/
│   │
│   ├── stores/                   # Pinia stores (global state)
│   │   ├── index.ts              # Pinia setup
│   │   ├── auth.store.ts         # Auth state & actions
│   │   ├── ui.store.ts           # Sidebar, theme
│   │   ├── users.store.ts        # Users management state
│   │   └── __tests__/
│   │
│   ├── router/                   # Vue Router config
│   │   ├── index.ts              # Router instance & guards
│   │   └── routes.ts             # Aggregated route definitions
│   │
│   ├── services/                 # API service layer
│   │   ├── api.service.ts        # Axios instance & interceptors
│   │   ├── base-api.service.ts   # Generic CRUD base class
│   │   ├── auth.service.ts       # Auth API calls
│   │   ├── users.service.ts      # Users CRUD + checkEmail + getUserActivity
│   │   ├── profile.service.ts    # Profile API calls
│   │   └── __tests__/
│   │
│   ├── locales/                  # ★ I18N TRANSLATIONS ★
│   │   ├── index.ts              # Locale barrel export
│   │   ├── en.ts                 # English translations
│   │   ├── vi.ts                 # Vietnamese translations
│   │   └── ja.ts                 # Japanese translations
│   │
│   ├── plugins/                  # Vue plugin registrations
│   │   ├── primevue.ts           # PrimeVue + theme setup
│   │   ├── i18n.ts               # vue-i18n setup & locale config
│   │   ├── pinia.ts              # Pinia setup
│   │   └── router.ts             # Router plugin
│   │
│   ├── types/                    # Client-only types
│   │   ├── api.types.ts          # Shared types (Pagination, UserRole, etc.)
│   │   ├── auth.types.ts         # Auth types
│   │   ├── users.types.ts        # User, UserFilters, AuditLog, DTOs
│   │   ├── profile.types.ts      # Profile DTOs
│   │   ├── table.types.ts        # AppTableColumn
│   │   ├── components.d.ts       # Global component types
│   │   ├── env.d.ts              # Vite env type declarations
│   │   └── router.d.ts           # Route meta types
│   └── utils/                    # Pure utility functions (if any)
│
├── e2e/                          # Playwright E2E tests
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
└── package.json
```

### 2.2 Path Aliases

Frontend dùng path alias style `@alias/` (không có `/` sau `@`), định nghĩa trong `client/tsconfig.json`:

| Alias | Trỏ tới |
|-------|---------|
| `@app/*` | `src/app/*` |
| `@assets/*` | `src/assets/*` |
| `@components/*` | `src/components/*` |
| `@composables/*` | `src/composables/*` |
| `@layouts/*` | `src/layouts/*` |
| `@locales` | `src/locales/index.ts` |
| `@locales/*` | `src/locales/*` |
| `@pages/*` | `src/pages/*` |
| `@plugins/*` | `src/plugins/*` |
| `@router` | `src/router/index.ts` |
| `@router/*` | `src/router/*` |
| `@services/*` | `src/services/*` |
| `@stores/*` | `src/stores/*` |
| `@apptypes/*` | `src/types/*` |

**Quy tắc:** Cross-module dùng `@alias/...`, intra-module dùng `./` hoặc `../`.

### 2.3 Route Aggregation Pattern

Each page module exports its own routes. The central router collects them:

```typescript
// client/src/router/routes.ts
import { authRoutes } from '@pages/auth/auth.routes';
import { dashboardRoutes } from '@pages/dashboard/dashboard.routes';
import { userRoutes } from '@pages/users/users.routes';
import { settingsRoutes } from '@pages/settings/settings.routes';
import { profileRoutes } from '@pages/profile/profile.routes';

export const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/dashboard' },
  ...authRoutes,
  ...dashboardRoutes,
  ...userRoutes,
  ...settingsRoutes,
  ...profileRoutes,
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
];
```

```typescript
// client/src/pages/users/users.routes.ts
import type { RouteRecordRaw } from 'vue-router';

export const userRoutes: RouteRecordRaw[] = [
  {
    path: '/users',
    component: () => import('@layouts/DefaultLayout.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
    children: [
      {
        path: '',
        name: 'UserList',
        component: () => import('./UserListPage.vue'),
        meta: { title: 'Users', titleKey: 'users.title', breadcrumb: 'Users' },
      },
      {
        path: 'create',
        name: 'UserCreate',
        component: () => import('./UserCreatePage.vue'),
        meta: { title: 'Create User', titleKey: 'users.createUser' },
      },
      {
        path: ':id/edit',
        name: 'UserEdit',
        component: () => import('./UserEditPage.vue'),
        meta: { title: 'Edit User', titleKey: 'users.editUser' },
      },
    ],
  },
];
```

### 2.4 Adding a New Page Module

> [!TIP]
> To add a new feature (e.g., **Products**), create a folder under `pages/` and follow this checklist:

```
1. Create  client/src/pages/products/
2. Add     ProductListPage.vue, ProductCreatePage.vue, etc.
3. Add     components/    (page-specific components)
4. Add     composables/   (page-specific logic)
5. Create  products.routes.ts
6. Import  routes in client/src/router/routes.ts
7. Add     server/src/modules/products/  (backend module)
8. Create  products.controller.ts, products.service.ts, products.repository.ts,
           products.routes.ts, products.validation.ts
9. Create  products.controller.test.ts  # Unit + Integration test bằng Vitest, chỉ test trên controller
10. Add    types in client/src/types/products.types.ts
```

---

## 3. Backend (`server/`)

### 3.1 Directory Structure

```
server/
├── src/
│   ├── app.ts                    # Express app setup (middleware, routes)
│   ├── server.ts                 # HTTP server entry point
│   │
│   ├── core/                     # ★ CORE ABSTRACTION LAYER ★
│   │   ├── index.ts              # Barrel export
│   │   ├── api-provider.service.ts # Factory — register & get AI providers
│   │   └── providers/            # Concrete AI provider implementations
│   │       ├── index.ts          # Barrel export
│   │       ├── types.ts          # IAiProvider interface, shared types
│   │       ├── gemini.provider.ts # Google Gemini API provider
│   │       ├── comfy.provider.ts  # ComfyUI workflow provider
│   │       └── zai.provider.ts   # Zai AI API provider
│   │
│   ├── config/                   # Configuration
│   │   ├── index.ts              # Aggregated config export
│   │   ├── auth.config.ts        # JWT secrets, token expiry
│   │   ├── cors.config.ts        # CORS allowed origins
│   │   └── app.config.ts         # Port, env, API prefix, body size limit
│   │
│   ├── modules/                  # ★ FEATURE MODULES ★
│   │   ├── auth/                 # Auth module (login, me)
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.controller.test.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.validation.ts
│   │   │
│   │   ├── admin/                # Admin-only modules
│   │   │   └── users/            # User management module
│   │   │       ├── users.controller.ts
│   │   │       ├── users.controller.test.ts
│   │   │       ├── users.service.ts
│   │   │       ├── users.repository.ts
│   │   │       ├── users.routes.ts
│   │   │       └── users.validation.ts
│   │   │
│   │   └── user/                 # User self-service module (profile)
│   │
│   ├── database/                 # Database layer (Prisma)
│   │   ├── prisma.ts             # Prisma client singleton
│   │   ├── seed.ts               # Database seeding (Prisma upsert)
│   │   └── __tests__/
│   │
│   ├── middleware/               # Global middleware
│   │   ├── error.middleware.ts   # Central error handler (ServiceError → HTTP)
│   │   ├── auth.middleware.ts    # JWT verification + requireRole guard
│   │   ├── async-handler.middleware.ts # Async wrapper (reject → errorMiddleware)
│   │   └── validate.middleware.ts # Request validation (Zod, body/query)
│   │
│   ├── models/                   # Shared model definitions
│   │   ├── common.model.ts       # ServiceError, pagination, role/action types
│   │   ├── auth.model.ts         # JwtPayload
│   │   ├── users.model.ts        # User, AuditLog, UserFilters, AuditLogDTO
│   │   └── index.ts              # Barrel export
│   │
│   ├── utils/                    # Utility functions
│   │   ├── response.util.ts      # sendSuccess / sendError helpers
│   │   ├── hash.util.ts          # bcrypt password hashing
│   │   ├── token.util.ts         # JWT sign/verify helpers
│   │   ├── logger.util.ts        # Winston logger instance
│   │   └── auth.util.ts          # getAuthUser / getAuthUserId (type-safe)
│   │
│   ├── types/                    # Server-only types
│   │   └── express.d.ts          # AuthenticatedRequest (extends Request)
│   │
│   └── __tests__/                # Cross-module or shared test utilities
│       └── setup.ts              # Global test setup
│
├── prisma/                       # Prisma schema & migrations
│   ├── schema.prisma             # Auto-generated from schema/ files
│   ├── schema/                   # Per-table schema fragments
│   ├── migrations/               # Prisma migrations
│   └── scripts/                  # Schema merge script
├── package.json
├── tsconfig.json
├── vitest.config.mts             # Vitest config
└── nodemon.json
```

### 3.2 Path Aliases (Backend)

Backend dùng path alias style `@alias/`, định nghĩa trong `server/tsconfig.json`:

| Alias | Trỏ tới |
|-------|---------|
| `@config` | `config/index.ts` |
| `@models/*` | `models/*` |
| `@middleware/*` | `middleware/*` |
| `@database/*` | `database/*` |
| `@utils/*` | `utils/*` |
| `@modules/*` | `modules/*` |
| `@core/*` | `core/*` |
| `@types-express` | `types/express.d.ts` |
| `@app` | `app.ts` |

### 3.3 Module Layer Pattern

Each backend module follows a consistent layered pattern:

```mermaid
graph TD
    A[Route] -->|asyncHandler + validate| B[Controller]
    B -->|calls business logic| C[Service]
    C -->|queries database| D[Repository]
    D -->|uses| E[Prisma Client]
```

| Layer | Responsibility | Example |
|---|---|---|
| **Route** | HTTP verbs, path, middleware chain, asyncHandler | `router.get('/', asyncHandler(controller.getUsers.bind(controller)))` |
| **Controller** | Class-based, thin; parse request, call service, sendSuccess | Extract query params → call service → `sendSuccess(res, result)` |
| **Service** | Business logic, throw ServiceError | Validate business rules, call repository, build audit diff |
| **Repository** | Prisma queries, select to exclude sensitive fields | `prisma.user.findMany({ where, select: USER_PUBLIC_SELECT })` |
| **Validation** | Zod schemas, export inferred types | `createUserSchema`, `CreateUserInput` |

### 3.3.1 Test files per module

Mỗi module backend chỉ có **duy nhất một file test** cạnh controller:

```
server/src/modules/<feature>/
├── <feature>.controller.ts
└── <feature>.controller.test.ts   # Unit + Integration test bằng Vitest, chỉ test trên controller
```

| File | Loại test | DB | Mục đích |
|---|---|---|---|
| `<feature>.controller.test.ts` | Integration (mặc định) | **Real test DB** | Test HTTP endpoint đầy đủ: routing, middleware, auth, validation, response |
| `<feature>.controller.test.ts` | Unit (khi cần) | Mock boundary | Test controller với mock external service/gateway trong cùng file |

Ví dụ module `users`:

```
server/src/modules/admin/users/
├── users.controller.ts
├── users.controller.test.ts   # Unit + Integration bằng Vitest, chỉ test controller
├── users.service.ts
├── users.repository.ts
├── users.routes.ts
└── users.validation.ts
```

#### Controller test checklist

- [ ] Import `describe`, `it`, `expect`, `beforeAll`, `beforeEach`, `afterEach`, `afterAll`, `vi` từ `vitest`
- [ ] Load `.env` để trỏ đúng test database
- [ ] Dùng `supertest` với Express `app` thật
- [ ] Tạo JWT token thật qua `signToken()`
- [ ] Tạo test data trực tiếp qua `prisma.user.create()` (không mock)
- [ ] Dọn dẹp data trong `beforeEach` / `afterEach` qua `prisma.deleteMany()` / `prisma.delete()`
- [ ] Đóng `prisma.$disconnect()` trong `afterAll`
- [ ] Assert cả HTTP response lẫn trạng thái DB sau khi gọi API

### 3.4 Route Registration

```typescript
// server/src/app.ts
import { authRoutes } from '@modules/auth/auth.routes';
import { usersRoutes } from '@modules/admin/users/users.routes';
import { errorMiddleware } from '@middleware/error.middleware';

app.use(`${appConfig.apiPrefix}/auth`, authRoutes);
app.use(`${appConfig.apiPrefix}/admin/users`, usersRoutes);
app.get(`${appConfig.apiPrefix}/health`, (_req, res) => res.json({ status: 'ok' }));

// Error handler (must be registered last)
app.use(errorMiddleware);
```

Auth + role guard được apply trong từng router file, không phải trong `app.ts`:

```typescript
// users.routes.ts
router.use(authMiddleware, requireRole('admin'));
```

### 3.5 Repository Pattern (Prisma)

Repository dùng Prisma Client trực tiếp, không kế thừa base class. Mỗi repository tự định nghĩa `select` shape để loại trừ sensitive fields:

```typescript
// server/src/modules/admin/users/users.repository.ts
import { prisma } from '@database/prisma';
import type { Prisma } from '@prisma/client';

const USER_PUBLIC_SELECT = {
  id: true, name: true, email: true, role: true, status: true,
  avatar: true, lastLoginAt: true, points: true, note: true, birthday: true,
  createdAt: true, updatedAt: true,
} as const;

const ALLOWED_SORT_FIELDS: Record<string, Prisma.UserOrderByWithRelationInput> = {
  id: { id: 'asc' },
  name: { name: 'asc' },
  email: { email: 'asc' },
  role: { role: 'asc' },
  status: { status: 'asc' },
  created_at: { createdAt: 'asc' },
  updated_at: { updatedAt: 'asc' },
};

export class UsersRepository {
  async findAllWithFilters(filters: UserFilters) {
    const where = this.buildWhereClause(filters);
    const skip = (filters.page || 1 - 1) * (filters.limit || 20);
    const [data, total] = await Promise.all([
      prisma.user.findMany({ where, orderBy, skip, take: filters.limit || 20, select: USER_PUBLIC_SELECT }),
      prisma.user.count({ where }),
    ]);
    return { data, total };
  }

  findByIdWithoutPassword(id: number) {
    return prisma.user.findUnique({ where: { id }, select: USER_PUBLIC_SELECT });
  }

  // ... create, update, delete, createAuditLog, getAuditLogs
}
```

**Quy tắc:**
- Không có `BaseRepository` chung — mỗi repository tự định nghĩa `select` và `where` clause
- Sort whitelist: map field name → `Prisma.OrderByInput`, fallback `createdAt: 'desc'`
- Dùng `Promise.all` để chạy `findMany` + `count` song song
- `prisma` instance từ `@database/prisma` (singleton)

---

## 4. Database

### 4.1 Prisma Schema

Schema được khai báo tại `server/prisma/schema.prisma` (auto-generated từ `server/prisma/schema/` fragments). Chạy `npm run schema:merge` để gộp.

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id           Int       @id @default(autoincrement()) @db.UnsignedInt
  name         String    @db.VarChar(100)
  email        String    @unique @db.VarChar(255)
  password     String    @db.VarChar(255)
  role         String    @default("user") @db.VarChar(20)
  status       String    @default("active") @db.VarChar(20)
  avatar       String?   @db.VarChar(500)
  lastLoginAt  DateTime? @map("last_login_at")
  points       Int       @default(0)
  note         String?   @db.VarChar(500)
  birthday     DateTime? @db.Date
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  auditLogsAsAdmin   AuditLog[] @relation("AuditLogAdmin")
  auditLogsAsTarget  AuditLog[] @relation("AuditLogTarget")

  @@index([role])
  @@index([status])
  @@map("users")
}

model AuditLog {
  id              Int      @id @default(autoincrement()) @db.UnsignedInt
  adminId         Int      @map("admin_id") @db.UnsignedInt
  targetUserId    Int      @map("target_user_id") @db.UnsignedInt
  action          String   @db.VarChar(20)
  changedFields   Json?    @map("changed_fields")
  timestamp       DateTime @default(now()) @db.DateTime(0)

  admin   User @relation("AuditLogAdmin",  fields: [adminId],      references: [id], onDelete: Cascade)
  target  User @relation("AuditLogTarget", fields: [targetUserId], references: [id], onDelete: Cascade)

  @@index([targetUserId])
  @@map("audit_logs")
}
```

### 4.2 SQL Migrations & Seeds

```
database/
├── seeds/                       # SQL seed files
└── schema.sql                   # Full schema snapshot (reference)
```

Prisma migrations nằm trong `server/prisma/migrations/`. Seed script dùng Prisma upsert (idempotent) tại `server/src/database/seed.ts`.

> [!NOTE]
- Chạy `npm run migrate` để tạo migration mới
- Chạy `npm run seed` để seed database
- Chạy `npm run seed:test` để seed test database
- Không sửa migration đã chạy — tạo migration mới

---

## 5. Key Libraries & Versions

| Package | Purpose | Workspace |
|---|---|---|
| `vue@3` | Frontend framework | client |
| `vite@6` | Build tool & dev server | client |
| `primevue@4` | UI component library | client |
| `@primevue/themes` | PrimeVue Aura/Lara theme | client |
| `vue-router@4` | Client-side routing | client |
| `pinia@2` | State management | client |
| `vue-i18n@10` | Internationalization (EN, VI, JA) | client |
| `axios` | HTTP client | client |
| `express@4` | HTTP server framework | server |
| `@prisma/client` | Prisma ORM (MySQL) | server |
| `jsonwebtoken` | JWT authentication | server |
| `bcryptjs` | Password hashing | server |
| `zod` | Request validation schemas | server |
| `winston` | Logging | server |
| `cors` | CORS middleware | server |
| `dotenv` | Environment variable loading | server |
| `supertest` | HTTP integration testing | server (dev) |
| `typescript@5` | Type checking | root |
| `concurrently` | Run client + server together | root |

---

## 6. Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Page component | `PascalCase` + `Page` suffix | `UserListPage.vue` |
| Page-specific component | `PascalCase` | `UserTable.vue` |
| Composable file | `camelCase` with `use` prefix | `useUsers.ts` |
| Store file | `kebab-case` + `.store.ts` | `auth.store.ts` |
| Service file | `kebab-case` + `.service.ts` | `user.service.ts` |
| Route file | `kebab-case` + `.routes.ts` | `users.routes.ts` |
| Type file | `kebab-case` + `.types.ts` | `user.types.ts` |
| Backend module folder | `kebab-case` plural | `users/` |
| Frontend page folder | `kebab-case` plural | `users/` |
| SQL migration | `NNN_description.sql` | `001_create_users_table.sql` |
| Env variable | `UPPER_SNAKE_CASE` | `DB_HOST`, `JWT_SECRET` |

---

## 7. Environment Variables (`.env`)

```env
# App
NODE_ENV=development
PORT=3000
API_PREFIX=/api

# Database (Prisma)
DATABASE_URL=mysql://root:password@localhost:3306/app_db
DATABASE_URL_TEST=mysql://root:password@localhost:3306/app_db_test

# Auth
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Client
VITE_API_BASE_URL=http://localhost:3000/api
```

---
