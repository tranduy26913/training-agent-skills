// Chat service with business logic.
// Talks to ChatRepository (Prisma-backed) and uses camelCase fields since
// the repository no longer goes through mysql2's snake_case row shape.
import { ServiceError } from '../../models/common.model';
import { ChatRepository } from './chat.repository';
import type {
  CreateSessionInput,
  UpdateSessionInput,
  SendMessageInput,
  ListSessionsQuery,
} from './chat.validation';
import { dispatchNotebookLmWorker } from './worker-dispatcher';
import { logger } from '../../utils/logger.util';

export { ServiceError };

// Step names for a QUERY job.
const QUERY_STEPS = ['prepare', 'retrieve', 'synthesize', 'store'] as const;

export class ChatService {
  private readonly repository: ChatRepository;

  constructor(repository?: ChatRepository) {
    this.repository = repository ?? new ChatRepository();
  }

  // Verify the user is a workspace member; throw 404 otherwise.
  private async getMemberOrThrow(workspaceId: number, userId: number) {
    const member = await this.repository.findWorkspaceMember(workspaceId, userId);
    if (!member) {
      throw new ServiceError('Workspace not found', 404);
    }
    return member;
  }

  // Verify a session exists; throw 404 otherwise.
  private async getSessionOrThrow(sessionId: number) {
    const session = await this.repository.findSessionById(sessionId);
    if (!session) {
      throw new ServiceError('Session not found', 404);
    }
    return session;
  }

  // Trigger the python worker, never failing the request on dispatch error.
  private async triggerWorker(jobId: number, llmProvider: string): Promise<void> {
    try {
      logger.info('Dispatching NotebookLM worker', {
        job_id: jobId,
        llm_provider: llmProvider,
        worker: 'QUERY',
      });
      await dispatchNotebookLmWorker('QUERY');
    } catch (error) {
      console.error('[ChatService] Failed to trigger python worker', { error });
    }
  }

  // List paginated sessions for a workspace.
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

  // Create a new chat session in a workspace.
  async createSession(workspaceId: number, dto: CreateSessionInput, userId: number) {
    await this.getMemberOrThrow(workspaceId, userId);

    const title = dto.title?.trim() || `Chat Session ${Date.now()}`;
    const llmProvider = dto.llmProvider ?? 'ollama';

    const result = await this.repository.createSession({
      workspaceId,
      userId,
      title,
      llmProvider,
    });
    const session = await this.repository.findSessionById(result.insertId);
    return session!;
  }

  // Get a single chat session, ensuring the caller is a member of its workspace.
  async getSession(sessionId: number, userId: number) {
    const session = await this.getSessionOrThrow(sessionId);
    await this.getMemberOrThrow(session.workspaceId, userId);
    return session;
  }

  // Update the title and provider of an existing chat session.
  async updateSession(sessionId: number, dto: UpdateSessionInput, userId: number) {
    const session = await this.getSessionOrThrow(sessionId);
    await this.getMemberOrThrow(session.workspaceId, userId);

    const llmProvider = dto.llmProvider ?? 'ollama';
    await this.repository.updateSession(sessionId, { title: dto.title, llmProvider });
    const updated = await this.repository.findSessionById(sessionId);
    return updated!;
  }

  // Persist a user message and enqueue a QUERY job for the worker.
  async sendMessage(
    sessionId: number,
    dto: SendMessageInput,
    userId: number,
  ): Promise<{ jobId: number }> {
    const session = await this.getSessionOrThrow(sessionId);
    await this.getMemberOrThrow(session.workspaceId, userId);

    // Prefer the provider passed in this request, fall back to the session's.
    const resolvedProvider = dto.llmProvider ?? session.llmProvider ?? 'ollama';

    const messageResult = await this.repository.createMessage({
      sessionId,
      role: 'user',
      content: dto.content,
    });

    const jobResult = await this.repository.createJob({
      type: 'QUERY',
      status: 'pending',
      payload: {
        workspaceId: session.workspaceId,
        sessionId,
        messageId: messageResult.insertId,
        queryText: dto.content,
        // Snapshot the resolved provider into the job payload for the worker.
        llmProvider: resolvedProvider,
      },
    });

    for (const stepName of QUERY_STEPS) {
      await this.repository.createJobStep({ jobId: jobResult.insertId, stepName });
    }

    await this.triggerWorker(jobResult.insertId, resolvedProvider);

    return { jobId: jobResult.insertId };
  }

  // List all messages in a session, scoped to a member of the workspace.
  async listMessages(sessionId: number, userId: number) {
    const session = await this.getSessionOrThrow(sessionId);
    await this.getMemberOrThrow(session.workspaceId, userId);

    return this.repository.listMessagesBySession(sessionId);
  }
}
