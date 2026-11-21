import apiClient from "@/lib/axios/client";

export type MediaCategory =
  | "PRODUCT"
  | "NEWS"
  | "PROFILE"
  | "RECEIPT"
  | "DOCUMENT"
  | "GENERAL";

export interface MediaAsset {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  category: MediaCategory;
  bucket: string;
  storagePath: string;
  publicUrl: string | null;
  isPrivate: boolean;
  entityId: string | null;
  uploadedBy: string | null;
  createdAt: string;
}

export const mediaApi = {
  async uploadMedia(
    file: File,
    options?: { category?: MediaCategory; entityId?: string }
  ): Promise<MediaAsset> {
    const formData = new FormData();
    if (options?.category) {
      formData.append("category", options.category);
    }
    if (options?.entityId) {
      formData.append("entityId", options.entityId);
    }
    formData.append("file", file);

    const params = new URLSearchParams();
    if (options?.category) params.set("category", options.category);
    if (options?.entityId) params.set("entityId", options.entityId);

    const query = params.toString();
    const res = await apiClient.post<{ status: string; data: MediaAsset }>(
      `/media/upload${query ? `?${query}` : ""}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return res.data.data;
  },

  async listMedia(params?: {
    category?: string;
    type?: "IMAGE" | "PDF" | "ALL";
    search?: string;
  }): Promise<MediaAsset[]> {
    const res = await apiClient.get<{ status: string; data: MediaAsset[] }>(
      "/media",
      { params }
    );
    return res.data?.data || [];
  },

  async getAccessUrl(
    id: string,
    expiresIn = 3600
  ): Promise<{ url: string; isPrivate: boolean }> {
    const res = await apiClient.get<{
      status: string;
      data: { url: string; isPrivate: boolean };
    }>(`/media/${id}/url`, { params: { expiresIn } });
    return res.data.data;
  },

  async deleteMedia(id: string): Promise<{ deleted: boolean; id: string }> {
    const res = await apiClient.delete<{
      status: string;
      data: { deleted: boolean; id: string };
    }>(`/media/${id}`);
    return res.data.data;
  },
};
