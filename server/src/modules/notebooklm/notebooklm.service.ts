import { ServiceError } from '../../models/common.model';
import type {
  AddNotebookLmMemberInput,
  NotebookLmJobDetails,
  NotebookLmMemberRole,
  NotebookLmWorkspaceFilters,
  NotebookLmWorkspaceMemberRow,
  NotebookLmWorkspaceRow,
  UpdateNotebookLmWorkspaceInput,
  UploadNotebookLmDocumentInput,
} from '../../models/notebooklm.model';
import { NotebookLmRepository } from './notebooklm.repository';
import type { CreateWorkspaceInput } from './notebooklm.validation';

export { ServiceError };

export class NotebookLmService {
  private repository: NotebookLmRepository;

  constructor(repository?: NotebookLmRepository) {
    this.repository = repository ?? new NotebookLmRepository();
  }

  private async getMemberOrThrow(workspaceId: number, userId: number): Promise<NotebookLmWorkspaceMemberRow> {
    const member = await this.repository.findMemberByWorkspaceAndUser(workspaceId, userId);
    if (!member) {
      throw new ServiceError('Workspace not found', 404);
    }
    return member;
  }

  private ensureOwner(role: NotebookLmMemberRole): void {
    if (role !== 'owner') {
      throw new ServiceError('Only workspace owner can manage members', 403);
    }
  }

  private ensureEditorOrOwner(role: NotebookLmMemberRole): void {
    if (role === 'viewer') {
      throw new ServiceError('Insufficient permissions', 403);
    }
  }

  async listWorkspaces(userId: number, filters: NotebookLmWorkspaceFilters) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const { data, total } = await this.repository.listWorkspacesForUser(userId, filters);

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

  async createWorkspace(input: CreateWorkspaceInput, userId: number): Promise<NotebookLmWorkspaceRow> {
    const duplicate = await this.repository.findWorkspaceByNameForOwner(input.name, userId);
    if (duplicate) {
      throw new ServiceError('Workspace name already exists', 409);
    }

    const workspaceResult = await this.repository.createWorkspace({
      name: input.name,
      description: input.description ?? null,
      owner_id: userId,
    });

    await this.repository.createWorkspaceMember({
      workspace_id: workspaceResult.insertId,
      user_id: userId,
      role: 'owner',
    });

    const created = await this.repository.findWorkspaceByIdForUser(workspaceResult.insertId, userId);
    if (!created) {
      throw new ServiceError('Workspace not found', 404);
    }

    return created;
  }

  async getWorkspace(workspaceId: number, userId: number): Promise<NotebookLmWorkspaceRow> {
    const workspace = await this.repository.findWorkspaceByIdForUser(workspaceId, userId);
    if (!workspace) {
      throw new ServiceError('Workspace not found', 404);
    }
    return workspace;
  }

  async updateWorkspace(
    workspaceId: number,
    input: UpdateNotebookLmWorkspaceInput,
    userId: number,
  ): Promise<NotebookLmWorkspaceRow> {
    const member = await this.getMemberOrThrow(workspaceId, userId);
    this.ensureEditorOrOwner(member.role);

    const duplicate = await this.repository.findWorkspaceByNameForOwner(input.name, member.user_id, workspaceId);
    if (duplicate) {
      throw new ServiceError('Workspace name already exists', 409);
    }

    await this.repository.updateWorkspace(workspaceId, {
      name: input.name,
      description: input.description ?? null,
    });

    return this.getWorkspace(workspaceId, userId);
  }

  async deleteWorkspace(workspaceId: number, userId: number): Promise<{ jobId: number }> {
    const member = await this.getMemberOrThrow(workspaceId, userId);
    this.ensureOwner(member.role);

    const workspace = await this.repository.findWorkspaceById(workspaceId);
    if (!workspace) {
      throw new ServiceError('Workspace not found', 404);
    }

    const job = await this.repository.createJob({
      type: 'DELETE_WORKSPACE',
      status: 'pending',
      payload: {
        workspaceId,
        requestedBy: userId,
      },
    });

    await this.repository.createJobStep({
      job_id: job.insertId,
      step_name: 'delete_workspace',
      status: 'pending',
      progress_pct: 0,
    });

    return { jobId: job.insertId };
  }

  async listMembers(workspaceId: number, userId: number): Promise<NotebookLmWorkspaceMemberRow[]> {
    await this.getMemberOrThrow(workspaceId, userId);
    return this.repository.listMembersByWorkspace(workspaceId);
  }

  async addMember(
    workspaceId: number,
    input: AddNotebookLmMemberInput,
    userId: number,
  ): Promise<NotebookLmWorkspaceMemberRow[]> {
    const actor = await this.getMemberOrThrow(workspaceId, userId);
    this.ensureOwner(actor.role);

    const existing = await this.repository.findMemberByWorkspaceAndUser(workspaceId, input.userId);
    if (existing) {
      throw new ServiceError('User is already a workspace member', 409);
    }

    await this.repository.createWorkspaceMember({
      workspace_id: workspaceId,
      user_id: input.userId,
      role: input.role,
    });

    return this.repository.listMembersByWorkspace(workspaceId);
  }

  async updateMemberRole(
    workspaceId: number,
    memberUserId: number,
    role: NotebookLmMemberRole,
    userId: number,
  ): Promise<NotebookLmWorkspaceMemberRow[]> {
    const actor = await this.getMemberOrThrow(workspaceId, userId);
    this.ensureOwner(actor.role);

    const target = await this.getMemberOrThrow(workspaceId, memberUserId);
    if (target.role === 'owner' && role !== 'owner') {
      throw new ServiceError('Owner role cannot be changed', 400);
    }

    await this.repository.updateMemberRole(workspaceId, memberUserId, role);
    return this.repository.listMembersByWorkspace(workspaceId);
  }

  async removeMember(workspaceId: number, memberUserId: number, userId: number): Promise<void> {
    const actor = await this.getMemberOrThrow(workspaceId, userId);
    this.ensureOwner(actor.role);

    const target = await this.getMemberOrThrow(workspaceId, memberUserId);
    if (target.role === 'owner') {
      throw new ServiceError('Owner cannot be removed from workspace', 400);
    }

    await this.repository.removeMember(workspaceId, memberUserId);
  }

  async listDocuments(workspaceId: number, userId: number) {
    await this.getMemberOrThrow(workspaceId, userId);
    return this.repository.listDocumentsByWorkspace(workspaceId);
  }

  async enqueueDocumentIngestion(
    workspaceId: number,
    input: UploadNotebookLmDocumentInput,
    userId: number,
  ): Promise<{ documentId: number; jobId: number }> {
    const member = await this.getMemberOrThrow(workspaceId, userId);
    this.ensureEditorOrOwner(member.role);

    const documentResult = await this.repository.createDocument({
      workspace_id: workspaceId,
      uploaded_by: userId,
      filename: input.filename,
      mime_type: input.mimeType,
      file_size: input.fileSize,
      file_data: input.fileData,
      status: 'pending',
    });

    const documentId = documentResult.insertId;
    const jobResult = await this.repository.createJob({
      type: 'INGEST',
      status: 'pending',
      payload: {
        workspaceId,
        documentId,
        requestedBy: userId,
        mimeType: input.mimeType,
      },
    });

    const stepNames = ['parse', 'chunk', 'embed', 'index'];
    for (const stepName of stepNames) {
      await this.repository.createJobStep({
        job_id: jobResult.insertId,
        step_name: stepName,
        status: 'pending',
        progress_pct: 0,
      });
    }

    return {
      documentId,
      jobId: jobResult.insertId,
    };
  }

  async enqueueDocumentDeletion(
    workspaceId: number,
    documentId: number,
    userId: number,
  ): Promise<{ jobId: number }> {
    const member = await this.getMemberOrThrow(workspaceId, userId);
    this.ensureEditorOrOwner(member.role);

    const document = await this.repository.findDocumentByIdForWorkspace(documentId, workspaceId);
    if (!document || document.status === 'deleted') {
      throw new ServiceError('Document not found', 404);
    }

    const jobResult = await this.repository.createJob({
      type: 'DELETE_DOC',
      status: 'pending',
      payload: {
        workspaceId,
        documentId,
        requestedBy: userId,
      },
    });

    await this.repository.createJobStep({
      job_id: jobResult.insertId,
      step_name: 'delete_document',
      status: 'pending',
      progress_pct: 0,
    });

    return { jobId: jobResult.insertId };
  }

  async getJobStatus(jobId: number, userId: number): Promise<NotebookLmJobDetails> {
    const job = await this.repository.findJobWithStepsByIdForUser(jobId, userId);
    if (!job) {
      throw new ServiceError('Job not found', 404);
    }
    return job;
  }
}
