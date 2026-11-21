export type NewsCategory = "HERBAL" | "PROMO" | "EDUKASI" | "PENGUMUMAN" | "EVENT";
export type NewsStatus = "PUBLISHED" | "DRAFT" | "ARCHIVED";

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: NewsCategory;
  tags: string[];
  thumbnailUrl?: string;
  status: NewsStatus;
  views: number;
  authorId?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewsPayload {
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  category: NewsCategory;
  tags?: string[];
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
