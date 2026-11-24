import { Metadata } from "next";
import { notFound } from "next/navigation";
import { initialShopProducts } from "@/modules/shop/api/shop.api";
import { ShopProduct } from "@/modules/shop/types/shop.types";
import ProductDetailClient from "./ProductDetailClient";
import { getBackendApiBaseUrl } from "@/lib/api/baseUrl";

interface Props {
  params: Promise<{
    lang: string;
    id: string;
  }>;
}

async function getProductById(id: string): Promise<ShopProduct | null> {
  // Cek database via API backend
  try {
    const beUrl = getBackendApiBaseUrl();
    const res = await fetch(`${beUrl}/products/${id}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      const item = json.data ?? json;
      if (item && item.id) {
        return {
          id: String(item.id),
          name: String(item.name),
          sku: item.sku ? String(item.sku) : undefined,
          category: String(item.category || "Herbal"),
          categoryKey: "filterHealth",
          agentPrice: Number(item.allowAgentPrice === false ? item.normalPrice : (item.agentPrice || item.normalPrice)),
          normalPrice: Number(item.normalPrice),
          tpPoints: Number(item.tpPoints || 0),
          stock: Number(item.stock || 0),
          imageUrl: item.imageUrl || undefined,
          rating: item.rating ? String(item.rating) : "5.0",
          sold: item.sold ? String(item.sold) : "0",
          description: String(item.description || ""),
          isSeparable: Boolean(item.isSeparable),
          defaultBreakdownQty: item.defaultBreakdownQty ? Number(item.defaultBreakdownQty) : null,
          isFraction: Boolean(item.isFraction),
          parentProductId: item.parentProductId ? String(item.parentProductId) : null,
          allowAgentPrice: item.allowAgentPrice !== false,
        };
      }
    }
  } catch (e) {
    // Fallback jika backend offline
  }

  // Fallback ke initialShopProducts
  const local = initialShopProducts.find((p) => p.id === id);
  return local || null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return {
      title: "Produk Tidak Ditemukan | TIJARAH-3",
    };
  }

  return {
    title: `${product.name} | TIJARAH-3`,
    description: product.description || `Beli ${product.name} dengan harga terjangkau di TIJARAH-3.`,
    openGraph: {
      title: `${product.name} | TIJARAH-3`,
      description: product.description || `Produk halal & herba HNI resmi di BC HNI Bukittinggi 3.`,
      images: product.imageUrl ? [product.imageUrl] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  return <ProductDetailClient product={product} />;
}
