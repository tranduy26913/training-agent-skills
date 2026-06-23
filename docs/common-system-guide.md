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
| **Backend** | Node.js + Express 4 + TypeScript, Prisma (MySQL), JWT (jsonwebtoken), bcryptjs, Zod, Winston |
| **Testing – FE** | Vitest + Vue Test Utils, Playwright (E2E) |
| **Testing – BE** | Vitest + Supertest |
| **Build** | Vite (FE), ts-node / nodemon (BE) |

---

## 2. Quy tắc code & style

### 2.1 Nguyên tắc chung (áp dụng toàn stack)

- **TypeScript strict mode** – không dùng `any` ngoại trừ những chỗ thực sự không thể tránh; khi đó phải có comment lý do. Không dùng `as any`, `as never`, hay non-null assertion `!` — dùng type-safe helper (vd: `getAuthUserId()`).
- **Không over-engineer** – chỉ thêm abstraction khi dùng ≥ 2 lần. Không tạo helper cho tác vụ dùng một lần.
- **Comment** – English only. Comment chỉ cho "tại sao", không cho "cái gì". Không bao giờ comment mojibake (ký tự hỏng).
- **Naming** – dùng camelCase cho biến/hàm, PascalCase cho class/component/type/interface.
- **Immutability** – ưu tiên `const`, không mutate tham số truyền vào hàm.
- **Error handling** – chỉ xử lý lỗi tại **system boundary** (API call, DB query). Không wrap try/catch vô căn cứ.
- **Single Responsibility** – mỗi hàm/component/service chỉ làm một việc.
- **Import path alias** – cross-module dùng path alias (`@utils/`, `@services/`...), intra-module dùng relative (`./`, `../`). Không trộn lẫn hai style trong cùng file.

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
// ✅ Controller – thin layer, dùng asyncHandler, không try/catch
import { asyncHandler } from '@middleware/async-handler.middleware'
import { getAuthUserId } from '@utils/auth.util'
import type { AuthenticatedRequest } from '@types-express'

class UsersController {
  async getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    const filters = parseUserFilters(req.query)
    const result = await usersService.getUsers(filters)
    sendSuccess(res, result)
  }

  async deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = Number(req.params.id)
    const adminId = getAuthUserId(req)  // type-safe, trả null nếu chưa auth
    await usersService.deleteUser(id, adminId!)
    sendSuccess(res, { message: 'User deleted successfully' })
  }
}

// ✅ Route – wrap handler với asyncHandler để reject → errorMiddleware
router.delete('/:id', asyncHandler(controller.deleteUser.bind(controller)))

// ✅ Service – business logic thuần, throw ServiceError khi cần
async getUsers(filters: UserFilters): Promise<PaginatedResult<PublicUser>> {
  const { data, total } = await this.repository.findAllWithFilters(filters)
  return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }
}
```

- **Controller pattern**: class-based, thin, dùng `asyncHandler` wrapper — không `try/catch` lặp. Reject tự forward đến `errorMiddleware`.
- **`AuthenticatedRequest`** thay vì `Request` — có `req.user?: JwtPayload`. Dùng `getAuthUserId(req)` / `getAuthUser(req)` thay vì `(req as any).user` hay `req.user!`.
- **Không viết Prisma query trực tiếp trong controller hay service** – dùng repository.
- **Zod** validate toàn bộ input từ request (body, params, query) tại middleware `validate`.
- **Throw `ServiceError`** với status code phù hợp khi có lỗi nghiệp vụ. `errorMiddleware` bắt và map ra HTTP response.
- **Không bao giờ** trả password hoặc sensitive data trong response — repository dùng `select` để loại trừ.

---

## 4. Frontend – Các function/util/composable hiện có

### 4.1 Composables (`client/src/composables/`)

#### `useEmailValidation(email, excludeId?, debounceMs?)`

Kiểm tra trùng email với server, có debounce. Dùng `watchDebounced` từ `@vueuse/core`.

```typescript
import { useEmailValidation } from '@composables/useEmailValidation'

const email = ref('')
const { isChecking, emailError, reset } = useEmailValidation(email, undefined, 500)
// emailError.value: '' | 'emailAlreadyExists'
// isChecking.value: true khi đang gọi API
// reset(): xóa lỗi, dừng check
// Skip API call khi email rỗng hoặc format không hợp lệ
// excludeId: Ref<number|undefined> | number — dùng cho edit mode (loại trừ user hiện tại)
```

#### `useProfile()`

Xử lý cập nhật profile và đổi mật khẩu, quản lý loading/error state.

```typescript
import { useProfile } from '@composables/useProfile'

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
// buildQueryString (protected) — loại trừ undefined/null/'' tự động
```

#### Danh sách services sẵn có

| Service | Import | Dùng cho |
|---|---|---|
| `authApiService` | `@services/auth.service` | `login()`, `me()` |
| `usersApiService` | `@services/users.service` | CRUD users + `checkEmail()`, `getUserActivity()` |
| `profileApiService` | `@services/profile.service` | `updateProfile()`, `changePassword()` |

---

### 4.3 Stores (`client/src/stores/`)

| Store | Import | Key state | Key actions |
|---|---|---|---|
| `useAuthStore` | `@stores/auth.store` | `token`, `user`, `isAuthenticated`, `isAdmin`, `userRole` | `login()`, `logout()`, `updateUser()` |
| `useUiStore` | `@stores/ui.store` | `sidebarCollapsed`, `darkMode` | `toggleSidebar()`, `toggleDarkMode()` |
| `useUsersStore` | `@stores/users.store` | `users`, `pagination`, `filters`, `currentUser`, `auditLogs`, `loading`, `loadingUser`, `loadingActivity`, `error` | `fetchUsers()`, `fetchUser()`, `createUser()`, `updateUser()`, `deleteUser()`, `fetchUserActivity()`, `resetFilters()`, `clearCurrentUser()` |

---

### 4.4 Types (`client/src/types/`)

| File | Key types |
|---|---|
| `api.types.ts` | `PaginatedData<T>`, `PaginationInfo`, `PaginationParams`, `SortParams`, `UserRole`, `UserStatus`, `AuditAction`, `ChangedFields`, `ApiErrorResponse` |
| `auth.types.ts` | `LoginPayload`, `AuthUser`, `LoginResponseData` |
| `users.types.ts` | `User`, `UserFilters`, `AuditLog`, `CreateUserDto`, `UpdateUserDto` |
| `profile.types.ts` | `UpdateProfileDto`, `ChangePasswordDto` |
| `table.types.ts` | `AppTableColumn<T>` |

---

### 4.5 Global components (`client/src/components/app/`)

#### `AppDataTable<T>` – Generic table với pagination & sorting

```typescript
import AppDataTable from '@components/AppDataTable.vue'
import type { AppTableColumn } from '@apptypes/table.types'

<AppDataTable
  :columns="columns"
  :value="usersStore.users"
  :loading="usersStore.loading"
  :pagination="usersStore.pagination"
  :sort-field="sortField"
  :sort-order="sortOrder"
  table-width="1200px"
  @page-change="handlePageChange"
  @sort-change="handleSortChange"
/>

// Định nghĩa columns:
const columns = computed<AppTableColumn<User>[]>(() => [
  { field: 'id', header: t('common.id'), width: '72px', sortable: true, hideBelow: 768, frozen: true, alignFrozen: 'left', columnAlign: 'center' },
  { field: 'name', header: t('users.name'), width: '160px', sortable: true, truncate: true },
  { field: 'email', header: t('users.email'), width: '220px', sortable: true, truncate: true },
  { field: 'status', header: t('users.status'), width: '140px', sortable: true, columnAlign: 'center' },
  { field: 'created_at', header: t('users.createdAt'), width: '160px', sortable: true, hideBelow: 1024, formatter: (row) => formatDate(row.created_at) },
  { field: 'actions', header: t('common.actions'), width: '120px', frozen: true, alignFrozen: 'right' },
])
```

**Column options:** `field`, `header`, `width`, `sortable`, `frozen`, `alignFrozen`, `hideBelow` (px breakpoint), `truncate`, `columnAlign`, `headerAlign`, `formatter`.

**Slots:** `#empty` (empty state), `#cell-<field>` (custom cell content), `#cell-actions` (action buttons).

---

## 5. Frontend – Cách xử lý các tác vụ thường gặp

### 5.1 Gọi API

**Quy tắc**: Không gọi service trực tiếp trong component. Luôn thông qua **Pinia store**.

```typescript
// ✅ Đúng – gọi qua store
import { useUsersStore } from '@stores/users.store'
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
async function fetchUsers(newFilters?: UserFilters): Promise<void> {
  if (newFilters) filters.value = { ...filters.value, ...newFilters }
  loading.value = true
  error.value = null
  try {
    const result = await apiGetUsers(filters.value)
    users.value = result.data
    pagination.value = result.pagination
  } catch (err: unknown) {
    error.value = extractErrorMessage(err, 'Failed to fetch users')
  } finally {
    loading.value = false
  }
}
```

**Lưu ý:** `createUser` và `updateUser` KHÔNG catch error trong store — error propagate ra ngoài để page component xử lý toast.
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
const emit = defineEmits<{ 'filter-change': [filters: UserFilters] }>()

function emitFilters(): void {
  emit('filter-change', { search: search.value, role: role.value, status: status.value })
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
  // State – ref cho primitives, shallowRef cho mảng/object lớn
  const items = shallowRef<Item[]>([])
  const loading = shallowRef(false)
  const pagination = ref<PaginationInfo>({ page: 1, limit: 20, total: 0, pages: 0 })
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
    header: t('users.deleteHeader'),
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    acceptLabel: t('common.yes'),
    rejectLabel: t('common.no'),
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
import { watchDebounced } from '@vueuse/core'

const validationSchema = computed(() =>
  toTypedSchema(
    z.object({
      name: z.string().min(1, t('users.nameRequired')).min(2, t('users.nameMinLength')).max(50, t('users.nameMaxLength')),
      email: z.string().min(1, t('users.emailRequired')).email(t('users.emailInvalid')),
    }),
  ),
)

const { defineField, handleSubmit, errors, setValues, validateField } = useForm({
  validationSchema,
  initialValues: { name: '', email: '' },
})

// Disable auto-validation; debounced watchers control when to validate
const [name] = defineField('name', { validateOnModelUpdate: false })
const [email] = defineField('email', { validateOnModelUpdate: false })

// Per-field debounced validation
watchDebounced(name, () => validateField('name'), { debounce: 400 })
watchDebounced(email, () => validateField('email'), { debounce: 400 })

const onSubmit = handleSubmit((values) => {
  emit('submit', values)
})
```

**Lưu ý:** Schema dùng `computed` để reactive với i18n locale. Dùng `defineField` với `validateOnModelUpdate: false` + `watchDebounced` để kiểm soát thời điểm validate.

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
import { useUiStore } from '@stores/ui.store'
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
import { sendSuccess, sendError } from '@utils/response.util'

// Thành công
sendSuccess(res, data)                          // 200
sendSuccess(res, data, 201)                      // 201

// Lỗi
sendError(res, 'Not found', 404)
sendError(res, 'Validation failed', 400)
```

### 6.2 ServiceError (`server/src/models/common.model.ts`)

Throw từ service, được bắt bởi `errorMiddleware`:

```typescript
import { ServiceError } from '@models/common.model'

// Trong service
if (!user) throw new ServiceError('User not found', 404)
if (exists) throw new ServiceError('Email already exists', 409)
if (id === adminId) throw new ServiceError('Cannot delete your own account', 400)
```

`ServiceError` có 3 tham số: `message`, `code` (HTTP status), `errorCode?` (tùy chọn). `errorMiddleware` bắt và gọi `sendError(res, err.message, err.code)`.

### 6.3 Token utils (`server/src/utils/token.util.ts`)

```typescript
import { signToken, verifyToken } from '@utils/token.util'

const token = signToken({ userId: 1, email: 'a@b.com', role: 'admin' })
const payload = verifyToken(token)  // throws nếu invalid/expired
```

### 6.4 Hash utils (`server/src/utils/hash.util.ts`)

```typescript
import { hashPassword, comparePassword } from '@utils/hash.util'

const hashed = await hashPassword('plain-text-password')
const isValid = await comparePassword('plain-text', hashed)
```

### 6.5 Logger (`server/src/utils/logger.util.ts`)

```typescript
import { logger } from '@utils/logger.util'

logger.info('User created', { userId: 1 })
logger.warn('Suspicious login attempt', { email })
logger.error('DB connection failed', { error: err.message })
```

### 6.6 Validation Middleware

```typescript
import { validate } from '@middleware/validate.middleware'
import { createUserSchema, checkEmailSchema } from './users.validation'

// Validate body (mặc định)
router.post('/', validate(createUserSchema), createUser)

// Validate query
router.get('/check-email', validate(checkEmailSchema, 'query'), checkEmail)
```

Schema Zod trực tiếp (không wrap trong `z.object({ body: ... })`):

```typescript
// users.validation.ts
import { z } from 'zod'

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'user', 'moderator']),
  status: z.enum(['active', 'inactive', 'suspended']),
  note: z.string().max(500).optional(),
  birthday: z.string().optional().refine((val) => !val || new Date(val) <= new Date(), { message: 'Birthday cannot be in the future' }),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
```

### 6.7 Auth helpers (`server/src/utils/auth.util.ts`)

Type-safe helpers để truy cập authenticated user, thay thế `(req as any).user` và `req.user!`:

```typescript
import { getAuthUser, getAuthUserId } from '@utils/auth.util'
import type { AuthenticatedRequest } from '@types-express'

// Trong controller
const adminId = getAuthUserId(req)  // number | null
const user = getAuthUser(req)       // JwtPayload | null
```

### 6.8 asyncHandler (`server/src/middleware/async-handler.middleware.ts`)

Wrap async Express handler để reject tự forward đến `errorMiddleware`:

```typescript
import { asyncHandler } from '@middleware/async-handler.middleware'

router.get('/', asyncHandler(controller.getUsers.bind(controller)))
```

Controller KHÔNG cần `try/catch` — throw hoặc reject sẽ được `errorMiddleware` bắt.

### 6.9 Repository Pattern (Prisma)

```typescript
// server/src/modules/admin/users/users.repository.ts
import { prisma } from '@database/prisma'
import type { Prisma } from '@prisma/client'

const ALLOWED_SORT_FIELDS: Record<string, Prisma.UserOrderByWithRelationInput> = {
  id: { id: 'asc' },
  name: { name: 'asc' },
  email: { email: 'asc' },
  // ... whitelist để prevent SQL injection
}

const USER_PUBLIC_SELECT = {
  id: true, name: true, email: true, role: true, status: true,
  avatar: true, lastLoginAt: true, points: true, note: true, birthday: true,
  createdAt: true, updatedAt: true,
} as const

export class UsersRepository {
  private buildWhereClause(filters: UserFilters): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {}
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { email: { contains: filters.search } },
      ]
    }
    if (filters.role) where.role = filters.role
    if (filters.status) where.status = filters.status
    return where
  }

  async findAllWithFilters(filters: UserFilters) {
    const where = this.buildWhereClause(filters)
    const page = filters.page || 1
    const limit = filters.limit || 20
    const skip = (page - 1) * limit
    const orderBy = this.resolveOrderBy(filters.sortBy, filters.sortOrder)

    const [data, total] = await Promise.all([
      prisma.user.findMany({ where, orderBy, skip, take: limit, select: USER_PUBLIC_SELECT }),
      prisma.user.count({ where }),
    ])
    return { data, total }
  }

  findByIdWithoutPassword(id: number) {
    return prisma.user.findUnique({ where: { id }, select: USER_PUBLIC_SELECT })
  }

  findByEmail(email: string, excludeId?: number) {
    return prisma.user.findFirst({
      where: { email, ...(excludeId !== undefined ? { id: { not: excludeId } } : {}) },
    })
  }
}
```

**Quy tắc:**
- Dùng `select` để loại trừ `password` — không bao giờ `select *`
- Sort whitelist: map field name → `Prisma.UserOrderByWithRelationInput`, fallback `createdAt: 'desc'`
- Repository không chứa business logic — chỉ data access
- `prisma` instance từ `@database/prisma` (singleton)

---

## 7. Backend – Cách xử lý các tác vụ thường gặp

### 7.1 Tạo một module mới

Tạo đầy đủ file trong `server/src/modules/<feature>/` (hoặc `server/src/modules/admin/<feature>/` cho admin-only):

```
<feature>.routes.ts       – Express router, dùng asyncHandler
<feature>.controller.ts   – Class-based, thin, dùng asyncHandler + getAuthUserId
<feature>.service.ts      – Business logic, throw ServiceError
<feature>.repository.ts   – Prisma data access, select để loại trừ sensitive
<feature>.validation.ts   – Zod schemas, export inferred types
```

Đăng ký route trong `server/src/app.ts`:

```typescript
import { featureRoutes } from '@modules/feature/feature.routes'
app.use(`${appConfig.apiPrefix}/feature`, featureRoutes)
```

### 7.2 Route + Auth

```typescript
import { Router } from 'express'
import { authMiddleware, requireRole } from '@middleware/auth.middleware'
import { validate } from '@middleware/validate.middleware'
import { asyncHandler } from '@middleware/async-handler.middleware'

const router = Router()
const controller = new FeatureController()

// Apply auth + role guard to all routes
router.use(authMiddleware, requireRole('admin'))

router.get('/', asyncHandler(controller.getAll.bind(controller)))
router.post('/', validate(createSchema), asyncHandler(controller.create.bind(controller)))
router.put('/:id', validate(updateSchema), asyncHandler(controller.update.bind(controller)))
router.delete('/:id', asyncHandler(controller.delete.bind(controller)))

export const featureRoutes = router
```

**Lưu ý:** `/check-email` phải đăng ký trước `/:id` để tránh route conflict.

### 7.3 Pagination trong Service (Prisma)

Pattern chuẩn với `skip` / `take` + `count`:

```typescript
async getUsers(filters: UserFilters): Promise<PaginatedResult<PublicUser>> {
  const page = filters.page || 1
  const limit = filters.limit || 20
  const { data, total } = await this.repository.findAllWithFilters(filters)

  return {
    data,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  }
}
```

Repository dùng `Promise.all` để chạy `findMany` + `count` song song.

### 7.4 Transaction (Prisma)

```typescript
import { prisma } from '@database/prisma'

await prisma.$transaction(async (tx) => {
  await tx.user.create({ data: { ... } })
  await tx.auditLog.create({ data: { ... } })
  // Nếu throw, tự động rollback
})
```

### 7.5 Error handling flow

```
Controller (asyncHandler) → Service throw ServiceError(message, statusCode)
    ↓
errorMiddleware bắt → sendError(res, message, statusCode)
```

`asyncHandler` wrap controller method, forward reject → `errorMiddleware`. Controller KHÔNG cần `try/catch`.

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

### 9.1 Backend – Vitest trên Controller

Trên server, **tất cả test (unit + integration) gom chung trong một file duy nhất** cạnh controller:

```
server/src/modules/<feature>/
├── <feature>.controller.ts
└── <feature>.controller.test.ts   # Unit + Integration test bằng Vitest
```

#### Quy tắc

- Chỉ test thông qua **controller/HTTP endpoint**, không test service hay repository riêng lẻ
- **Integration test dùng DB thật** (`app_db_test`) là mặc định
- **Unit test trong cùng file** khi cần mock boundary (external API, file system, v.v.)
- Mỗi test tự tạo và dọn dẹp dữ liệu của mình (`beforeEach` / `afterEach`)
- Dùng `supertest` gọi qua Express `app` thật
- Tạo JWT token thật bằng `signToken()`
- Không hard-code ID; query/lưu lại ID sau khi insert

#### Template `<feature>.controller.test.ts`

```typescript
import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, vi } from 'vitest'
import request from 'supertest'
import dotenv from 'dotenv'
import path from 'path'
import app from '../../app'
import { prisma } from '../../database/prisma'
import { signToken } from '../../utils/token.util'
import { hashPassword } from '../../utils/hash.util'

// Load env to use test database
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') })

const ADMIN_ID = 1000
const ADMIN_EMAIL = 'admin@app.com'

function getAdminToken(): string {
  return signToken({ userId: ADMIN_ID, email: ADMIN_EMAIL, role: 'admin' })
}

async function cleanupUserByEmail(email: string): Promise<void> {
  const user = await prisma.user.findFirst({ where: { email } })
  if (user) {
    // Delete audit logs first due to FK
    await prisma.auditLog.deleteMany({ where: { OR: [{ targetUserId: user.id }, { adminId: user.id }] } })
    await prisma.user.delete({ where: { id: user.id } })
  }
}

async function createTestUser(data: { name: string; email: string; role?: string }): Promise<number> {
  const hashed = await hashPassword('password123')
  const created = await prisma.user.create({
    data: { name: data.name, email: data.email, password: hashed, role: data.role ?? 'user', status: 'active' },
    select: { id: true },
  })
  return created.id
}

describe('UsersController Tests', () => {
  beforeEach(async () => {
    await cleanupUserByEmail('test@example.com')
  })

  afterEach(async () => {
    await cleanupUserByEmail('test@example.com')
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  // Integration test – gọi endpoint thật với DB thật
  it('should create a new user', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${getAdminToken()}`)
      .send({ name: 'Test', email: 'test@example.com', role: 'user', status: 'active' })
      .expect(201)

    expect(res.body.data.email).toBe('test@example.com')
    expect(res.body.data).not.toHaveProperty('password')
  })

  // Unit test trong cùng file – mock external service nếu cần
  it('should return 502 when external service is down', async () => {
    // vi.mock hoặc inject mock gateway tại đây
  })
})
```

#### Lưu ý quan trọng

- `prisma.$disconnect()` chỉ gọi trong `afterAll` của suite cuối cùng, hoặc dùng global setup/teardown
- Không dùng `any` cho kết quả query; dùng type từ Prisma hoặc `select` shape
- Luôn import `describe`, `it`, `expect`, ... từ `vitest` để TypeScript nhận diện đúng
- Nếu test cần nhiều suite dùng chung DB connection, cân nhắc dùng `setupFiles` trong `vitest.config.mts`

### 9.2 Frontend – Component tests (Vitest + Vue Test Utils)

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

### 9.4 Chạy test

```bash
# Backend controller tests
cd server
npm test

# Backend test một file cụ thể
npx vitest run src/modules/admin/users/users.controller.test.ts

# Frontend unit
cd client
npm test

# E2E
cd client
npx playwright test
```

---

> **Cập nhật tài liệu này**: Mỗi khi thêm composable, service, store, utility mới → cập nhật mục tương ứng trong file này.  
> Owner: Tech Lead / Senior Developer.
