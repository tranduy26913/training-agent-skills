import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServiceError } from '../../models/common.model';
import { NotebookLmService } from './notebooklm.service';
import type {
  NotebookLmMemberRole,
  NotebookLmWorkspaceMemberRow,
  NotebookLmWorkspaceRow,
} from '../../models/notebooklm.model';

function createMockRepository() {
  return {
    listWorkspacesForUser: vi.fn(),
    findWorkspaceByIdForUser: vi.fn(),
    findWorkspaceById: vi.fn(),
    findWorkspaceByNameForOwner: vi.fn(),
    createWorkspace: vi.fn(),
    createWorkspaceMember: vi.fn(),
    updateWorkspace: vi.fn(),
    deleteWorkspace: vi.fn(),
    createJob: vi.fn(),
    createJobStep: vi.fn(),
    findMemberByWorkspaceAndUser: vi.fn(),
    listMembersByWorkspace: vi.fn(),
    searchUsers: vi.fn(),
    updateMemberRole: vi.fn(),
    removeMember: vi.fn(),
    createDocument: vi.fn(),
    findDocumentByIdForWorkspace: vi.fn(),
    findJobWithStepsByIdForUser: vi.fn(),
  };
}

type MockRepository = ReturnType<typeof createMockRepository>;

type WorkspaceOverride = Partial<{
  id: number;
  name: string;
  description: string | null;
  owner_id: number;
  created_at: Date;
  updated_at: Date;
  role: NotebookLmMemberRole;
  document_count: number;
}>;

type MemberOverride = Partial<{
  id: number;
  workspace_id: number;
  user_id: number;
  role: NotebookLmMemberRole;
  created_at: Date;
  user_name: string;
  user_email: string;
}>;

function mockWorkspace(overrides: WorkspaceOverride = {}): NotebookLmWorkspaceRow {
  return {
    id: 10,
    name: 'Alpha Workspace',
    description: 'Knowledge base',
    owner_id: 100,
    created_at: new Date(),
    updated_at: new Date(),
    role: 'owner',
    document_count: 0,
    ...overrides,
  } as NotebookLmWorkspaceRow;
}

function mockMember(overrides: MemberOverride = {}): NotebookLmWorkspaceMemberRow {
  return {
    id: 1,
    workspace_id: 10,
    user_id: 100,
    role: 'owner',
    created_at: new Date(),
    user_name: 'Admin',
    user_email: 'admin@example.com',
    ...overrides,
  } as NotebookLmWorkspaceMemberRow;
}

describe('NotebookLmService', () => {
  let repository: MockRepository;
  let service: NotebookLmService;
  let dispatchWorker: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    repository = createMockRepository();
    dispatchWorker = vi.fn().mockResolvedValue(undefined);
    service = new NotebookLmService(repository as any, dispatchWorker);
  });

  it('creates workspace and owner membership', async () => {
    const createdWorkspace = mockWorkspace({ id: 55, owner_id: 200, name: 'Project KB' });
    repository.findWorkspaceByNameForOwner.mockResolvedValueOnce(null);
    repository.createWorkspace.mockResolvedValueOnce({ insertId: 55 });
    repository.createWorkspaceMember.mockResolvedValueOnce({ insertId: 101 });
    repository.findWorkspaceByIdForUser.mockResolvedValueOnce(createdWorkspace);

    const result = await service.createWorkspace({ name: 'Project KB', description: 'Docs' }, 200);

    expect(repository.createWorkspace).toHaveBeenCalledWith({
      name: 'Project KB',
      description: 'Docs',
      owner_id: 200,
    });
    expect(repository.createWorkspaceMember).toHaveBeenCalledWith({
      workspace_id: 55,
      user_id: 200,
      role: 'owner',
    });
    expect(result.id).toBe(55);
  });

  it('fails create workspace when owner already has same name', async () => {
    repository.findWorkspaceByNameForOwner.mockResolvedValueOnce(mockWorkspace());

    await expect(
      service.createWorkspace({ name: 'Alpha Workspace', description: 'Dup' }, 100),
    ).rejects.toEqual(new ServiceError('Workspace name already exists', 409));
  });

  it('returns paginated workspace list', async () => {
    repository.listWorkspacesForUser.mockResolvedValueOnce({
      data: [mockWorkspace()],
      total: 1,
    });

    const result = await service.listWorkspaces(100, { page: 1, limit: 10 });

    expect(result.data).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
    expect(result.pagination.pages).toBe(1);
  });

  it('adds member when actor is owner', async () => {
    repository.findMemberByWorkspaceAndUser
      .mockResolvedValueOnce(mockMember({ user_id: 100, role: 'owner' }))
      .mockResolvedValueOnce(null);
    repository.createWorkspaceMember.mockResolvedValueOnce({ insertId: 999 });
    repository.listMembersByWorkspace.mockResolvedValueOnce([
      mockMember({ user_id: 100, role: 'owner' }),
      mockMember({ user_id: 201, role: 'editor' }),
    ]);

    const result = await service.addMember(10, { userId: 201, role: 'editor' }, 100);

    expect(repository.createWorkspaceMember).toHaveBeenCalledWith({
      workspace_id: 10,
      user_id: 201,
      role: 'editor',
    });
    expect(result).toHaveLength(2);
  });

  it('upserts role when target user is already a member', async () => {
    repository.findMemberByWorkspaceAndUser
      .mockResolvedValueOnce(mockMember({ user_id: 100, role: 'owner' }))
      .mockResolvedValueOnce(mockMember({ user_id: 201, role: 'viewer' }));
    repository.updateMemberRole.mockResolvedValueOnce({ affectedRows: 1 });
    repository.listMembersByWorkspace.mockResolvedValueOnce([
      mockMember({ user_id: 100, role: 'owner' }),
      mockMember({ user_id: 201, role: 'editor' }),
    ]);

    const result = await service.addMember(10, { userId: 201, role: 'editor' }, 100);

    expect(repository.updateMemberRole).toHaveBeenCalledWith(10, 201, 'editor');
    expect(repository.createWorkspaceMember).not.toHaveBeenCalled();
    expect(result.find((item) => item.user_id === 201)?.role).toBe('editor');
  });

  it('rejects add member when actor is not owner', async () => {
    repository.findMemberByWorkspaceAndUser.mockResolvedValueOnce(
      mockMember({ user_id: 101, role: 'editor' }),
    );

    await expect(
      service.addMember(10, { userId: 202, role: 'viewer' }, 101),
    ).rejects.toEqual(new ServiceError('Only workspace owner can manage members', 403));
  });

  it('searches users with pagination', async () => {
    repository.searchUsers.mockResolvedValueOnce({
      data: [{ id: 201, name: 'An Nguyen', email: 'an.nguyen@example.com' }],
      total: 1,
    });

    const result = await service.searchUsers({ q: 'an', page: 1, limit: 10 }, 100);

    expect(repository.searchUsers).toHaveBeenCalledWith({ q: 'an', page: 1, limit: 10 });
    expect(result).toEqual({
      data: [{ id: 201, name: 'An Nguyen', email: 'an.nguyen@example.com' }],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        pages: 1,
      },
    });
  });

  it('enqueues INGEST job on upload for editor', async () => {
    repository.findMemberByWorkspaceAndUser.mockResolvedValueOnce(
      mockMember({ user_id: 101, role: 'editor' }),
    );
    repository.createDocument.mockResolvedValueOnce({ insertId: 501 });
    repository.createJob.mockResolvedValueOnce({ insertId: 9001 });
    repository.createJobStep.mockResolvedValueOnce({ insertId: 1 });

    const result = await service.enqueueDocumentIngestion(
      10,
      {
        filename: 'spec.md',
        mimeType: 'text/markdown',
        fileSize: 17,
        fileData: Buffer.from('# test'),
      },
      101,
    );

    expect(result).toEqual({ documentId: 501, jobId: 9001 });
    expect(repository.createJob).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'INGEST', status: 'pending' }),
    );
    expect(dispatchWorker).toHaveBeenCalledWith('INGEST');
  });

  it('enqueues INGEST payload with worker-compatible snake_case keys', async () => {
    repository.findMemberByWorkspaceAndUser.mockResolvedValueOnce(
      mockMember({ user_id: 101, role: 'editor' }),
    );
    repository.createDocument.mockResolvedValueOnce({ insertId: 502 });
    repository.createJob.mockResolvedValueOnce({ insertId: 9003 });
    repository.createJobStep.mockResolvedValue({ insertId: 1 });

    await service.enqueueDocumentIngestion(
      10,
      {
        filename: 'doc.txt',
        mimeType: 'text/plain',
        fileSize: 10,
        fileData: Buffer.from('content'),
      },
      101,
    );

    expect(repository.createJob).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'INGEST',
        payload: expect.objectContaining({
          document_id: 502,
          workspace_id: 10,
          requested_by: 101,
          mime_type: 'text/plain',
        }),
      }),
    );
  });

  it('forbids upload for viewer role', async () => {
    repository.findMemberByWorkspaceAndUser.mockResolvedValueOnce(
      mockMember({ user_id: 102, role: 'viewer' }),
    );

    await expect(
      service.enqueueDocumentIngestion(
        10,
        {
          filename: 'blocked.pdf',
          mimeType: 'application/pdf',
          fileSize: 100,
          fileData: Buffer.from('x'),
        },
        102,
      ),
    ).rejects.toEqual(new ServiceError('Insufficient permissions', 403));
  });

  it('enqueues DELETE_DOC job for editor', async () => {
    repository.findMemberByWorkspaceAndUser.mockResolvedValueOnce(
      mockMember({ user_id: 103, role: 'editor' }),
    );
    repository.findDocumentByIdForWorkspace.mockResolvedValueOnce({ id: 77, workspace_id: 10 });
    repository.createJob.mockResolvedValueOnce({ insertId: 9002 });
    repository.createJobStep.mockResolvedValueOnce({ insertId: 2 });

    const result = await service.enqueueDocumentDeletion(10, 77, 103);

    expect(result).toEqual({ jobId: 9002 });
    expect(repository.createJob).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'DELETE_DOC', status: 'pending' }),
    );
    expect(dispatchWorker).toHaveBeenCalledWith('DELETE_DOC');
  });

  it('enqueues DELETE_DOC payload with worker-compatible snake_case keys', async () => {
    repository.findMemberByWorkspaceAndUser.mockResolvedValueOnce(
      mockMember({ user_id: 103, role: 'editor' }),
    );
    repository.findDocumentByIdForWorkspace.mockResolvedValueOnce({ id: 78, workspace_id: 10 });
    repository.createJob.mockResolvedValueOnce({ insertId: 9004 });
    repository.createJobStep.mockResolvedValueOnce({ insertId: 2 });

    await service.enqueueDocumentDeletion(10, 78, 103);

    expect(repository.createJob).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'DELETE_DOC',
        payload: expect.objectContaining({
          document_id: 78,
          workspace_id: 10,
          requested_by: 103,
        }),
      }),
    );
  });

  it('forbids document delete for viewer role', async () => {
    repository.findMemberByWorkspaceAndUser.mockResolvedValueOnce(
      mockMember({ user_id: 104, role: 'viewer' }),
    );

    await expect(service.enqueueDocumentDeletion(10, 77, 104)).rejects.toEqual(
      new ServiceError('Insufficient permissions', 403),
    );
  });

  it('returns job status with steps for authorized user', async () => {
    repository.findJobWithStepsByIdForUser.mockResolvedValueOnce({
      id: 9001,
      type: 'INGEST',
      status: 'processing',
      payload: { workspaceId: 10 },
      retry_count: 0,
      max_retries: 3,
      error_message: null,
      created_at: new Date(),
      updated_at: new Date(),
      steps: [
        {
          id: 1,
          job_id: 9001,
          step_name: 'parse',
          status: 'done',
          progress_pct: 100,
          detail: null,
          started_at: new Date(),
          finished_at: new Date(),
        },
      ],
    });

    const result = await service.getJobStatus(9001, 100);

    expect(result.id).toBe(9001);
    expect(result.steps).toHaveLength(1);
  });

  it('rejects unknown job', async () => {
    repository.findJobWithStepsByIdForUser.mockResolvedValueOnce(null);

    await expect(service.getJobStatus(9999, 100)).rejects.toEqual(new ServiceError('Job not found', 404));
  });

  it('updates member role when actor is owner', async () => {
    repository.findMemberByWorkspaceAndUser
      .mockResolvedValueOnce(mockMember({ user_id: 100, role: 'owner' }))
      .mockResolvedValueOnce(mockMember({ user_id: 201, role: 'viewer' }));
    repository.updateMemberRole.mockResolvedValueOnce({ affectedRows: 1 });
    repository.listMembersByWorkspace.mockResolvedValueOnce([
      mockMember({ user_id: 100, role: 'owner' }),
      mockMember({ user_id: 201, role: 'editor' as NotebookLmMemberRole }),
    ]);

    const members = await service.updateMemberRole(10, 201, 'editor', 100);

    expect(members.find((m) => m.user_id === 201)?.role).toBe('editor');
  });

  it('deletes workspace immediately for owner', async () => {
    repository.findMemberByWorkspaceAndUser.mockResolvedValueOnce(
      mockMember({ user_id: 100, role: 'owner' }),
    );
    repository.findWorkspaceById.mockResolvedValueOnce(mockWorkspace({ id: 10 }));
    repository.deleteWorkspace.mockResolvedValueOnce({ affectedRows: 1 });

    const result = await service.deleteWorkspace(10, 100);

    expect(result).toEqual({ deleted: true });
    expect(repository.deleteWorkspace).toHaveBeenCalledWith(10);
  });
});
