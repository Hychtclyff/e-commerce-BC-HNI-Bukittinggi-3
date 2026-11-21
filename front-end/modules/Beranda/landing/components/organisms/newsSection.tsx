"use client";

import React, { useEffect, useState } from "react";
import { Link } from "@/lib/i18n/navigation";
import { useLocale } from "next-intl";
import { apiClient } from "@/lib/axios/client";
import { Newspaper, ArrowUpRight, Calendar } from "lucide-react";
import { formatDate } from "@/utils/formatters";

interface NewsItem {
  id: string;
  title: string;
  summary?: string;
  category?: string;
  publishedAt?: string;
  createdAt?: string;
}

export const NewsHighlightSection = () => {
  const locale = useLocale();
  const isEn = locale === "en";
  const [articles, setArticles] = useState<NewsItem[]>([]);

  useEffect(() => {
    let active = true;
    apiClient
      .get<{ data: NewsItem[] }>("/news?status=PUBLISHED&limit=4")
      .then((res) => {
        if (active && Array.isArray(res.data?.data)) {
          setArticles(res.data.data.slice(0, 4));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const fallbackHeadlines: NewsItem[] = isEn
    ? [
        {
          id: "f1",
          category: "Herbal Guide",
          title: "Why Do Thousands of Families Keep Minyak Herba Sinergi at Home?",
          summary: "Discover the practical everyday benefits and authentic seal checks before buying.",
          publishedAt: new Date().toISOString(),
        },
        {
          id: "f2",
          category: "Partner Tips",
          title: "How Registered HNI Agents Maximize Monthly TP Points Without Extra Hassle",
          summary: "Link your HNI ID once and watch every order automatically sync your agent points.",
          publishedAt: new Date().toISOString(),
        },
        {
          id: "f3",
          category: "Store Update",
          title: "Same-Day Counter Pickup vs Regional Express: Which Fits Your Order Best?",
          summary: "Compare pickup speed and dynamic shipping rates directly from BC 3 Bukittinggi.",
          publishedAt: new Date().toISOString(),
        },
      ]
    : [
        {
          id: "f1",
          category: "Edukasi Herba",
          title: "Kenapa Minyak Herba Sinergi Selalu Jadi Andalan Keluarga di Rumah?",
          summary: "Simak manfaat praktis sehari-hari serta cara memastikan keaslian segel resmi HNI.",
          publishedAt: new Date().toISOString(),
        },
        {
          id: "f2",
          category: "Tips Mitra",
          title: "Cara Agen HNI Mengumpulkan Poin TP Lebih Cepat Tanpa Input Ulang Manual",
          summary: "Cukup tautkan ID HNI di profil sekali, seluruh belanja otomatis terhitung Harga Agen.",
          publishedAt: new Date().toISOString(),
        },
        {
          id: "f3",
          category: "Info Gerai",
          title: "Ambil Langsung di Gerai atau Kirim Ekspedisi? Ini Panduan Hemat Ongkirnya",
          summary: "Bandingkan opsi pengambilan cepat di Jl. Panorama No. 18 dan tarif pengiriman wilayah.",
          publishedAt: new Date().toISOString(),
        },
      ];

  const displayList = articles.length > 0 ? articles : fallbackHeadlines;

  return (
    <section id="latest-news" className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary-sage mb-1">
            <Newspaper className="w-3.5 h-3.5" />
            <span>{isEn ? "Must-Read Insights" : "Wajib Baca & Edukasi Herbal"}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-text-primary">
            {isEn ? "Latest Stories & Herbal Updates" : "Informasi & Artikel Menarik Terbaru"}
          </h2>
          <p className="text-sm text-text-muted mt-1">
            {isEn
              ? "Curated herbal insights, agent tips, and official store updates you shouldn't miss."
              : "Rangkuman edukasi herba, rahasia belanja hemat agen, dan kabar terbaru dari BC HNI 3."}
          </p>
        </div>
        <Link
          href="/news"
          className="text-sm text-primary-sage hover:text-primary-dark hover:underline font-semibold whitespace-nowrap"
        >
          {isEn ? "Explore All Articles" : "Baca Semua Artikel"} &rarr;
        </Link>
      </div>

      {/* Editorial Non-Card Headline List */}
      <div className="divide-y divide-border-subtle border-y border-border-subtle">
        {displayList.map((item, idx) => (
          <Link
            key={item.id}
            href="/news"
            className="group py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface/60 px-2 sm:px-3 transition-colors"
          >
            <div className="flex items-start gap-4 min-w-0">
              <span className="font-mono text-lg sm:text-xl font-black text-primary-sage/50 group-hover:text-primary-sage transition-colors shrink-0 w-7">
                0{idx + 1}
              </span>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-wider text-primary-sage">
                  <span>{item.category || (isEn ? "Article" : "Artikel")}</span>
                  <span className="text-text-muted font-normal flex items-center gap-1 normal-case">
                    <Calendar className="w-3 h-3" />
                    {formatDate(item.publishedAt || item.createdAt || new Date().toISOString())}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-text-primary group-hover:text-primary-sage transition-colors leading-snug">
                  {item.title}
                </h3>
                {item.summary && (
                  <p className="text-xs sm:text-sm text-text-muted line-clamp-1">
                    {item.summary}
                  </p>
                )}
              </div>
            </div>

            <span className="inline-flex items-center gap-1 text-xs font-bold text-text-primary group-hover:text-primary-sage shrink-0 self-end sm:self-center">
              <span>{isEn ? "Read Now" : "Baca Sekarang"}</span>
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default NewsHighlightSection;
