import { ServiceError } from '@models/common.model';
import { VocabulariesRepository, type VocabularyFilters, type VocabularyRow } from './vocabularies.repository';
import type { CreateVocabularyInput, UpdateVocabularyInput } from './vocabularies.validation';

export interface VocabularyResponse {
  id: number;
  slug: string;
  kanji: string;
  hiragana: string | null;
  romaji: string | null;
  meaningVi: string;
  onYomi: string | null;
  level: string;
  mediaUrl: string | null;
  note: string | null;
  example: string | null;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  createdById: number;
  createdByName: string;
  updatedById: number | null;
  updatedByName: string | null;
  version: number;
  learnCount: number;
  favoriteCount: number;
  reportCount: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function nullableText(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags.map(String).map((tag) => tag.trim()).filter(Boolean).slice(0, 10);
}

function normalizeStatus(status: string): 'draft' | 'published' | 'archived' {
  if (status === 'published' || status === 'archived') return status;
  return 'draft';
}

function toResponse(row: VocabularyRow): VocabularyResponse {
  return {
    id: row.id,
    slug: row.slug,
    kanji: row.kanji,
    hiragana: row.hiragana,
    romaji: row.romaji,
    meaningVi: row.meaningVi,
    onYomi: row.onYomi,
    level: row.level,
    mediaUrl: row.mediaUrl,
    note: row.note,
    example: row.example,
    tags: normalizeTags(row.tags),
    status: normalizeStatus(row.status),
    createdById: row.createdById,
    createdByName: row.createdBy.name,
    updatedById: row.updatedById,
    updatedByName: row.updatedBy?.name ?? null,
    version: row.version,
    learnCount: row.learnCount,
    favoriteCount: row.favoriteCount,
    reportCount: row.reportCount,
    isDeleted: row.isDeleted,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class VocabulariesService {
  private repository: VocabulariesRepository;

  constructor(repository?: VocabulariesRepository) {
    this.repository = repository || new VocabulariesRepository();
  }

  async getVocabularies(filters: VocabularyFilters = {}): Promise<VocabularyResponse[]> {
    const rows = await this.repository.findAll(filters);
    return rows.map(toResponse);
  }

  async getVocabulary(id: number): Promise<VocabularyResponse> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new ServiceError('Vocabulary not found', 404);
    }

    const row = await this.repository.findById(id);
    if (!row) {
      throw new ServiceError('Vocabulary not found', 404);
    }

    return toResponse(row);
  }

  async createVocabulary(data: CreateVocabularyInput, adminId: number): Promise<VocabularyResponse> {
    const slugBase = `${data.kanji}-${data.meaningVi}`
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 150) || 'vocabulary';
    const created = await this.repository.create({
      slug: `${slugBase}-${Date.now()}`,
      kanji: data.kanji,
      hiragana: nullableText(data.hiragana),
      romaji: nullableText(data.romaji),
      meaningVi: data.meaningVi,
      onYomi: nullableText(data.onYomi),
      level: data.level,
      mediaUrl: nullableText(data.mediaUrl),
      note: nullableText(data.note),
      example: nullableText(data.example),
      tags: data.tags,
      status: data.status,
      createdBy: { connect: { id: adminId } },
      updatedBy: { connect: { id: adminId } },
    });

    await this.repository.createAuditLog({
      adminId,
      targetUserId: adminId,
      action: 'CREATE_VOCABULARY',
      changedFields: { vocabularyId: created.id, kanji: data.kanji, meaningVi: data.meaningVi },
    });

    return this.getVocabulary(created.id);
  }

  async updateVocabulary(id: number, data: UpdateVocabularyInput, adminId: number): Promise<VocabularyResponse> {
    const current = await this.getVocabulary(id);
    const updateData: Record<string, unknown> = {
      updatedById: adminId,
      version: { increment: 1 },
    };

    if (data.kanji !== undefined) updateData.kanji = data.kanji;
    if (data.hiragana !== undefined) updateData.hiragana = nullableText(data.hiragana);
    if (data.romaji !== undefined) updateData.romaji = nullableText(data.romaji);
    if (data.meaningVi !== undefined) updateData.meaningVi = data.meaningVi;
    if (data.onYomi !== undefined) updateData.onYomi = nullableText(data.onYomi);
    if (data.level !== undefined) updateData.level = data.level;
    if (data.mediaUrl !== undefined) updateData.mediaUrl = nullableText(data.mediaUrl);
    if (data.note !== undefined) updateData.note = nullableText(data.note);
    if (data.example !== undefined) updateData.example = nullableText(data.example);
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.status !== undefined) updateData.status = data.status;

    await this.repository.update(id, updateData);
    await this.repository.createAuditLog({
      adminId,
      targetUserId: current.createdById,
      action: 'UPDATE_VOCABULARY',
      changedFields: { vocabularyId: id, ...data },
    });

    return this.getVocabulary(id);
  }

  async deleteVocabulary(id: number, adminId: number): Promise<void> {
    const current = await this.getVocabulary(id);
    await this.repository.createAuditLog({
      adminId,
      targetUserId: current.createdById,
      action: 'DELETE_VOCABULARY',
      changedFields: { vocabularyId: id, kanji: current.kanji },
    });
    await this.repository.softDelete(id);
  }
}
