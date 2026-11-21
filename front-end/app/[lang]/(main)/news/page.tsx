"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { apiClient } from "@/lib/axios/client";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahModal } from "@/components/atom/tijarahModal";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { formatDate } from "@/utils/formatters";
import { Newspaper, Search, Calendar, User } from "lucide-react";

interface NewsArticle {
  id: string;
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
  const [activeArticle, setActiveArticle] = useState<NewsArticle | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiClient
      .get<{ data: NewsArticle[] }>("/news?status=PUBLISHED")
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
            {filtered.map((item) => (
              <article
                key={item.id}
                onClick={() => setActiveArticle(item)}
                className="cursor-pointer group rounded-xl border border-border-subtle bg-surface overflow-hidden hover:border-primary-sage/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="h-44 bg-canvas border-b border-border-subtle overflow-hidden flex items-center justify-center">
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
                      {item.title}
                    </h2>
                    {item.summary && (
                      <p className="text-xs text-text-muted line-clamp-3 leading-relaxed">
                        {item.summary}
                      </p>
                    )}
                  </div>
                </div>
                <div className="px-5 py-3 border-t border-border-subtle flex items-center justify-between text-[11px] text-text-muted">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(item.publishedAt || item.createdAt || new Date().toISOString())}
                  </span>
                  <span className="font-semibold text-primary-sage">
                    {isEn ? "Read Article" : "Baca Selengkapnya"} &rarr;
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <TijarahModal
        isOpen={!!activeArticle}
        onClose={() => setActiveArticle(null)}
        title={activeArticle?.title || ""}
        confirmText={isEn ? "Close" : "Tutup"}
        confirmVariant="primary"
        onConfirm={() => setActiveArticle(null)}
        maxWidth="2xl"
      >
        {activeArticle && (
          <div className="space-y-4 text-xs sm:text-sm text-text-primary">
            <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {activeArticle.authorName || "Admin BC 3"}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(activeArticle.publishedAt || activeArticle.createdAt || new Date().toISOString())}
              </span>
            </div>
            {activeArticle.thumbnailUrl && (
              <img
                src={activeArticle.thumbnailUrl}
                alt={activeArticle.title}
                className="w-full max-h-64 object-cover rounded-xl border border-border-subtle"
              />
            )}
            <div className="whitespace-pre-line leading-relaxed text-text-secondary">
              {activeArticle.content || activeArticle.summary || ""}
            </div>
          </div>
        )}
      </TijarahModal>
    </div>
  );
}
