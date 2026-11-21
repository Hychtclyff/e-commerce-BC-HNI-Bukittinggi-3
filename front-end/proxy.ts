// proxy.ts — Next.js 16 (menggantikan middleware.ts)
import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

const locales = ["id", "en"] as const;

const intlMiddleware = createIntlMiddleware({
    locales,
    defaultLocale: "id",
    localePrefix: "always",
});

// Next.js 16: default export dengan nama fungsi "proxy"
export default async function proxy(request: NextRequest) {
    // 1. Refresh Supabase auth session (wajib agar cookie tidak expired)
    const supabaseResponse = await updateSession(request);

    // 2. Jalankan next-intl middleware
    const intlResponse = intlMiddleware(request);

    // 3. Teruskan cookies Supabase ke intl response agar session tetap valid
    supabaseResponse.cookies.getAll().forEach((cookie) => {
        intlResponse.cookies.set(cookie.name, cookie.value, {
            httpOnly: cookie.httpOnly,
            secure: cookie.secure,
            sameSite: cookie.sameSite as "lax" | "strict" | "none" | undefined,
            path: cookie.path,
            maxAge: cookie.maxAge,
        });
    });

    return intlResponse;
}

export const config = {
    matcher: [
        // Cocokkan semua path kecuali static files, API, dan favicon
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
    ],
};
