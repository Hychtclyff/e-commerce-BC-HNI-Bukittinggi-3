import "server-only";

const dictionaries = {
    id: async () => {
        const globalDict = await import("./dictionaries/id.json").then((m) => m.default).catch(() => ({}));
        const landingDict = await import("./modules/Beranda/landing/dictionaries/id.json").then((m) => m.default).catch(() => ({}));
        const authDict = await import("./modules/auth/dictionaries/id.json").then((m) => m.default).catch(() => ({}));
        const profileDict = await import("./modules/profile/dictionaries/id.json").then((m) => m.default).catch(() => ({}));
        return { ...globalDict, ...landingDict, ...authDict, ...profileDict };
    },
    en: async () => {
        const globalDict = await import("./dictionaries/en.json").then((m) => m.default).catch(() => ({}));
        const landingDict = await import("./modules/Beranda/landing/dictionaries/en.json").then((m) => m.default).catch(() => ({}));
        const authDict = await import("./modules/auth/dictionaries/en.json").then((m) => m.default).catch(() => ({}));
        const profileDict = await import("./modules/profile/dictionaries/en.json").then((m) => m.default).catch(() => ({}));
        return { ...globalDict, ...landingDict, ...authDict, ...profileDict };
    },
};

export const getDictionary = async (locale: "id" | "en") =>
    dictionaries[locale]?.() ?? dictionaries.en();