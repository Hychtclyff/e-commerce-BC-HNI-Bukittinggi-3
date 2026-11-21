// lib/i18n/request.ts
import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";

// Daftar locale yang didukung
const locales = ["id", "en"];

export default getRequestConfig(async ({ requestLocale }) => {
    // requestLocale bernilai Promise, wajib di-await
    let locale = await requestLocale;

    // Validasi locale agar tidak undefined atau di luar daftar
    if (!locale || !locales.includes(locale)) {
        locale = "id"; // fallback default locale
    }

    let globalMessages = {};
    try {
        globalMessages = (await import(`../../dictionaries/${locale}.json`)).default;
    } catch (e) {
        console.error(`Gagal memuat global dictionary untuk locale ${locale}:`, e);
    }

    let landingMessages = {};
    try {
        landingMessages = (await import(`../../modules/landing/dictionaries/${locale}.json`)).default;
    } catch (e) {
        console.error(`Gagal memuat landing dictionary untuk locale ${locale}:`, e);
    }

    const mergedMessages = {
        ...globalMessages,
        ...landingMessages,
    };

  

    return {
        locale,
        messages: mergedMessages,
        timeZone: "Asia/Jakarta",
    };
});