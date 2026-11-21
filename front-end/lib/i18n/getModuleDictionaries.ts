// lib/i18n/getModuleDictionaries.ts
import fs from "fs";
import path from "path";

/**
 * Penggabungan objek terjemahan secara mendalam (Deep Merge)
 */
export function deepMerge(target: any, source: any) {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach((key) => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
}

function isObject(item: any) {
    return item && typeof item === "object" && !Array.isArray(item);
}

export function getModuleDictionaries(locale: string) {
    let messages = {};
    try {
        const modulesDir = path.join(process.cwd(), "modules");

        if (fs.existsSync(modulesDir)) {
            // Fungsi rekursif untuk masuk ke dalam subfolder (misal: Beranda/about, shop, dll)
            const readRecursive = (currentDir: string) => {
                const entries = fs.readdirSync(currentDir, { withFileTypes: true });

                for (const entry of entries) {
                    const fullPath = path.join(currentDir, entry.name);

                    if (entry.isDirectory()) {
                        // 1. Cek apakah di dalam folder saat ini ada file "dictionaries/${locale}.json"
                        let dictPath = path.join(fullPath, "dictionaries", `${locale}.json`);
                        if (!fs.existsSync(dictPath)) {
                            dictPath = path.join(fullPath, "dictinories", `${locale}.json`);
                        }

                        if (fs.existsSync(dictPath)) {
                            try {
                                const fileContent = fs.readFileSync(dictPath, "utf8");
                                const modDict = JSON.parse(fileContent);
                                messages = deepMerge(messages, modDict);
                            } catch (parseErr) {
                                console.error(`Gagal parsing JSON dari ${dictPath}:`, parseErr);
                            }
                        }

                        // Lanjutkan penelusuran ke subfolder berikutnya secara mendalam
                        readRecursive(fullPath);
                    } else if (entry.isFile() && entry.name === `${locale}.json`) {
                        // 2. Baca file ${locale}.json jika ada di dalam subfolder (misal dictionaries/newsProduct/id.json)
                        try {
                            const fileContent = fs.readFileSync(fullPath, "utf8");
                            const modDict = JSON.parse(fileContent);
                            messages = deepMerge(messages, modDict);
                        } catch (parseErr) {
                            console.error(`Gagal parsing JSON dari ${fullPath}:`, parseErr);
                        }
                    }
                }
            };

            readRecursive(modulesDir);
        }
    } catch (e) {
        console.error(`Gagal memuat module dictionaries (${locale}):`, e);
    }

    return messages;
}