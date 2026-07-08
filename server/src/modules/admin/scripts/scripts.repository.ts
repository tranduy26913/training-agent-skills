import { prisma } from '@database/prisma';
import type { Prisma } from '@prisma/client';

export const SCRIPT_PUBLIC_SELECT = {
  id: true,
  title: true,
  idea: true,
  characterCount: true,
  minScenes: true,
  vibe: true,
  content: true,
  status: true,
  projectId: true,
  ownerId: true,
  isDeleted: true,
  createdAt: true,
  updatedAt: true,
  project: {
    select: { name: true },
  },
  owner: {
    select: { name: true },
  },
} as const;

export type ScriptRow = Prisma.ScriptGetPayload<{ select: typeof SCRIPT_PUBLIC_SELECT }>;

export class ScriptsRepository {
  findByProject(projectId: number) {
    return prisma.script.findMany({
      where: { projectId, isDeleted: false },
      orderBy: { updatedAt: 'desc' },
      select: SCRIPT_PUBLIC_SELECT,
    });
  }

  findById(id: number) {
    return prisma.script.findFirst({
      where: { id, isDeleted: false },
      select: SCRIPT_PUBLIC_SELECT,
    });
  }

  findProject(id: number) {
    return prisma.project.findFirst({
      where: { id, isDeleted: false },
      select: { id: true },
    });
  }

  create(data: Prisma.ScriptCreateInput) {
    return prisma.script.create({
      data,
      select: { id: true },
    });
  }

  update(id: number, data: Prisma.ScriptUpdateInput) {
    return prisma.script.updateMany({
      where: { id, isDeleted: false },
      data,
    });
  }

  softDelete(id: number) {
    return prisma.script.updateMany({
      where: { id, isDeleted: false },
      data: { isDeleted: true },
    });
  }

  createAuditLog(entry: {
    adminId: number;
    targetUserId: number;
    action: string;
    changedFields?: Record<string, unknown> | null;
  }) {
    return prisma.auditLog.create({
      data: {
        adminId: entry.adminId,
        targetUserId: entry.targetUserId,
        action: entry.action,
        changedFields: (entry.changedFields ?? undefined) as Prisma.InputJsonValue,
      },
    });
  }
}
