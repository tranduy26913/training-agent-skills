import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useNotebooklmWorkspaceStore } from '../notebooklm-workspace.store';
import type { PaginatedData } from '@/types/api.types';
import type {
  Workspace,
  WorkspaceDocument,
  WorkspaceJobProgress,
  WorkspaceMember,
  WorkspaceMemberCandidate,
} from '@/types/notebooklm.types';

const serviceMocks = vi.hoisted(() => ({
  getWorkspaces: vi.fn(),
  getWorkspace: vi.fn(),
  createWorkspace: vi.fn(),
  updateWorkspace: vi.fn(),
  deleteWorkspace: vi.fn(),
  getWorkspaceDocuments: vi.fn(),
  uploadDocument: vi.fn(),
  deleteDocument: vi.fn(),
  getJobProgress: vi.fn(),
  searchWorkspaceCandidateUsers: vi.fn(),
  addOrUpdateWorkspaceMember: vi.fn(),
}));

vi.mock('@/services/notebooklm-workspace.service', () => ({
  notebooklmWorkspaceService: serviceMocks,
}));

describe('useNotebooklmWorkspaceStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('loads workspace list into state', async () => {
    const result: PaginatedData<Workspace> = {
      data: [
        {
          id: 1,
          name: 'Alpha',
          description: 'Main workspace',
          role: 'owner',
          documentCount: 2,
          status: 'active',
          createdAt: '2026-05-07T08:00:00.000Z',
          updatedAt: '2026-05-07T08:00:00.000Z',
        },
      ],
      pagination: { page: 1, limit: 10, total: 1, pages: 1 },
    };
    serviceMocks.getWorkspaces.mockResolvedValue(result);

    const store = useNotebooklmWorkspaceStore();
    await store.fetchItems({ page: 1, limit: 10 });

    expect(store.items).toHaveLength(1);
    expect(store.pagination.total).toBe(1);
    expect(serviceMocks.getWorkspaces).toHaveBeenCalledOnce();
  });

  it('rejects upload when file type is unsupported', async () => {
    const store = useNotebooklmWorkspaceStore();
    const invalidFile = new File(['a'], 'notes.exe', { type: 'application/x-msdownload' });

    await expect(store.uploadDocument(1, invalidFile)).rejects.toThrow('Unsupported file type');
  });

  it('rejects upload when workspace role is viewer', async () => {
    const store = useNotebooklmWorkspaceStore();
    store.currentItem = {
      id: 2,
      name: 'Read-only',
      description: null,
      role: 'viewer',
      documentCount: 0,
      status: 'active',
      createdAt: '2026-05-07T08:00:00.000Z',
      updatedAt: '2026-05-07T08:00:00.000Z',
    };

    const file = new File(['hello'], 'notes.txt', { type: 'text/plain' });

    await expect(store.uploadDocument(2, file)).rejects.toThrow('You do not have permission to upload documents');
  });

  it('polls and stores job progress until done', async () => {
    const store = useNotebooklmWorkspaceStore();

    const processing: WorkspaceJobProgress = {
      jobId: 9001,
      status: 'processing',
      steps: [
        { name: 'parse', status: 'done' },
        { name: 'chunk', status: 'running' },
      ],
      updatedAt: '2026-05-07T08:00:00.000Z',
    };

    const done: WorkspaceJobProgress = {
      ...processing,
      status: 'done',
      steps: [
        { name: 'parse', status: 'done' },
        { name: 'chunk', status: 'done' },
        { name: 'embed', status: 'done' },
      ],
    };

    serviceMocks.getJobProgress
      .mockResolvedValueOnce(processing)
      .mockResolvedValueOnce(done);

    const finalProgress = await store.pollJobUntilSettled(9001, {
      intervalMs: 1,
      maxAttempts: 3,
    });

    expect(finalProgress.status).toBe('done');
    expect(store.jobProgressById[9001]?.status).toBe('done');
    expect(serviceMocks.getJobProgress).toHaveBeenCalledTimes(2);
  });

  it('searches candidate users by keyword and stores results', async () => {
    const store = useNotebooklmWorkspaceStore();
    const candidates: WorkspaceMemberCandidate[] = [
      {
        id: 99,
        name: 'Jane Doe',
        email: 'jane@example.com',
      },
    ];
    serviceMocks.searchWorkspaceCandidateUsers.mockResolvedValue(candidates);

    await store.searchCandidateUsers(15, 'jane');

    expect(serviceMocks.searchWorkspaceCandidateUsers).toHaveBeenCalledWith(15, 'jane', 1, 10);
    expect(store.memberCandidates).toEqual(candidates);
  });

  it('adds a new member to state when user is not in member list', async () => {
    const store = useNotebooklmWorkspaceStore();
    const createdMember: WorkspaceMember = {
      id: 501,
      userId: 44,
      role: 'editor',
      name: 'Editor User',
      email: 'editor@example.com',
    };
    serviceMocks.addOrUpdateWorkspaceMember.mockResolvedValue(createdMember);

    const result = await store.addOrUpdateMember(15, 44, 'editor');

    expect(serviceMocks.addOrUpdateWorkspaceMember).toHaveBeenCalledWith(15, 44, 'editor');
    expect(result).toEqual(createdMember);
    expect(store.members).toEqual([createdMember]);
  });

  it('upserts role in state when member already exists', async () => {
    const store = useNotebooklmWorkspaceStore();
    store.members = [
      {
        id: 777,
        userId: 44,
        role: 'viewer',
        name: 'Member User',
        email: 'member@example.com',
      },
    ];

    const updatedMember: WorkspaceMember = {
      id: 777,
      userId: 44,
      role: 'editor',
      name: 'Member User',
      email: 'member@example.com',
    };
    serviceMocks.addOrUpdateWorkspaceMember.mockResolvedValue(updatedMember);

    await store.addOrUpdateMember(15, 44, 'editor');

    expect(store.members).toHaveLength(1);
    expect(store.members[0].role).toBe('editor');
  });
});
