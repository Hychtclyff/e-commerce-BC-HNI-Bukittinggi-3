import { db, pool } from "@/prisma/db";
import { AppError } from "@/utils/AppError";
import { SupportedLanguage, t } from "@/i18n";
import { GetProductsQuery } from "./products.schema";
import axios from "axios";
import { axiosClient } from "@/config/axios";
import { pgNumericColumn } from "@prisma/orm-postgres/target/codecs";

export const productsService = {
  async getHighlightProducts(limit = 8) {
    const safeLimit = Math.min(Math.max(Number(limit) || 8, 1), 24);
    const res = await pool.query(
      `SELECT
         p.id,
         p.sku,
         p.name,
         p.category,
         p."normalPrice",
         p."agentPrice",
         p."tpPoints",
         p.stock,
         p."imageUrl",
         p.description,
         p."isActive",
         COALESCE(SUM(oi.qty), 0)::int AS "soldCount"
       FROM products.products p
       LEFT JOIN orders.order_items oi ON oi."productId" = p.id
       WHERE p."isActive" = true AND p.stock > 0
       GROUP BY p.id
       ORDER BY COALESCE(SUM(oi.qty), 0) DESC, p."tpPoints" DESC, p.stock DESC
       LIMIT $1`,
      [safeLimit]
    );
    return res.rows;
  },

  async getProducts(query: GetProductsQuery, lang: SupportedLanguage = "id") {
    try {
      const res = await pool.query(
        `SELECT 
                    id, 
                    sku, 
                    name, 
                    category, 
                    "normalPrice", 
                    "agentPrice", 
                    "tpPoints", 
                    stock, 
                    "imageUrl", 
                    description, 
                    "isActive",
                    is_separable AS "isSeparable", 
                    default_breakdown_qty AS "defaultBreakdownQty", 
                    is_fraction AS "isFraction", 
                    parent_product_id AS "parentProductId", 
                    allow_agent_price AS "allowAgentPrice", 
                    reward_points AS "rewardPoints", 
                    physical_stock AS "physicalStock", 
                    point_stock AS "pointStock", 
                    "createdAt", 
                    "updatedAt"
                 FROM products.products
                 WHERE "isActive" = true AND stock > 0
                 ORDER BY "createdAt" DESC`,
      );

      let products = res.rows;

      if (query.search) {
        const s = query.search.toLowerCase();
        products = products.filter(
          (p: any) =>
            (p.name && p.name.toLowerCase().includes(s)) ||
            (p.sku && p.sku.toLowerCase().includes(s)),
        );
      }

      if (query.category) {
        const c = query.category.toUpperCase();
        products = products.filter(
          (p: any) => p.category && p.category.toUpperCase() === c,
        );
      }

      return products;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        t("products.get_products_failed", { message: error.message }, lang),
        500,
      );
    }
  },

  async getProductById(id: string, lang: SupportedLanguage = "id") {
    try {
      const res = await pool.query(
        `SELECT 
                    id, 
                    sku, 
                    name, 
                    category, 
                    "normalPrice", 
                    "agentPrice", 
                    "tpPoints", 
                    stock, 
                    "imageUrl", 
                    description, 
                    "isActive",
                    is_separable AS "isSeparable", 
                    default_breakdown_qty AS "defaultBreakdownQty", 
                    is_fraction AS "isFraction", 
                    parent_product_id AS "parentProductId", 
                    allow_agent_price AS "allowAgentPrice", 
                    reward_points AS "rewardPoints", 
                    physical_stock AS "physicalStock", 
                    point_stock AS "pointStock", 
                    "createdAt", 
                    "updatedAt"
                 FROM products.products
                 WHERE id = $1 AND "isActive" = true`,
        [id],
      );

      const product = res.rows[0];
      if (!product) {
        throw new AppError(t("products.product_not_found", {}, lang), 404);
      }
      return product;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        t("products.get_products_failed", { message: error.message }, lang),
        500,
      );
    }
  },

  async syncHsisProduct() {
    // hit endpoint hsis saldo
    const payload = {
      m: "",
      y: "",
      a: "",
      start: 0,
      limit: 1000,
    };
    const response = await axiosClient.post("/saldo-cabang/saldo", payload);
    const saldoList = response.data?.data?.saldo ?? response.data?.saldo ?? [];

    let syncedCount = 0;
    let skippedCount = 0;

    // 2. Iterasi berurutan agar aman untuk koneksi database
    for (const item of saldoList) {
      // Lewati jika kode SKU (pc) kosong
      if (!item.pc) {
        skippedCount++;
        continue;
      }

      const sku = String(item.pc).trim();
      const pointStock = Number(item.t ?? 0);
      const totalValue = Number(item.tv ?? 0);
      const totalValuePoints = Number(item.tvp ?? 0);
      const explicitAgentPrice = Number(item.ha ?? item.agentPrice ?? 0);
      const derivedAgentPrice =
        explicitAgentPrice > 0
          ? Math.round(explicitAgentPrice)
          : pointStock > 0 && totalValue > 0
          ? Math.round(totalValue / pointStock)
          : 0;
      const explicitNormalPrice = Number(
        item.hk ?? item.hj ?? item.hn ?? item.normalPrice ?? item.consumerPrice ?? 0
      );
      const derivedNormalPrice =
        explicitNormalPrice > 0
          ? Math.round(explicitNormalPrice)
          : derivedAgentPrice > 0
          ? Math.round((derivedAgentPrice * 1.2) / 5000) * 5000
          : 0;
      const derivedTpPoints =
        pointStock > 0 && totalValuePoints > 0
          ? Math.round(totalValuePoints / pointStock)
          : 0;

      const updatePayload: Record<string, any> = {
        // Selalu sinkronkan saldo poin/stok HSIS (so); stok fisik (stock) dan normalPrice tidak ditimpa
        pointStock,
      };
      if (derivedAgentPrice > 0) {
        updatePayload.agentPrice = derivedAgentPrice;
      }
      if (derivedTpPoints > 0) {
        updatePayload.tpPoints = derivedTpPoints;
      }

      await db.orm.products.Product.upsert({
        conflictOn: { sku },
        update: updatePayload,
        create: {
          sku,
          name: String(item.pn ?? sku).trim(),
          stock: pointStock,
          pointStock,
          physicalStock: pointStock,
          agentPrice: derivedAgentPrice,
          normalPrice: derivedNormalPrice,
          tpPoints: derivedTpPoints,
        },
      });
      syncedCount++;
    }

    return {
      totalFetched: saldoList.length,
      syncedCount,
      skippedCount,
    };
  },
};
