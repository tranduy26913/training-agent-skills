# Feature Structure Convention / 機能構造規約

> このドキュメントは新しい機能を追加する際の統一された構造を定義します。
> This document defines the unified structure for adding new features.

---

## 1. Server Feature Structure / サーバー側の機能構造

```
server/src/
├── models/                          # 集中型定義 / Centralized type definitions
│   ├── common.model.ts              # 共通型 (PaginatedResult, ServiceError, etc.)
│   ├── <feature>.model.ts           # 機能固有の型 (e.g., users.model.ts)
│   └── index.ts                     # バレルエクスポート / Barrel export
│
├── modules/
│   └── <feature>/                   # 機能モジュール / Feature module
│       ├── <feature>.controller.ts  # リクエスト/レスポンス処理 / Request/Response handling
│       ├── <feature>.service.ts     # ビジネスロジック / Business logic
│       ├── <feature>.repository.ts  # データアクセス / Data access layer
│       ├── <feature>.routes.ts      # ルート定義 / Route definitions
│       ├── <feature>.validation.ts  # Zodスキーマ / Zod validation schemas
│       └── <feature>.*.test.ts      # ユニットテスト / Unit tests
│
├── middleware/                      # 共通ミドルウェア / Shared middleware
├── database/                        # DB基盤 / Database infrastructure
├── utils/                           # ユーティリティ / Shared utilities
└── config/                          # 設定 / Configuration
```

### 1.1 Models Layer / モデル層のルール

| ファイル | 内容 | File | Content |
|---------|------|------|---------|
| `common.model.ts` | `ServiceError`, `PaginatedResult`, `PaginationParams`, `SortParams`, 共通enum | Common shared types, enums, error classes |
| `<feature>.model.ts` | DB行型、フィルター型、入出力DTO | DB row types, filter types, request/response DTOs |
| `index.ts` | 全モデルを再エクスポート | Re-exports all models |

**ルール / Rules:**
- 2つ以上のモジュールで使われる型は `common.model.ts` に定義する
- Types used by 2+ modules go in `common.model.ts`
- 機能固有の型は `<feature>.model.ts` に定義する
- Feature-specific types go in `<feature>.model.ts`
- 各モジュールファイルで型を直接定義しない
- Never define types directly in module files (controller, service, repository)

### 1.2 Module Layer / モジュール層のルール

| レイヤー | 責務 | Layer | Responsibility |
|---------|----|-------|---------------|
| **Controller** | HTTP処理、エラーマッピング | HTTP handling, error mapping to status codes |
| **Service** | ビジネスロジック、バリデーション、権限チェック | Business logic, validation, permissions |
| **Repository** | SQLクエリ、データアクセス | SQL queries, data access |
| **Validation** | Zodスキーマ、入力バリデーション | Zod schemas, input type inference |
| **Routes** | エンドポイント定義、ミドルウェア適用 | Endpoint definitions, middleware application |

### 1.3 New Module Checklist / 新モジュール追加チェックリスト

```
□ models/<feature>.model.ts を作成し、DB行型・フィルター型・DTO型を定義
□ models/index.ts にエクスポートを追加
□ modules/<feature>/<feature>.validation.ts を作成（Zodスキーマ）
□ modules/<feature>/<feature>.repository.ts を作成（BaseRepositoryを継承）
□ modules/<feature>/<feature>.service.ts を作成（ServiceErrorを使用）
□ modules/<feature>/<feature>.controller.ts を作成（sendSuccess/sendErrorを使用）
□ modules/<feature>/<feature>.routes.ts を作成（ミドルウェア適用）
□ app.ts にルートを登録
□ テストファイルを作成
```

---

## 2. Client Feature Structure / クライアント側の機能構造

```
client/src/
├── types/                              # 集中型定義 / Centralized type definitions
│   ├── api.types.ts                    # 共通API型 (ApiResponse, PaginationInfo, etc.)
│   ├── <feature>.types.ts              # 機能固有の型 (e.g., users.types.ts)
│   └── ...
│
├── services/                           # APIサービス層 / API service layer
│   ├── api.service.ts                  # Axiosインスタンス + インターセプター / Axios instance
│   ├── base-api.service.ts             # ベースCRUDクライアント / Base CRUD client class
│   └── <feature>.service.ts            # 機能固有APIクライアント / Feature API client
│
├── stores/                             # Pinia状態管理 / Pinia state management
│   ├── <feature>.store.ts              # 機能ストア / Feature store
│   └── index.ts                        # バレルエクスポート / Barrel export
│
├── pages/
│   └── <feature>/                      # 機能ページ / Feature pages
│       ├── <feature>.routes.ts         # ルート定義 / Route definitions
│       ├── <Feature>ListPage.vue       # 一覧ページ / List page
│       ├── <Feature>CreatePage.vue     # 作成ページ / Create page
│       ├── <Feature>EditPage.vue       # 編集ページ / Edit page
│       ├── composables/
│       │   └── use<Feature>.ts         # API操作コンポーザブル / API composable
│       └── components/
│           ├── <Feature>Table.vue      # テーブルコンポーネント / Table component
│           ├── <Feature>Form.vue       # フォームコンポーネント / Form component
│           └── <Feature>Filters.vue    # フィルターコンポーネント / Filters component
│
├── plugins/                            # プラグイン設定 / Plugin configuration
├── router/                             # ルーター設定 / Router configuration
├── layouts/                            # レイアウト / Layouts
└── components/                         # 共通コンポーネント / Shared components
```

### 2.1 Types Layer / 型定義層のルール

| ファイル | 内容 | File | Content |
|---------|------|------|---------|
| `api.types.ts` | `ApiResponse`, `PaginationInfo`, `PaginatedData`, `PaginationParams`, `SortParams`, 共通enum | Common API types |
| `<feature>.types.ts` | エンティティ型、DTO型、フィルター型 | Entity types, DTOs, filter types |

**ルール / Rules:**
- `api.types.ts` はサーバーの `common.model.ts` に対応する
- `api.types.ts` corresponds to server's `common.model.ts`
- コンポーネントから直接 `types/` をインポートする（composable経由の再エクスポートも可）
- Components import from `types/` directly (re-export via composable is also OK)

### 2.2 Service Layer / サービス層のルール

| ファイル | 責務 | File | Responsibility |
|---------|------|------|---------------|
| `api.service.ts` | Axiosインスタンス、トークン付与、401リダイレクト | Axios instance, token injection, 401 redirect |
| `base-api.service.ts` | 共通CRUD操作（`getList`, `getById`, `create`, `update`, `delete`） | Common CRUD operations |
| `<feature>.service.ts` | `BaseApiClient`を継承。機能固有のメソッドを追加 | Extends `BaseApiClient`, adds feature-specific methods |

**BaseApiClient の使い方 / How to use BaseApiClient:**
```typescript
// 例: products.service.ts
import { BaseApiClient } from './base-api.service';
import type { Product, CreateProductDto, UpdateProductDto } from '@/types/products.types';

class ProductsApiClient extends BaseApiClient<Product, CreateProductDto, UpdateProductDto> {
  constructor() {
    super('/products');  // APIベースパス / API base path
  }

  // 機能固有メソッドを追加 / Add feature-specific methods
  async getByCategory(categoryId: number) {
    return this.getList({ categoryId });
  }
}

export const productsApiService = new ProductsApiClient();
```

### 2.3 Store Layer / ストア層のルール

- composable (`use<Feature>`) を使って API を呼び出す
- Use composable (`use<Feature>`) to call API
- 型は `@/types/<feature>.types` からインポートする
- Import types from `@/types/<feature>.types`
- loading/error 状態をストアで管理する
- Manage loading/error states in the store

### 2.4 Component Layer / コンポーネント層のルール

| コンポーネント | 責務 | Component | Responsibility |
|-------------|------|-----------|---------------|
| `*Page.vue` | ページ構成、ストア接続、ナビゲーション | Page composition, store connection, navigation |
| `*Table.vue` | テーブル表示、ページネーション、ソート | Table display, pagination, sorting |
| `*Form.vue` | フォーム入力、バリデーション（VeeValidate + Zod） | Form input, validation (VeeValidate + Zod) |
| `*Filters.vue` | フィルター入力、検索 | Filter input, search |

### 2.4.1 Form Validation Convention / フォームバリデーション規約

**Standard:** `vee-validate` + `@vee-validate/zod` + `zod` for all `*Form.vue` components.

**Pattern:**
```typescript
import { computed, watch } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { watchDebounced } from '@vueuse/core';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// 1. Zod schema wrapped in computed for reactive i18n error messages
const validationSchema = computed(() =>
  toTypedSchema(
    z.object({
      name: z.string().min(1, t('feature.nameRequired')).max(50, t('feature.nameMaxLength')),
      email: z.string().min(1, t('feature.emailRequired')).email(t('feature.emailInvalid')),
      // ... other fields
    }),
  ),
);

// 2. useForm with the schema and initial values
const { defineField, handleSubmit, errors, setValues, validateField } = useForm({
  validationSchema,
  initialValues: { name: '', email: '' },
});

// 3. defineField — disable auto-validation; use watchDebounced for per-field control
const [name] = defineField('name', { validateOnModelUpdate: false });
const [email] = defineField('email', { validateOnModelUpdate: false });

// 4. Per-field debounced validation (each field is fully independent)
watchDebounced(name, () => validateField('name'), { debounce: 400 });
watchDebounced(email, () => validateField('email'), { debounce: 400 });

// 5. handleSubmit validates all fields before calling the callback
const onSubmit = handleSubmit((values) => {
  emit('submit', { name: values.name.trim(), email: values.email.trim() });
});
```

**Rules / ルール:**
- Use `computed(() => toTypedSchema(...))` so Zod error messages update when locale changes
- Set `validateOnModelUpdate: false` on `defineField` to prevent validation on every keystroke
- Use `watchDebounced` (from `@vueuse/core`, 400ms) per field — each field validates independently
- Errors are only shown after the user has typed in that field (no errors on initial load)
- On form submit, VeeValidate validates all fields regardless of touched state
- Use `setValues` (not direct ref assignment) to populate form from `initialData` in edit mode
- For async server-side checks (e.g. email duplicate), keep a dedicated composable (`useEmailValidation`) alongside VeeValidate

### 2.5 New Feature Checklist / 新機能追加チェックリスト

```
□ types/<feature>.types.ts を作成（エンティティ型、DTO型、フィルター型）
□ services/<feature>.service.ts を作成（BaseApiClientを継承）
□ pages/<feature>/<feature>.routes.ts を作成
□ pages/<feature>/composables/use<Feature>.ts を作成
□ pages/<feature>/<Feature>ListPage.vue を作成
□ pages/<feature>/<Feature>CreatePage.vue を作成（必要に応じて）
□ pages/<feature>/<Feature>EditPage.vue を作成（必要に応じて）
□ pages/<feature>/components/<Feature>Table.vue を作成
□ pages/<feature>/components/<Feature>Form.vue を作成（VeeValidate + Zod を使用）
□ pages/<feature>/components/<Feature>Filters.vue を作成（必要に応じて）
□ stores/<feature>.store.ts を作成
□ stores/index.ts にエクスポートを追加
□ router/routes.ts にルートを追加
```

---

## 3. Data Flow / データフロー

```
[Server]
  Request → Routes → Middleware → Controller → Service → Repository → DB
                                     ↓
                                  models/ (型定義)

[Client]
  Component → Store → Composable → Service(BaseApiClient) → api.service.ts → Server
      ↓          ↓         ↓              ↓
    types/     types/    types/         types/ (型定義)
```

---

## 4. Naming Convention / 命名規則

| 場所 | 命名規則 | 例 |
|------|---------|-----|
| Server model file | `<feature>.model.ts` | `users.model.ts`, `products.model.ts` |
| Server module files | `<feature>.<layer>.ts` | `users.controller.ts`, `users.service.ts` |
| Client type file | `<feature>.types.ts` | `users.types.ts`, `auth.types.ts` |
| Client service file | `<feature>.service.ts` | `users.service.ts` |
| Client page file | `<Feature><Action>Page.vue` | `UserListPage.vue`, `UserCreatePage.vue` |
| Client component file | `<Feature><Role>.vue` | `UserTable.vue`, `UserForm.vue` |
| Client composable file | `use<Feature>.ts` | `useUsers.ts` |
| Client store file | `<feature>.store.ts` | `users.store.ts` |
| Client route file | `<feature>.routes.ts` | `users.routes.ts` |
