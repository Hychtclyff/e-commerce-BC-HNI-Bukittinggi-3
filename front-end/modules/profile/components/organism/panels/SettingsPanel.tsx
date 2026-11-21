"use client";

import React from "react";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { ChangePasswordForm } from "../form/changePasswordForm";
import { useTranslations } from "next-intl";
import { Globe, Sun, Moon, KeyRound } from "lucide-react";

export function SettingsPanel() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();
  const tPwd = useTranslations("passwordForm");

  const currentLang = pathname.startsWith("/en") ? "en" : "id";

  const handleLanguageChange = (newLang: string) => {
    if (newLang === currentLang) return;
    const newPath = pathname.replace(`/${currentLang}`, `/${newLang}`);
    router.push(newPath);
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* 1. Appearance & Language Settings */}
      <TijarahCard tijarahVariant="default" className="p-4 sm:p-6 border border-border-subtle">
        <h3 className="text-base font-extrabold text-text-primary mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary-sage shrink-0" />
          <span>{t("appearanceSettings")}</span>
        </h3>

        <div className="flex flex-col gap-5">
          {/* Language Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-subtle">
            <div className="min-w-0">
              <span className="text-sm font-bold text-text-primary block">{t("appLanguage")}</span>
              <span className="text-xs text-text-muted">{t("languageSubtitle")}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-canvas p-1 rounded-xl border border-border-subtle self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => handleLanguageChange("id")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  currentLang === "id" ? "bg-primary-sage text-white shadow-sm" : "text-text-muted hover:text-text-primary"
                }`}
              >
                🇮🇩 Indonesia
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange("en")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  currentLang === "en" ? "bg-primary-sage text-white shadow-sm" : "text-text-muted hover:text-text-primary"
                }`}
              >
                🇬🇧 English
              </button>
            </div>
          </div>

          {/* Theme Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-sm font-bold text-text-primary block">{t("themeMode")}</span>
              <span className="text-xs text-text-muted">{t("themeSubtitle")}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-canvas p-1 rounded-xl border border-border-subtle self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  theme === "light" ? "bg-primary-sage text-white shadow-sm" : "text-text-muted hover:text-text-primary"
                }`}
              >
                <Sun className="w-3.5 h-3.5" /> {t("lightTheme")}
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  theme === "dark" ? "bg-primary-sage text-white shadow-sm" : "text-text-muted hover:text-text-primary"
                }`}
              >
                <Moon className="w-3.5 h-3.5" /> {t("darkTheme")}
              </button>
            </div>
          </div>
        </div>
      </TijarahCard>

      {/* 2. Password Change */}
      <TijarahCard tijarahVariant="default" className="p-6 border border-border-subtle">
        <h3 className="text-base font-extrabold text-text-primary mb-1 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-accent-gold" />
          <span>{tPwd("title")}</span>
        </h3>
        <p className="text-xs text-text-muted mb-4">{tPwd("subtitle")}</p>

        <ChangePasswordForm />
      </TijarahCard>
    </div>
  );
}

export default SettingsPanel;
