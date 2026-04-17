import { test, expect } from './fixtures';

const ADMIN_EMAIL = process.env.TEST_USER_EMAIL ?? 'admin@app.com';
const ADMIN_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'admin123';

test.describe('Login', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('successful login redirects to /dashboard', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page).toHaveURL('/dashboard');
  });

  test('invalid credentials shows error message', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login(ADMIN_EMAIL, 'wrong-password');
    // Wait explicitly for the API response, then verify error rendered
    await page.waitForResponse(
      (r) => r.url().includes('/api/auth') && !r.ok(),
      { timeout: 10000 },
    );
    await loginPage.expectError('Invalid email or password');
  });

  test('empty email prevents form submission', async ({ loginPage, page }) => {
    await loginPage.goto();
    // Fill only password — email input stays empty
    await loginPage.passwordInput.fill(ADMIN_PASSWORD);
    await loginPage.submitButton.click();
    // HTML5 validation blocks submission; page stays at /login
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Route guards — unauthenticated', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('accessing /users without auth redirects to /login', async ({ page }) => {
    await page.goto('/users');
    await expect(page).toHaveURL('/login');
  });

  test('accessing /users/create without auth redirects to /login', async ({ page }) => {
    await page.goto('/users/create');
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Route guards — authenticated admin', () => {
  test('admin can navigate to /users', async ({ page }) => {
    await page.goto('/users');
    await expect(page).toHaveURL('/users');
    await expect(page.getByTestId('users-list-heading')).toBeVisible({ timeout: 30000 });
  });

  test('visiting /login while authenticated redirects to /dashboard', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL('/dashboard');
  });
});

test.describe('Logout', () => {
  test('logout clears session and redirects to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByTitle('Logout').click();
    await expect(page).toHaveURL('/login');
  });

  test('after logout, accessing /users redirects to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByTitle('Logout').click();
    await expect(page).toHaveURL('/login');

    await page.goto('/users');
    await expect(page).toHaveURL('/login');
  });
});
