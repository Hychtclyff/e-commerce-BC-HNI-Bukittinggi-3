import { Metadata } from "next";
import { Card, Chip, Button } from "@heroui/react";
import { getTranslations, getLocale } from "next-intl/server";
import { title, subtitle } from "@/components/primitives";
import Products from "@/modules/Beranda/products";
import Profile from "@/modules/profile";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tijarah.vercel.app";

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getLocale();
    const isID = locale === "id";

    const pageTitle = isID
        ? "Profil | TIJARAH-3"
        : "Profile | TIJARAH-3";

    const pageDesc = isID
        ? "Profil pengguna"
        : "User profile";

    return {
        title: pageTitle,
        description: pageDesc,
        alternates: {
            canonical: `/${locale}/profile`,
            languages: { id: "/id/profile", en: "/en/profile" },
        },
        openGraph: {
            type: "website",
            locale: isID ? "id_ID" : "en_US",
            url: `${BASE_URL}/${locale}/profile`,
            siteName: "TIJARAH-3",
            title: pageTitle,
            description: pageDesc,
            images: [{ url: `${BASE_URL}/og-profile.png`, width: 1200, height: 630 }],
        },
        twitter: { card: "summary_large_image", title: pageTitle, description: pageDesc },
    };
}



export default async function ProfilePage() {
    const t = await getTranslations("Products");

    return (
        <Profile />
    );
}