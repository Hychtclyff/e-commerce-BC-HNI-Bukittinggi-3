"use client";

import React, { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { apiClient } from "@/lib/axios/client";
import { formatDate } from "@/utils/formatters";
import { showToast } from "@/utils/toast";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { TijarahButton } from "@/components/atom/tijarahButton";
import {
  Newspaper,
  Calendar,
  User,
  Clock,
  Share2,
  Copy,
  Check,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export interface NewsArticleDetail {
  id: string;
  slug: string;
  title: string;
  titleEn?: string | null;
  summary?: string;
  summaryEn?: string | null;
  excerpt?: string;
  content: string;
  contentEn?: string | null;
  category: string;
  tags?: string[];
  taggedProductIds?: string[];
  taggedProducts?: Array<{
    id: string;
    sku: string;
    name: string;
    category?: string;
    normalPrice?: number;
    agentPrice?: number;
    imageUrl?: string | null;
  }>;
  thumbnailUrl?: string | null;
  status?: string;
  views?: number;
  authorName?: string;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface NewsArticleViewProps {
  slug: string;
  lang: string;
}

export const NewsArticleView: React.FC<NewsArticleViewProps> = ({ slug, lang }) => {
  const locale = useLocale() || lang;
  const isEn = locale === "en";

  const [article, setArticle] = useState<NewsArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [related, setRelated] = useState<NewsArticleDetail[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);

    apiClient
      .get<{ status: string; data: any }>(`/news/${slug}`, {
        skipAuthRedirect: true,
        skipGlobalToast: true,
      } as any)
      .then((res) => {
        if (!active) return;
        const item = res.data?.data;
        if (item && (item.id || item.slug)) {
          setArticle({
            id: String(item.id),
            slug: String(item.slug || item.id),
            title: String((isEn && item.titleEn ? item.titleEn : item.title) || ""),
            summary: (isEn && item.summaryEn ? item.summaryEn : item.summary) || item.excerpt || "",
            excerpt: (isEn && item.summaryEn ? item.summaryEn : item.excerpt) || item.summary || "",
            content: String((isEn && item.contentEn ? item.contentEn : item.content) || ""),
            category: String(item.category || "EDUKASI"),
            tags: Array.isArray(item.tags) ? item.tags : [],
            thumbnailUrl: item.thumbnail_url || item.thumbnailUrl || null,
            status: item.status,
            views: Number(item.views || 0),
            authorName: item.author_name || item.authorName || (isEn ? "Store Admin BC HNI 3" : "Admin Toko BC HNI 3"),
            publishedAt: item.published_at || item.publishedAt || item.created_at || new Date().toISOString(),
            createdAt: item.created_at || item.createdAt || new Date().toISOString(),
            updatedAt: item.updated_at || item.updatedAt || new Date().toISOString(),
          });
        } else {
          setNotFound(true);
        }
      })
      .catch(() => {
        if (active) setNotFound(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug, isEn]);

  // Load related articles
  useEffect(() => {
    let active = true;
    apiClient
      .get<{ data: any[] }>("/news?status=PUBLISHED&limit=6", {
        skipAuthRedirect: true,
        skipGlobalToast: true,
      } as any)
      .then((res) => {
        if (!active) return;
        if (Array.isArray(res.data?.data)) {
          const list = res.data.data
            .filter((item: any) => item.slug !== slug && item.id !== slug)
            .slice(0, 3)
            .map((item: any) => ({
              id: String(item.id),
              slug: String(item.slug || item.id),
              title: String(item.title || ""),
              summary: item.summary || item.excerpt || "",
              excerpt: item.excerpt || item.summary || "",
              content: String(item.content || ""),
              category: String(item.category || "EDUKASI"),
              tags: Array.isArray(item.tags) ? item.tags : [],
              thumbnailUrl: item.thumbnail_url || item.thumbnailUrl || null,
              authorName: item.author_name || item.authorName,
              publishedAt: item.published_at || item.publishedAt || item.created_at,
              createdAt: item.created_at || item.createdAt,
            }));
          setRelated(list);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [slug]);

  // Handle Share / Copy URL
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      showToast.success(
        isEn ? "Link Copied" : "Tautan Disalin",
        isEn ? "Article URL has been copied to clipboard." : "Tautan artikel berhasil disalin ke papan klip."
      );
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    if (typeof window !== "undefined" && article) {
      const shareUrl = window.location.href;
      const text = encodeURIComponent(
        `${article.title}\n\nBaca artikel selengkapnya di TIJARAH BC HNI 3 Bukittinggi:\n${shareUrl}`
      );
      window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
    }
  };

  // Estimated reading time
  const readingTimeMinutes = Math.max(
    1,
    Math.ceil(((article?.content || "").replace(/<[^>]+>/g, "").split(/\s+/).length || 100) / 180)
  );

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-pulse">
        <div className="h-4 w-48 bg-surface rounded" />
        <div className="space-y-3">
          <div className="h-6 w-24 bg-surface rounded-full" />
          <div className="h-10 w-3/4 bg-surface rounded-lg" />
          <div className="h-4 w-1/2 bg-surface rounded" />
        </div>
        <div className="h-72 sm:h-96 w-full bg-surface rounded-2xl border border-border-subtle" />
        <div className="space-y-4 pt-4">
          <div className="h-4 w-full bg-surface rounded" />
          <div className="h-4 w-5/6 bg-surface rounded" />
          <div className="h-4 w-4/5 bg-surface rounded" />
          <div className="h-4 w-full bg-surface rounded" />
        </div>
      </div>
    );
  }

  // Not Found State
  if (notFound || !article) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-surface border border-border-subtle flex items-center justify-center mx-auto text-primary-sage">
          <Newspaper className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-text-primary tracking-tight">
            {isEn ? "Article Not Found" : "Artikel Tidak Ditemukan"}
          </h1>
          <p className="text-sm text-text-muted leading-relaxed max-w-md mx-auto">
            {isEn
              ? "The article or herbal insight you are looking for is no longer available or the link might be incorrect."
              : "Berita atau edukasi herbal yang Anda tuju mungkin telah dipindahkan atau tautan yang dimasukkan tidak tepat."}
          </p>
        </div>
        <div className="pt-2">
          <Link href="/news">
            <TijarahButton tijarahVariant="primary" className="font-bold text-xs h-10 px-5 rounded-xl">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              {isEn ? "Back to News & Insights" : "Kembali ke Berita & Edukasi"}
            </TijarahButton>
          </Link>
        </div>
      </div>
    );
  }

  const displayTitle = isEn && article.titleEn ? article.titleEn : article.title;
  const displaySummary = isEn && article.summaryEn ? article.summaryEn : article.summary;
  const displayContent = isEn && article.contentEn ? article.contentEn : article.content;

  // Detect whether content is HTML
  const hasHtmlContent = /<[a-z][\s\S]*>/i.test(displayContent);

  return (
    <article className="min-h-screen pb-16 pt-2">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        {/* 1. Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-text-muted">
          <Link href="/" className="hover:text-primary-sage transition-colors">
            {isEn ? "Home" : "Beranda"}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-border-subtle" />
          <Link href="/news" className="hover:text-primary-sage transition-colors">
            {isEn ? "News & Herbal Insights" : "Berita & Edukasi"}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-border-subtle" />
          <span className="text-text-primary font-medium truncate max-w-[200px] sm:max-w-xs">
            {displayTitle}
          </span>
        </nav>

        {/* 2. Article Header */}
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <TijarahBadge tijarahVariant="primary" className="text-xs font-bold px-3 py-1">
              {article.category || (isEn ? "HERBAL INSIGHT" : "EDUKASI HERBA")}
            </TijarahBadge>
            <span className="inline-flex items-center gap-1 text-[11px] text-text-muted bg-surface border border-border-subtle px-2.5 py-1 rounded-full">
              <Clock className="w-3 h-3 text-primary-sage" />
              <span>
                {readingTimeMinutes} {isEn ? "min read" : "menit baca"}
              </span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-[40px] font-black tracking-tight text-text-primary leading-[1.2]">
            {displayTitle}
          </h1>

          {/* Author and Date Bar with Social Share */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-y border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-sage/15 border border-primary-sage/30 flex items-center justify-center text-primary-sage font-bold text-sm shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-text-primary leading-tight">
                  {article.authorName || "Admin BC 3 Bukittinggi"}
                </p>
                <p className="text-[11px] text-text-muted flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(article.publishedAt || article.createdAt || new Date().toISOString())}</span>
                  <span>•</span>
                  <span>BC HNI 3 Bukittinggi</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                title={isEn ? "Share on WhatsApp" : "Bagikan ke WhatsApp"}
                className="h-8 px-3 rounded-lg border border-border-subtle bg-surface hover:bg-surface-hover hover:border-primary-sage/40 text-xs font-semibold text-text-primary inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-primary-sage" />
                <span>WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                title={isEn ? "Copy Article URL" : "Salin Tautan Artikel"}
                className="h-8 px-3 rounded-lg border border-border-subtle bg-surface hover:bg-surface-hover hover:border-primary-sage/40 text-xs font-semibold text-text-primary inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-success" />
                    <span className="text-success">{isEn ? "Copied" : "Tersalin"}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-text-muted" />
                    <span>{isEn ? "Copy Link" : "Salin Link"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* 3. Hero Thumbnail */}
        {article.thumbnailUrl && (
          <div className="rounded-2xl overflow-hidden border border-border-subtle bg-canvas shadow-sm">
            <img
              src={article.thumbnailUrl}
              alt={article.title}
              className="w-full max-h-[460px] object-cover object-center"
            />
          </div>
        )}

        {/* 4. Article Summary / Lead Quote Box */}
        {displaySummary && (
          <div className="rounded-xl border-l-4 border-primary-sage bg-primary-sage/5 p-4 sm:p-5 text-sm sm:text-base leading-relaxed text-text-primary italic">
            &ldquo;{displaySummary}&rdquo;
          </div>
        )}

        {/* 5. Article Main Content Body */}
        <section className="article-content text-text-primary text-sm sm:text-base leading-relaxed space-y-4">
          {hasHtmlContent ? (
            <div
              className="prose prose-sm sm:prose-base max-w-none text-text-primary leading-relaxed
                prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-text-primary
                prose-p:leading-relaxed prose-p:my-3 prose-p:text-text-secondary
                prose-strong:text-text-primary prose-strong:font-bold
                prose-ul:list-disc prose-ul:pl-5 prose-ol:list-decimal prose-ol:pl-5
                prose-li:my-1 prose-li:text-text-secondary
                prose-blockquote:border-l-4 prose-blockquote:border-primary-sage prose-blockquote:pl-4 prose-blockquote:italic
                prose-img:rounded-xl prose-img:border prose-img:border-border-subtle"
              dangerouslySetInnerHTML={{ __html: displayContent }}
            />
          ) : (
            <div className="whitespace-pre-line text-text-secondary leading-relaxed space-y-3 font-normal">
              {displayContent}
            </div>
          )}
        </section>

        {/* 6. Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="pt-4 border-t border-border-subtle flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-text-muted mr-1">Tags:</span>
            {article.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-xs font-medium text-text-secondary bg-surface border border-border-subtle px-2.5 py-1 rounded-md"
              >
                #{tag.trim()}
              </span>
            ))}
          </div>
        )}

        {/* 6.5 Highlighted Tagged Products (#5EA17B35) */}
        {article.taggedProducts && article.taggedProducts.length > 0 && (
          <section className="p-5 rounded-2xl border border-primary-sage/25 bg-primary-sage/5 space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-primary-sage">
              {isEn ? "Featured Products in This Article" : "Produk Terkait dalam Artikel Ini"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {article.taggedProducts.map((prod) => (
                <Link
                  key={prod.id}
                  href={`/products/${prod.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border-subtle bg-surface hover:border-primary-sage/60 transition-colors"
                >
                  {prod.imageUrl ? (
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="w-12 h-12 rounded-lg object-cover border border-border-subtle shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-canvas border border-border-subtle shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-text-primary truncate">{prod.name}</p>
                    <p className="text-[11px] font-mono text-text-muted">{prod.sku}</p>
                    {prod.normalPrice && (
                      <p className="text-xs font-extrabold text-primary-sage mt-0.5">
                        Rp {Number(prod.normalPrice).toLocaleString("id-ID")}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-primary-sage shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 7. Bottom Navigation & Share Actions */}
        <div className="p-6 rounded-2xl border border-border-subtle bg-surface/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-bold text-text-primary">
              {isEn ? "Helpful article?" : "Apakah artikel ini bermanfaat?"}
            </p>
            <p className="text-xs text-text-muted">
              {isEn
                ? "Share this herbal insight with family, colleagues, or fellow HNI agents."
                : "Bagikan wawasan herba resmi ini kepada keluarga, kerabat, atau sesama mitra agen HNI."}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="h-9 px-4 rounded-xl bg-primary-sage text-white text-xs font-bold hover:bg-primary-dark transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{isEn ? "Share Article" : "Bagikan Artikel"}</span>
            </button>
            <Link href="/news">
              <TijarahButton
                tijarahVariant="outline"
                className="text-xs font-bold h-9 px-4 rounded-xl"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                {isEn ? "All Articles" : "Semua Berita"}
              </TijarahButton>
            </Link>
          </div>
        </div>

        {/* 8. Related Articles Section */}
        {related.length > 0 && (
          <section className="pt-10 border-t border-border-subtle space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary-sage">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isEn ? "Recommended Reading" : "Rekomendasi Bacaan Lainnya"}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight mt-0.5">
                  {isEn ? "Related Herbal Stories" : "Artikel Terkait & Kabar Gerai"}
                </h3>
              </div>
              <Link
                href="/news"
                className="text-xs font-bold text-primary-sage hover:underline hidden sm:inline-flex items-center gap-1"
              >
                {isEn ? "View all" : "Lihat semua"}
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {related.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/news/${rel.id}`}
                  className="group rounded-xl border border-border-subtle bg-surface overflow-hidden hover:border-primary-sage/60 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="h-36 bg-canvas border-b border-border-subtle overflow-hidden flex items-center justify-center">
                      {rel.thumbnailUrl ? (
                        <img
                          src={rel.thumbnailUrl}
                          alt={rel.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Newspaper className="w-8 h-8 text-primary-sage/50" />
                      )}
                    </div>
                    <div className="p-4 space-y-1.5">
                      <TijarahBadge tijarahVariant="primary" className="text-[9px] font-bold">
                        {rel.category || (isEn ? "Article" : "Artikel")}
                      </TijarahBadge>
                      <h4 className="text-sm font-bold text-text-primary line-clamp-2 group-hover:text-primary-sage transition-colors leading-snug">
                        {rel.title}
                      </h4>
                      {rel.summary && (
                        <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed">
                          {rel.summary}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="px-4 py-2.5 border-t border-border-subtle flex items-center justify-between text-[10px] text-text-muted">
                    <span>{formatDate(rel.publishedAt || rel.createdAt || new Date().toISOString())}</span>
                    <span className="font-bold text-primary-sage inline-flex items-center gap-0.5">
                      {isEn ? "Read" : "Baca"} &rarr;
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
};

export default NewsArticleView;
