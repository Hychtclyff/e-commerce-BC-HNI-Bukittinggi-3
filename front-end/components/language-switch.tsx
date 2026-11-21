"use client";

import { TijarahButton } from "@/components/atom/tijarahButton";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/lib/i18n/navigation";

export const LanguageSwitch = () => {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const switchLanguage = () => {
        const nextLocale = locale === "id" ? "en" : "id";
        router.replace(pathname, { locale: nextLocale });
    };

    return (
        <TijarahButton
            type="button"
            tijarahVariant="ghost"
            size="sm"
            aria-label="Switch language"
            className="text-xs font-semibold px-2.5 h-8 text-text-muted hover:text-text-primary hover:bg-canvas rounded-xl"
            onClick={switchLanguage}
        >
            {locale === "id" ? "English" : "Indonesia"}
        </TijarahButton>
    );
};

export default LanguageSwitch;
