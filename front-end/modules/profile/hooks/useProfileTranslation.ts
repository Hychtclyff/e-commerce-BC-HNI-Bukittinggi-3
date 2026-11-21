"use client";

import { useParams, usePathname } from "next/navigation";
import idDict from "../dictionaries/id.json";
import enDict from "../dictionaries/en.json";

export type ProfileDictKey = keyof typeof idDict;

export function useProfileTranslation() {
  const params = useParams();
  const pathname = usePathname();

  const langParam = typeof params?.lang === "string" ? params.lang : undefined;
  const isEn = langParam ? langParam === "en" : pathname ? pathname.startsWith("/en") || pathname.includes("/en/") : false;
  const dict = isEn ? enDict : idDict;

  const t = (key: ProfileDictKey | string, fallback?: string): string => {
    const val = (dict as unknown as Record<string, any>)[key];
    return typeof val === "string" ? val : fallback || key;
  };

  return {
    t,
    isEn,
    locale: isEn ? "en" : "id",
    dict,
  };
}
