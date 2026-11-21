// app/robots.ts — serve di /robots.txt (HARUS di app/ root)
import { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tijarah.vercel.app";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                // Halaman auth & admin tidak perlu diindeks
                disallow: ["/api/", "/id/login", "/en/login", "/id/register", "/en/register"],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
        host: baseUrl,
    };
}
