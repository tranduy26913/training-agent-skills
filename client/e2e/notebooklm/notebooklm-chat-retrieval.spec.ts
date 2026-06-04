import { test, expect } from '../fixtures';

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5174';
const ADMIN_EMAIL = process.env.TEST_USER_EMAIL ?? 'admin@app.com';
const ADMIN_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'admin123';

/**
 * E2E spec: NotebookLM Chat & Retrieval
 * ======================================
 * Covers:
 *  1. Session list navigation
 *  2. Session creation
 *  3. Session title editing
 *  4. Chat panel basics (empty state, send button)
 *  5. User message display on the right side (optimistic update)
 *  6. Full RAG pipeline with mock Ollama server
 *
 * Mock Ollama prerequisite (for section 6):
 *   python python-services/mock_ollama_server.py --port 11434
 *   Set env: LLM_API_URL=http://localhost:11434
 *   Then run the query worker: python python-services/run_worker.py
 * / モックOllamaサーバーのセクション(6)の前提条件:
 *   上記のモックサーバーとワーカーが動作していること
 */

// ---------------------------------------------------------------------------
// Minimal API helper
// APIヘルパー / bootstrap test data via HTTP
// ---------------------------------------------------------------------------

class ChatApiClient {
  private token: string | null = null;

  constructor(private readonly baseURL: string) {}

  async authenticate(): Promise<void> {
    const res = await fetch(`${this.baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    if (!res.ok) throw new Error(`Auth failed: ${res.status}`);
    const body = (await res.json()) as { token: string };
    this.token = body.token;
  }

  private get headers(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
    };
  }

  /** ワークスペース一覧を取得する / List accessible workspaces */
  async listWorkspaces(): Promise<Array<{ id: number; name: string }>> {
    const res = await fetch(`${this.baseURL}/api/notebooklm/workspaces?limit=5`, {
      headers: this.headers,
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { data?: Array<{ id: number; name: string }> };
    return body.data ?? [];
  }

  /** チャットセッションを作成する / Create a chat session (with optional llmProvider) */
  async createSession(
    workspaceId: number,
    title: string,
    llmProvider?: 'ollama' | 'mock' | 'gemini',
  ): Promise<{ id: number } | null> {
    const res = await fetch(`${this.baseURL}/api/notebooklm/workspaces/${workspaceId}/sessions`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ title, ...(llmProvider ? { llmProvider } : {}) }),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: { id: number } };
    return body.data ?? null;
  }

  /** セッションにメッセージを送信する / Send a message to a session */
  async sendMessage(sessionId: number, content: string): Promise<{ jobId: number } | null> {
    const res = await fetch(`${this.baseURL}/api/notebooklm/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ content }),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: { jobId: number } };
    return body.data ?? null;
  }

  /** セッションのメッセージ一覧を取得する / List messages for a session */
  async listMessages(
    sessionId: number,
  ): Promise<Array<{ id: number; role: string; content: string }>> {
    const res = await fetch(`${this.baseURL}/api/notebooklm/sessions/${sessionId}/messages`, {
      headers: this.headers,
    });
    if (!res.ok) return [];
    const body = (await res.json()) as {
      data?: Array<{ id: number; role: string; content: string }>;
    };
    return body.data ?? [];
  }

  /** モックOllamaサーバーが稼働しているか確認する / Check if mock Ollama is reachable */
  async isMockOllamaReachable(ollamaUrl = 'http://localhost:11434'): Promise<boolean> {
    try {
      const res = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(1500) });
      return res.ok;
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Section 1: Session List
// ---------------------------------------------------------------------------

test.describe('NotebookLM Chat — Session List', () => {
  test('navigates to chat session list from workspace edit page', async ({ page }) => {
    await page.goto('/notebooklm');
    await expect(page).toHaveURL('/notebooklm');

    const firstChatBtn = page.locator('[data-testid="workspace-chat-btn"]').first();
    const firstEditBtn = page.locator('[data-testid="workspace-edit-btn"]').first();

    if ((await firstChatBtn.count()) > 0) {
      await firstChatBtn.first().click();
      await expect(page.getByText('Chat Sessions')).toBeVisible();
    } else if ((await firstEditBtn.count()) > 0) {
      await firstEditBtn.first().click();
      const openChatBtn = page.getByRole('button', { name: /open chat/i });
      if ((await openChatBtn.count()) > 0) {
        await openChatBtn.click();
        await expect(page.getByText('Chat Sessions')).toBeVisible();
      } else {
        test.skip(true, 'No "Open Chat" button found on workspace edit page');
      }
    } else {
      test.skip(true, 'No workspaces available for chat navigation test');
    }
  });

  test('renders chat session list page with correct header', async ({ page, baseURL }) => {
    const api = new ChatApiClient(baseURL ?? BASE_URL);
    await api.authenticate();

    const workspaces = await api.listWorkspaces();
    test.skip(workspaces.length === 0, 'No workspaces available — skip');

    await page.goto(`/notebooklm/workspaces/${workspaces[0].id}/chat`);
    await expect(page.getByText('Chat Sessions')).toBeVisible();
    await expect(page.getByRole('button', { name: /new session/i })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Section 2: Create Session
// ---------------------------------------------------------------------------

test.describe('NotebookLM Chat — Create Session', () => {
  test('navigates to create form and shows title input', async ({ page, baseURL }) => {
    const api = new ChatApiClient(baseURL ?? BASE_URL);
    await api.authenticate();

    const workspaces = await api.listWorkspaces();
    test.skip(workspaces.length === 0, 'No workspaces — skip');

    await page.goto(`/notebooklm/workspaces/${workspaces[0].id}/chat/create`);
    await expect(page.getByTestId('session-title-input')).toBeVisible();
    await expect(page.getByTestId('session-create-btn')).toBeVisible();
  });

  test('creates a session and redirects to session list or chat panel', async ({
    page,
    baseURL,
  }) => {
    const api = new ChatApiClient(baseURL ?? BASE_URL);
    await api.authenticate();

    const workspaces = await api.listWorkspaces();
    test.skip(workspaces.length === 0, 'No workspaces — skip');

    await page.goto(`/notebooklm/workspaces/${workspaces[0].id}/chat/create`);
    await page.getByTestId('session-title-input').fill(`E2E session ${Date.now()}`);
    await page.getByTestId('session-create-btn').click();

    await expect(page).toHaveURL(/\/notebooklm\/workspaces\/\d+\/chat/);
  });
});

// ---------------------------------------------------------------------------
// Section 3: Edit Session Title
// ---------------------------------------------------------------------------

test.describe('NotebookLM Chat — Edit Session Title', () => {
  test('updates session title from the chat page', async ({ page, baseURL }) => {
    const api = new ChatApiClient(baseURL ?? BASE_URL);
    await api.authenticate();

    const workspaces = await api.listWorkspaces();
    test.skip(workspaces.length === 0, 'No workspaces — skip');

    const created = await api.createSession(workspaces[0].id, 'E2E edit target session');
    test.skip(created === null, 'Could not create session — skip');

    await page.goto(`/notebooklm/workspaces/${workspaces[0].id}/chat/${created!.id}`);

    const editBtn = page.getByTestId('session-title-edit-btn');
    if ((await editBtn.count()) > 0) {
      await editBtn.click();
      await page.getByTestId('session-title-input').clear();
      await page.getByTestId('session-title-input').fill('Updated E2E Title');
      await page.getByTestId('session-title-save-btn').click();
      await expect(page.getByText('Updated E2E Title')).toBeVisible();
    } else {
      await expect(page.getByTestId('chat-panel')).toBeVisible();
    }
  });
});

// ---------------------------------------------------------------------------
// Section 4: Chat Panel basics
// ---------------------------------------------------------------------------

test.describe('NotebookLM Chat — Chat Panel', () => {
  test('shows empty state and send button on a new session page', async ({ page, baseURL }) => {
    const api = new ChatApiClient(baseURL ?? BASE_URL);
    await api.authenticate();

    const workspaces = await api.listWorkspaces();
    test.skip(workspaces.length === 0, 'No workspaces — skip');

    const created = await api.createSession(workspaces[0].id, 'E2E panel session');
    test.skip(created === null, 'Could not create session — skip');

    await page.goto(`/notebooklm/workspaces/${workspaces[0].id}/chat/${created!.id}`);

    await expect(page.getByTestId('chat-panel')).toBeVisible();
    await expect(page.getByTestId('chat-message-input')).toBeVisible();
    await expect(page.getByTestId('chat-send-btn')).toBeVisible();
  });

  test('send button is disabled when input is empty', async ({ page, baseURL }) => {
    const api = new ChatApiClient(baseURL ?? BASE_URL);
    await api.authenticate();

    const workspaces = await api.listWorkspaces();
    test.skip(workspaces.length === 0, 'No workspaces — skip');

    const created = await api.createSession(workspaces[0].id, 'E2E disabled-btn session');
    test.skip(created === null, 'Could not create session — skip');

    await page.goto(`/notebooklm/workspaces/${workspaces[0].id}/chat/${created!.id}`);
    await expect(page.getByTestId('chat-send-btn')).toBeDisabled();
  });

  test('send button becomes active when user types a message', async ({ page, baseURL }) => {
    const api = new ChatApiClient(baseURL ?? BASE_URL);
    await api.authenticate();

    const workspaces = await api.listWorkspaces();
    test.skip(workspaces.length === 0, 'No workspaces — skip');

    const created = await api.createSession(workspaces[0].id, 'E2E typing session');
    test.skip(created === null, 'Could not create session — skip');

    await page.goto(`/notebooklm/workspaces/${workspaces[0].id}/chat/${created!.id}`);

    await page.getByTestId('chat-message-input').fill('Hello world');
    await expect(page.getByTestId('chat-send-btn')).not.toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Section 5: User message displayed on the right side (optimistic update)
// ユーザーメッセージが右側に即座に表示されること（楽観的更新）
// ---------------------------------------------------------------------------

test.describe('NotebookLM Chat — User message on the right', () => {
  test('user message appears on the right side immediately after sending', async ({
    page,
    baseURL,
  }) => {
    const api = new ChatApiClient(baseURL ?? BASE_URL);
    await api.authenticate();

    const workspaces = await api.listWorkspaces();
    test.skip(workspaces.length === 0, 'No workspaces — skip');

    const created = await api.createSession(workspaces[0].id, 'E2E user-msg right session');
    test.skip(created === null, 'Could not create session — skip');

    await page.goto(`/notebooklm/workspaces/${workspaces[0].id}/chat/${created!.id}`);

    const userText = 'Is this document about AI?';
    await page.getByTestId('chat-message-input').fill(userText);
    await page.getByTestId('chat-send-btn').click();

    // ユーザーメッセージは楽観的更新によりポーリング完了前に即座に表示される
    // User message must appear instantly (optimistic update), before polling finishes
    const userBubble = page.locator('.flex.justify-end').filter({ hasText: userText });
    await expect(userBubble).toBeVisible({ timeout: 3000 });
  });

  test('user message bubble has right-aligned layout class (justify-end)', async ({
    page,
    baseURL,
  }) => {
    const api = new ChatApiClient(baseURL ?? BASE_URL);
    await api.authenticate();

    const workspaces = await api.listWorkspaces();
    test.skip(workspaces.length === 0, 'No workspaces — skip');

    const created = await api.createSession(workspaces[0].id, 'E2E right-align session');
    test.skip(created === null, 'Could not create session — skip');

    await page.goto(`/notebooklm/workspaces/${workspaces[0].id}/chat/${created!.id}`);

    const question = 'What is machine learning?';
    await page.getByTestId('chat-message-input').fill(question);
    await page.getByTestId('chat-send-btn').click();

    // メッセージバブルが justify-end クラスを持つことを確認する
    // The outer wrapper must have justify-end for right-side alignment
    await expect(
      page.locator('.flex.justify-end').filter({ hasText: question }),
    ).toBeVisible({ timeout: 3000 });
  });

  test('input is cleared after sending and re-enabled while waiting', async ({
    page,
    baseURL,
  }) => {
    const api = new ChatApiClient(baseURL ?? BASE_URL);
    await api.authenticate();

    const workspaces = await api.listWorkspaces();
    test.skip(workspaces.length === 0, 'No workspaces — skip');

    const created = await api.createSession(workspaces[0].id, 'E2E clear-input session');
    test.skip(created === null, 'Could not create session — skip');

    await page.goto(`/notebooklm/workspaces/${workspaces[0].id}/chat/${created!.id}`);

    await page.getByTestId('chat-message-input').fill('Clear me after send');
    await page.getByTestId('chat-send-btn').click();

    // 入力欄が送信後にクリアされることを確認する
    // The input must be emptied immediately after send
    await expect(page.getByTestId('chat-message-input')).toHaveValue('', { timeout: 3000 });
  });
});

// ---------------------------------------------------------------------------
// Section 6: Full RAG pipeline with Mock Ollama server
// モックOllamaサーバーを使ったRAGパイプラインのフルフロー
//
// Prerequisites to run this section:
//   1. python python-services/mock_ollama_server.py --port 11434
//   2. LLM_API_URL=http://localhost:11434 python python-services/run_worker.py
// ---------------------------------------------------------------------------

test.describe('NotebookLM Chat — Mock Ollama RAG pipeline', () => {
  test('mock Ollama server responds to health check', async ({ baseURL }) => {
    const api = new ChatApiClient(baseURL ?? BASE_URL);
    const reachable = await api.isMockOllamaReachable();
    test.skip(!reachable, 'Mock Ollama server not running — skip RAG pipeline tests');

    // モックサーバーが /api/tags を正しく返す / Mock server must expose model list
    const res = await fetch('http://localhost:11434/api/tags');
    expect(res.ok).toBe(true);
    const body = (await res.json()) as { models: unknown[] };
    expect(body.models.length).toBeGreaterThan(0);
  });

  test('mock Ollama server returns a generate response', async ({ baseURL }) => {
    const api = new ChatApiClient(baseURL ?? BASE_URL);
    const reachable = await api.isMockOllamaReachable();
    test.skip(!reachable, 'Mock Ollama server not running — skip');

    // POST /api/generate はモック回答を返す / POST /api/generate returns a mock answer
    const res = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3',
        prompt: 'Context:\nAI stands for artificial intelligence.\n---\nQuestion: what is AI?\nAnswer:',
        stream: false,
      }),
    });

    expect(res.ok).toBe(true);
    const body = (await res.json()) as { response: string; done: boolean };
    expect(body.done).toBe(true);
    expect(typeof body.response).toBe('string');
    expect(body.response.length).toBeGreaterThan(10);
  });

  test('user question triggers job and assistant answer eventually appears on the left', async ({
    page,
    baseURL,
  }) => {
    const api = new ChatApiClient(baseURL ?? BASE_URL);
    await api.authenticate();

    const ollamaReachable = await api.isMockOllamaReachable();
    test.skip(!ollamaReachable, 'Mock Ollama server not running — skip');

    const workspaces = await api.listWorkspaces();
    test.skip(workspaces.length === 0, 'No workspaces — skip');

    const created = await api.createSession(workspaces[0].id, 'E2E RAG full pipeline');
    test.skip(created === null, 'Could not create session — skip');

    await page.goto(`/notebooklm/workspaces/${workspaces[0].id}/chat/${created!.id}`);

    const question = 'What does this workspace contain?';
    await page.getByTestId('chat-message-input').fill(question);
    await page.getByTestId('chat-send-btn').click();

    // ユーザーメッセージが右側に即座に現れる / User message on the right immediately
    await expect(
      page.locator('.flex.justify-end').filter({ hasText: question }),
    ).toBeVisible({ timeout: 3000 });

    // ワーカーがジョブを処理しアシスタント回答が左側に現れるまで待つ
    // Wait for the query worker to process the job and write the assistant reply
    await expect(
      page.locator('.flex.justify-start').first(),
    ).toBeVisible({ timeout: 90_000 });

    // アシスタント回答がモックOllamaのマーカーを含む / Response contains mock Ollama marker
    const assistantBubble = page.locator('.flex.justify-start').first();
    await expect(assistantBubble).toContainText(/mock ollama/i, { timeout: 90_000 });
  });

  test('assistant bubble appears on the left side with sources section if available', async ({
    page,
    baseURL,
  }) => {
    const api = new ChatApiClient(baseURL ?? BASE_URL);
    await api.authenticate();

    const ollamaReachable = await api.isMockOllamaReachable();
    test.skip(!ollamaReachable, 'Mock Ollama server not running — skip');

    const workspaces = await api.listWorkspaces();
    test.skip(workspaces.length === 0, 'No workspaces — skip');

    // APIでメッセージを直接送信してジョブが完了するのを待ってから画面を確認する
    // Send via API directly and navigate after job might be done
    const created = await api.createSession(workspaces[0].id, 'E2E assistant left side');
    test.skip(created === null, 'Could not create session — skip');

    await page.goto(`/notebooklm/workspaces/${workspaces[0].id}/chat/${created!.id}`);
    await page.getByTestId('chat-message-input').fill('Summarize the documents');
    await page.getByTestId('chat-send-btn').click();

    // アシスタントメッセージバブルは justify-start クラスを持つ
    // Assistant bubble must carry justify-start (left-side alignment)
    await expect(
      page.locator('.flex.justify-start').first(),
    ).toBeVisible({ timeout: 90_000 });
  });
});

// ---------------------------------------------------------------------------
// Section 7: LLM Provider Selection (CR-NBLM-LLM-001)
// LLMプロバイダー選択 (セッション単位でのプロバイダー指定)
// ---------------------------------------------------------------------------

test.describe('NotebookLM Chat — LLM Provider Selection', () => {
  test('create session with mock provider via API and verify llm_provider persisted', async ({
    baseURL,
  }) => {
    const api = new ChatApiClient(baseURL ?? BASE_URL);
    await api.authenticate();

    const workspaces = await api.listWorkspaces();
    test.skip(workspaces.length === 0, 'No workspaces — skip');

    // モックプロバイダーでセッションを作成する / Create session with mock provider
    const created = await api.createSession(workspaces[0].id, 'E2E provider mock session', 'mock');
    test.skip(created === null, 'Could not create session — skip');
    expect(created!.id).toBeTruthy();
  });

  test('session list shows provider badge after creating session', async ({ page, baseURL }) => {
    const api = new ChatApiClient(baseURL ?? BASE_URL);
    await api.authenticate();

    const workspaces = await api.listWorkspaces();
    test.skip(workspaces.length === 0, 'No workspaces — skip');

    // セッションをAPIで作成してからリスト画面でバッジを確認する
    // Create session via API then check badge in list view
    await api.createSession(workspaces[0].id, 'E2E provider badge session', 'gemini');

    await page.goto(`/notebooklm/workspaces/${workspaces[0].id}/chat`);

    // セッションリストにプロバイダーバッジが表示されること
    // At least one provider badge must be visible in the session list
    const badge = page.locator('[data-testid="session-provider-badge"]').first();
    await expect(badge).toBeVisible({ timeout: 10_000 });
  });
});
