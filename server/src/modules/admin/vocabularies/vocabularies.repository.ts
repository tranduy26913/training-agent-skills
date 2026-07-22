import { prisma } from '@database/prisma';
import type { Prisma } from '@prisma/client';

export const VOCABULARY_PUBLIC_SELECT = {
  id: true,
  slug: true,
  kanji: true,
  hiragana: true,
  romaji: true,
  meaningVi: true,
  onYomi: true,
  level: true,
  mediaUrl: true,
  note: true,
  example: true,
  tags: true,
  status: true,
  createdById: true,
  updatedById: true,
  version: true,
  learnCount: true,
  favoriteCount: true,
  reportCount: true,
  isDeleted: true,
  createdAt: true,
  updatedAt: true,
  createdBy: {
    select: { name: true },
  },
  updatedBy: {
    select: { name: true },
  },
} as const;

export type VocabularyRow = Prisma.VocabularyGetPayload<{ select: typeof VOCABULARY_PUBLIC_SELECT }>;

export interface VocabularyFilters {
  search?: string;
  level?: string;
  status?: string;
}

export class VocabulariesRepository {
  findAll(filters: VocabularyFilters = {}) {
    const where: Prisma.VocabularyWhereInput = { isDeleted: false };

    if (filters.level) {
      where.level = filters.level;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const search = filters.search?.trim();
    if (search) {
      where.OR = [
        { kanji: { contains: search } },
        { hiragana: { contains: search } },
        { romaji: { contains: search } },
        { meaningVi: { contains: search } },
        { onYomi: { contains: search } },
      ];
    }

    return prisma.vocabulary.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      select: VOCABULARY_PUBLIC_SELECT,
    });
  }

  findById(id: number) {
    return prisma.vocabulary.findFirst({
      where: { id, isDeleted: false },
      select: VOCABULARY_PUBLIC_SELECT,
    });
  }

  create(data: Prisma.VocabularyCreateInput) {
    return prisma.vocabulary.create({
      data,
      select: { id: true },
    });
  }

  update(id: number, data: Prisma.VocabularyUpdateInput) {
    return prisma.vocabulary.updateMany({
      where: { id, isDeleted: false },
      data,
    });
  }

  softDelete(id: number) {
    return prisma.vocabulary.updateMany({
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
