// lib/i18n/request.ts
import { getRequestConfig } from "next-intl/server";
import { getModuleDictionaries, deepMerge } from "./getModuleDictionaries";

const locales = ["id", "en"] as const;

export default getRequestConfig(async ({ requestLocale }) => {
    let locale = await requestLocale;

    if (!locale || !locales.includes(locale as any)) {
        locale = "id";
    }

    let messages = {};

    // 1. Load Global Dictionaries (dictionaries/id.json)
    try {
        const globalDict = (await import(`../../dictionaries/${locale}.json`)).default;
        messages = deepMerge(messages, globalDict);
    } catch (e) {
        console.error(`Gagal memuat global dictionary (${locale}):`, e);
    }

    // 2. Load Module Dictionaries via Utility yang sudah dibuat
    const moduleMessages = getModuleDictionaries(locale);
    messages = deepMerge(messages, moduleMessages);

    return {
        locale,
        messages,
        timeZone: "Asia/Jakarta",
    };
});