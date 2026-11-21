import apiClient from "@/lib/axios/client";
import { LoginDto, RegisterDto } from "./auth.type";
import { useAuthStore } from "./auth.store";

export const authService = {
    login: async (body: LoginDto) => {
        const response = await apiClient.post("/auth/login", body);
        const resData = response.data;

        // Backend response structure:
        // { status: "success", message: "...", data: { user: {...}, token: "...", appToken: "..." } }
        const payload = resData.data ?? resData;
        const accessToken =
            payload.appToken ||
            payload.token ||
            payload.accessToken ||
            resData.accessToken ||
            resData.token;
        const refreshToken =
            payload.refreshToken || resData.refreshToken || null;
        const user = payload.user || resData.user || { id: "", email: body.email };

        if (accessToken) {
            useAuthStore.getState().setAuth({
                user,
                accessToken,
                refreshToken,
            });

            // Sync ke document.cookie agar Middleware & Server Components dapat membaca token
            if (typeof window !== "undefined") {
                document.cookie = `access_token=${accessToken}; path=/; max-age=86400; SameSite=Lax`;
                if (refreshToken) {
                    document.cookie = `refresh_token=${refreshToken}; path=/; max-age=604800; SameSite=Lax`;
                }
            }
        }

        return resData;
    },

    register: async (body: RegisterDto) => {
        const response = await apiClient.post("/auth/register", body);
        return response.data;
    },

    refresh: async () => {
        const response = await apiClient.post("/auth/refresh");
        const resData = response.data;
        const payload = resData.data ?? resData;
        const accessToken =
            payload.appToken ||
            payload.token ||
            payload.accessToken ||
            resData.accessToken;

        if (accessToken) {
            useAuthStore.getState().setTokens({ accessToken });
            if (typeof window !== "undefined") {
                document.cookie = `access_token=${accessToken}; path=/; max-age=86400; SameSite=Lax`;
            }
        }

        return resData;
    },

    logout: () => {
        useAuthStore.getState().logout();
        if (typeof window !== "undefined") {
            document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            document.cookie = "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
    },

    getGoogleOAuthUrl: async (redirectTo?: string) => {
        const response = await apiClient.get("/auth/google/url", {
            params: { redirectTo },
        });
        return response.data;
    },

    signWithGoogle: async (tokenStrOrObj: string | { token: string }) => {
        const payload = typeof tokenStrOrObj === "string" ? { token: tokenStrOrObj } : tokenStrOrObj;
        const response = await apiClient.post("/auth/sign-in-with-google", payload);
        const resData = response.data;
        const data = resData.data ?? resData;
        const accessToken = data.token || data.appToken;

        if (accessToken) {
            useAuthStore.getState().setAuth({
                user: data.user || null,
                accessToken,
                refreshToken: data.refreshToken || null,
            });

            if (typeof window !== "undefined") {
                document.cookie = `access_token=${accessToken}; path=/; max-age=86400; SameSite=Lax`;
            }
        }

        return resData;
    },

    exchangeCode: async (code: string) => {
        const response = await apiClient.post("/auth/exchange-code", { code });
        return response.data;
    },

    authHashCode: async (accessToken: string, refreshToken: string) => {
        const response = await apiClient.post("/auth/auth-code", { accessToken, refreshToken });
        return response.data;
    },

    resendOtp: async (email: string, type: "signup" | "email_change" = "signup") => {
        const response = await apiClient.post("/auth/resend-otp", { email, type });
        return response.data;
    },

    verifyOtp: async (email: string, code: string) => {
        const response = await apiClient.post("/auth/verify-otp", {
            email,
            code,
            otp: code,
            token: code,
        });
        const resData = response.data;
        const payload = resData?.data ?? resData;
        const accessToken = payload?.appToken || payload?.token || payload?.accessToken;

        if (accessToken) {
            useAuthStore.getState().setAuth({
                user: payload?.user || null,
                accessToken,
                refreshToken: payload?.refreshToken || null,
            });

            if (typeof window !== "undefined") {
                document.cookie = `access_token=${accessToken}; path=/; max-age=86400; SameSite=Lax`;
            }
        }

        return resData;
    },
};