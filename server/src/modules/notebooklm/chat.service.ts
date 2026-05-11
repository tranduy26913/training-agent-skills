// チャットサービス / Chat service with business logic
import { ServiceError } from '../../models/common.model';
import { ChatRepository } from './chat.repository';
import type { CreateSessionInput, UpdateSessionInput, SendMessageInput, ListSessionsQuery } from './chat.validation';
import { dispatchNotebookLmWorker } from './worker-dispatcher';

export { ServiceError };

// QUERYジョブのステップ名一覧 / Step names for a QUERY job
const QUERY_STEPS = ['prepare', 'retrieve', 'synthesize', 'store'] as const;

export class ChatService {
  private readonly repository: ChatRepository;

  // コンストラクタ / Constructor with optional repository injection for testing
  constructor(repository?: ChatRepository) {
    this.repository = repository ?? new ChatRepository();
  }

  // ワークスペースメンバー確認ヘルパー / Verify user is a workspace member or throw 404
  private async getMemberOrThrow(workspaceId: number, userId: number) {
    const member = await this.repository.findWorkspaceMember(workspaceId, userId);
    if (!member) {
      throw new ServiceError('Workspace not found', 404);
    }
    return member;
  }

  // セッション確認ヘルパー / Verify session exists or throw 404
  private async getSessionOrThrow(sessionId: number) {
    const session = await this.repository.findSessionById(sessionId);
    if (!session) {
      throw new ServiceError('Session not found', 404);
    }
    return session;
  }

  // ワーカートリガー / Trigger python worker without failing the request on error
  private async triggerWorker(): Promise<void> {
    try {
      await dispatchNotebookLmWorker('QUERY');
    } catch (error) {
      console.error('[ChatService] Failed to trigger python worker', { error });
    }
  }

  // セッション一覧取得 / List paginated sessions for a workspace
  async listSessions(workspaceId: number, userId: number, filters: ListSessionsQuery) {
    await this.getMemberOrThrow(workspaceId, userId);

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const { data, total } = await this.repository.listSessionsForWorkspace(workspaceId, filters);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // セッション作成 / Create a new chat session in a workspace
  async createSession(workspaceId: number, dto: CreateSessionInput, userId: number) {
    await this.getMemberOrThrow(workspaceId, userId);

    const title = dto.title?.trim() || `Chat Session ${Date.now()}`;
    // [CR-NBLM-LLM-001] プロバイダーを決定 / Resolve provider (defaults to 'ollama')
    const llm_provider = dto.llmProvider ?? 'ollama';

    const result = await this.repository.createSession({ workspace_id: workspaceId, user_id: userId, title, llm_provider });
    const session = await this.repository.findSessionById(result.insertId);
    return session!;
  }

  // セッション更新 / Update the title and provider of an existing chat session
  async updateSession(sessionId: number, dto: UpdateSessionInput, userId: number) {
    const session = await this.getSessionOrThrow(sessionId);
    await this.getMemberOrThrow(session.workspace_id, userId);

    // [CR-NBLM-LLM-001] プロバイダーも保存 / Persist provider along with title
    const llm_provider = dto.llmProvider ?? 'ollama';
    await this.repository.updateSession(sessionId, { title: dto.title, llm_provider });
    const updated = await this.repository.findSessionById(sessionId);
    return updated!;
  }

  // メッセージ送信 / Send a user message and enqueue a QUERY job
  async sendMessage(sessionId: number, dto: SendMessageInput, userId: number): Promise<{ jobId: number }> {
    const session = await this.getSessionOrThrow(sessionId);
    await this.getMemberOrThrow(session.workspace_id, userId);

    // ユーザーメッセージを保存 / Persist user message
    const messageResult = await this.repository.createMessage({
      session_id: sessionId,
      role: 'user',
      content: dto.content,
    });

    // QUERYジョブを作成 / Create QUERY job with context payload
    const jobResult = await this.repository.createJob({
      type: 'QUERY',
      status: 'pending',
      payload: {
        workspace_id: session.workspace_id,
        session_id: sessionId,
        message_id: messageResult.insertId,
        query_text: dto.content,
        // [CR-NBLM-LLM-001] セッションのプロバイダースナップショットをペイロードに含める / Snapshot session provider into job payload
        llm_provider: session.llm_provider ?? 'ollama',
      },
    });

    // ジョブステップを作成 / Create each processing step for the job
    for (const stepName of QUERY_STEPS) {
      await this.repository.createJobStep({ job_id: jobResult.insertId, step_name: stepName });
    }

    // バックグラウンドワーカーを起動 / Trigger background worker (non-blocking)
    await this.triggerWorker();

    return { jobId: jobResult.insertId };
  }

  // メッセージ一覧取得 / List all messages in a session
  async listMessages(sessionId: number, userId: number) {
    const session = await this.getSessionOrThrow(sessionId);
    await this.getMemberOrThrow(session.workspace_id, userId);

    return this.repository.listMessagesBySession(sessionId);
  }
}
