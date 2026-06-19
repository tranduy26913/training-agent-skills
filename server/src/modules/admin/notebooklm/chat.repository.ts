// Chat repository backed by Prisma Client.
// Public API mirrors the previous mysql2-based repository; the methods that
// used to return ResultSetHeader (insertId) now return a small adapter with
// the same shape so existing service code keeps working.
import { prisma } from '@database/prisma';
import type { ListSessionsQuery } from './chat.validation';

// Minimal subset of mysql2's ResultSetHeader so callers reading .insertId
// continue to work after the Prisma migration.
export interface InsertResult {
  insertId: number;
  affectedRows: number;
}

export class ChatRepository {
  // Find the workspace member record used for access checks.
  findWorkspaceMember(workspaceId: number, userId: number) {
    return prisma.workspaceMember.findFirst({
      where: { workspaceId, userId },
    });
  }

  // Find a chat session by id.
  findSessionById(sessionId: number) {
    return prisma.chatSession.findUnique({ where: { id: sessionId } });
  }

  // List chat sessions in a workspace, paginated by updated_at desc.
  async listSessionsForWorkspace(workspaceId: number, filters: ListSessionsQuery) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.chatSession.findMany({
        where: { workspaceId },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.chatSession.count({ where: { workspaceId } }),
    ]);

    return { data, total };
  }

  // Insert a new chat session. Returns { insertId, affectedRows }.
  async createSession(data: {
    workspaceId: number;
    userId: number;
    title: string;
    llmProvider?: 'ollama' | 'mock' | 'gemini';
  }): Promise<InsertResult> {
    const created = await prisma.chatSession.create({
      data: {
        workspaceId: data.workspaceId,
        userId: data.userId,
        title: data.title,
        llmProvider: data.llmProvider ?? 'ollama',
      },
      select: { id: true },
    });
    return { insertId: created.id, affectedRows: 1 };
  }

  // Update a chat session's title and provider. Returns the affected count.
  async updateSession(
    sessionId: number,
    data: { title: string; llmProvider?: 'ollama' | 'mock' | 'gemini' },
  ): Promise<InsertResult> {
    const result = await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        title: data.title,
        llmProvider: data.llmProvider ?? 'ollama',
      },
      select: { id: true },
    });
    return { insertId: result.id, affectedRows: 1 };
  }

  // Insert a new chat message.
  async createMessage(data: {
    sessionId: number;
    role: 'user' | 'assistant';
    content: string;
    jobId?: number | null;
  }): Promise<InsertResult> {
    const created = await prisma.chatMessage.create({
      data: {
        sessionId: data.sessionId,
        role: data.role,
        content: data.content,
        jobId: data.jobId ?? null,
      },
      select: { id: true },
    });
    return { insertId: created.id, affectedRows: 1 };
  }

  // List messages for a session, ordered by created_at asc.
  listMessagesBySession(sessionId: number) {
    return prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Insert a background job. payload is JSON-serialized by Prisma.
  async createJob(data: {
    type: string;
    status: string;
    payload: Record<string, unknown>;
    maxRetries?: number;
  }): Promise<InsertResult> {
    const created = await prisma.job.create({
      data: {
        type: data.type,
        status: data.status,
        payload: data.payload as any,
        maxRetries: data.maxRetries ?? 3,
      },
      select: { id: true },
    });
    return { insertId: created.id, affectedRows: 1 };
  }

  // Insert a job step.
  async createJobStep(data: {
    jobId: number;
    stepName: string;
    status?: string;
    progressPct?: number;
    detail?: string | null;
  }): Promise<InsertResult> {
    const created = await prisma.jobStep.create({
      data: {
        jobId: data.jobId,
        stepName: data.stepName,
        status: data.status ?? 'pending',
        progressPct: data.progressPct ?? 0,
        detail: data.detail ?? null,
      },
      select: { id: true },
    });
    return { insertId: created.id, affectedRows: 1 };
  }
}
