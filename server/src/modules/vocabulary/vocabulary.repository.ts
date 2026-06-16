// Vocabulary repository backed by Prisma Client.
// Public API mirrors the previous mysql2-based implementation so the service
// layer does not need to change.
import { prisma } from '../../database/prisma';
import type { Prisma } from '@prisma/client';
import {
  VocabularyStatus,
  VocabRelationType,
} from '../../models/vocabularies.model';
import type {
  VocabularyRow,
  VocabRelationDto,
  VocabChangeLogDto,
  VocabReportDto,
  VocabularyResponse,
  VocabularyFilter,
  PaginationParams,
  VocabularyListResponse,
  CreateVocabularyDto,
  UpdateVocabularyDto,
} from '../../models/vocabularies.model';

// Whitelist of sortable columns.
const ALLOWED_SORT_FIELDS: Record<string, Prisma.VocabularyOrderByWithRelationInput> = {
  id: { id: 'asc' },
  kanji: { kanji: 'asc' },
  level: { level: 'asc' },
  created_at: { createdAt: 'asc' },
  updated_at: { updatedAt: 'asc' },
};

// Build a Prisma where clause from the request filters.
function buildWhereClause(filters: VocabularyFilter): Prisma.VocabularyWhereInput {
  const where: Prisma.VocabularyWhereInput = {
    status: { not: VocabularyStatus.Delete },
  };

  if (filters.kanji) {
    where.kanji = { contains: filters.kanji };
  }
  if (filters.level) {
    where.level = filters.level;
  }
  if (filters.status) {
    where.status = filters.status;
  }
  // tags is JSON; filter by containment using array_contains.
  if (filters.tag) {
    where.tags = { array_contains: [filters.tag] };
  }
  if (filters.createdBy !== undefined) {
    where.createdBy = filters.createdBy;
  }
  return where;
}

// Map a Prisma vocabulary row to the API snake-case shape used by the service.
function mapToRow(v: {
  id: number;
  kanji: string;
  hiragana: string | null;
  romaji: string | null;
  meaningVi: string;
  onYomi: string | null;
  level: string | null;
  mediaUrl: string | null;
  note: string | null;
  tags: unknown;
  status: string;
  learnCount: number;
  favoriteCount: number;
  createdBy: number | null;
  updatedBy: number | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}): VocabularyRow {
  return {
    id: v.id,
    kanji: v.kanji,
    hiragana: v.hiragana,
    romaji: v.romaji,
    meaning_vi: v.meaningVi,
    on_yomi: v.onYomi,
    level: v.level as VocabularyRow['level'],
    media_url: v.mediaUrl,
    note: v.note,
    tags: Array.isArray(v.tags) ? (v.tags as string[]) : null,
    status: v.status as VocabularyStatus,
    learn_count: v.learnCount,
    favorite_count: v.favoriteCount,
    created_by: v.createdBy,
    updated_by: v.updatedBy,
    version: v.version,
    created_at: v.createdAt,
    updated_at: v.updatedAt,
  };
}

const VOCAB_SELECT = {
  id: true,
  kanji: true,
  hiragana: true,
  romaji: true,
  meaningVi: true,
  onYomi: true,
  level: true,
  mediaUrl: true,
  note: true,
  tags: true,
  status: true,
  learnCount: true,
  favoriteCount: true,
  createdBy: true,
  updatedBy: true,
  version: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class VocabularyRepository {
  // Find a vocabulary by id (including soft-deleted rows).
  async findById(id: number): Promise<VocabularyRow | null> {
    const v = await prisma.vocabulary.findUnique({
      where: { id },
      select: VOCAB_SELECT,
    });
    return v ? mapToRow(v) : null;
  }

  // Find all vocabularies with filters and pagination.
  async findAllWithFilters(
    filters: VocabularyFilter,
    pagination: PaginationParams,
  ): Promise<VocabularyListResponse> {
    const where = buildWhereClause(filters);
    const page = pagination.page || 1;
    const limit = Math.min(pagination.limit || 20, 100);
    const skip = (page - 1) * limit;

    const orderBy = ALLOWED_SORT_FIELDS[pagination.sort || 'created_at']
      ?? { createdAt: 'desc' as const };
    if (pagination.order === 'asc') {
      const key = Object.keys(orderBy)[0] as keyof Prisma.VocabularyOrderByWithRelationInput;
      (orderBy as any)[key] = 'asc';
    }

    const [rows, total] = await Promise.all([
      prisma.vocabulary.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: VOCAB_SELECT,
      }),
      prisma.vocabulary.count({ where }),
    ]);

    const data = rows.map((r) => mapToResponse(mapToRow(r)));
    return {
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  // Find vocabulary by id with relations, change logs, and reports.
  async findByIdWithDetails(id: number) {
    const v = await prisma.vocabulary.findUnique({
      where: { id },
      select: VOCAB_SELECT,
    });
    if (!v || v.status === VocabularyStatus.Delete) {
      return null;
    }

    const [relationRows, logRows, reportRows] = await Promise.all([
      prisma.vocabRelation.findMany({
        where: { vocabId: id },
        include: {
          target: { select: { id: true, kanji: true, hiragana: true, romaji: true, level: true } },
        },
      }),
      prisma.vocabChangeLog.findMany({
        where: { vocabId: id },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.vocabReport.findMany({
        where: { vocabId: id },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const relations: {
      related: VocabRelationDto[];
      synonyms: VocabRelationDto[];
      antonyms: VocabRelationDto[];
    } = { related: [], synonyms: [], antonyms: [] };

    for (const r of relationRows) {
      const dto: VocabRelationDto = {
        id: r.target.id,
        kanji: r.target.kanji,
        hiragana: r.target.hiragana,
        romaji: r.target.romaji,
        level: r.target.level as VocabRelationDto['level'],
      };
      if (r.relationType === VocabRelationType.Related) relations.related.push(dto);
      else if (r.relationType === VocabRelationType.Synonym) relations.synonyms.push(dto);
      else if (r.relationType === VocabRelationType.Antonym) relations.antonyms.push(dto);
    }

    const changeLogs: VocabChangeLogDto[] = logRows.map((row) => ({
      id: row.id,
      field_name: row.fieldName,
      old_value: row.oldValue,
      new_value: row.newValue,
      changed_by: row.changedBy ?? 0,
      change_reason: row.changeReason,
      created_at: row.createdAt,
    }));

    const reports: VocabReportDto[] = reportRows.map((row) => ({
      id: row.id,
      report_text: row.reportText,
      status: row.status as VocabReportDto['status'],
      reported_by: row.reportedBy,
      resolved_by: row.resolvedBy,
      resolved_at: row.resolvedAt,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    }));

    return {
      vocabulary: mapToResponse(mapToRow(v)),
      relations,
      changeLogs,
      reports,
    };
  }

  // Create a new vocabulary with relations in a single transaction.
  async create(data: CreateVocabularyDto, userId: number): Promise<number> {
    return prisma.$transaction(async (tx) => {
      const created = await tx.vocabulary.create({
        data: {
          kanji: data.kanji,
          hiragana: data.hiragana ?? null,
          romaji: data.romaji ?? null,
          meaningVi: data.meaning_vi,
          onYomi: data.on_yomi ?? null,
          level: data.level ?? null,
          mediaUrl: data.media_url ?? null,
          note: data.note ?? null,
          tags: data.tags ?? undefined,
          status: data.status ?? VocabularyStatus.Publish,
          createdBy: userId,
          updatedBy: userId,
          version: 1,
        },
        select: { id: true },
      });

      if (data.relations) {
        await this.insertRelations(tx, created.id, data.relations);
      }

      return created.id;
    });
  }

  // Update vocabulary fields, create change logs, and replace relations.
  async update(
    id: number,
    data: UpdateVocabularyDto,
    userId: number,
    changeReason?: string,
  ): Promise<void> {
    const current = await this.findById(id);
    if (!current) {
      throw new Error('Vocabulary not found');
    }

    await prisma.$transaction(async (tx) => {
      // Build the patch dynamically based on which fields are provided.
      // Prisma's UpdateInput does not accept bare `null` for nullable text
      // fields, so we use the `set` operator wrapper.
      const patch: Record<string, unknown> = { updatedBy: userId };
      if (data.kanji !== undefined) {
        patch.kanji = data.kanji === null ? { set: null } : data.kanji;
      }
      if (data.hiragana !== undefined) {
        patch.hiragana = data.hiragana === null ? { set: null } : data.hiragana;
      }
      if (data.romaji !== undefined) {
        patch.romaji = data.romaji === null ? { set: null } : data.romaji;
      }
      if (data.meaning_vi !== undefined) {
        patch.meaningVi = data.meaning_vi === null ? { set: null } : data.meaning_vi;
      }
      if (data.on_yomi !== undefined) {
        patch.onYomi = data.on_yomi === null ? { set: null } : data.on_yomi;
      }
      if (data.level !== undefined) {
        patch.level = data.level === null ? { set: null } : data.level;
      }
      if (data.media_url !== undefined) {
        patch.mediaUrl = data.media_url === null ? { set: null } : data.media_url;
      }
      if (data.note !== undefined) {
        patch.note = data.note === null ? { set: null } : data.note;
      }
      if (data.tags !== undefined) {
        patch.tags = data.tags === null ? { set: null } : data.tags;
      }
      if (data.status !== undefined) {
        patch.status = data.status === null ? { set: null } : data.status;
      }

      await tx.vocabulary.update({
        where: { id },
        data: {
          ...patch,
          // Increment version atomically.
          version: { increment: 1 },
        },
      });

      // Write change logs for the fields that actually changed.
      await this.writeChangeLogs(tx, id, current, data, userId, changeReason);

      // Replace relations wholesale if provided.
      if (data.relations) {
        await tx.vocabRelation.deleteMany({ where: { vocabId: id } });
        await this.insertRelations(tx, id, data.relations);
      }
    });
  }

  // Soft delete: set status to 'Delete'.
  async softDelete(id: number, userId: number): Promise<void> {
    await prisma.vocabulary.update({
      where: { id },
      data: { status: VocabularyStatus.Delete, updatedBy: userId },
    });
  }

  // Vocabulary options for the relation MultiSelect (excludes soft-deleted and
  // optionally the supplied ids).
  async findRelationOptions(excludeIds: number[] = []): Promise<VocabRelationDto[]> {
    const rows = await prisma.vocabulary.findMany({
      where: {
        status: { not: VocabularyStatus.Delete },
        ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
      },
      orderBy: { kanji: 'asc' },
      select: { id: true, kanji: true, hiragana: true, romaji: true, level: true },
    });
    return rows.map((r) => ({
      id: r.id,
      kanji: r.kanji,
      hiragana: r.hiragana,
      romaji: r.romaji,
      level: r.level as VocabRelationDto['level'],
    }));
  }

  // Resolve a report by id.
  async resolveReport(
    reportId: number,
    status: 'resolved' | 'dismissed',
    adminId: number,
  ): Promise<boolean> {
    try {
      await prisma.vocabReport.update({
        where: { id: reportId },
        data: { status, resolvedBy: adminId, resolvedAt: new Date() },
      });
      return true;
    } catch {
      return false;
    }
  }

  // Check whether a (kanji, meaning_vi) pair already exists, optionally
  // excluding a specific id (for update).
  async existsDuplicateKanjiMeaning(
    kanji: string,
    meaningVi: string,
    excludeId?: number,
  ): Promise<boolean> {
    const count = await prisma.vocabulary.count({
      where: {
        kanji,
        meaningVi,
        status: { not: VocabularyStatus.Delete },
        ...(excludeId !== undefined ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  // Analytics counts for a vocabulary entry.
  async getAnalytics(id: number) {
    const v = await prisma.vocabulary.findUnique({
      where: { id },
      select: { status: true, learnCount: true, favoriteCount: true },
    });
    if (!v || v.status === VocabularyStatus.Delete) return null;

    const [reportCount, relationCount] = await Promise.all([
      prisma.vocabReport.count({ where: { vocabId: id } }),
      prisma.vocabRelation.count({ where: { vocabId: id } }),
    ]);

    return {
      learnCount: v.learnCount,
      favoriteCount: v.favoriteCount,
      reportCount,
      relationCount,
    };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  // Insert relations for a vocabulary. Skips self-references and unknown
  // targets (filtered at the DB level).
  private async insertRelations(
    tx: Prisma.TransactionClient,
    vocabId: number,
    relations: { related?: number[]; synonyms?: number[]; antonyms?: number[] },
  ): Promise<void> {
    const entries: Array<{ targetVocabId: number; relationType: string }> = [];
    for (const target of relations.related ?? []) {
      if (target === vocabId) throw new Error('Cannot create self-reference relation');
      entries.push({ targetVocabId: target, relationType: VocabRelationType.Related });
    }
    for (const target of relations.synonyms ?? []) {
      if (target === vocabId) throw new Error('Cannot create self-reference relation');
      entries.push({ targetVocabId: target, relationType: VocabRelationType.Synonym });
    }
    for (const target of relations.antonyms ?? []) {
      if (target === vocabId) throw new Error('Cannot create self-reference relation');
      entries.push({ targetVocabId: target, relationType: VocabRelationType.Antonym });
    }
    if (entries.length === 0) return;

    // Confirm targets exist (and are not soft-deleted) to preserve the
    // explicit existence check the previous SQL version had.
    const ids = Array.from(new Set(entries.map((e) => e.targetVocabId)));
    const existing = await tx.vocabulary.findMany({
      where: { id: { in: ids }, status: { not: VocabularyStatus.Delete } },
      select: { id: true },
    });
    const existingSet = new Set(existing.map((r) => r.id));
    const missing = ids.filter((id) => !existingSet.has(id));
    if (missing.length > 0) {
      throw new Error(`Target vocabulary ${missing[0]} not found`);
    }

    await tx.vocabRelation.createMany({
      data: entries.map((e) => ({ vocabId, ...e })),
    });
  }

  // Compare old vs new and write one change_log row per changed field.
  private async writeChangeLogs(
    tx: Prisma.TransactionClient,
    vocabId: number,
    oldData: VocabularyRow,
    newData: UpdateVocabularyDto,
    userId: number,
    changeReason?: string,
  ): Promise<void> {
    const fieldsToLog: Array<{ field: string; oldVal: string | null; newVal: string | null }> = [];

    if (newData.kanji !== undefined && newData.kanji !== oldData.kanji) {
      fieldsToLog.push({ field: 'kanji', oldVal: oldData.kanji, newVal: newData.kanji });
    }
    if (newData.hiragana !== undefined && newData.hiragana !== oldData.hiragana) {
      fieldsToLog.push({ field: 'hiragana', oldVal: oldData.hiragana, newVal: newData.hiragana });
    }
    if (newData.romaji !== undefined && newData.romaji !== oldData.romaji) {
      fieldsToLog.push({ field: 'romaji', oldVal: oldData.romaji, newVal: newData.romaji });
    }
    if (newData.meaning_vi !== undefined && newData.meaning_vi !== oldData.meaning_vi) {
      fieldsToLog.push({ field: 'meaning_vi', oldVal: oldData.meaning_vi, newVal: newData.meaning_vi });
    }
    if (newData.on_yomi !== undefined && newData.on_yomi !== oldData.on_yomi) {
      fieldsToLog.push({ field: 'on_yomi', oldVal: oldData.on_yomi, newVal: newData.on_yomi });
    }
    if (newData.level !== undefined && newData.level !== oldData.level) {
      fieldsToLog.push({ field: 'level', oldVal: oldData.level, newVal: newData.level });
    }
    if (newData.media_url !== undefined && newData.media_url !== oldData.media_url) {
      fieldsToLog.push({ field: 'media_url', oldVal: oldData.media_url, newVal: newData.media_url });
    }
    if (newData.note !== undefined && newData.note !== oldData.note) {
      fieldsToLog.push({ field: 'note', oldVal: oldData.note, newVal: newData.note });
    }
    if (newData.tags !== undefined && JSON.stringify(newData.tags) !== JSON.stringify(oldData.tags)) {
      fieldsToLog.push({
        field: 'tags',
        oldVal: JSON.stringify(oldData.tags),
        newVal: JSON.stringify(newData.tags),
      });
    }
    if (newData.status !== undefined && newData.status !== oldData.status) {
      fieldsToLog.push({ field: 'status', oldVal: oldData.status, newVal: newData.status });
    }

    if (fieldsToLog.length === 0) return;
    await tx.vocabChangeLog.createMany({
      data: fieldsToLog.map((f) => ({
        vocabId,
        fieldName: f.field,
        oldValue: f.oldVal,
        newValue: f.newVal,
        changedBy: userId,
        changeReason: changeReason ?? null,
      })),
    });
  }
}

// Map a VocabularyRow to the response shape used in API output.
function mapToResponse(row: VocabularyRow): VocabularyResponse {
  return {
    id: row.id,
    kanji: row.kanji,
    hiragana: row.hiragana,
    romaji: row.romaji,
    meaning_vi: row.meaning_vi,
    on_yomi: row.on_yomi,
    level: row.level,
    media_url: row.media_url,
    note: row.note,
    tags: row.tags,
    status: row.status,
    learn_count: row.learn_count,
    favorite_count: row.favorite_count,
    created_by: row.created_by,
    updated_by: row.updated_by,
    version: row.version,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
