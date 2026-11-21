import { toast } from "@heroui/react";

export interface ToastOptions {
  description?: string;
  timeout?: number;
  color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
  variant?: "default" | "solid" | "bordered" | "flat";
}

/**
 * Utilitas Terpadu Toast Notifikasi HeroUI untuk Tijarah
 */
export const showToast = {
  error: (title: string, description?: string, options?: ToastOptions) => {
    try {
      if (typeof window !== "undefined") {
        toast.danger(title, {
          description,
          timeout: options?.timeout ?? 5000,
          ...options,
        });
      }
    } catch (e) {
      console.error("[Toast Error]", title, description, e);
    }
  },

  danger: (title: string, description?: string, options?: ToastOptions) => {
    showToast.error(title, description, options);
  },

  success: (title: string, description?: string, options?: ToastOptions) => {
    try {
      if (typeof window !== "undefined") {
        toast.success(title, {
          description,
          timeout: options?.timeout ?? 4000,
          ...options,
        });
      }
    } catch (e) {
      console.log("[Toast Success]", title, description);
    }
  },

  warning: (title: string, description?: string, options?: ToastOptions) => {
    try {
      if (typeof window !== "undefined") {
        toast.warning(title, {
          description,
          timeout: options?.timeout ?? 4500,
          ...options,
        });
      }
    } catch (e) {
      console.warn("[Toast Warning]", title, description);
    }
  },

  info: (title: string, description?: string, options?: ToastOptions) => {
    try {
      if (typeof window !== "undefined") {
        toast.info(title, {
          description,
          timeout: options?.timeout ?? 4000,
          ...options,
        });
      }
    } catch (e) {
      console.info("[Toast Info]", title, description);
    }
  },
};

/**
 * Helper Global untuk Menangani Gagal Fetch / Error API dengan Toast HeroUI
 */
export function handleApiError(error: any, fallbackTitle: string = "Gagal Memproses Permintaan") {
  const status = error?.status || error?.response?.status;
  const message =
    error?.data?.message ||
    error?.response?.data?.message ||
    error?.message ||
    "Terjadi kendala saat menghubungi server.";

  if (status === 401) {
    showToast.warning("Sesi Kedaluwarsa (401)", "Silakan masuk kembali untuk melanjutkan akses.");
    return;
  }

  if (status === 403) {
    showToast.error("Akses Ditolak (403)", "Anda tidak memiliki izin untuk melakukan tindakan ini.");
    return;
  }

  if (status === 404) {
    showToast.error("Data Tidak Ditemukan (404)", message);
    return;
  }

  if (status >= 500) {
    showToast.error(
      "Gangguan Server (500)",
      message || "Terjadi kesalahan internal pada server. Silakan coba beberapa saat lagi."
    );
    return;
  }

  // Network / Offline Error
  if (error?.code === "ERR_NETWORK" || message.toLowerCase().includes("network")) {
    showToast.error(
      "Koneksi Terputus",
      "Tidak dapat terhubung ke server. Periksa jaringan internet Anda."
    );
    return;
  }

  // General Error
  showToast.error(fallbackTitle, typeof message === "string" ? message : JSON.stringify(message));
}

export { showToast as toast };
export default showToast;
