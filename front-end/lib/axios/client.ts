import axios from "axios";
import { createClient } from "@/utils/supabase/client";
import { useAuthStore } from "@/modules/auth/services/auth.store";
import { handleApiError } from "@/utils/toast";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_BE_URL ?? "http://localhost:5000/api/v1";

/**
 * Membaca bahasa (locale) aktif secara dinamis dari URL pathname atau Cookie
 */
function getDynamicLanguage(): string {
    if (typeof window !== "undefined") {
        // 1. Cek segmen pertama dari URL pathname (misal /en/login atau /id/login)
        const pathLang = window.location.pathname.split("/")[1];
        if (pathLang === "en" || pathLang === "id") {
            return pathLang;
        }

        // 2. Fallback cek cookie NEXT_LOCALE
        const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]*)/);
        if (match && (match[1] === "en" || match[1] === "id")) {
            return match[1];
        }
    }
    return "id"; // Default fallback
}

/**
 * Axios Instance Konfigurasi Terpusat untuk Frontend Tijarah
 */
export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
    timeout: 15000, // 15 detik timeout
});

// ── Request Interceptor: Auto-attach Auth Bearer Token & Dynamic Language ────
apiClient.interceptors.request.use(
    async (config) => {
        // 1. Pasang header Language & Accept-Language dinamis
        const currentLang = getDynamicLanguage();
        config.headers["Accept-Language"] = currentLang;

        if (typeof window !== "undefined") {
            try {
                // 2. Cek token dari Zustand Store lebih dulu
                let token = useAuthStore.getState().accessToken;

                // 3. Fallback ke Supabase Session jika tidak ada di Zustand
                if (!token) {
                    const supabase = createClient();
                    const { data } = await supabase.auth.getSession();
                    token = data.session?.access_token ?? null;
                }

                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }

                const authUser = useAuthStore.getState().user;
                if (authUser?.id) {
                    config.headers["x-user-id"] = String(authUser.id);
                }
            } catch (err) {
                console.error("Gagal mengambil token untuk Axios request:", err);
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ── Response Interceptor: Uniform Error Handling ────────────────────────────
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const errorMessage =
            error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            "Terjadi kesalahan pada koneksi server.";

        // Buat objek error yang rapi
        const formattedError = new Error(
            typeof errorMessage === "string" ? errorMessage : JSON.stringify(errorMessage)
        );
        (formattedError as any).status = status;
        (formattedError as any).data = error.response?.data;

        if (typeof window !== "undefined") {
            const currentPath = window.location.pathname;
            const currentLang = getDynamicLanguage();

            // Panggil toast error global dari HeroUI jika tidak di-skip secara eksplisit
            const isSilent = (error.config as any)?.skipGlobalToast || (error.config as any)?.silent;
            if (!isSilent) {
                handleApiError(formattedError);
            }

            const requestUrl = String(error.config?.url || "");
            const skipAuthRedirect =
                Boolean((error.config as any)?.skipAuthRedirect) ||
                requestUrl.includes("/hsis");

            // Jika 401 Unauthorized (bukan dari endpoint gateway HSIS) dan tidak sedang di halaman login/register/401
            if (status === 401 && !skipAuthRedirect) {
                const isAuthPage =
                    currentPath.includes("/login") ||
                    currentPath.includes("/register") ||
                    currentPath.includes("/401");

                if (!isAuthPage) {
                    const redirectUrl = `/${currentLang}/401?next=${encodeURIComponent(currentPath + window.location.search)}`;
                    // Dispatch custom event untuk global login modal trigger jika didukung
                    window.dispatchEvent(new CustomEvent("unauthorized_session", { detail: { redirectUrl } }));
                    // Navigasi ke halaman 401
                    window.location.href = redirectUrl;
                }
            }
        }

        return Promise.reject(formattedError);
    }
);

// Inisialisasi API Checker di DevTools browser saat mode development
if (typeof window !== "undefined") {
    import("../api/route-checker").then(({ initDevRouteChecker }) => {
        initDevRouteChecker();
    }).catch(() => {});
}

export default apiClient;

