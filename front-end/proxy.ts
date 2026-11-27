// proxy.ts — Next.js 16 (menggantikan middleware.ts)
import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest } from "next/server";

const locales = ["id", "en"] as const;

const intlMiddleware = createIntlMiddleware({
    locales,
    defaultLocale: "id",
    localePrefix: "always",
});

// Next.js 16: default export dengan nama fungsi "proxy"
export default async function proxy(request: NextRequest) {
    return intlMiddleware(request);
}

export const config = {
    matcher: [
        // Cocokkan semua path kecuali static files, API, dan favicon
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
    ],
};
