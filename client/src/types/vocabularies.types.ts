export type VocabularyStatus = 'draft' | 'published' | 'archived';
export type VocabularyLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | 'Other';

export interface Vocabulary {
  id: number;
  kanji: string;
  hiragana: string | null;
  romaji: string | null;
  meaningVi: string;
  onYomi: string | null;
  level: VocabularyLevel;
  mediaUrl: string | null;
  note: string | null;
  tags: string[];
  status: VocabularyStatus;
  createdById: number;
  createdByName: string;
  updatedById: number | null;
  updatedByName: string | null;
  version: number;
  learnCount: number;
  favoriteCount: number;
  reportCount: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VocabularyFilters {
  search?: string;
  level?: VocabularyLevel | '';
  status?: VocabularyStatus | '';
}

export interface CreateVocabularyDto {
  kanji: string;
  hiragana?: string | null;
  romaji?: string | null;
  meaningVi: string;
  onYomi?: string | null;
  level: VocabularyLevel;
  mediaUrl?: string | null;
  note?: string | null;
  tags?: string[];
  status: VocabularyStatus;
}

export type UpdateVocabularyDto = Partial<CreateVocabularyDto>;
