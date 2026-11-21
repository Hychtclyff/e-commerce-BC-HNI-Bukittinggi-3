import { apiClient } from "@/lib/axios/client";
import type { NewsArticle, NewsPayload, NewsFilterParams } from "../types/news.types";

export interface INewsListResponse {
  status: string;
  data: NewsArticle[];
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

export const newsApi = {
  async getNewsList(params?: NewsFilterParams): Promise<NewsArticle[]> {
    try {
      const res = await apiClient.get<INewsListResponse>("/news", {
        params: {
          category: params?.category,
          status: params?.status,
          q: params?.q,
          page: params?.page || 1,
          limit: params?.limit || 50,
        },
      });

      if (res.data?.data && Array.isArray(res.data.data)) {
        return res.data.data.map((item: any) => ({
          id: String(item.id),
          title: String(item.title || ""),
          slug: String(item.slug || ""),
          content: String(item.content || ""),
          excerpt: String(item.excerpt || ""),
          category: (item.category || "EDUKASI") as any,
          tags: Array.isArray(item.tags) ? item.tags : (item.tags ? [String(item.tags)] : []),
          thumbnailUrl: item.thumbnail_url || item.thumbnailUrl || undefined,
          status: (item.status || "PUBLISHED") as any,
          views: Number(item.views || 0),
          authorId: item.author_id || item.authorId || undefined,
          publishedAt: item.published_at || item.publishedAt || item.created_at || new Date().toISOString(),
          createdAt: item.created_at || item.createdAt || new Date().toISOString(),
          updatedAt: item.updated_at || item.updatedAt || new Date().toISOString(),
        }));
      }
    } catch (err: any) {
      console.warn("[newsApi] Gagal memuat /news:", err.message);
    }
    return [];
  },

  async getNewsByIdOrSlug(idOrSlug: string): Promise<NewsArticle | null> {
    try {
      const res = await apiClient.get<{ status: string; data: any }>(`/news/${idOrSlug}`);
      if (res.data?.data) {
        const item = res.data.data;
        return {
          id: String(item.id),
          title: String(item.title || ""),
          slug: String(item.slug || ""),
          content: String(item.content || ""),
          excerpt: String(item.excerpt || ""),
          category: (item.category || "EDUKASI") as any,
          tags: Array.isArray(item.tags) ? item.tags : [],
          thumbnailUrl: item.thumbnail_url || item.thumbnailUrl || undefined,
          status: (item.status || "PUBLISHED") as any,
          views: Number(item.views || 0),
          authorId: item.author_id || item.authorId || undefined,
          publishedAt: item.published_at || item.publishedAt || item.created_at || new Date().toISOString(),
          createdAt: item.created_at || item.createdAt || new Date().toISOString(),
          updatedAt: item.updated_at || item.updatedAt || new Date().toISOString(),
        };
      }
    } catch (err: any) {
      console.warn(`[newsApi] Gagal memuat berita ${idOrSlug}:`, err.message);
    }
    return null;
  },

  async createNews(payload: NewsPayload): Promise<{ success: boolean; message: string; data?: NewsArticle }> {
    try {
      const res = await apiClient.post<{ status: string; message: string; data: any }>("/news", {
        title: payload.title,
        slug: payload.slug,
        content: payload.content,
        excerpt: payload.excerpt,
        category: payload.category,
        tags: payload.tags,
        thumbnail_url: payload.thumbnailUrl,
        status: payload.status,
      });

      return {
        success: true,
        message: res.data?.message || "Artikel berita berhasil diterbitkan.",
        data: res.data?.data,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Gagal menerbitkan artikel berita.",
      };
    }
  },

  async updateNews(id: string, payload: Partial<NewsPayload>): Promise<{ success: boolean; message: string }> {
    try {
      const res = await apiClient.put<{ status: string; message: string }>(`/news/${id}`, {
        title: payload.title,
        slug: payload.slug,
        content: payload.content,
        excerpt: payload.excerpt,
        category: payload.category,
        tags: payload.tags,
        thumbnail_url: payload.thumbnailUrl,
        status: payload.status,
      });

      return {
        success: true,
        message: res.data?.message || "Artikel berita berhasil diperbarui.",
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Gagal memperbarui artikel berita.",
      };
    }
  },

  async deleteNews(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await apiClient.delete<{ status: string; message: string }>(`/news/${id}`);
      return {
        success: true,
        message: res.data?.message || "Artikel berita berhasil dihapus.",
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Gagal menghapus artikel berita.",
      };
    }
  },
};

export default newsApi;
