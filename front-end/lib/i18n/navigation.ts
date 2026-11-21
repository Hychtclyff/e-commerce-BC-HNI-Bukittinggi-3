// lib/i18n/navigation.ts (atau navigation.ts)
import { createNavigation } from "next-intl/navigation";

export const { Link, redirect, usePathname, useRouter } = createNavigation({
    locales: ["id", "en"],
    defaultLocale: "id",
});