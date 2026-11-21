// app/robots.ts
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/api/", "/admin/"], // Halaman yang tidak ingin diindeks
        },
        sitemap: "https://tijarah.vercel.app/sitemap.xml",
    };
}