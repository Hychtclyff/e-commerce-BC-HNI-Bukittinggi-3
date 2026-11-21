"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authService } from "@/modules/auth/services/auth.service";
import { createClient } from "@/utils/supabase/server";

// Helper: ambil locale dari cookie next-intl (default 'id')
async function getLocale(): Promise<string> {
    const cookieStore = await cookies();
    return cookieStore.get("NEXT_LOCALE")?.value ?? "id";
}



/** Masuk / Daftar dengan Google OAuth */
export async function loginWithGoogle(mode: "login" | "register" = "login") {
    const locale = await getLocale();

    const nextPath =
        mode === "register"
            ? `/${locale}/profile/complete`
            : `/${locale}`;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const redirectTo = `${siteUrl}/${locale}/auth/callback?next=${nextPath}`;

    // Coba via Backend Endpoint getGoogleOAuthUrl lebih dahulu
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

    // Fallback via Supabase Client Direct OAuth
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo,
            queryParams: {
                access_type: "offline",
                prompt: "consent",
            },
        },
    });

    if (error || !data.url) {
        redirect(`/${locale}/${mode}?error=google-oauth-failed`);
    }

    redirect(data.url);
}


