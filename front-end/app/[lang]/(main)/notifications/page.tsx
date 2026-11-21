import { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { NotificationsViewAllPage } from "@/modules/notifications";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tijarah.vercel.app";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isID = locale === "id";

  const pageTitle = isID
    ? "Pusat Notifikasi | TIJARAH-3"
    : "Notification Center | TIJARAH-3";

  const pageDesc = isID
    ? "Pantau seluruh notifikasi update status pesanan, mutasi limit kasbon B2B, dan voucher promo resmi BC HNI 3 Bukittinggi secara real-time."
    : "Track all real-time order status updates, B2B credit ceiling changes, and official promo vouchers of BC HNI 3 Bukittinggi.";

  return {
    title: pageTitle,
    description: pageDesc,
    alternates: {
      canonical: `/${locale}/notifications`,
      languages: {
        id: "/id/notifications",
        en: "/en/notifications",
      },
    },
    openGraph: {
      type: "website",
      locale: isID ? "id_ID" : "en_US",
      url: `${BASE_URL}/${locale}/notifications`,
      siteName: "TIJARAH-3",
      title: pageTitle,
      description: pageDesc,
      images: [
        {
          url: `${BASE_URL}/og-notifications.png`,
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDesc,
    },
  };
}

export default async function NotificationsPage() {
  return (
    <main id="notifications-page-main" className="w-full">
      <NotificationsViewAllPage />
    </main>
  );
}
