import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServiceError } from '../../models/common.model';
import { ChatService } from './chat.service';

// モックリポジトリファクトリ / Mock repository factory
function createMockRepository() {
  return {
    findMemberByWorkspaceAndSession: vi.fn(),
    findWorkspaceMember: vi.fn(),
    findSessionById: vi.fn(),
    listSessionsForWorkspace: vi.fn(),
    createSession: vi.fn(),
    updateSession: vi.fn(),
    createMessage: vi.fn(),
    listMessagesBySession: vi.fn(),
    createJob: vi.fn(),
    createJobStep: vi.fn(),
  };
}

type MockRepository = ReturnType<typeof createMockRepository>;

describe('ChatService', () => {
  let repository: MockRepository;
  let service: ChatService;

  beforeEach(() => {
    repository = createMockRepository();
    service = new ChatService(repository as never);
  });

  // セッション一覧テスト / List sessions tests
  describe('listSessions', () => {
    it('returns paginated sessions for workspace member', async () => {
      repository.findWorkspaceMember.mockResolvedValueOnce({ user_id: 1, role: 'owner', workspace_id: 10 });
      repository.listSessionsForWorkspace.mockResolvedValueOnce({
        data: [{ id: 1, title: 'Session A', workspace_id: 10 }],
        total: 1,
      });

      const result = await service.listSessions(10, 1, { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('throws 404 when user is not a workspace member', async () => {
      repository.findWorkspaceMember.mockResolvedValueOnce(null);

      await expect(service.listSessions(10, 99, {})).rejects.toEqual(
        new ServiceError('Workspace not found', 404),
      );
    });
  });

  // セッション作成テスト / Create session tests
  describe('createSession', () => {
    it('creates session with given title', async () => {
      repository.findWorkspaceMember.mockResolvedValueOnce({ user_id: 1, role: 'editor', workspace_id: 10 });
      repository.createSession.mockResolvedValueOnce({ insertId: 55 });
      repository.findSessionById.mockResolvedValueOnce({ id: 55, title: 'My Session', workspace_id: 10 });

      const result = await service.createSession(10, { title: 'My Session' }, 1);

      expect(result.id).toBe(55);
      expect(repository.createSession).toHaveBeenCalledOnce();
    });

    it('generates default title when title not provided', async () => {
      repository.findWorkspaceMember.mockResolvedValueOnce({ user_id: 1, role: 'viewer', workspace_id: 10 });
      repository.createSession.mockResolvedValueOnce({ insertId: 56 });
      repository.findSessionById.mockResolvedValueOnce({ id: 56, title: 'Chat Session', workspace_id: 10 });

      const result = await service.createSession(10, {}, 1);

      expect(result.id).toBe(56);
      expect(repository.createSession).toHaveBeenCalledWith(
        expect.objectContaining({ title: expect.stringContaining('Chat Session') }),
      );
    });

    it('throws 404 when user is not workspace member', async () => {
      repository.findWorkspaceMember.mockResolvedValueOnce(null);

      await expect(service.createSession(10, { title: 'X' }, 99)).rejects.toEqual(
        new ServiceError('Workspace not found', 404),
      );
    });
  });

  // セッション更新テスト / Update session tests
  describe('updateSession', () => {
    it('updates session title for workspace member', async () => {
      repository.findSessionById.mockResolvedValueOnce({ id: 1, workspace_id: 10, user_id: 1 });
      repository.findWorkspaceMember.mockResolvedValueOnce({ user_id: 1, role: 'owner', workspace_id: 10 });
      repository.updateSession.mockResolvedValueOnce(undefined);
      repository.findSessionById.mockResolvedValueOnce({ id: 1, title: 'Updated', workspace_id: 10 });

      const result = await service.updateSession(1, { title: 'Updated' }, 1);

      expect(result.id).toBe(1);
      expect(repository.updateSession).toHaveBeenCalledOnce();
    });

    it('throws 404 when session does not exist', async () => {
      repository.findSessionById.mockResolvedValueOnce(null);

      await expect(service.updateSession(999, { title: 'X' }, 1)).rejects.toEqual(
        new ServiceError('Session not found', 404),
      );
    });

    it('throws 403 when user is not a workspace member', async () => {
      repository.findSessionById.mockResolvedValueOnce({ id: 1, workspace_id: 10, user_id: 2 });
      repository.findWorkspaceMember.mockResolvedValueOnce(null);

      await expect(service.updateSession(1, { title: 'X' }, 99)).rejects.toEqual(
        new ServiceError('Workspace not found', 404),
      );
    });
  });

  // メッセージ送信テスト / Send message tests
  describe('sendMessage', () => {
    it('creates user message and enqueues QUERY job', async () => {
      repository.findSessionById.mockResolvedValueOnce({ id: 1, workspace_id: 10, user_id: 1 });
      repository.findWorkspaceMember.mockResolvedValueOnce({ user_id: 1, role: 'viewer', workspace_id: 10 });
      repository.createMessage.mockResolvedValueOnce({ insertId: 200 });
      repository.createJob.mockResolvedValueOnce({ insertId: 9001 });
      repository.createJobStep.mockResolvedValueOnce({ insertId: 1 });

      const result = await service.sendMessage(1, { content: 'What is the summary?' }, 1);

      expect(result.jobId).toBe(9001);
      expect(repository.createMessage).toHaveBeenCalledWith(expect.objectContaining({ role: 'user', session_id: 1 }));
      expect(repository.createJob).toHaveBeenCalledWith(expect.objectContaining({ type: 'QUERY' }));
    });

    it('throws 404 when session not found', async () => {
      repository.findSessionById.mockResolvedValueOnce(null);

      await expect(service.sendMessage(999, { content: 'test' }, 1)).rejects.toEqual(
        new ServiceError('Session not found', 404),
      );
    });

    it('throws 403 when user has no workspace access', async () => {
      repository.findSessionById.mockResolvedValueOnce({ id: 1, workspace_id: 10, user_id: 1 });
      repository.findWorkspaceMember.mockResolvedValueOnce(null);

      await expect(service.sendMessage(1, { content: 'test' }, 99)).rejects.toEqual(
        new ServiceError('Workspace not found', 404),
      );
    });
  });

  // メッセージ一覧テスト / List messages tests
  describe('listMessages', () => {
    it('returns messages for session member', async () => {
      repository.findSessionById.mockResolvedValueOnce({ id: 1, workspace_id: 10, user_id: 1 });
      repository.findWorkspaceMember.mockResolvedValueOnce({ user_id: 1, role: 'viewer', workspace_id: 10 });
      repository.listMessagesBySession.mockResolvedValueOnce([
        { id: 10, role: 'user', content: 'Hello', session_id: 1 },
        { id: 11, role: 'assistant', content: 'Hi there', session_id: 1 },
      ]);

      const result = await service.listMessages(1, 1);

      expect(result).toHaveLength(2);
    });

    it('throws 404 when session not found', async () => {
      repository.findSessionById.mockResolvedValueOnce(null);

      await expect(service.listMessages(999, 1)).rejects.toEqual(
        new ServiceError('Session not found', 404),
      );
    });
  });
});
