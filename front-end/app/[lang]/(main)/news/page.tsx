"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { apiClient } from "@/lib/axios/client";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { formatDate } from "@/utils/formatters";
import { Newspaper, Search, Calendar, ArrowRight } from "lucide-react";

interface NewsArticle {
  id: string;
  slug?: string;
  title: string;
  summary?: string;
  content?: string;
  category?: string;
  thumbnailUrl?: string | null;
  authorName?: string;
  publishedAt?: string;
  createdAt?: string;
}

export default function NewsPage() {
  const locale = useLocale();
  const isEn = locale === "en";
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiClient
      .get<{ data: NewsArticle[] }>("/news?status=PUBLISHED", {
        skipAuthRedirect: true,
        skipGlobalToast: true,
      } as any)
      .then((res) => {
        if (active && Array.isArray(res.data?.data)) {
          setArticles(res.data.data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>(["ALL"]);
    articles.forEach((a) => {
      if (a.category) set.add(a.category);
    });
    return Array.from(set);
  }, [articles]);

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      if (selectedCategory !== "ALL" && a.category !== selectedCategory) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          a.title.toLowerCase().includes(q) ||
          (a.summary || "").toLowerCase().includes(q) ||
          (a.content || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [articles, selectedCategory, search]);

  return (
    <div className="flex flex-col gap-0 pb-12">
      {/* 1. Full-Bleed Editorial Hero matching Landing Page */}
      <section className="relative w-screen left-1/2 -translate-x-1/2 -mt-6 overflow-hidden min-h-[340px] sm:min-h-[400px] flex flex-col justify-between text-white">
        <img
          src="/images/bc3-storefront.jpg"
          alt="Berita & Edukasi Herbal TIJARAH BC 3"
          style={{
            maskImage: "linear-gradient(to bottom, black 90%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 90%, transparent 100%)",
          }}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div
          style={{
            maskImage: "linear-gradient(to bottom, black 90%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 90%, transparent 100%)",
          }}
          className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/40"
        />

        <div className="relative z-10 container mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-12 flex flex-col justify-between flex-grow">
          <div className="text-[11px] font-semibold tracking-wider uppercase text-white/80">
            TIJARAH • {isEn ? "HERBAL INSIGHTS & NEWS" : "BERITA & EDUKASI HERBAL"}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end my-auto py-4">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-medium text-white/95">
                  {isEn ? "Herbal Education" : "Edukasi Herba"}
                </span>
                <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-medium text-white/95">
                  {isEn ? "Official Updates" : "Informasi Resmi"}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl leading-[1.1] tracking-tight">
                <span className="block font-light text-white/90">
                  {isEn ? "Latest Stories &" : "Berita &"}
                </span>
                <span className="block font-black text-white">
                  {isEn ? "Announcements" : "Artikel Terkini"}
                </span>
              </h1>
            </div>

            <div className="lg:col-span-5">
              <p className="text-xs sm:text-sm text-white/85 leading-relaxed max-w-md">
                {isEn
                  ? "Official updates from BC HNI 3 Bukittinggi, herbal product insights, and partner announcements."
                  : "Pembaruan resmi dari BC HNI 3 Bukittinggi, edukasi produk herbal halal, serta informasi kemitraan."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Filter Bar + Articles Grid */}
      <section className="py-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <TijarahButton
                key={cat}
                type="button"
                size="sm"
                tijarahVariant={selectedCategory === cat ? "primary" : "outline"}
                onClick={() => setSelectedCategory(cat)}
                className="text-xs font-bold h-8 px-3 rounded-lg"
              >
                {cat === "ALL" ? (isEn ? "All" : "Semua") : cat}
              </TijarahButton>
            ))}
          </div>
          <div className="w-full sm:w-64">
            <TijarahInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isEn ? "Search articles..." : "Cari berita..."}
              startContent={<Search className="w-4 h-4 text-text-muted" />}
              className="text-xs"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 rounded-xl border border-border-subtle bg-surface animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-border-subtle bg-surface p-12 text-center space-y-2">
            <Newspaper className="w-10 h-10 text-text-muted mx-auto" />
            <p className="text-sm font-bold text-text-primary">
              {isEn ? "No articles found" : "Belum ada berita yang sesuai"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {filtered.map((item) => {
              const articleHref = `/news/${item.id}`;
              return (
                <Link
                  key={item.id}
                  href={articleHref}
                  className="group rounded-xl border border-border-subtle bg-surface overflow-hidden hover:border-primary-sage/60 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="h-48 bg-canvas border-b border-border-subtle overflow-hidden flex items-center justify-center relative">
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Newspaper className="w-10 h-10 text-primary-sage/50" />
                      )}
                    </div>
                    <div className="p-5 space-y-2">
                      <TijarahBadge tijarahVariant="primary" className="text-[10px] font-bold">
                        {item.category || (isEn ? "Article" : "Artikel")}
                      </TijarahBadge>
                      <h2 className="text-base font-bold text-text-primary line-clamp-2 group-hover:text-primary-sage transition-colors">
                        {isEn && (item as any).titleEn ? (item as any).titleEn : item.title}
                      </h2>
                      {(item.summary || (item as any).summaryEn) && (
                        <p className="text-xs text-text-muted line-clamp-3 leading-relaxed">
                          {isEn && (item as any).summaryEn ? (item as any).summaryEn : item.summary}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="px-5 py-3 border-t border-border-subtle flex items-center justify-between text-[11px] text-text-muted">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(item.publishedAt || item.createdAt || new Date().toISOString())}
                    </span>
                    <span className="font-semibold text-primary-sage inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      {isEn ? "Read Article" : "Baca Artikel"}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
