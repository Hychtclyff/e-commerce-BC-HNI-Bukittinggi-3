export type NewsCategory = "HERBAL" | "PROMO" | "EDUKASI" | "PENGUMUMAN" | "EVENT";
export type NewsStatus = "PUBLISHED" | "DRAFT" | "ARCHIVED";

export interface NewsArticle {
  id: string;
  title: string;
  titleEn?: string | null;
  slug: string;
  content: string;
  contentEn?: string | null;
  excerpt?: string;
  summary?: string;
  summaryEn?: string | null;
  category: NewsCategory;
  tags: string[];
  taggedProductIds?: string[];
  taggedProducts?: any[];
  thumbnailUrl?: string;
  status: NewsStatus;
  views: number;
  authorId?: string;
  authorName?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewsPayload {
  title: string;
  titleEn?: string;
  slug?: string;
  content: string;
  contentEn?: string;
  excerpt?: string;
  summaryEn?: string;
  category: NewsCategory;
  tags?: string[];
  taggedProductIds?: string[];
  thumbnailUrl?: string;
  status: NewsStatus;
  publishedAt?: string;
}

export interface NewsFilterParams {
  category?: string;
  status?: string;
  q?: string;
  page?: number;
  limit?: number;
}
