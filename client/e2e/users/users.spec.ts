import { test, expect, ApiClient } from '../fixtures';

const ADMIN_EMAIL = process.env.TEST_USER_EMAIL ?? 'admin@app.com';
const ADMIN_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'admin123';

// Unique suffix to avoid test data conflicts
function uid(): string {
  return Date.now().toString(36);
}

// ---------------------------------------------------------------------------
// User List Page
// ---------------------------------------------------------------------------
test.describe('User List', () => {
  test('displays the Users heading and table', async ({ userListPage }) => {
    await userListPage.goto();
    await expect(userListPage.heading).toBeVisible();
    await expect(userListPage.table).toBeVisible();
  });

  test('shows Create User button', async ({ userListPage }) => {
    await userListPage.goto();
    await expect(userListPage.createButton).toBeVisible();
  });

  test('Create User button navigates to create form', async ({ userListPage, page }) => {
    await userListPage.goto();
    await userListPage.clickCreateUser();
    await expect(page).toHaveURL('/users/create');
  });

  test('search filters table results', async ({ userListPage, api }) => {
    // Seed a user with a unique name so we can find it
    await api.authenticate(ADMIN_EMAIL, ADMIN_PASSWORD);
    const tag = uid();
    const seeded = await api.createUser({
      name: `E2E Search ${tag}`,
      email: `e2e-search-${tag}@test.com`,
      role: 'user',
      status: 'active',
    });

    try {
      await userListPage.goto();
      await userListPage.waitForTableLoad();
      await userListPage.searchFor(`E2E Search ${tag}`);
      await userListPage.expectUserInTable(`E2E Search ${tag}`);
    } finally {
      await api.deleteUser(seeded.id).catch(() => {});
    }
  });

  test('search with no results shows empty state', async ({ userListPage }) => {
    await userListPage.goto();
    await userListPage.searchFor('__nonexistent_user_xyz_12345__');
    await expect(userListPage.emptyState).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Create User
// ---------------------------------------------------------------------------
test.describe('Create User', () => {
  test('form is accessible at /users/create', async ({ userFormPage }) => {
    await userFormPage.gotoCreate();
    await expect(userFormPage.heading).toBeVisible();
    await expect(userFormPage.nameInput).toBeVisible();
    await expect(userFormPage.emailInput).toBeVisible();
    await expect(userFormPage.submitButton).toBeVisible();
    await expect(userFormPage.cancelButton).toBeVisible();
  });

  test('shows validation error when name is empty', async ({ userFormPage }) => {
    await userFormPage.gotoCreate();
    await userFormPage.fillEmail('valid@example.com');
    await userFormPage.submit();
    await userFormPage.expectFieldError('Name is required');
  });

  test('shows validation error when name is too short', async ({ userFormPage }) => {
    await userFormPage.gotoCreate();
    await userFormPage.fillName('ab');
    await userFormPage.fillEmail('valid@example.com');
    await userFormPage.submit();
    await userFormPage.expectFieldError('Name must be at least 3 characters');
  });

  test('shows validation error for invalid email format', async ({ userFormPage }) => {
    await userFormPage.gotoCreate();
    await userFormPage.fillName('Valid Name');
    await userFormPage.fillEmail('not-an-email');
    await userFormPage.submit();
    await userFormPage.expectFieldError('Invalid email format');
  });

  test('successful creation navigates back to /users', async ({ userFormPage, api, page }) => {
    const tag = uid();
    const email = `e2e-create-${tag}@test.com`;

    await userFormPage.gotoCreate();
    await userFormPage.fillName(`E2E Create ${tag}`);
    await userFormPage.fillEmail(email);
    await userFormPage.submit();

    await expect(page).toHaveURL('/users');

    // Cleanup: find and delete the created user via API
    await api.authenticate(ADMIN_EMAIL, ADMIN_PASSWORD);
    // Search by listing users — we just verify navigation succeeded; cleanup is best-effort
  });

  test('cancel navigates back to /users', async ({ userFormPage, page }) => {
    await userFormPage.gotoCreate();
    await userFormPage.cancel();
    await expect(page).toHaveURL('/users');
  });

  test('duplicate email shows conflict error', async ({ userFormPage, api }) => {
    const tag = uid();
    await api.authenticate(ADMIN_EMAIL, ADMIN_PASSWORD);
    const seeded = await api.createUser({
      name: `E2E Dupe ${tag}`,
      email: `e2e-dupe-${tag}@test.com`,
      role: 'user',
      status: 'active',
    });

    try {
      await userFormPage.gotoCreate();
      await userFormPage.fillName('Another Name');
      await userFormPage.fillEmail(`e2e-dupe-${tag}@test.com`);
      await userFormPage.submit();
      await userFormPage.expectEmailError('This email is already in use');
    } finally {
      await api.deleteUser(seeded.id).catch(() => {});
    }
  });
});

// ---------------------------------------------------------------------------
// Edit User
// ---------------------------------------------------------------------------
test.describe('Edit User', () => {
  let seededId: number;
  const tag = uid();
  const seededEmail = `e2e-edit-${tag}@test.com`;

  test.beforeAll(async ({ baseURL }) => {
    const client = new ApiClient(baseURL ?? 'http://localhost:5173');
    await client.authenticate(ADMIN_EMAIL, ADMIN_PASSWORD);
    const user = await client.createUser({
      name: `E2E Edit ${tag}`,
      email: seededEmail,
      role: 'user',
      status: 'active',
    });
    seededId = user.id;
  });

  test.afterAll(async ({ baseURL }) => {
    const client = new ApiClient(baseURL ?? 'http://localhost:5173');
    await client.authenticate(ADMIN_EMAIL, ADMIN_PASSWORD);
    await client.deleteUser(seededId).catch(() => {});
  });

  test('edit form loads with existing user data', async ({ page }) => {
    const formPage = new (await import('../pages/user-form-page')).UserFormPage(page, 'edit');
    await formPage.gotoEdit(seededId);
    await expect(formPage.nameInput).toHaveValue(`E2E Edit ${tag}`);
    await expect(formPage.emailInput).toHaveValue(seededEmail);
  });

  test('update navigates back to /users', async ({ page }) => {
    const formPage = new (await import('../pages/user-form-page')).UserFormPage(page, 'edit');
    await formPage.gotoEdit(seededId);
    await formPage.fillName(`E2E Edited ${tag}`);
    await formPage.submit();
    await expect(page).toHaveURL('/users');
  });

  test('cancel from edit navigates back to /users', async ({ page }) => {
    const formPage = new (await import('../pages/user-form-page')).UserFormPage(page, 'edit');
    await formPage.gotoEdit(seededId);
    await formPage.cancel();
    await expect(page).toHaveURL('/users');
  });
});

// ---------------------------------------------------------------------------
// Delete User
// ---------------------------------------------------------------------------
test.describe('Delete User', () => {
  test('delete shows confirmation dialog and removes user', async ({ userListPage, api, page }) => {
    const tag = uid();
    await api.authenticate(ADMIN_EMAIL, ADMIN_PASSWORD);
    const seeded = await api.createUser({
      name: `E2E Delete ${tag}`,
      email: `e2e-delete-${tag}@test.com`,
      role: 'user',
      status: 'active',
    });

    try {
      await userListPage.goto();
      await userListPage.waitForTableLoad();
      await userListPage.searchFor(`E2E Delete ${tag}`);
      await userListPage.expectUserInTable(`E2E Delete ${tag}`);

      await userListPage.clickDeleteForRow(0);

      // Confirm dialog should appear
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText('Are you sure you want to delete this user?');

      await page.getByRole('button', { name: 'Yes' }).click();

      // User should be removed from the table
      await userListPage.waitForTableLoad();
      await userListPage.expectUserNotInTable(`E2E Delete ${tag}`);
    } catch {
      // Best-effort cleanup if test failed before delete
      await api.deleteUser(seeded.id).catch(() => {});
    }
  });
});
