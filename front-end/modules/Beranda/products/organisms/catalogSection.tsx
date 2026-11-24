import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { Star, Sparkles, ShoppingBag } from "lucide-react";
import { catalogProducts } from "../data";

interface ICatalogItem {
    id: string;
    name: string;
    category: string;
    hkPrice: string;
    haPrice: string;
    points: string;
    rating: string;
    sold: string;
    image: string;
    description?: string;
    isFraction?: boolean;
    allowAgentPrice?: boolean;
}

export const Catalog = async () => {
    const t = await getTranslations("Products");

    let displayProducts: ICatalogItem[] = catalogProducts.map(p => ({
        id: String(p.id),
        name: p.name,
        category: p.category,
        hkPrice: p.hkPrice,
        haPrice: p.haPrice,
        points: p.points,
        rating: p.rating,
        sold: p.sold,
        image: p.image,
        description: "Produk herbal alami teruji klinis dan bersertifikat halal dari HNI.",
        isFraction: false,
        allowAgentPrice: true
    }));

    try {
        const { getBackendApiBaseUrl } = await import("@/lib/api/baseUrl");
        const beUrl = getBackendApiBaseUrl();
        const res = await fetch(`${beUrl}/products`, {
            cache: "no-store"
        });
        if (res.ok) {
            const json = await res.json();
            const list = json.data ?? json;
            if (Array.isArray(list) && list.length > 0) {
                displayProducts = list.map((item: any) => ({
                    id: String(item.id),
                    name: String(item.name),
                    category: String(item.category || "Herbal"),
                    hkPrice: `Rp ${Number(item.normalPrice || 0).toLocaleString("id-ID")}`,
                    haPrice: `Rp ${Number(item.allowAgentPrice === false ? item.normalPrice : (item.agentPrice || item.normalPrice)).toLocaleString("id-ID")}`,
                    points: item.isFraction ? "0 TP" : `${item.tpPoints || 0} TP`,
                    rating: item.rating ? String(item.rating) : "5.0",
                    sold: item.sold ? String(item.sold) : "0",
                    image: item.imageUrl || "",
                    description: item.description || "Formula herbal berkualitas tinggi untuk menunjang kesehatan optimal sehari-hari.",
                    isFraction: Boolean(item.isFraction),
                    allowAgentPrice: item.allowAgentPrice !== false
                }));
            }
        }
    } catch (err) {
        console.warn("[Catalog] Menggunakan data fallback katalog lokal:", err);
    }

    return (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayProducts.map((product) => {
                const isFraction = product.isFraction || product.allowAgentPrice === false;
                const activePrice = isFraction ? product.hkPrice : product.haPrice;

                return (
                    <div
                        key={product.id}
                        className="group relative flex flex-col justify-between rounded-[26px] border border-border-subtle bg-surface shadow-none hover:border-primary-sage/50 transition-all duration-300 overflow-hidden"
                    >
                        {/* 1. Area Media Foto Produk Full-Bleed (Sesuai Referensi) */}
                        <Link href={`/products/${product.id}`} className="block relative w-full aspect-[4/3] bg-canvas overflow-hidden border-b border-border-subtle/40">
                            <div className="w-full h-full flex flex-col items-center justify-center text-text-muted gap-1 bg-canvas group-hover:scale-105 transition-transform duration-500 ease-out">
                                <ShoppingBag className="w-10 h-10 stroke-[1.2]" />
                                <span className="text-[10px] uppercase font-semibold tracking-wider">HNI Official</span>
                            </div>

                            {/* Floating Badge Kiri Atas */}
                            <div className="absolute top-3 left-3 flex items-center gap-1.5 pointer-events-none">
                                {isFraction ? (
                                    <span className="text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full bg-amber-500 text-white shadow-xs">
                                        Eceran (0 TP)
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full bg-surface/90 text-text-primary backdrop-blur-md border border-border-subtle/60 shadow-xs">
                                        {t("agentPriceLabel")}
                                    </span>
                                )}
                            </div>

                            {/* Floating Badge Poin Kanan Atas */}
                            {!isFraction && (
                                <div className="absolute top-3 right-3 pointer-events-none">
                                    <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-accent-gold text-white shadow-xs">
                                        <Sparkles className="w-2.5 h-2.5" />
                                        {product.points}
                                    </span>
                                </div>
                            )}
                        </Link>

                        {/* 2. Area Konten Teks & Tipografi (Sesuai Referensi) */}
                        <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3">
                            <div className="flex flex-col gap-1.5">
                                {/* Baris 1: Judul di Kiri & Harga di Kanan */}
                                <div className="flex items-baseline justify-between gap-2">
                                    <Link href={`/products/${product.id}`} className="min-w-0 flex-1">
                                        <h3 className="font-semibold text-text-primary text-sm sm:text-base leading-snug line-clamp-1 hover:text-primary-sage transition-colors">
                                            {product.name}
                                        </h3>
                                    </Link>
                                    <span className="font-bold text-text-primary text-sm sm:text-base tracking-tight shrink-0 text-right">
                                        {activePrice}
                                    </span>
                                </div>

                                {/* Baris 2: Deskripsi Singkat Mengalir di Bawah Judul */}
                                <p className="text-xs text-text-muted leading-relaxed line-clamp-2">
                                    {product.description}
                                </p>
                            </div>

                            {/* Baris 3: Kategori/Rating di Kiri & Tombol Kapsul Beli di Kanan Bawah */}
                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border-subtle/40 mt-auto">
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider truncate">
                                        {product.category}
                                    </span>
                                    <div className="flex items-center gap-1 text-[10px] text-text-muted">
                                        <Star className="w-2.5 h-2.5 fill-status-warning text-status-warning" />
                                        <span>{product.rating}</span>
                                        {!isFraction && (
                                            <span className="line-through text-text-muted font-normal ml-1">
                                                {product.hkPrice}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <Link href={`/products/${product.id}`} className="shrink-0">
                                    <button
                                        type="button"
                                        className="rounded-full px-5 py-1.5 h-8 text-xs font-semibold bg-primary-sage hover:bg-primary-dark text-white transition-colors cursor-pointer shadow-none flex items-center gap-1.5"
                                    >
                                        <ShoppingBag className="w-3.5 h-3.5" />
                                        <span>Beli</span>
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                );
            })}
        </section>
    );
};