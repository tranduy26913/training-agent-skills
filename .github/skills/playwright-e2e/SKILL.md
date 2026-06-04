---
name: playwright-e2e
description: Plan and build comprehensive Playwright E2E test suites with Page Object Model, authentication state persistence, custom fixtures, visual regression, and CI integration. Uses interview-driven planning to clarify critical user flows, auth strategy, test data approach, and parallelization before writing any tests. Also runs as a standalone post-implementation E2E writer — reads 04-quality.md to generate a test case file, then writes Playwright tests from that plan.
context: fork
---

# Playwright E2E Test Suite Builder

## When to use

Use this skill when you need to:

- Set up Playwright from scratch in an existing project
- Build E2E tests for critical user flows (signup, checkout, dashboards)
- Implement Page Object Model for maintainable test architecture
- Configure authentication state persistence across tests
- Set up visual regression testing with screenshots
- Integrate Playwright into CI/CD with sharding and retries

## Phase 1: Explore (Plan Mode)

Enter plan mode. Before writing any tests, explore the existing project:

### Project structure
- Find the tech stack: is this React, Next.js, Vue, SvelteKit, or another framework?
- Check if Playwright is already installed (`playwright.config.ts`, `@playwright/test` in package.json)
- Look for existing test directories (`e2e/`, `tests/`, `__tests__/`)
- Check for existing E2E tests in Cypress, Selenium, or other frameworks (migration context)
- Find the dev server command and port (`npm run dev`, `next dev`, etc.)

### Application structure
- Identify the main routes/pages (look at router config, pages directory, or route files)
- Find authentication flow (login page URL, auth API endpoints, token storage)
- Check for test IDs in components (`data-testid`, `data-test`, `data-cy` attributes)
- Look for API routes that tests might need to seed data through
- Check `.env` files for test-specific environment variables

### CI/CD
- Check for existing CI config (`.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile`)
- Look for Docker or docker-compose setup (useful for consistent test environments)
- Check if there's a staging/preview environment URL pattern

## Phase 2: Interview (AskUserQuestion)

Use AskUserQuestion to clarify requirements. Ask in rounds.

### Round 1: Scope and critical flows

```
Question: "What are the critical user flows to test?"
Header: "Flows"
multiSelect: true
Options:
  - "Authentication (signup, login, logout, password reset)" — Core auth flows
  - "Core CRUD (create, read, update, delete main resources)" — Primary data operations
  - "Checkout/payments (cart, billing, confirmation)" — E-commerce or payment flows
  - "Dashboard/admin (data views, filters, exports)" — Admin panel interactions
```

```
Question: "How many pages/routes does the application have approximately?"
Header: "App size"
Options:
  - "Small (< 10 routes)" — Landing page, auth, a few feature pages
  - "Medium (10-30 routes)" — Multiple feature areas, settings, profiles
  - "Large (30+ routes)" — Complex app with many sections and user roles
```

### Round 2: Authentication strategy for tests

```
Question: "How does your app handle authentication?"
Header: "Auth type"
Options:
  - "Cookie/session based (Recommended)" — Server sets httpOnly cookies after login
  - "JWT in localStorage" — Token stored in browser localStorage
  - "OAuth/SSO (Google, GitHub, etc.)" — Third-party auth provider redirect flow
  - "No auth (public app)" — No login required

Question: "How should tests authenticate?"
Header: "Test auth"
Options:
  - "Login via UI once, reuse state (Recommended)" — storageState pattern: login in setup, share cookies across tests
  - "API login in beforeEach" — Call auth API directly before each test, skip UI login
  - "Seed auth token in fixtures" — Inject pre-generated tokens, no login flow needed
  - "Test login UI every time" — Actually test the login form in each test suite
```

### Round 3: Test data and environment

```
Question: "How should test data be managed?"
Header: "Test data"
Options:
  - "API seeding in fixtures (Recommended)" — Call API endpoints to create/clean test data before each test
  - "Database seeding (direct SQL)" — Run SQL scripts or ORM commands to populate test database
  - "Shared test environment (pre-populated)" — Tests run against a persistent staging environment with existing data
  - "Mock API responses" — Intercept network requests and return mock data

Question: "What environment do E2E tests run against?"
Header: "Environment"
Options:
  - "Local dev server (Recommended)" — Start dev server before tests, run against localhost
  - "Preview/staging URL" — Run against a deployed preview or staging environment
  - "Docker Compose stack" — Full stack in containers, tests run outside or inside
```

### Round 4: CI and parallelization

```
Question: "How should tests run in CI?"
Header: "CI"
Options:
  - "GitHub Actions (Recommended)" — Native Playwright support with sharding
  - "GitLab CI" — Docker-based runners with Playwright image
  - "Local only (no CI yet)" — Just local test runs for now
  - "Other CI (Jenkins, CircleCI)" — Custom CI configuration
```

## Phase 3: Plan (ExitPlanMode)

Write a concrete implementation plan covering:

1. **Directory structure** — test files, page objects, fixtures, config
2. **Playwright config** — projects (browsers), base URL, retries, workers
3. **Auth setup** — global setup for storageState or API-based auth
4. **Page objects** — classes for each page with locators and actions
5. **Test fixtures** — custom fixtures for data seeding, auth, API client
6. **Test suites** — test files for each critical flow from the interview

Present via ExitPlanMode for user approval.

## Phase 4: Write Test Cases (Markdown Review)

**Before writing any code**, generate a test case specification file in Markdown and wait for user review.

### Step 4.1: Create test case spec file

Create the file at:

```
docs/<feature>/specs/<feature>-design/05-e2e-testcases.md
```

If no `docs/` structure exists, create at:

```
e2e/specs/<feature>-testcases.md
```

Use this exact format:

```markdown
# E2E Test Cases — <Feature Name>

## Overview
- **Feature**: <feature name>
- **Flows from interview**: <list of flows the user selected>
- **Auth strategy**: <how tests will authenticate>
- **Total test cases**: <N>

## Spec files

| File | Covers |
|------|--------|
| `e2e/<feature>/auth.spec.ts` | Login, logout, session expiry |
| `e2e/<feature>/crud.spec.ts` | Create, read, update, delete flows |

## Test Cases

### TC-001: <Title>
- **Suite**: `<spec file>`
- **Preconditions**: <auth state, seed data or existing data to use, starting URL>
- **Steps**:
  1. Navigate to `<URL>`
  2. <User action — fill field / click button / select option>
  3. <Next action>
  4. ...
- **Expected outcome**: <observable result — what the user sees at the end>
- **screenshotStep labels**: `<step label 1>`, `<step label 2>`, ...
  - ⚠ Toast steps: capture screenshot immediately when toast is visible (before auto-dismiss)
  - ⚠ Error steps: capture screenshot after error element becomes visible
- [ ] Written

### TC-002: <Title>
...
```

### Step 4.2: Rules for writing test cases

- **One TC = one user-observable outcome** — not a technical assertion
- **Group by spec file** — keep related flows in the same file
- **Cover all flows** from the interview answers (Phase 2)
- **No duplication** — check existing `*.spec.ts` files first; skip already-covered scenarios
- **Preconditions must be explicit** — auth role, data source (seed vs. existing), starting URL
- **Steps must be detailed** — list every discrete user action (fill field, click button, select option, wait for response). Steps in the spec become the guide for `screenshotStep` labels in the code.
- **Steps must be human-readable** — write steps in plain language that a non-technical person can follow (e.g., "Click the 'Create Vocabulary' button" not "Click `[data-testid='vocab-create-btn']`"). Never include CSS selectors, `data-testid` values, or code snippets inside step descriptions. Reserve technical locator details for the `.spec.ts` implementation only.
- **`screenshotStep` labels** — pre-define a label for every meaningful step; each label becomes a screenshot caption in the HTML report. Plan labels that cover the full user flow — not just the final outcome.
- **Toast screenshots** — mark steps that produce a toast notification with ⚠; these must be captured before the toast auto-dismisses (see `screenshotStep` patterns in Phase 5).
- **Error screenshots** — mark steps that produce field validation errors with ⚠; capture screenshot after the error element is visible.
- **Existing data for read/edit/delete** — unless the test directly validates the *creation* flow, prefer pointing to pre-existing stable data (e.g., a seeded admin user or a record created in `beforeAll`) rather than seeding per-test. Seed only when the data must be unique or will be mutated/deleted.
- **Coverage target**: at minimum, one happy-path TC and one failure/edge-case TC per flow

### Step 4.3: Ask user to review

After creating the file, **STOP and ask the user to review**:

```
AskUserQuestion:
  "I've created the test case spec at <path>. Please review the test cases before I start writing the Playwright tests."
  Options:
    - "Looks good, proceed with writing the tests"
    - "I want to add / modify some test cases first"
    - "Remove TC-xxx: <reason>"
    - "Add a test case: <description>"
```

Do NOT write any `.spec.ts` files until the user approves the spec.

### Step 4.4: Apply review feedback

For each change requested:
- Add / remove / modify TCs in the Markdown file
- Re-show the updated list briefly (title + expected outcome only)
- Ask for confirmation again if changes are substantial

Once approved, mark the spec with:
```markdown
> ✅ Approved by user on <date>. Proceeding to Phase 5.
```

---

## Phase 5: Execute

After approval, implement following this order:

### Step 1: Playwright config

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  // All artifacts (screenshots, traces, videos) and the HTML report go into
  // one directory. Feature subfolders come automatically from spec file paths:
  //   e2e/users/users.spec.ts        → test-results/users-users-TC001-chromium/
  //   e2e/vocabularies/*.spec.ts     → test-results/vocabularies-*-TC001-chromium/
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['html', { open: 'never', outputFolder: 'playwright-report' }], ['github']]
    : [['html', { open: 'always', outputFolder: 'playwright-report' }]],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    // Auth setup — runs before all tests
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // Chrome only — install additional browsers with `npx playwright install` if cross-browser is needed
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

### Step 2: Auth setup (global)

```typescript
// e2e/auth.setup.ts
import { test as setup, expect } from '@playwright/test';

const authFile = 'e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');

  // Fill login form
  await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL || 'test@example.com');
  await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD || 'testpassword');
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Wait for auth to complete — adjust selector to your app
  await page.waitForURL('/dashboard');
  await expect(page.getByRole('navigation')).toBeVisible();

  // Save signed-in state
  await page.context().storageState({ path: authFile });
});
```

### Step 3: Custom fixtures

```typescript
// e2e/fixtures.ts
import { test as base, expect } from '@playwright/test';
import { LoginPage } from './pages/login-page';
import { DashboardPage } from './pages/dashboard-page';

// API client for test data seeding
class ApiClient {
  constructor(private baseURL: string, private token?: string) {}

  async createResource(data: Record<string, unknown>) {
    const response = await fetch(`${this.baseURL}/api/resources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Seed failed: ${response.status}`);
    return response.json();
  }

  async deleteResource(id: string) {
    await fetch(`${this.baseURL}/api/resources/${id}`, {
      method: 'DELETE',
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
    });
  }
}

type Fixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  api: ApiClient;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  api: async ({ baseURL }, use) => {
    const client = new ApiClient(baseURL!);
    await use(client);
  },
});

export { expect };
```

### Step 4: Page Object Model

```typescript
// e2e/pages/login-page.ts
import { type Page, type Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(private page: Page) {
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: 'Sign in' });
    this.errorMessage = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectError(message: string) {
    await expect(this.errorMessage).toContainText(message);
  }
}

// e2e/pages/dashboard-page.ts
import { type Page, type Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly heading: Locator;
  readonly createButton: Locator;
  readonly searchInput: Locator;
  readonly resourceList: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.createButton = page.getByRole('button', { name: 'Create' });
    this.searchInput = page.getByPlaceholder('Search');
    this.resourceList = page.getByTestId('resource-list');
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async createResource(name: string) {
    await this.createButton.click();
    await this.page.getByLabel('Name').fill(name);
    await this.page.getByRole('button', { name: 'Save' }).click();
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    // Wait for debounced search to trigger
    await this.page.waitForResponse(resp =>
      resp.url().includes('/api/resources') && resp.status() === 200
    );
  }

  async expectResourceVisible(name: string) {
    await expect(this.resourceList.getByText(name)).toBeVisible();
  }

  async expectResourceCount(count: number) {
    await expect(this.resourceList.getByRole('listitem')).toHaveCount(count);
  }
}
```

### Step 5: Test suites

```typescript
// e2e/auth.spec.ts
import { test, expect } from './fixtures';

test.describe('Authentication', () => {
  // These tests run WITHOUT storageState (unauthenticated)
  test.use({ storageState: { cookies: [], origins: [] } });

  test('successful login redirects to dashboard', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login('test@example.com', 'testpassword');
    await expect(page).toHaveURL('/dashboard');
  });

  test('invalid credentials shows error', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login('test@example.com', 'wrongpassword');
    await loginPage.expectError('Invalid credentials');
  });

  test('logout clears session', async ({ page }) => {
    // Login first
    await page.goto('/login');
    // ... login steps ...

    // Logout
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL('/login');

    // Verify can't access protected route
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });
});

// e2e/dashboard.spec.ts
import { test, expect } from './fixtures';

test.describe('Dashboard', () => {
  test('displays resource list', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await expect(dashboardPage.heading).toHaveText('Dashboard');
    await expect(dashboardPage.resourceList).toBeVisible();
  });

  test('create new resource', async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.createResource('New E2E Resource');

    // Verify resource appears in list
    await dashboardPage.expectResourceVisible('New E2E Resource');
  });

  test('search filters results', async ({ dashboardPage, api }) => {
    // Seed test data via API
    await api.createResource({ name: 'Alpha Item' });
    await api.createResource({ name: 'Beta Item' });

    await dashboardPage.goto();
    await dashboardPage.search('Alpha');
    await dashboardPage.expectResourceVisible('Alpha Item');
  });

  test('empty state shown when no resources', async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.search('nonexistent-query-xyz');
    await expect(page.getByText('No results found')).toBeVisible();
  });
});

// e2e/crud.spec.ts
import { test, expect } from './fixtures';

test.describe('Resource CRUD', () => {
  let resourceId: string;

  test.beforeEach(async ({ api }) => {
    // Seed a resource for tests that need one
    const resource = await api.createResource({ name: 'Test Resource' });
    resourceId = resource.id;
  });

  test.afterEach(async ({ api }) => {
    // Clean up seeded data
    if (resourceId) {
      await api.deleteResource(resourceId).catch(() => {});
    }
  });

  test('edit resource name', async ({ page }) => {
    await page.goto(`/resources/${resourceId}`);
    await page.getByRole('button', { name: 'Edit' }).click();
    await page.getByLabel('Name').clear();
    await page.getByLabel('Name').fill('Updated Resource');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByRole('heading')).toHaveText('Updated Resource');
  });

  test('delete resource with confirmation', async ({ page }) => {
    await page.goto(`/resources/${resourceId}`);
    await page.getByRole('button', { name: 'Delete' }).click();

    // Confirm deletion dialog
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Confirm' }).click();

    // Should redirect to list
    await expect(page).toHaveURL('/dashboard');
  });
});
```

### Step 6: Screenshot step helper

Wrap **every meaningful user action** with `screenshotStep()` — it captures a full-page screenshot and attaches it to the HTML report. Each screenshot documents one step of the user flow.

**Coverage rule**: every interaction the user performs (fill a field, click a button, see a result, see an error, see a toast) gets its own `screenshotStep`. The test report should read like a visual walkthrough of the entire flow.

**Do NOT wrap auxiliary setup steps** (login, navigate-to-page, API seeding) — call those directly so the report only shows meaningful evidence screenshots.

```typescript
// e2e/helpers/screenshot-step.ts
import { type Page, type TestInfo } from '@playwright/test';

/**
 * Wraps a test action, then captures a full-page screenshot and attaches it
 * to the Playwright HTML report.
 *
 * Use for every meaningful user action (fill, click, assert result, assert error,
 * assert toast). Skip auxiliary steps such as login or page navigation.
 *
 * @param captureImmediately - Set true when the step asserts a transient element
 *   (toast notification, temporary banner) — captures the screenshot right after
 *   the action resolves, before any settle delay, so the element is still visible.
 */
export async function screenshotStep(
  page: Page,
  testInfo: TestInfo,
  stepName: string,
  action: () => Promise<void>,
  options?: { captureImmediately?: boolean },
): Promise<void> {
  try {
    await action();
    // For toasts and other transient elements, capture immediately before they disappear.
    // For normal steps, wait briefly so animations/transitions finish.
    if (!options?.captureImmediately) {
      await page.waitForTimeout(300);
    }
    const screenshot = await page.screenshot({ fullPage: true });
    await testInfo.attach(stepName, { body: screenshot, contentType: 'image/png' });
  } catch (error) {
    const screenshot = await page.screenshot({ fullPage: true });
    await testInfo.attach(`❌ ${stepName}`, { body: screenshot, contentType: 'image/png' });
    throw error;
  }
}
```

**Pattern — standard action step (fill field, click button):**

```typescript
await screenshotStep(page, testInfo, 'Fill name and description', async () => {
  await page.getByTestId('name-input').fill('My Resource');
  await page.getByTestId('description-input').fill('Test description');
});
```

**Pattern — toast notification (⚠ capture before auto-dismiss):**

```typescript
await screenshotStep(page, testInfo, 'Save → success toast', async () => {
  await page.getByTestId('save-btn').click();
  // Wait until the toast is visible — screenshot is taken immediately after (captureImmediately)
  await expect(page.locator('.p-toast')).toBeVisible({ timeout: 5000 });
}, { captureImmediately: true });
// After the toast step, assert the post-toast state in a separate step
await screenshotStep(page, testInfo, 'Redirected to list page', async () => {
  await expect(page).toHaveURL('/resources');
});
```

**Pattern — field validation error (⚠ capture after error appears):**

```typescript
await screenshotStep(page, testInfo, 'Submit → field validation errors', async () => {
  await page.getByTestId('save-btn').click();
  // Wait until the error element is visible before the screenshot is taken
  await expect(page.getByTestId('name-error')).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId('email-error')).toBeVisible();
});
```

**Pattern — full CRUD happy path (all steps covered):**

```typescript
test('TC-007: create resource — happy path', async ({ page }, testInfo) => {
  // Auxiliary setup — no screenshotStep
  await page.goto('/resources/create');

  await screenshotStep(page, testInfo, 'Create page loaded', async () => {
    await expect(page.getByTestId('create-page')).toBeVisible();
  });

  await screenshotStep(page, testInfo, 'Fill required fields', async () => {
    await page.getByTestId('name-input').fill('My Resource');
    await page.getByTestId('email-input').fill('res@test.com');
  });

  await screenshotStep(page, testInfo, 'Save → success toast', async () => {
    await page.getByTestId('save-btn').click();
    await expect(page.locator('.p-toast')).toBeVisible({ timeout: 5000 });
  }, { captureImmediately: true });

  await screenshotStep(page, testInfo, 'Redirected to list — new item visible', async () => {
    await expect(page).toHaveURL('/resources');
    await expect(page.getByText('My Resource')).toBeVisible();
  });
});
```

Screenshots attached via `screenshotStep()` appear automatically in the **Attachments** tab of the standard Playwright HTML report (`playwright-report/index.html`). No custom reporter needed.

---

## Directory structure reference

```
e2e/
├── .auth/
│   └── user.json                       # Saved auth state (gitignored)
├── helpers/
│   └── screenshot-step.ts              # screenshotStep() helper
├── fixtures.ts                         # Custom test fixtures and API client
├── pages/
│   ├── login-page.ts                   # Shared page objects
│   └── ...
├── auth.setup.ts                       # Global auth setup (runs once)
├── auth/
│   └── auth.spec.ts                    # Authentication tests
├── users/
│   └── users.spec.ts                   # User management tests
├── vocabularies/
│   ├── vocabulary-list.spec.ts         # Vocabulary list tests
│   ├── vocabulary-create.spec.ts       # Vocabulary create tests
│   └── vocabulary-edit.spec.ts         # Vocabulary edit tests
└── <feature>/
    └── <feature>-<flow>.spec.ts        # Feature spec files — one folder per feature
playwright-report/                      # HTML report (gitignored)
│   └── index.html                      # Opens automatically after test run (open: 'always')
test-results/                           # Test artifacts — screenshots, traces, videos (gitignored)
playwright.config.ts                    # Playwright configuration
```

## Best practices

### Use role-based locators first
Prefer `getByRole()`, `getByLabel()`, `getByText()` over CSS selectors or test IDs. These locators mirror how users interact with the page and catch accessibility issues:

```typescript
// Preferred — accessible and resilient
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByLabel('Email').fill('user@test.com');

// Fallback — when role-based doesn't work
await page.getByTestId('custom-widget').click();

// Avoid — fragile, breaks on refactors
await page.locator('.btn-primary').click();
await page.locator('#email-input').fill('user@test.com');
```

### Wait for network, not timers
Never use `page.waitForTimeout()`. Wait for specific conditions:

```typescript
// Wait for API response
await page.waitForResponse(resp => resp.url().includes('/api/data'));

// Wait for element state
await expect(page.getByText('Saved')).toBeVisible();

// Wait for navigation
await expect(page).toHaveURL('/dashboard');

// Wait for loading to finish
await expect(page.getByTestId('spinner')).toBeHidden();
```

### Isolate test data — seed only when necessary

For **create** tests: always seed or fill in the UI (the creation itself is the subject of the test).

For **edit / delete / read-detail** tests: prefer pointing to **pre-existing stable data** (e.g., a record seeded once in `beforeAll`, a well-known admin account, or a fixture record that is never deleted). Only seed per-test when the record must be unique or will be mutated/deleted in a way that cannot be rolled back.

```typescript
// ✅ Read/view test — use existing data, no seed needed
test('TC-010: edit page pre-fills existing vocabulary', async ({ page }) => {
  // Use a well-known record ID that is always present in the test DB
  await page.goto('/vocabularies/1/edit');
  await expect(page.getByTestId('meaning-vi-input')).not.toBeEmpty();
});

// ✅ Edit test — seed only when mutation must be isolated
test('TC-011: update meaning_vi and save', async ({ api, page }) => {
  const item = await api.createVocabulary({ meaning_vi: `E2E ${uid()}`, ... });
  try {
    await page.goto(`/vocabularies/${item.id}/edit`);
    // ... test logic ...
  } finally {
    await api.deleteVocabulary(item.id).catch(() => {});
  }
});

// ✅ Delete test — seed so deletion doesn't destroy stable shared data
test('TC-005: delete vocabulary', async ({ api, page }) => {
  const item = await api.createVocabulary({ meaning_vi: `E2E Delete ${uid()}`, ... });
  // Seed here because we will delete it — don't delete production/stable data
  ...
});
```

**Decision guide for seeding:**

| Test type | Mutates data? | Use existing? | Seed? |
|-----------|---------------|---------------|-------|
| List / search / filter | No | ✅ Yes | Only if list might be empty |
| View detail / edit page load | No | ✅ Yes | No |
| Update (save changes) | Yes | ❌ No | ✅ Yes — isolate the mutation |
| Delete | Yes (destroys) | ❌ No | ✅ Yes — never delete shared data |
| Create | N/A | N/A | N/A — form under test |

### Screenshot every step of the flow

Every meaningful user interaction must have its own `screenshotStep`. The test report should be a visual walkthrough that a reviewer can follow without reading code.

```typescript
// ✅ Every action documented
await screenshotStep(page, testInfo, 'Search input filled', async () => {
  await page.getByTestId('search-input').fill('hello');
});
await screenshotStep(page, testInfo, 'Search results loaded', async () => {
  await expect(page.getByTestId('result-row').first()).toBeVisible();
});

// ❌ Multiple actions squashed — unclear which step failed and which state was captured
await screenshotStep(page, testInfo, 'Search and see results', async () => {
  await page.getByTestId('search-input').fill('hello');
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page.getByTestId('result-row').first()).toBeVisible();
});
```

### Capture toasts before auto-dismiss

Always use `captureImmediately: true` when the step asserts a toast or any other element that auto-hides:

```typescript
// ✅ Correct — screenshot taken immediately when toast is visible
await screenshotStep(page, testInfo, 'Success toast shown', async () => {
  await page.getByTestId('save-btn').click();
  await expect(page.locator('.p-toast')).toBeVisible({ timeout: 5000 });
}, { captureImmediately: true });

// ❌ Wrong — 300ms settle delay may run after the toast has already dismissed
await screenshotStep(page, testInfo, 'Success toast shown', async () => {
  await page.getByTestId('save-btn').click();
  await expect(page.locator('.p-toast')).toBeVisible({ timeout: 5000 });
});
```

### Capture field errors explicitly

When testing validation, assert the error element is visible inside the `screenshotStep` action so the screenshot captures the error state:

```typescript
// ✅ Error visible in screenshot
await screenshotStep(page, testInfo, 'Submit → required field errors', async () => {
  await page.getByTestId('save-btn').click();
  await expect(page.getByTestId('name-error')).toBeVisible({ timeout: 5000 });
});

// ❌ Error state not visible — screenshot taken before error renders
await page.getByTestId('save-btn').click();
await screenshotStep(page, testInfo, 'Submitted form', async () => {
  // empty action — no assertion, error may not be visible yet
});
await expect(page.getByTestId('name-error')).toBeVisible();
```

### Tag tests for selective runs

```typescript
test('checkout flow @slow @checkout', async ({ page }) => {
  // Long test tagged for selective execution
});

// Run only: npx playwright test --grep @checkout
// Skip slow: npx playwright test --grep-invert @slow
```

### .gitignore additions

```
# Playwright
e2e/.auth/
test-results/
playwright-report/
blob-report/
```

## Checklist before finishing

- [ ] `playwright.config.ts` has webServer configured to start the dev server
- [ ] Auth setup saves storageState and all test projects depend on it
- [ ] Page objects use role-based locators (`getByRole`, `getByLabel`, `getByText`)
- [ ] No `waitForTimeout()` calls — only wait for elements, URLs, or responses
- [ ] Edit/delete tests use existing stable data where possible; only seed when mutation/deletion requires isolation
- [ ] Every meaningful user action is wrapped in its own `screenshotStep()` — full flow visible in the report
- [ ] Toast steps use `{ captureImmediately: true }` so the screenshot is taken before the toast disappears
- [ ] Error steps assert the error element inside the `screenshotStep` action so the error is visible in the screenshot
- [ ] Trace, screenshot, and video are captured on failure for debugging
- [ ] `.auth/` directory is in `.gitignore`
- [ ] `npx playwright test` passes locally and `playwright-report/index.html` shows screenshots in Attachments

---

## Phase 6: Standalone Post-Implementation E2E Writer

Use this phase when invoked **independently after implementation tasks are complete** — skip Phases 1–4 (setup wizard) entirely.

### Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `FEATURE` | ✅ | What was implemented (feature name / description) |
| `QUALITY_SPEC` | ✅ | Path to `04-quality.md` for this feature |
| `E2E_DIR` | optional | E2E test directory (default: `client/e2e/`) |

### Step 1 — Read quality spec

Read `QUALITY_SPEC` (the `04-quality.md` file). Focus on:
- Section **E2E Tests** or **Integration Tests** — extract all listed test cases
- Note which flows are already covered by existing E2E test files (check `E2E_DIR` for related spec files)

### Step 2 — Generate test case plan file

Create a test case plan file at:
```
docs/<feature>/specs/<feature>-design/05-e2e-testcases.md
```

The file must list **every E2E test case** to be written. Use this format:

```markdown
# E2E Test Cases — <Feature Name>

## Source
- Quality spec: `<QUALITY_SPEC path>`
- Generated from: Phase 5 of playwright-e2e skill

## Test Cases

### TC-001: <Test case title>
- **Preconditions**: <Auth state, existing data to use OR seed data needed>
- **Steps**:
  1. Navigate to `<URL>`
  2. <Exact user action — fill field / click button / select option>
  3. <Next action>
  4. ...
- **Expected outcome**: <What the user sees at the end>
- **screenshotStep labels**: `<label 1>`, `<label 2>`, ...
  - ⚠ `<label>` — toast step (use `captureImmediately: true`)
  - ⚠ `<label>` — field error step
- **Spec file**: `e2e/<feature>/<file>.spec.ts`
- [ ] Written

### TC-002: ...
```

Rules for generating test cases:
- **No duplication**: Skip any test case already covered in existing `*.spec.ts` files
- **Full coverage**: Include every scenario from the E2E section of `04-quality.md`
- **One test case = one user-observable outcome** (not a step)
- **Detailed steps**: List every discrete action — fill field, click button, wait for response, see result. Steps guide the `screenshotStep` labels in the code.
- **Plan screenshot labels upfront**: Every step maps to a `screenshotStep` label. Mark toast and error steps with ⚠.
- **Seed data rule**: For list/filter/view/edit-load tests — prefer existing stable data; only seed for mutation tests (update, delete) or when uniqueness is required.
- Group related cases under a shared spec file

### Step 3 — Write Playwright tests from test case plan

For each test case in `05-e2e-testcases.md`:

1. **Locate or create the spec file** listed in `TC-xxx → Spec file`
2. **Write the test** following Playwright best practices (see Best practices section above):
   - Use role-based locators (`getByRole`, `getByLabel`, `getByText`) or `getByTestId`
   - No `waitForTimeout()` — wait for elements, URLs, or API responses
   - For edit/delete tests: use existing stable data when possible; seed only when the test mutates or destroys the record
   - Wrap every meaningful user action in its own `screenshotStep()` — the report must show the full flow
   - Use `{ captureImmediately: true }` for steps that assert toasts or other transient elements
   - Assert error elements inside the `screenshotStep` action so the screenshot captures the error state
   - Re-use existing Page Objects from `e2e/pages/` if they cover the page
   - Create new Page Object if one doesn't exist for this page
3. **Authenticate** using `storageState` from `e2e/.auth/user.json` (default)
4. Check off each `TC-xxx` in `05-e2e-testcases.md` as it is written (mark `✅`)

### Step 4 — Verify

Run the new tests:
```bash
npx playwright test <spec-file-path> --reporter=list
```

- All new tests must pass
- If a test fails, debug and fix before proceeding to next test case
- Update `05-e2e-testcases.md` with final status
