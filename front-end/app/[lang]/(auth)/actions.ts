"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authService } from "@/modules/auth/services/auth.service";

// Helper: ambil locale dari cookie next-intl (default 'id')
async function getLocale(): Promise<string> {
    const cookieStore = await cookies();
    return cookieStore.get("NEXT_LOCALE")?.value ?? "id";
}

/** Masuk / Daftar dengan Google OAuth via Backend */
export async function loginWithGoogle(mode: "login" | "register" = "login") {
    const locale = await getLocale();

    const nextPath =
        mode === "register"
            ? `/${locale}/profile/complete`
            : `/${locale}`;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const redirectTo = `${siteUrl}/${locale}/auth/callback?next=${nextPath}`;

    try {
        const resData = await authService.getGoogleOAuthUrl(redirectTo);
        const authUrl = resData?.data?.url || resData?.url;
        if (authUrl) {
            redirect(authUrl);
        }
    } catch (err: any) {
        if (err?.digest?.startsWith("NEXT_REDIRECT")) {
            throw err;
        }
    }

    redirect(`/${locale}/${mode}?error=google-oauth-failed`);
}


