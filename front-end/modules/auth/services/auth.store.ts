import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface User {
    id: string;
    email: string;
    fullName?: string;
    phone?: string;
    role?: string;
    [key: string]: any;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;

    // Actions
    setAuth: (payload: { user: User; accessToken: string; refreshToken?: string }) => void;
    setTokens: (tokens: { accessToken: string; refreshToken?: string }) => void;
    setUser: (user: User | null) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,

            setAuth: ({ user, accessToken, refreshToken = null }) =>
                set({
                    user,
                    accessToken,
                    refreshToken,
                    isAuthenticated: true,
                }),

            setTokens: ({ accessToken, refreshToken = null }) =>
                set((state) => ({
                    accessToken,
                    refreshToken: refreshToken ?? state.refreshToken,
                    isAuthenticated: !!accessToken,
                })),

            setUser: (user) =>
                set({
                    user,
                    isAuthenticated: !!user,
                }),

            logout: () =>
                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                }),
        }),
        {
            name: "tijarah-auth-storage", // Key di localStorage
            storage: createJSONStorage(() => localStorage),
        }
    )
);
