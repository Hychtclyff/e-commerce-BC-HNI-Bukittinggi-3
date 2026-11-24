import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewsArticleView } from "./NewsArticleView";

interface NewsDetailPageProps {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: NewsDetailPageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  const beUrl = process.env.NEXT_PUBLIC_BE_URL || "http://localhost:5000/api/v1";

  try {
    const res = await fetch(`${beUrl}/news/${slug}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      const article = json.data;
      if (article && article.title) {
        return {
          title: `${article.title} | Tijarah BC HNI 3 Bukittinggi`,
          description:
            article.summary ||
            article.excerpt ||
            "Artikel & edukasi herbal resmi dari Business Center HNI 3 Bukittinggi.",
          openGraph: {
            title: article.title,
            description: article.summary || article.excerpt,
            images: article.thumbnail_url || article.thumbnailUrl ? [article.thumbnail_url || article.thumbnailUrl] : [],
          },
        };
      }
    }
  } catch {
    // Fallback metadata jika backend tidak dapat dihubungi saat SSR
  }

  const isEn = lang === "en";
  return {
    title: isEn
      ? "Herbal News & Insight | Tijarah BC HNI 3"
      : "Berita & Edukasi Herbal | Tijarah BC HNI 3",
    description: isEn
      ? "Official herbal articles, tips, and updates from BC HNI 3 Bukittinggi."
      : "Artikel, panduan herba, dan pembaruan resmi dari BC HNI 3 Bukittinggi.",
  };
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { lang, slug } = await params;

  if (!slug) {
    notFound();
  }

  return <NewsArticleView slug={slug} lang={lang} />;
}
