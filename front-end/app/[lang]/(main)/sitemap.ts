// app/[lang]/sitemap.ts
import { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tijarah.vercel.app";
const locales = ["id", "en"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
    // Rute statis per locale
    const staticPaths = [
        { path: "", priority: 1.0, changeFrequency: "daily" as const },
        { path: "/about", priority: 0.8, changeFrequency: "monthly" as const },
        { path: "/products", priority: 0.9, changeFrequency: "weekly" as const },
        { path: "/shop", priority: 0.85, changeFrequency: "daily" as const },
    ];

    const staticRoutes: MetadataRoute.Sitemap = locales.flatMap((locale) =>
        staticPaths.map(({ path, priority, changeFrequency }) => ({
            url: `${baseUrl}/${locale}${path}`,
            lastModified: new Date(),
            changeFrequency,
            priority,
        }))
    );

    // Slug produk statis (akan diganti dengan query DB setelah backend siap)
    const productSlugs = [
        "minyak-herba-sinergi",
        "madu-multiflora-250g",
        "kopi-7-elemen-sevel",
        "extra-food-hania",
        "spirulina-kapsul",
        "zaitun-extra-virgin",
        "susu-kambing-egm",
        "pasta-gigi-siwak",
    ];

    const productRoutes: MetadataRoute.Sitemap = locales.flatMap((locale) =>
        productSlugs.map((slug) => ({
            url: `${baseUrl}/${locale}/products/${slug}`,
            lastModified: new Date(),
            changeFrequency: "weekly" as const,
            priority: 0.7,
        }))
    );

    return [...staticRoutes, ...productRoutes];
}