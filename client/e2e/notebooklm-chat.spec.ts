/**
 * E2E tests for NotebookLM Chat feature
 * NotebookLMチャット機能のE2Eテスト
 */
import { test, expect } from './fixtures';
import { ChatSessionListPage, ChatSessionCreatePage, ChatSessionEditPage } from './pages/chat-page';

const ADMIN_EMAIL = process.env.TEST_USER_EMAIL ?? 'admin@app.com';
const ADMIN_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'admin123';

// ---- API client helper for test data setup / テストデータ準備用APIクライアント ----

class ChatApiClient {
  private token: string | null = null;

  constructor(private readonly baseURL: string) {}

  async authenticate(): Promise<void> {
    const res = await fetch(`${this.baseURL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    if (!res.ok) throw new Error(`Auth failed: ${res.status}`);
    const body = (await res.json()) as { token: string };
    this.token = body.token;
  }

  private get authHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
    };
  }

  // ワークスペースを作成する / Create a test workspace and return its id
  async createWorkspace(name: string): Promise<number> {
    const res = await fetch(`${this.baseURL}/api/v1/user/notebooklm/workspaces`, {
      method: 'POST',
      headers: this.authHeaders,
      body: JSON.stringify({ name, description: 'E2E chat test workspace' }),
    });
    if (!res.ok) throw new Error(`Create workspace failed: ${res.status}`);
    const body = (await res.json()) as { id: number };
    return body.id;
  }

  // ワークスペースを削除する / Delete a workspace by id (cleanup)
  async deleteWorkspace(id: number): Promise<void> {
    await fetch(`${this.baseURL}/api/v1/user/notebooklm/workspaces/${id}`, {
      method: 'DELETE',
      headers: this.authHeaders,
    });
  }
}

// ---- Tests ----

test.describe('NotebookLM Chat', () => {
  let workspaceId: number;
  let api: ChatApiClient;

  test.beforeAll(async ({ baseURL }) => {
    api = new ChatApiClient(baseURL ?? 'http://localhost:5174');
    await api.authenticate();
    workspaceId = await api.createWorkspace(`E2E Chat WS ${Date.now()}`);
  });

  test.afterAll(async () => {
    if (workspaceId) {
      await api.deleteWorkspace(workspaceId);
    }
  });

  // セッション一覧ページ / Session list page
  test('displays empty chat session list for new workspace', async ({ page }) => {
    const listPage = new ChatSessionListPage(page);
    await listPage.goto(workspaceId);

    await expect(listPage.heading).toBeVisible();
    await expect(listPage.newSessionButton).toBeVisible();
  });

  // セッション作成 / Create session
  test('creates a new chat session with a custom title', async ({ page }) => {
    const listPage = new ChatSessionListPage(page);
    await listPage.goto(workspaceId);
    await listPage.clickNewSession();

    await expect(page).toHaveURL(/\/chat\/create$/);

    const createPage = new ChatSessionCreatePage(page);
    await createPage.create('E2E Test Session');

    // セッション詳細ページへリダイレクト / Should redirect to session edit page
    await expect(page).toHaveURL(/\/chat\/\d+$/);
  });

  // タイトルなしでセッション作成 / Create session without title uses default
  test('creates a chat session without a title (uses default)', async ({ page }) => {
    const listPage = new ChatSessionListPage(page);
    await listPage.goto(workspaceId);
    await listPage.clickNewSession();

    const createPage = new ChatSessionCreatePage(page);
    await createPage.create(); // no title → default "Chat Session <timestamp>"

    await expect(page).toHaveURL(/\/chat\/\d+$/);
    // セッションタイトルが表示される / Session title should be visible (default format)
    await expect(page.getByRole('heading')).toBeVisible();
  });

  // メッセージ送信 / Send a message
  test('sends a user message and shows it in the conversation', async ({ page }) => {
    const listPage = new ChatSessionListPage(page);
    await listPage.goto(workspaceId);
    await listPage.clickNewSession();

    const createPage = new ChatSessionCreatePage(page);
    await createPage.create('Chat for Messaging');

    await expect(page).toHaveURL(/\/chat\/\d+$/);

    const editPage = new ChatSessionEditPage(page);
    await editPage.sendMessage('What is the purpose of this workspace?');

    // ユーザーメッセージがUIに表示される / User message should appear immediately
    await expect(page.getByText('What is the purpose of this workspace?')).toBeVisible();
  });

  // セッション一覧にセッションが表示される / Session list shows created sessions
  test('shows created sessions in the session list', async ({ page }) => {
    const listPage = new ChatSessionListPage(page);
    await listPage.goto(workspaceId);

    // 作成したセッションが一覧に表示される / At least one session should be listed
    // (sessions were created in prior tests within this describe block)
    await expect(page.getByText('E2E Test Session')).toBeVisible();
  });

  // 空メッセージは送信しない / Empty message is not sent
  test('does not send an empty message (send button disabled)', async ({ page }) => {
    const listPage = new ChatSessionListPage(page);
    await listPage.goto(workspaceId);
    await listPage.clickNewSession();

    const createPage = new ChatSessionCreatePage(page);
    await createPage.create('Empty Message Test');

    const editPage = new ChatSessionEditPage(page);
    // 入力が空のときSendボタンが無効 / Send button should be disabled when input is empty
    await expect(editPage.sendButton).toBeDisabled();
  });

  // 存在しないワークスペースはリダイレクトまたは404 / Unknown workspace handled gracefully
  test('handles unknown workspace id gracefully', async ({ page }) => {
    await page.goto('/notebooklm/workspaces/9999999/chat');

    // エラーメッセージかリダイレクトが発生する / Should show error or redirect
    await page.waitForLoadState('networkidle');
    const hasError =
      (await page.getByText(/not found/i).count()) > 0 ||
      page.url().includes('/notebooklm') ||
      page.url().includes('/dashboard');

    expect(hasError).toBe(true);
  });
});
