# Common System Guide

> Tài liệu này là **nguồn sự thật duy nhất** cho toàn bộ hệ thống.  
> Mọi developer **bắt buộc** đọc và tuân thủ trước khi đóng góp code.

---

## Mục lục

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Quy tắc code & style](#2-quy-tắc-code--style)
3. [Cấu trúc thư mục](#3-cấu-trúc-thư-mục)
4. [Frontend – Các function/util/composable hiện có](#4-frontend--các-functionutilcomposable-hiện-có)
5. [Frontend – Cách xử lý các tác vụ thường gặp](#5-frontend--cách-xử-lý-các-tác-vụ-thường-gặp)
6. [Backend – Các utility/pattern hiện có](#6-backend--các-utilitypattern-hiện-có)
7. [Backend – Cách xử lý các tác vụ thường gặp](#7-backend--cách-xử-lý-các-tác-vụ-thường-gặp)
8. [Database conventions](#8-database-conventions)
9. [Testing conventions](#9-testing-conventions)

---

## 1. Tổng quan hệ thống

| Layer | Tech stack |
|---|---|
| **Frontend** | Vue 3 + TypeScript + `<script setup>`, Pinia, Vue Router 4, PrimeVue 4, TailwindCSS, VueUse, Vee-Validate + Zod, vue-i18n |
| **Backend** | Node.js + Express 4 + TypeScript, MySQL 2 (pool), JWT (jsonwebtoken), bcryptjs, Zod, Winston |
| **Testing – FE** | Vitest + Vue Test Utils, Playwright (E2E) |
| **Testing – BE** | Vitest + Supertest |
| **Build** | Vite (FE), ts-node / nodemon (BE) |

---

## 2. Quy tắc code & style

### 2.1 Nguyên tắc chung (áp dụng toàn stack)

- **TypeScript strict mode** – không dùng `any` ngoại trừ những chỗ thực sự không thể tránh; khi đó phải có comment lý do.
- **Không over-engineer** – chỉ thêm abstraction khi dùng ≥ 2 lần. Không tạo helper cho tác vụ dùng một lần.
- **Không comment self-documenting code** – code phải đủ rõ. Comment chỉ cho "tại sao", không cho "cái gì".
- **Naming** – dùng camelCase cho biến/hàm, PascalCase cho class/component/type/interface.
- **Immutability** – ưu tiên `const`, không mutate tham số truyền vào hàm.
- **Error handling** – chỉ xử lý lỗi tại **system boundary** (API call, DB query). Không wrap try/catch vô căn cứ.
- **Single Responsibility** – mỗi hàm/component/service chỉ làm một việc.

### 2.2 Frontend (Vue 3)

```typescript
// ✅ ĐÚNG – Composition API với <script setup>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()

// Props
const props = defineProps<{ userId: number }>()
// Emits
const emit = defineEmits<{ success: []; error: [message: string] }>()

// State – ref cho primitives, shallowRef cho mảng/object lớn
const loading = ref(false)
const items = shallowRef<Item[]>([])

// Computed – derived state
const hasItems = computed(() => items.value.length > 0)

// Lifecycle
onMounted(() => { fetchData() })

async function fetchData(): Promise<void> {
  loading.value = true
  try {
    items.value = await someStore.fetch()
  } finally {
    loading.value = false
  }
}
</script>
```

- **Không dùng Options API** trừ khi project legacy yêu cầu.
- **Template**: dùng PrimeVue components + TailwindCSS utility class. Không viết inline style.
- **Props**: luôn dùng generic TypeScript `defineProps<{...}>()`, không dùng runtime validation object.
- **Emits**: luôn khai báo typed `defineEmits<{...}>()`.
- **`shallowRef`** cho danh sách dữ liệu lớn (bảng, danh sách API). `ref` cho primitives.
- Luôn dùng `v-bind:key` khi render danh sách.

### 2.3 Backend (Express + TypeScript)

```typescript
// ✅ Controller – chỉ parse request → gọi service → trả response
export async function getUsers(req: Request, res: Response): Promise<void> {
  const filters = parseUserFilters(req.query)
  const result = await usersService.getUsers(filters)
  sendSuccess(res, result)
}

// ✅ Service – business logic thuần, throw ServiceError khi cần
export async function getUsers(filters: UserFilters): Promise<PaginatedResult<User>> {
  return usersRepository.findAll(filters)
}
```

- **Không viết SQL trực tiếp trong controller hay service** – dùng repository.
- **Zod** validate toàn bộ input từ request (body, params, query) tại middleware `validate`.
- **Throw `ServiceError`** với status code phù hợp khi có lỗi nghiệp vụ.
- **Không bao giờ** trả password hoặc sensitive data trong response.

### 2.4 File & thư mục

| Loại file | Convention |
|---|---|
| Vue component | `PascalCase.vue` – ví dụ `UserListPage.vue` |
| Composable | `use<Name>.ts` – ví dụ `useEmailValidation.ts` |
| Pinia store | `<feature>.store.ts` – ví dụ `auth.store.ts` |
| Service (FE) | `<feature>.service.ts` |
| Type/interface | `<feature>.types.ts` |
| Route definition | `<feature>.routes.ts` |
| BE Controller | `<feature>.controller.ts` |
| BE Service | `<feature>.service.ts` |
| BE Repository | `<feature>.repository.ts` |
| BE Validation (Zod) | `<feature>.validation.ts` |

---

## 3. Cấu trúc thư mục

```
client/src/
├── app/                    # App component
├── assets/                 # Static assets
├── components/             # Shared/reusable components
│   └── app/                # Global components (AppDataTable, AppSidebar,…)
├── composables/            # useXxx() – reusable reactive logic
├── layouts/                # Layout components (DefaultLayout, AuthLayout,…)
├── locales/                # i18n – en.ts, vi.ts, ja.ts
├── pages/                  # Feature folders, mỗi folder là 1 tính năng
│   ├── auth/
│   │   ├── components/
│   │   ├── *.vue
│   │   └── auth.routes.ts
│   ├── users/
│   ├── employees/
│   └── notebooklm/
├── plugins/                # Vue plugin setup (pinia, router, i18n, primevue)
├── router/                 # Route aggregator + navigation guard
├── services/               # API services (axios wrappers)
├── stores/                 # Pinia stores
└── types/                  # Shared TypeScript types

server/src/
├── app.ts                  # Express app setup
├── server.ts               # HTTP server entry
├── config/                 # App/DB/auth/CORS config
├── database/               # Connection pool, BaseRepository, migrations, seeds
├── middleware/             # auth, error, validate
├── models/                 # TypeScript interfaces cho DB rows
├── modules/                # Feature modules (auth, users, employees, notebooklm)
│   └── <feature>/
│       ├── <feature>.controller.ts
│       ├── <feature>.service.ts
│       ├── <feature>.routes.ts
│       └── <feature>.validation.ts
├── types/                  # Shared types (AuthenticatedRequest,…)
└── utils/                  # hash, token, logger, response helpers
```

---

## 4. Frontend – Các function/util/composable hiện có

### 4.1 Composables (`client/src/composables/`)

#### `useEmailValidation(email, excludeId?, debounceMs?)`

Kiểm tra trùng email với server, có debounce.

```typescript
import { useEmailValidation } from '@/composables/useEmailValidation'

const email = ref('')
const { isChecking, emailError, reset } = useEmailValidation(email, undefined, 500)
// emailError.value: '' | 'emailAlreadyExists'
// isChecking.value: true khi đang gọi API
// reset(): xóa lỗi, dừng check
```

#### `useProfile()`

Xử lý cập nhật profile và đổi mật khẩu, quản lý loading/error state.

```typescript
import { useProfile } from '@/composables/useProfile'

const { updateProfile, changePassword, loading, error } = useProfile()
await updateProfile({ name: 'John', birthday: '1990-01-01' })
await changePassword({ currentPassword: '...', newPassword: '...' })
```

---

### 4.2 Services (`client/src/services/`)

#### `api.service.ts` – Axios instance với JWT interceptor

Không import trực tiếp. Được dùng nội bộ bởi các service khác.

Tự động:
- Thêm `Authorization: Bearer <token>` từ `localStorage`
- Redirect về `/login` khi nhận 401 (ngoài endpoint `/auth/`)

#### `BaseApiClient<T>` (`base-api.service.ts`)

Generic client với đầy đủ CRUD:

```typescript
// Kế thừa để tạo service cho feature
class EmployeesApiService extends BaseApiClient<Employee> {
  constructor() { super('/employees') }
  // thêm method đặc thù nếu cần
}

// Các method có sẵn:
service.getList(params?)          // GET /resource?page=1&limit=20...
service.getById(id)               // GET /resource/:id
service.create(data)              // POST /resource
service.update(id, data)          // PUT /resource/:id
service.delete(id)                // DELETE /resource/:id
```

#### Danh sách services sẵn có

| Service | Import | Dùng cho |
|---|---|---|
| `authApiService` | `@/services/auth.service` | `login()`, `me()` |
| `usersApiService` | `@/services/users.service` | CRUD users + `checkEmail()`, `getUserActivity()` |
| `employeesApiService` | `@/services/employees.service` | CRUD employees + filter |
| `profileApiService` | `@/services/profile.service` | `updateProfile()`, `changePassword()` |
| `notebooklmChatService` | `@/services/notebooklm-chat.service` | Chat session & messages |
| `notebooklmWorkspaceService` | `@/services/notebooklm-workspace.service` | Workspace & documents |
| `notebooklmOperationsService` | `@/services/notebooklm-operations.service` | Admin operations |

---

### 4.3 Stores (`client/src/stores/`)

| Store | Import | Key state | Key actions |
|---|---|---|---|
| `useAuthStore` | `@/stores/auth.store` | `token`, `user`, `isAuthenticated`, `isAdmin`, `userRole` | `login()`, `logout()`, `updateUser()` |
| `useUiStore` | `@/stores/ui.store` | `sidebarCollapsed`, `darkMode` | `toggleSidebar()`, `toggleDarkMode()` |
| `useEmployeesStore` | `@/stores/employees.store` | `employees`, `pagination`, `filters`, `loading` | `fetchEmployees()`, `createEmployee()`, `updateEmployee()`, `deleteEmployee()`, `resetFilters()` |
| `useUsersStore` | `@/stores/users.store` | `users`, `pagination`, `filters`, `currentUser` | `fetchUsers()`, `getUser()`, `createUser()`, `updateUser()`, `deleteUser()` |
| `useNotebooklmChatStore` | `@/stores/notebooklm-chat.store` | `sessions`, `currentSession`, `messages`, `currentWorkspaceId` | `fetchSessions()`, `createSession()`, `sendMessage()`, `updateSession()` |
| `useNotebooklmWorkspaceStore` | `@/stores/notebooklm-workspace.store` | `workspaces`, `currentWorkspace`, `documents` | `fetchWorkspaces()`, `createWorkspace()`, `ingestDocuments()` |
| `useNotebooklmOperationsStore` | `@/stores/notebooklm-operations.store` | `operations`, `pagination`, `filters` | `fetchOperations()` |

---

### 4.4 Types (`client/src/types/`)

| File | Key types |
|---|---|
| `api.types.ts` | `PaginatedData<T>`, `PaginationInfo`, `UserRole`, `UserStatus`, `AuditAction` |
| `auth.types.ts` | `LoginPayload`, `AuthUser`, `LoginResponseData` |
| `employees.types.ts` | `Employee`, `EmployeeFilters`, `EmployeeDepartment`, `EmployeePosition`, `CreateEmployeeDto`, `UpdateEmployeeDto` |
| `users.types.ts` | `User`, `UserFilters`, `AuditLog`, `CreateUserDto`, `UpdateUserDto` |
| `notebooklm.types.ts` | `ChatSession`, `ChatMessage`, `Workspace`, `Document`, `SendMessageDto` |
| `profile.types.ts` | `UpdateProfileDto`, `ChangePasswordDto` |
| `table.types.ts` | `AppTableColumn<T>` |

---

### 4.5 Global components (`client/src/components/app/`)

#### `AppDataTable<T>` – Generic table với pagination & sorting

```typescript
<AppDataTable
  :columns="columns"
  :value="usersStore.users"
  :loading="usersStore.loading"
  :pagination="usersStore.pagination"
  :sort-field="sortField"
  :sort-order="sortOrder"
  @page-change="handlePageChange"
  @sort-change="handleSortChange"
/>

// Định nghĩa columns:
const columns: AppTableColumn<User>[] = [
  { field: 'name', header: 'Name', sortable: true },
  { field: 'email', header: 'Email', sortable: true, hideBelow: 768 },
  { field: 'role', header: 'Role', frozen: true, width: '120px' },
  {
    field: 'created_at',
    header: 'Created',
    formatter: (val) => formatDate(val),
  },
]
```

---

## 5. Frontend – Cách xử lý các tác vụ thường gặp

### 5.1 Gọi API

**Quy tắc**: Không gọi service trực tiếp trong component. Luôn thông qua **Pinia store**.

```typescript
// ✅ Đúng – gọi qua store
const usersStore = useUsersStore()
onMounted(() => usersStore.fetchUsers())

// ❌ Sai – gọi service trực tiếp trong component
const users = ref([])
onMounted(async () => {
  users.value = await usersApiService.getList()  // ❌
})
```

**Pattern trong store**:

```typescript
// stores/users.store.ts
async function fetchUsers(params?: UserFilters): Promise<void> {
  loading.value = true
  error.value = null
  try {
    const result = await usersApiService.getList(params ?? filters.value)
    users.value = result.data
    pagination.value = result.pagination
  } catch (err) {
    error.value = (err as Error).message
  } finally {
    loading.value = false
  }
}
```

### 5.2 Filter + Debounce

**Dùng `watchDebounced` từ VueUse** cho input filter gọi API:

```typescript
import { watchDebounced } from '@vueuse/core'

const searchQuery = ref('')

// Debounce 400ms trước khi gọi store
watchDebounced(
  searchQuery,
  (val) => {
    usersStore.fetchUsers({ search: val, page: 1 })
  },
  { debounce: 400 }
)
```

**Cho filter phức tạp (nhiều field)**, emit event lên parent và để page component tổng hợp:

```typescript
// FilterComponent.vue
const emit = defineEmits<{ filterChange: [filters: UserFilters] }>()

function applyFilter(): void {
  emit('filterChange', { search: search.value, role: role.value, status: status.value })
}

// Page component
function handleFilterChange(filters: UserFilters): void {
  usersStore.fetchUsers({ ...filters, page: 1 })
}
```

### 5.3 State Management – Pinia

**Luôn dùng Composition API style** cho store:

```typescript
// stores/example.store.ts
import { defineStore } from 'pinia'
import { ref, computed, shallowRef } from 'vue'

export const useExampleStore = defineStore('example', () => {
  // State
  const items = shallowRef<Item[]>([])
  const loading = ref(false)
  const pagination = ref<PaginationInfo>({ page: 1, limit: 20, total: 0 })
  const filters = ref<ItemFilters>({})

  // Computed (derived state)
  const isEmpty = computed(() => items.value.length === 0)

  // Actions
  async function fetchItems(params?: ItemFilters): Promise<void> {
    if (params) filters.value = { ...filters.value, ...params }
    loading.value = true
    try {
      const result = await itemsApiService.getList(filters.value)
      items.value = result.data
      pagination.value = result.pagination
    } finally {
      loading.value = false
    }
  }

  function resetFilters(): void {
    filters.value = {}
    fetchItems()
  }

  return { items, loading, pagination, filters, isEmpty, fetchItems, resetFilters }
})
```

### 5.4 Pagination

Pattern chuẩn: store giữ `pagination`, component bắt event `page-change`:

```typescript
// Component
function handlePageChange(page: number): void {
  usersStore.fetchUsers({ ...usersStore.filters, page })
}

// Template
<AppDataTable
  :pagination="usersStore.pagination"
  @page-change="handlePageChange"
/>
```

### 5.5 Sorting

```typescript
const sortField = shallowRef<string>('created_at')
const sortOrder = shallowRef<1 | -1>(-1)

function handleSortChange(field: string, order: 1 | -1): void {
  sortField.value = field
  sortOrder.value = order
  usersStore.fetchUsers({
    ...usersStore.filters,
    page: 1,
    sortBy: field,
    sortOrder: order === 1 ? 'asc' : 'desc',
  })
}
```

### 5.6 Confirm + Toast (PrimeVue)

**Luôn dùng `useConfirm` + `useToast`** từ PrimeVue. Không dùng `window.confirm`.

```typescript
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

const confirm = useConfirm()
const toast = useToast()

function handleDelete(id: number): void {
  confirm.require({
    message: t('users.deleteConfirm'),
    header: t('common.confirm'),
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: t('common.cancel'), severity: 'secondary', outlined: true },
    acceptProps: { label: t('common.delete'), severity: 'danger' },
    accept: async () => {
      try {
        await usersStore.deleteUser(id)
        toast.add({ severity: 'success', summary: t('common.success'), detail: t('users.deletedSuccess'), life: 3000 })
      } catch {
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('users.deletedError'), life: 3000 })
      }
    },
  })
}
```

Template bắt buộc có `<ConfirmDialog />` và `<Toast />` ở layout hoặc page:

```html
<ConfirmDialog />
<Toast />
```

### 5.7 Form Validation (Vee-Validate + Zod)

```typescript
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2, 'Name too short'),
  email: z.string().email('Invalid email'),
})

const { handleSubmit, errors, defineField } = useForm({
  validationSchema: toTypedSchema(schema),
})

const [name, nameAttrs] = defineField('name')
const [email, emailAttrs] = defineField('email')

const onSubmit = handleSubmit(async (values) => {
  await usersStore.createUser(values)
})
```

### 5.8 i18n – Đa ngôn ngữ

Hệ thống hỗ trợ **EN / VI / JA**. Bắt buộc dùng `t()` cho toàn bộ text hiển thị.

```typescript
const { t, locale } = useI18n()

// Đổi ngôn ngữ
locale.value = 'vi'
localStorage.setItem('app-locale', 'vi')
```

Cấu trúc key i18n:
```typescript
// locales/en.ts
export default {
  common: { save: 'Save', cancel: 'Cancel', delete: 'Delete', confirm: 'Confirm', success: 'Success', error: 'Error' },
  users: { title: 'Users', createUser: 'Create User', deleteConfirm: 'Are you sure?' },
  // ... feature-specific keys
}
```

**Quy tắc**: Thêm key vào **tất cả 3 file** (`en.ts`, `vi.ts`, `ja.ts`) cùng lúc.

### 5.9 Navigation

```typescript
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// Điều hướng
router.push({ name: 'UserEdit', params: { id: userId } })
router.push('/dashboard')
router.back()

// Đọc params/query
const id = Number(route.params.id)
const tab = route.query.tab as string
```

### 5.10 Dark mode

Được quản lý qua `useUiStore`:

```typescript
const uiStore = useUiStore()

// Toggle
uiStore.toggleDarkMode()

// Trong template
<div :class="{ dark: uiStore.darkMode }">
```

---

## 6. Backend – Các utility/pattern hiện có

### 6.1 Response helpers (`server/src/utils/response.util.ts`)

**Bắt buộc dùng** – không trả `res.json()` trực tiếp trong controller.

```typescript
import { sendSuccess, sendError } from '@/utils/response.util'

// Thành công
sendSuccess(res, data)                          // 200
sendSuccess(res, data, 'Created', 201)          // 201

// Lỗi
sendError(res, 'Not found', 404)
sendError(res, 'Validation failed', 422, details)
```

### 6.2 ServiceError (`server/src/models/common.model.ts`)

Throw từ service, được bắt bởi `errorMiddleware`:

```typescript
import { ServiceError } from '@/models/common.model'

// Trong service
if (!user) throw new ServiceError('User not found', 404)
if (exists) throw new ServiceError('Email already taken', 409)
```

### 6.3 Token utils (`server/src/utils/token.util.ts`)

```typescript
import { signToken, verifyToken } from '@/utils/token.util'

const token = signToken({ userId: 1, email: 'a@b.com', role: 'admin' })
const payload = verifyToken(token)  // throws nếu invalid/expired
```

### 6.4 Hash utils (`server/src/utils/hash.util.ts`)

```typescript
import { hashPassword, comparePassword } from '@/utils/hash.util'

const hashed = await hashPassword('plain-text-password')
const isValid = await comparePassword('plain-text', hashed)
```

### 6.5 Logger (`server/src/utils/logger.util.ts`)

```typescript
import { logger } from '@/utils/logger.util'

logger.info('User created', { userId: 1 })
logger.warn('Suspicious login attempt', { email })
logger.error('DB connection failed', { error: err.message })
```

### 6.6 Validation Middleware

```typescript
import { validate } from '@/middleware/validate.middleware'
import { createUserSchema } from './users.validation'

router.post('/', authMiddleware, validate(createUserSchema), createUser)

// validation schema (Zod)
export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(['admin', 'user']),
  }),
})
```

### 6.7 BaseRepository (`server/src/database/base.repository.ts`)

```typescript
import { BaseRepository } from '@/database/base.repository'
import type { UserRow } from '@/models/users.model'

class UsersRepository extends BaseRepository<UserRow> {
  constructor() { super('users') }

  // Override hoặc thêm method đặc thù
  async findByEmail(email: string): Promise<UserRow | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [email]
    )
    return (rows[0] as UserRow) ?? null
  }
}

export const usersRepository = new UsersRepository()
```

**Methods sẵn có**: `findAll(page, limit)`, `findById(id)`, `create(data)`, `update(id, data)`, `delete(id)`

---

## 7. Backend – Cách xử lý các tác vụ thường gặp

### 7.1 Tạo một module mới

Tạo đầy đủ 4 file trong `server/src/modules/<feature>/`:

```
<feature>.routes.ts       – Express router
<feature>.controller.ts   – Parse req → call service → sendSuccess/sendError
<feature>.service.ts      – Business logic, throw ServiceError
<feature>.validation.ts   – Zod schemas
```

Đăng ký route trong `server/src/app.ts`:

```typescript
import { featureRoutes } from './modules/feature/feature.routes'
app.use(`${appConfig.apiPrefix}/feature`, featureRoutes)
```

### 7.2 Route + Auth

```typescript
import { Router } from 'express'
import { authMiddleware, requireRole } from '@/middleware/auth.middleware'
import { validate } from '@/middleware/validate.middleware'

const router = Router()

router.get('/', authMiddleware, getAll)
router.post('/', authMiddleware, requireRole('admin'), validate(createSchema), create)
router.put('/:id', authMiddleware, validate(updateSchema), update)
router.delete('/:id', authMiddleware, requireRole('admin'), deleteItem)

export const featureRoutes = router
```

### 7.3 Pagination trong DB query

Pattern chuẩn với `LIMIT` / `OFFSET` + `COUNT(*)`:

```typescript
async function getUsers(filters: UserFilters): Promise<PaginatedResult<User>> {
  const { page = 1, limit = 20, search, role, status } = filters

  const conditions: string[] = []
  const params: unknown[] = []

  if (search) {
    conditions.push('(name LIKE ? OR email LIKE ?)')
    params.push(`%${search}%`, `%${search}%`)
  }
  if (role) { conditions.push('role = ?'); params.push(role) }
  if (status) { conditions.push('status = ?'); params.push(status) }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const offset = (page - 1) * limit

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, email, role, status, created_at FROM users ${where} LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )
  const [[{ total }]] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM users ${where}`,
    params
  )

  return { data: rows as User[], pagination: { page, limit, total } }
}
```

### 7.4 Transaction

```typescript
import { withTransaction } from '@/database/transaction'

await withTransaction(async (conn) => {
  await conn.query('INSERT INTO orders ...', [...])
  await conn.query('UPDATE inventory ...', [...])
  // Nếu throw, tự động rollback
})
```

### 7.5 Error handling flow

```
Service throw ServiceError(message, statusCode)
    ↓
errorMiddleware bắt → sendError(res, message, statusCode)
```

Không bao giờ để lỗi chưa được xử lý bubble lên tầng HTTP response trực tiếp.

---

## 8. Database conventions

- **Tên bảng**: `snake_case`, số nhiều – ví dụ `users`, `audit_logs`, `notebooklm_chat_sessions`
- **Primary key**: `id INT AUTO_INCREMENT`
- **Timestamps**: luôn có `created_at TIMESTAMP DEFAULT NOW()` và `updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW()`
- **Soft delete**: dùng `status ENUM('active','inactive','deleted')` thay vì `DELETE` thực sự nếu cần lịch sử
- **Migration files**: đặt tên `NNN_describe_action.sql` (ví dụ `010_add_user_fields.sql`), không sửa migration đã chạy – tạo migration mới
- **Foreign key**: đặt tên `fk_<table>_<ref_table>_<column>`
- **Index**: thêm index cho các cột hay dùng trong WHERE/JOIN

---

## 9. Testing conventions

### 9.1 Unit tests (Vitest)

- File test đặt cạnh file được test: `users.service.test.ts`
- Hoặc trong `__tests__/` cùng cấp
- Test **behavior**, không test implementation detail
- Mock ở mức module boundary (mock DB calls, mock external API)

```typescript
// Ví dụ test service
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usersService } from './users.service'
import { pool } from '@/database/connection'

vi.mock('@/database/connection', () => ({ pool: { query: vi.fn() } }))

describe('usersService.getUsers', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns paginated users', async () => {
    vi.mocked(pool.query)
      .mockResolvedValueOnce([[{ id: 1, name: 'Alice' }]] as any)
      .mockResolvedValueOnce([[{ total: 1 }]] as any)

    const result = await usersService.getUsers({ page: 1, limit: 20 })
    expect(result.data).toHaveLength(1)
    expect(result.pagination.total).toBe(1)
  })
})
```

### 9.2 Component tests (Vitest + Vue Test Utils)

```typescript
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import UserListPage from './UserListPage.vue'

describe('UserListPage', () => {
  it('fetches users on mount', () => {
    const wrapper = mount(UserListPage, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
      },
    })
    const store = useUsersStore()
    expect(store.fetchUsers).toHaveBeenCalledOnce()
  })
})
```

### 9.3 E2E tests (Playwright)

- Files trong `client/e2e/`
- Dùng **Page Object Model** (`client/e2e/pages/`)
- Auth state được setup một lần trong `auth.setup.ts`, các spec dùng lại
- Mỗi spec test **1 luồng nghiệp vụ** (không test UI detail nhỏ)

```typescript
// e2e/users.spec.ts
import { test, expect } from './fixtures'

test('admin can create a new user', async ({ adminPage }) => {
  await adminPage.goto('/users/create')
  await adminPage.fill('[name=name]', 'New User')
  await adminPage.fill('[name=email]', 'new@example.com')
  await adminPage.click('[type=submit]')
  await expect(adminPage.getByText('User created')).toBeVisible()
})
```

---

> **Cập nhật tài liệu này**: Mỗi khi thêm composable, service, store, utility mới → cập nhật mục tương ứng trong file này.  
> Owner: Tech Lead / Senior Developer.
