// NotebookLM workspace + member data access via Prisma Client.
// Public API returns snake_case row types to keep the service/controller
// layers unchanged from the previous mysql2-based implementation.
import { prisma } from '../../database/prisma';
import type {
  NotebookLmWorkspaceRow,
  NotebookLmWorkspaceMemberRow,
  NotebookLmDocumentRow,
  NotebookLmJobRow,
  NotebookLmJobStepRow,
  NotebookLmJobDetails,
  NotebookLmUserSearchRow,
  CreateNotebookLmWorkspaceInput,
  UpdateNotebookLmWorkspaceInput,
  NotebookLmUserSearchFilters,
  NotebookLmWorkspaceFilters,
  NotebookLmMemberRole,
  NotebookLmDocumentStatus,
  NotebookLmJobType,
  NotebookLmJobStatus,
} from '../../models/notebooklm.model';

// Minimal subset of mysql2's ResultSetHeader so service code reading
// .insertId continues to work after the Prisma migration.
export interface InsertResult {
  insertId: number;
  affectedRows: number;
}

// Map a Prisma workspace + member document_count to the snake_case row.
function mapWorkspaceWithMember(args: {
  id: number;
  name: string;
  description: string | null;
  ownerId: number;
  createdAt: Date;
  updatedAt: Date;
  role: string;
  document_count: number;
}): NotebookLmWorkspaceRow {
  return {
    id: args.id,
    name: args.name,
    description: args.description,
    owner_id: args.ownerId,
    created_at: args.createdAt,
    updated_at: args.updatedAt,
    role: args.role as NotebookLmMemberRole,
    document_count: args.document_count,
  };
}

// Map a Prisma workspace row alone (no member/doc context) to snake_case.
function mapWorkspaceRow(w: {
  id: number;
  name: string;
  description: string | null;
  ownerId: number;
  createdAt: Date;
  updatedAt: Date;
  document_count?: number;
}): NotebookLmWorkspaceRow {
  return {
    id: w.id,
    name: w.name,
    description: w.description,
    owner_id: w.ownerId,
    created_at: w.createdAt,
    updated_at: w.updatedAt,
    role: undefined,
    document_count: w.document_count,
  };
}

// Map a Prisma member row to the snake_case shape.
function mapMemberRow(m: {
  id: number;
  workspaceId: number;
  userId: number;
  role: string;
  createdAt: Date;
  user_name?: string;
  user_email?: string;
}): NotebookLmWorkspaceMemberRow {
  return {
    id: m.id,
    workspace_id: m.workspaceId,
    user_id: m.userId,
    role: m.role as NotebookLmMemberRole,
    created_at: m.createdAt,
    user_name: m.user_name,
    user_email: m.user_email,
  };
}

// Map a Prisma document row to snake_case.
function mapDocumentRow(d: {
  id: number;
  workspaceId: number;
  uploadedBy: number;
  filename: string;
  mimeType: string;
  fileSize: bigint;
  fileData?: Uint8Array | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): NotebookLmDocumentRow {
  return {
    id: d.id,
    workspace_id: d.workspaceId,
    uploaded_by: d.uploadedBy,
    filename: d.filename,
    mime_type: d.mimeType,
    file_size: Number(d.fileSize),
    // Prisma returns Bytes (Uint8Array); the service treats it as a Buffer
    // when reading. Cast through unknown to satisfy TS strict checks.
    file_data: d.fileData ? (d.fileData as unknown as Buffer) : null,
    status: d.status as NotebookLmDocumentStatus,
    created_at: d.createdAt,
    updated_at: d.updatedAt,
  };
}

// Map a Prisma job row to snake_case.
function mapJobRow(j: {
  id: number;
  type: string;
  status: string;
  payload: unknown;
  retryCount: number;
  maxRetries: number;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}): NotebookLmJobRow {
  return {
    id: j.id,
    type: j.type as NotebookLmJobType,
    status: j.status as NotebookLmJobStatus,
    payload: j.payload,
    retry_count: j.retryCount,
    max_retries: j.maxRetries,
    error_message: j.errorMessage,
    created_at: j.createdAt,
    updated_at: j.updatedAt,
  };
}

// Map a Prisma job_step row to snake_case.
function mapStepRow(s: {
  id: number;
  jobId: number;
  stepName: string;
  status: string;
  progressPct: number;
  detail: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
}): NotebookLmJobStepRow {
  return {
    id: s.id,
    job_id: s.jobId,
    step_name: s.stepName,
    status: s.status as NotebookLmJobStepRow['status'],
    progress_pct: s.progressPct,
    detail: s.detail,
    started_at: s.startedAt,
    finished_at: s.finishedAt,
  };
}

export class NotebookLmRepository {
  // Search active users by name or email.
  async searchUsers(filters: NotebookLmUserSearchFilters): Promise<{
    data: NotebookLmUserSearchRow[];
    total: number;
  }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = {
      status: 'active',
      OR: [{ name: { contains: filters.q } }, { email: { contains: filters.q } }],
    };

    const [rows, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip,
        take: limit,
        select: { id: true, name: true, email: true },
      }),
      prisma.user.count({ where }),
    ]);

    return { data: rows, total };
  }

  // List workspaces a user is a member of, with the member role + document
  // count attached.
  async listWorkspacesForUser(
    userId: number,
    filters: NotebookLmWorkspaceFilters,
  ): Promise<{ data: NotebookLmWorkspaceRow[]; total: number }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const skip = (page - 1) * limit;

    const memberWhere = {
      userId,
      ...(filters.role ? { role: filters.role } : {}),
      ...(filters.search ? { workspace: { name: { contains: filters.search } } } : {}),
    };

    const [memberRows, total] = await Promise.all([
      prisma.workspaceMember.findMany({
        where: memberWhere,
        include: {
          workspace: {
            include: {
              documents: { where: { status: { not: 'deleted' } }, select: { id: true } },
            },
          },
        },
        orderBy: { workspace: { updatedAt: 'desc' } },
        skip,
        take: limit,
      }),
      prisma.workspaceMember.count({ where: memberWhere }),
    ]);

    const data = memberRows.map((m) =>
      mapWorkspaceWithMember({
        id: m.workspace.id,
        name: m.workspace.name,
        description: m.workspace.description,
        ownerId: m.workspace.ownerId,
        createdAt: m.workspace.createdAt,
        updatedAt: m.workspace.updatedAt,
        role: m.role,
        document_count: m.workspace.documents.length,
      }),
    );

    return { data, total };
  }

  // Find a workspace by id for a specific member. Returns null if not a member.
  async findWorkspaceByIdForUser(
    workspaceId: number,
    userId: number,
  ): Promise<NotebookLmWorkspaceRow | null> {
    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId },
      include: {
        workspace: {
          include: {
            documents: { where: { status: { not: 'deleted' } }, select: { id: true } },
          },
        },
      },
    });
    if (!member) return null;
    return mapWorkspaceWithMember({
      id: member.workspace.id,
      name: member.workspace.name,
      description: member.workspace.description,
      ownerId: member.workspace.ownerId,
      createdAt: member.workspace.createdAt,
      updatedAt: member.workspace.updatedAt,
      role: member.role,
      document_count: member.workspace.documents.length,
    });
  }

  // Find a workspace by id (no access check). Includes document count.
  async findWorkspaceById(workspaceId: number): Promise<NotebookLmWorkspaceRow | null> {
    const w = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        documents: { where: { status: { not: 'deleted' } }, select: { id: true } },
      },
    });
    if (!w) return null;
    return mapWorkspaceRow({
      id: w.id,
      name: w.name,
      description: w.description,
      ownerId: w.ownerId,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
      document_count: w.documents.length,
    });
  }

  // Find a workspace by name for a given owner. Used to enforce uniqueness.
  async findWorkspaceByNameForOwner(
    name: string,
    ownerId: number,
    excludeWorkspaceId?: number,
  ): Promise<NotebookLmWorkspaceRow | null> {
    const w = await prisma.workspace.findFirst({
      where: {
        name,
        ownerId,
        ...(excludeWorkspaceId !== undefined ? { id: { not: excludeWorkspaceId } } : {}),
      },
    });
    return w
      ? mapWorkspaceRow({
          id: w.id,
          name: w.name,
          description: w.description,
          ownerId: w.ownerId,
          createdAt: w.createdAt,
          updatedAt: w.updatedAt,
        })
      : null;
  }

  // Create a new workspace. Returns the generated id (wrapped to match the
  // previous ResultSetHeader shape so service code can read .insertId).
  async createWorkspace(
    data: CreateNotebookLmWorkspaceInput & { owner_id: number },
  ): Promise<InsertResult> {
    const created = await prisma.workspace.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        ownerId: data.owner_id,
      },
      select: { id: true },
    });
    return { insertId: created.id, affectedRows: 1 };
  }

  // Update a workspace's name/description.
  async updateWorkspace(workspaceId: number, data: UpdateNotebookLmWorkspaceInput): Promise<InsertResult> {
    const updated = await prisma.workspace.update({
      where: { id: workspaceId },
      data: { name: data.name, description: data.description ?? null },
      select: { id: true },
    });
    return { insertId: updated.id, affectedRows: 1 };
  }

  // Delete a workspace. Cascades to members, documents, sessions.
  async deleteWorkspace(workspaceId: number): Promise<InsertResult> {
    const deleted = await prisma.workspace.delete({
      where: { id: workspaceId },
      select: { id: true },
    });
    return { insertId: deleted.id, affectedRows: 1 };
  }

  // Add a member to a workspace.
  async createWorkspaceMember(data: {
    workspace_id: number;
    user_id: number;
    role: string;
  }): Promise<InsertResult> {
    const created = await prisma.workspaceMember.create({
      data: {
        workspaceId: data.workspace_id,
        userId: data.user_id,
        role: data.role,
      },
      select: { id: true },
    });
    return { insertId: created.id, affectedRows: 1 };
  }

  // Find a single member by workspace + user.
  async findMemberByWorkspaceAndUser(
    workspaceId: number,
    userId: number,
  ): Promise<NotebookLmWorkspaceMemberRow | null> {
    const m = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId },
    });
    return m ? mapMemberRow({ ...m }) : null;
  }

  // List all members of a workspace, joined with the user record. Sort by
  // role priority (owner > editor > viewer) then id asc, to match the
  // FIELD(role, ...) ordering of the previous SQL version.
  async listMembersByWorkspace(workspaceId: number): Promise<NotebookLmWorkspaceMemberRow[]> {
    const rows = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { workspace: { select: { ownerId: true } } },
      orderBy: { id: 'asc' },
    });
    const rolePriority: Record<string, number> = { owner: 0, editor: 1, viewer: 2 };
    return rows
      .map((m) =>
        mapMemberRow({
          id: m.id,
          workspaceId: m.workspaceId,
          userId: m.userId,
          // owner is implicit when the member's user_id matches the workspace owner.
          role: m.userId === m.workspace.ownerId ? 'owner' : m.role,
          createdAt: m.createdAt,
        }),
      )
      .sort((a, b) => {
        const pa = rolePriority[a.role] ?? 99;
        const pb = rolePriority[b.role] ?? 99;
        if (pa !== pb) return pa - pb;
        return a.id - b.id;
      });
  }

  // Update a member's role.
  async updateMemberRole(workspaceId: number, userId: number, role: string): Promise<InsertResult> {
    const updated = await prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId } },
      data: { role },
      select: { id: true },
    });
    return { insertId: updated.id, affectedRows: 1 };
  }

  // Remove a member from a workspace.
  async removeMember(workspaceId: number, userId: number): Promise<InsertResult> {
    const deleted = await prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { id: true },
    });
    return { insertId: deleted.id, affectedRows: 1 };
  }

  // Create a new document. fileData is stored as binary blob.
  async createDocument(data: {
    workspace_id: number;
    uploaded_by: number;
    filename: string;
    mime_type: string;
    file_size: number;
    file_data: Uint8Array;
    status: string;
  }): Promise<InsertResult> {
    const created = await prisma.document.create({
      data: {
        workspaceId: data.workspace_id,
        uploadedBy: data.uploaded_by,
        filename: data.filename,
        mimeType: data.mime_type,
        fileSize: BigInt(data.file_size),
        // Buffer is a Uint8Array under the hood; Prisma's generated types
        // are strict about ArrayBuffer vs ArrayBufferLike so we cast.
        fileData: data.file_data as Uint8Array<ArrayBuffer>,
        status: data.status,
      },
      select: { id: true },
    });
    return { insertId: created.id, affectedRows: 1 };
  }

  // Find a document by id, scoped to a workspace.
  async findDocumentByIdForWorkspace(
    documentId: number,
    workspaceId: number,
  ): Promise<NotebookLmDocumentRow | null> {
    const d = await prisma.document.findFirst({
      where: { id: documentId, workspaceId },
    });
    return d ? mapDocumentRow(d) : null;
  }

  // List documents in a workspace, each with the latest associated job id.
  // The latest job is matched on payload.documentId / payload.document_id;
  // because Prisma cannot express an "OR across JSON paths" filter, the
  // resolution is done in memory by scanning recent jobs in this workspace.
  async listDocumentsByWorkspace(
    workspaceId: number,
  ): Promise<Array<NotebookLmDocumentRow & { latest_job_id: number | null }>> {
    const documents = await prisma.document.findMany({
      where: { workspaceId },
      orderBy: { updatedAt: 'desc' },
    });

    const docIds = documents.map((d) => d.id);
    if (docIds.length === 0) return [];

    // Recent INGEST/DELETE_DOC jobs that target this workspace.
    const recentJobs = await prisma.job.findMany({
      where: { type: { in: ['INGEST', 'DELETE_DOC'] } },
      orderBy: { id: 'desc' },
      take: 200,
      select: { id: true, payload: true },
    });

    const docIdSet = new Set(docIds);
    const latestByDoc = new Map<number, number>();
    for (const j of recentJobs) {
      const p = (j.payload ?? {}) as Record<string, unknown>;
      const target = (p.workspaceId ?? p.workspace_id) as number | undefined;
      if (typeof target !== 'number' || target !== workspaceId) continue;
      const did = (p.documentId ?? p.document_id) as number | undefined;
      if (typeof did !== 'number' || !docIdSet.has(did) || latestByDoc.has(did)) continue;
      latestByDoc.set(did, j.id);
    }

    return documents.map((d) => ({
      ...mapDocumentRow(d),
      latest_job_id: latestByDoc.get(d.id) ?? null,
    }));
  }

  // Insert a background job. payload is JSON.
  async createJob(data: {
    type: string;
    status: string;
    payload: Record<string, unknown>;
    max_retries?: number;
  }): Promise<InsertResult> {
    const created = await prisma.job.create({
      data: {
        type: data.type,
        status: data.status,
        payload: data.payload as any,
        maxRetries: data.max_retries ?? 3,
      },
      select: { id: true },
    });
    return { insertId: created.id, affectedRows: 1 };
  }

  // Insert a job step.
  async createJobStep(data: {
    job_id: number;
    step_name: string;
    status?: string;
    progress_pct?: number;
    detail?: string | null;
  }): Promise<InsertResult> {
    const created = await prisma.jobStep.create({
      data: {
        jobId: data.job_id,
        stepName: data.step_name,
        status: data.status ?? 'pending',
        progressPct: data.progress_pct ?? 0,
        detail: data.detail ?? null,
      },
      select: { id: true },
    });
    return { insertId: created.id, affectedRows: 1 };
  }

  // Find a job with its steps, only if the user is a member of the workspace
  // the job targets (matched via payload.workspaceId / workspace_id).
  async findJobWithStepsByIdForUser(
    jobId: number,
    userId: number,
  ): Promise<NotebookLmJobDetails | null> {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { steps: { orderBy: { id: 'asc' } } },
    });
    if (!job) return null;

    // The previous SQL version extracted workspaceId from the job payload and
    // checked membership. We do the same with Prisma.
    const payload = (job.payload ?? {}) as Record<string, unknown>;
    const workspaceId = (payload.workspaceId ?? payload.workspace_id) as number | undefined;
    if (typeof workspaceId !== 'number') return null;

    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId },
    });
    if (!member) return null;

    return { ...mapJobRow(job), steps: job.steps.map(mapStepRow) };
  }
}
