/**
 * Page Object Model for NotebookLM Chat pages
 * チャット機能のページオブジェクトモデル
 */
import type { Page, Locator } from '@playwright/test';

export class ChatSessionListPage {
  readonly heading: Locator;
  readonly newSessionButton: Locator;
  readonly sessionRows: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: /Chat Sessions/i });
    this.newSessionButton = page.getByRole('button', { name: /New Session/i });
    this.sessionRows = page.locator('[data-testid^="chat-session-row-"]');
  }

  // セッション一覧ページへ移動 / Navigate to sessions list for a workspace
  async goto(workspaceId: number): Promise<void> {
    await this.page.goto(`/notebooklm/workspaces/${workspaceId}/chat`);
  }

  // 作成ページへ移動 / Click new session button to open create page
  async clickNewSession(): Promise<void> {
    await this.newSessionButton.click();
  }

  // セッションを開く / Click on a session row to open it
  async openSession(index = 0): Promise<void> {
    await this.sessionRows.nth(index).locator('button[data-testid^="chat-open-"]').click();
  }
}

export class ChatSessionCreatePage {
  readonly titleInput: Locator;
  readonly providerSelect: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(private readonly page: Page) {
    this.titleInput = page.getByPlaceholder(/session title/i);
    // [CR-NBLM-LLM-001] LLMプロバイダー選択 / LLM provider dropdown
    this.providerSelect = page.locator('[data-testid="session-provider-select"]');
    this.submitButton = page.getByRole('button', { name: /Create Session/i });
    this.cancelButton = page.getByRole('button', { name: /Cancel/i });
  }

  // タイトルとプロバイダーを入力して送信 / Fill title, optionally select provider, and submit form
  async create(title?: string, provider?: 'ollama' | 'mock' | 'gemini'): Promise<void> {
    if (title) {
      await this.titleInput.fill(title);
    }
    if (provider) {
      await this.providerSelect.click();
      await this.page.getByRole('option', { name: new RegExp(provider, 'i') }).click();
    }
    await this.submitButton.click();
  }
}

export class ChatSessionEditPage {
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly messageBubbles: Locator;
  readonly loadingSpinner: Locator;
  // [CR-NBLM-LLM-001] プロバイダーバッジとセッション設定 / Provider badge and settings toggle
  readonly providerBadge: Locator;
  readonly settingsButton: Locator;
  readonly settingsProviderSelect: Locator;
  readonly settingsSubmitButton: Locator;

  constructor(private readonly page: Page) {
    this.messageInput = page.getByPlaceholder(/Type your question/i);
    this.sendButton = page.getByRole('button', { name: /Send/i });
    this.messageBubbles = page.locator('.message-bubble, [class*="rounded-2xl"]');
    this.loadingSpinner = page.locator('.pi-spinner');
    this.providerBadge = page.locator('[data-testid="session-provider-badge"]').first();
    this.settingsButton = page.locator('[data-testid="chat-settings-btn"]');
    this.settingsProviderSelect = page.locator('[data-testid="session-provider-select"]');
    this.settingsSubmitButton = page.locator('[data-testid="session-submit-btn"]');
  }

  // メッセージを送信する / Type message content and click send
  async sendMessage(content: string): Promise<void> {
    await this.messageInput.fill(content);
    await this.sendButton.click();
  }
}
