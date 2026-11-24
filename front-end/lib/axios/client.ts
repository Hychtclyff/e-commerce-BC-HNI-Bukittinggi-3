import axios from "axios";
import { createClient } from "@/utils/supabase/client";
import { useAuthStore } from "@/modules/auth/services/auth.store";
import { handleApiError } from "@/utils/toast";
import { recordApiTelemetry, recordPlaywrightApiHit } from "@/lib/dev/qaTelemetry";
import { getBackendApiBaseUrl } from "@/lib/api/baseUrl";

const API_BASE_URL = getBackendApiBaseUrl();

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

function isJwtExpired(token: string): boolean {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return false;
        const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
        if (!payload?.exp) return false;
        return payload.exp * 1000 < Date.now() + 10_000;
    } catch {
        return false;
    }
}

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

                // 3. Fallback ke cookie access_token jika Zustand belum ter-hydrate
                if (!token) {
                    const cookieMatch = document.cookie.match(/(?:^|;\s*)access_token=([^;]*)/);
                    if (cookieMatch?.[1]) {
                        token = decodeURIComponent(cookieMatch[1]);
                    }
                }

                // 4. Jika token kosong atau sudah kedaluwarsa, ambil/refresh dari Supabase Session
                if (!token || isJwtExpired(token)) {
                    const supabase = createClient();
                    const { data } = await supabase.auth.getSession();
                    const freshToken = data.session?.access_token ?? null;
                    if (freshToken) {
                        token = freshToken;
                        useAuthStore.getState().setTokens({
                            accessToken: freshToken,
                            refreshToken: data.session?.refresh_token ?? undefined,
                        });
                        document.cookie = `access_token=${freshToken}; path=/; max-age=86400; SameSite=Lax`;
                    }
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

// ── Single-Flight Refresh Queue untuk 401 Unauthorized ────────────────────────
let isRefreshing = false;
let refreshSubscribers: Array<{
    resolve: (token: string) => void;
    reject: (err: any) => void;
}> = [];

function processRefreshQueue(error: any, token: string | null = null) {
    refreshSubscribers.forEach(({ resolve, reject }) => {
        if (token) {
            resolve(token);
        } else {
            reject(error);
        }
    });
    refreshSubscribers = [];
}

function clearAuthSession() {
    useAuthStore.getState().logout();
    if (typeof window !== "undefined") {
        document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        try {
            const supabase = createClient();
            void supabase.auth.signOut();
        } catch {
            // ignore
        }
    }
}

async function attemptSessionRefresh(): Promise<string | null> {
    if (typeof window === "undefined") return null;

    // 1. Coba refresh via Supabase Session terlebih dahulu
    try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.refreshSession();
        if (!error && data?.session?.access_token) {
            const freshToken = data.session.access_token;
            const freshRefresh = data.session.refresh_token ?? undefined;
            useAuthStore.getState().setTokens({
                accessToken: freshToken,
                refreshToken: freshRefresh,
            });
            document.cookie = `access_token=${freshToken}; path=/; max-age=86400; SameSite=Lax`;
            if (freshRefresh) {
                document.cookie = `refresh_token=${freshRefresh}; path=/; max-age=604800; SameSite=Lax`;
            }
            return freshToken;
        }
    } catch {
        // lanjut ke internal refresh token
    }

    // 2. Fallback: Refresh via Backend /auth/refresh menggunakan refreshToken
    let storedRefreshToken = useAuthStore.getState().refreshToken;
    if (!storedRefreshToken) {
        const match = document.cookie.match(/(?:^|;\s*)refresh_token=([^;]*)/);
        if (match?.[1]) storedRefreshToken = decodeURIComponent(match[1]);
    }

    if (!storedRefreshToken) return null;

    try {
        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken: storedRefreshToken,
        });
        const payload = res.data?.data ?? res.data;
        const nextAccessToken = payload?.appToken || payload?.token || payload?.accessToken;
        const nextRefreshToken = payload?.refreshToken || storedRefreshToken;

        if (nextAccessToken) {
            useAuthStore.getState().setTokens({
                accessToken: nextAccessToken,
                refreshToken: nextRefreshToken,
            });
            document.cookie = `access_token=${nextAccessToken}; path=/; max-age=86400; SameSite=Lax`;
            document.cookie = `refresh_token=${nextRefreshToken}; path=/; max-age=604800; SameSite=Lax`;
            return nextAccessToken;
        }
    } catch {
        return null;
    }

    return null;
}

// ── Response Interceptor: Uniform Error Handling + Auto Refresh ─────────────
apiClient.interceptors.response.use(
    (response) => {
        if (process.env.NODE_ENV === "development") {
            recordPlaywrightApiHit({
                method: String(response.config?.method || "GET").toUpperCase(),
                url: String(response.config?.url || ""),
                status: response.status,
            });
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config as any;
        const status = error.response?.status;
        const requestUrl = String(originalRequest?.url || "");

        const isAuthEndpoint =
            requestUrl.includes("/auth/login") ||
            requestUrl.includes("/auth/register") ||
            requestUrl.includes("/auth/refresh") ||
            requestUrl.includes("/auth/forgot-password") ||
            requestUrl.includes("/auth/reset-password");

        // Coba silent refresh token saat 401 sebelum menampilkan error / redirect
        if (
            typeof window !== "undefined" &&
            status === 401 &&
            originalRequest &&
            !originalRequest._retry &&
            !isAuthEndpoint &&
            !originalRequest.skipAuthRedirect
        ) {
            if (isRefreshing) {
                return new Promise<string>((resolve, reject) => {
                    refreshSubscribers.push({ resolve, reject });
                })
                    .then((newToken) => {
                        originalRequest.headers = originalRequest.headers || {};
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        return apiClient(originalRequest);
                    })
                    .catch((refreshErr) => Promise.reject(refreshErr));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const newToken = await attemptSessionRefresh();
                if (newToken) {
                    processRefreshQueue(null, newToken);
                    originalRequest.headers = originalRequest.headers || {};
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return apiClient(originalRequest);
                }

                processRefreshQueue(error, null);
                clearAuthSession();
            } catch (refreshErr) {
                processRefreshQueue(refreshErr, null);
                clearAuthSession();
            } finally {
                isRefreshing = false;
            }
        }

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

        if (process.env.NODE_ENV === "development") {
            const method = String(originalRequest?.method || "GET").toUpperCase();
            recordApiTelemetry({
                method,
                url: requestUrl,
                status,
                message: formattedError.message,
            });
            recordPlaywrightApiHit({
                method,
                url: requestUrl,
                status: status || 0,
                message: formattedError.message,
            });
        }

        if (typeof window !== "undefined") {
            const currentPath = window.location.pathname;
            const currentLang = getDynamicLanguage();

            // Panggil toast error global dari HeroUI jika tidak di-skip secara eksplisit
            const isSilent = originalRequest?.skipGlobalToast || originalRequest?.silent;
            if (!isSilent) {
                handleApiError(formattedError);
                (formattedError as any)._toastShown = true;
            }

            const skipAuthRedirect =
                Boolean(originalRequest?.skipAuthRedirect) ||
                requestUrl.includes("/hsis") ||
                requestUrl.includes("/contact-info") ||
                requestUrl.includes("/delivery-methods") ||
                requestUrl.includes("/shipping-rates") ||
                requestUrl.includes("/checkout/calculate") ||
                requestUrl.includes("/vouchers");

            const protectedPathPatterns = [
                "/store",
                "/profile",
                "/orders",
                "/scan",
            ];
            const isProtectedPage = protectedPathPatterns.some((p) => currentPath.includes(p));

            // Jika sesi benar-benar kedaluwarsa (refresh gagal) pada aksi terautentikasi atau rute terlindungi: arahkan ke login
            if (status === 401 && !skipAuthRedirect && (isProtectedPage || originalRequest?._retry)) {
                const isAuthPage =
                    currentPath.includes("/login") ||
                    currentPath.includes("/register") ||
                    currentPath.includes("/401");

                if (!isAuthPage) {
                    const nextParam = encodeURIComponent(currentPath + window.location.search);
                    const redirectUrl = `/${currentLang}/login?expired=1&next=${nextParam}`;
                    window.dispatchEvent(new CustomEvent("unauthorized_session", { detail: { redirectUrl } }));
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

