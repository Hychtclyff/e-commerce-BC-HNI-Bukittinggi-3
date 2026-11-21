"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  ShieldCheck,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { useLocale } from "next-intl";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahSelect } from "@/components/atom/tijarahSelect";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { ProductCard } from "@/components/molecules/ProductCard";
import { ShopProduct } from "../../types/shop.types";
import { formatCurrency } from "@/utils/formatters";
import { Link } from "@/lib/i18n/navigation";

export interface ShopCatalogSectionProps {
  products: ShopProduct[];
  isAgent: boolean;
  onAddToCart: (product: ShopProduct) => void;
}

type SortOption = "DEFAULT" | "NAME_ASC" | "PRICE_ASC" | "TP_DESC" | "STOCK_DESC";

export const ShopCatalogSection: React.FC<ShopCatalogSectionProps> = ({
  products,
  isAgent,
  onAddToCart,
}) => {
  const locale = useLocale();
  const isEn = locale === "en";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("DEFAULT");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = viewMode === "list" ? 24 : 16;

  const categories = useMemo(() => {
    const list = Array.from(new Set(products.map((p) => p.category || "Umum")));
    return ["ALL", ...list];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = products.filter((p) => {
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q) ||
        (p.sku || "").toLowerCase().includes(q);
      const matchCategory =
        selectedCategory === "ALL" || (p.category || "Umum") === selectedCategory;
      return matchSearch && matchCategory;
    });

    if (sortBy === "NAME_ASC") {
      return [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sortBy === "PRICE_ASC") {
      return [...list].sort((a, b) => {
        const pa = isAgent && a.allowAgentPrice !== false ? a.agentPrice : a.normalPrice;
        const pb = isAgent && b.allowAgentPrice !== false ? b.agentPrice : b.normalPrice;
        return pa - pb;
      });
    }
    if (sortBy === "TP_DESC") {
      return [...list].sort((a, b) => (b.tpPoints || 0) - (a.tpPoints || 0));
    }
    if (sortBy === "STOCK_DESC") {
      return [...list].sort((a, b) => (b.stock || 0) - (a.stock || 0));
    }
    return list;
  }, [products, searchQuery, selectedCategory, sortBy, isAgent]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortBy, viewMode]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + pageSize);

  return (
    <div className="flex flex-col gap-5">
      {/* Header & Compact Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
              {isEn ? "Herbal & BC3 Product Catalog" : "Katalog Herba & Produk BC3"}
            </h2>
            <span className="text-[11px] font-bold text-text-muted bg-canvas px-2.5 py-0.5 rounded-full border border-border-subtle">
              {filteredProducts.length} {isEn ? "products" : "produk"}
            </span>
            {isAgent && (
              <span className="text-[11px] font-bold text-primary-sage bg-primary-sage/10 px-2.5 py-0.5 rounded-full border border-primary-sage/20 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                {isEn ? "Agent Price Active" : "Harga Agen Aktif"}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            {isEn
              ? "Browse authentic HNI products with real-time stock, pagination, and quick list view."
              : "Pilih produk herbal resmi HNI dengan stok riil, pagination ringkas, dan mode daftar cepat."}
          </p>
        </div>

        {/* Search + Sort + View Mode */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-full sm:w-64">
            <TijarahInput
              id="search-shop-products"
              placeholder={isEn ? "Search name or SKU..." : "Cari nama atau SKU..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startContent={<Search className="w-4 h-4 text-text-muted" />}
              className="text-xs"
            />
          </div>

          <div className="w-44">
            <TijarahSelect
              selectedKey={sortBy}
              onSelectionChange={(k) => {
                if (k) setSortBy(String(k) as SortOption);
              }}
              className="text-xs"
            >
              <TijarahSelect.Item id="DEFAULT">
                {isEn ? "Default Order" : "Urutan Default"}
              </TijarahSelect.Item>
              <TijarahSelect.Item id="NAME_ASC">
                {isEn ? "Name A - Z" : "Nama A - Z"}
              </TijarahSelect.Item>
              <TijarahSelect.Item id="PRICE_ASC">
                {isEn ? "Lowest Price" : "Harga Termurah"}
              </TijarahSelect.Item>
              <TijarahSelect.Item id="TP_DESC">
                {isEn ? "Highest TP" : "Poin TP Tertinggi"}
              </TijarahSelect.Item>
              <TijarahSelect.Item id="STOCK_DESC">
                {isEn ? "Highest Stock" : "Stok Terbanyak"}
              </TijarahSelect.Item>
            </TijarahSelect>
          </div>

          <div className="flex items-center rounded-xl border border-border-subtle bg-surface p-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              title={isEn ? "Grid View" : "Tampilan Grid"}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-primary-sage text-white"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              title={isEn ? "Quick List View" : "Tampilan Daftar Cepat"}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "bg-primary-sage text-white"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? "bg-primary-sage text-surface shadow-sm"
                  : "bg-surface border border-border-subtle text-text-muted hover:text-text-primary hover:border-primary-sage/40"
              }`}
            >
              {cat === "ALL" ? (isEn ? "All Categories" : "Semua Kategori") : cat}
            </button>
          );
        })}
      </div>

      {/* Products View */}
      {paginatedProducts.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {paginatedProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                id={prod.id}
                name={prod.name}
                category={prod.category}
                agentPrice={prod.agentPrice}
                normalPrice={prod.normalPrice}
                tpPoints={prod.tpPoints}
                stock={prod.stock}
                imageUrl={prod.imageUrl}
                description={prod.description}
                isAgent={isAgent}
                isFraction={prod.isFraction}
                isSeparable={prod.isSeparable}
                allowAgentPrice={prod.allowAgentPrice}
                onAddToCart={() => onAddToCart(prod)}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border-subtle bg-surface">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas/70 border-b border-border-subtle text-text-muted uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">{isEn ? "Product" : "Produk"}</th>
                  <th className="py-3 px-3">{isEn ? "Category" : "Kategori"}</th>
                  <th className="py-3 px-3 text-right">{isEn ? "Stock" : "Stok"}</th>
                  <th className="py-3 px-3 text-right">TP</th>
                  <th className="py-3 px-3 text-right">{isEn ? "Price" : "Harga"}</th>
                  <th className="py-3 px-4 text-right">{isEn ? "Action" : "Aksi"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {paginatedProducts.map((prod) => {
                  const activePrice =
                    isAgent && prod.allowAgentPrice !== false
                      ? prod.agentPrice
                      : prod.normalPrice;
                  return (
                    <tr key={prod.id} className="hover:bg-canvas/40 transition-colors">
                      <td className="py-2.5 px-4">
                        <Link
                          href={`/products/${prod.id}`}
                          className="font-bold text-text-primary hover:text-primary-sage transition-colors block"
                        >
                          {prod.name}
                        </Link>
                        {prod.sku && (
                          <span className="font-mono text-[10px] text-text-muted">{prod.sku}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-text-muted">{prod.category}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-text-primary">
                        {prod.stock}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-accent-gold">
                        {prod.tpPoints || 0}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-primary-sage">
                        {formatCurrency(activePrice)}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <TijarahButton
                          type="button"
                          size="sm"
                          tijarahVariant="primary"
                          isDisabled={prod.stock <= 0}
                          onClick={() => onAddToCart(prod)}
                          className="text-[11px] font-bold h-7 px-3 inline-flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>{isEn ? "Add" : "Tambah"}</span>
                        </TijarahButton>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="py-16 text-center rounded-3xl border border-dashed border-border-subtle bg-surface flex flex-col items-center justify-center p-6">
          <p className="text-sm font-bold text-text-primary">
            {isEn
              ? "No products match your search."
              : "Tidak ada produk yang sesuai dengan pencarian Anda."}
          </p>
          <p className="text-xs text-text-muted mt-1">
            {isEn
              ? "Try another keyword or select All Categories."
              : 'Coba gunakan kata kunci lain atau pilih kategori "Semua Kategori".'}
          </p>
        </div>
      )}

      {/* Pagination Bar */}
      {filteredProducts.length > pageSize && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface border border-border-subtle px-4 py-3 rounded-2xl text-xs">
          <span className="text-text-muted font-medium">
            {isEn
              ? `Showing ${startIndex + 1}-${Math.min(startIndex + pageSize, filteredProducts.length)} of ${filteredProducts.length} products`
              : `Menampilkan ${startIndex + 1}-${Math.min(startIndex + pageSize, filteredProducts.length)} dari ${filteredProducts.length} produk`}
          </span>

          <div className="flex items-center gap-1.5 flex-wrap">
            <TijarahButton
              type="button"
              size="sm"
              tijarahVariant="outline"
              isDisabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8 px-2.5 text-xs font-bold"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </TijarahButton>

            {Array.from({ length: totalPages }, (_, idx) => idx + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === totalPages ||
                  Math.abs(p - safePage) <= 1
              )
              .map((pageNum, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && pageNum - prev > 1;
                return (
                  <React.Fragment key={pageNum}>
                    {showEllipsis && (
                      <span className="px-1.5 text-text-muted">...</span>
                    )}
                    <TijarahButton
                      type="button"
                      size="sm"
                      tijarahVariant={pageNum === safePage ? "primary" : "outline"}
                      onClick={() => setCurrentPage(pageNum)}
                      className="h-8 min-w-8 px-2.5 text-xs font-bold"
                    >
                      {pageNum}
                    </TijarahButton>
                  </React.Fragment>
                );
              })}

            <TijarahButton
              type="button"
              size="sm"
              tijarahVariant="outline"
              isDisabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 px-2.5 text-xs font-bold"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </TijarahButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopCatalogSection;
