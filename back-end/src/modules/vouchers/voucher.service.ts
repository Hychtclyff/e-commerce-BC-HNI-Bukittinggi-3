import { db } from "@/prisma/db";
import { AppError } from "@/utils/AppError";
import { SupportedLanguage, t } from "@/i18n";

export const injectedVouchers = [
    {
        code: "DISKONHNI10K",
        title: "Voucher Diskon Rp 10.000 Herbal HNI",
        discountType: "FIXED",
        discountValue: 10000,
        minPurchase: 100000,
        maxDiscount: undefined,
        validUntil: "2026-12-31T23:59:59.000Z",
        isActive: true,
        description: "Potongan harga Rp 10.000 untuk minimal belanja produk HNI Rp 100.000",
    },
    {
        code: "AGENHNI15",
        title: "Diskon Khusus Agen 15%",
        discountType: "PERCENTAGE",
        discountValue: 15,
        minPurchase: 250000,
        maxDiscount: 50000,
        validUntil: "2026-12-31T23:59:59.000Z",
        isActive: true,
        description: "Diskon 15% maksimal Rp 50.000 untuk belanja minimal Rp 250.000",
    },
    {
        code: "FREEONGKIRBC3",
        title: "Subsidi Ongkir Rp 15.000 Kurir BC3",
        discountType: "SHIPPING_SUBSIDY",
        discountValue: 15000,
        minPurchase: 150000,
        maxDiscount: undefined,
        validUntil: "2026-12-31T23:59:59.000Z",
        isActive: true,
        description: "Subsidi ongkos kirim hingga Rp 15.000 khusus kurir lokal BC3 Bukittinggi",
    },
];

export interface VoucherCustomRule {
    field: "SUBTOTAL" | "TOTAL_QTY" | "TOTAL_TP_POINTS";
    operator: ">=" | "<=" | "==";
    value: number;
}

export interface VoucherConditionsPayload {
    audienceTypes?: string[];
    targetAudience?: string;
    targetUserIds?: string[];
    minPurchaseCount?: number;
    minTransactionAmount?: number;
    maxDiscountAmount?: number;
    minItemsCount?: number;
    maxUsagePerUser?: number;
    allowedPaymentMethods?: string[];
    paymentMethodRestriction?: string;
    allowedCategories?: string[];
    categoryRestriction?: string;
    allowedProductSkus?: string[];
    validFrom?: string;
    allowedDaysOfWeek?: number[];
    allowedShippingTypes?: string[];
    applicableChannels?: string[];
    autoApply?: boolean;
    stackable?: boolean;
    customRules?: VoucherCustomRule[];
}

export interface ValidateVoucherContext {
    paymentMethod?: string;
    shippingType?: string;
    channel?: string;
    items?: Array<{
        productId?: string;
        sku?: string;
        category?: string;
        qty?: number;
        tpPoints?: number;
    }>;
}

function normalizePaymentMethodGroup(pm?: string): string[] {
    const val = String(pm || "").toUpperCase();
    if (!val) return [];
    if (val === "CASH_STORE" || val === "CASH_ONLY") return ["CASH_STORE", "CASH_ONLY"];
    if (val === "QRIS_MOCKUP" || val === "BANK_TRANSFER_MOCKUP" || val === "TRANSFER_QRIS") {
        return [val, "TRANSFER_QRIS"];
    }
    return [val];
}

function normalizeCategoryGroup(cat?: string): string[] {
    const val = String(cat || "").toUpperCase();
    if (!val) return [];
    if (val.includes("HERB")) return [val, "HERBAL_ONLY", "HERBAL"];
    if (val.includes("BEVERAGE") || val.includes("MINUM") || val.includes("KOPI")) {
        return [val, "BEVERAGE_ONLY", "BEVERAGE"];
    }
    if (val.includes("COSMETIC") || val.includes("KOSMETIK")) {
        return [val, "COSMETICS_ONLY", "COSMETICS"];
    }
    return [val];
}

export const voucherService = {
    async getUserVouchers(userId?: string, lang: SupportedLanguage = 'id') {
        try {
            let vouchers = await db.orm.promotions.Voucher
                .where({ isActive: true })
                .all();

            // Injeksi data seeder voucher jika tabel voucher belum memiliki data
            if (vouchers.length === 0) {
                for (const item of injectedVouchers) {
                    await db.orm.promotions.Voucher.create(item as any);
                }
                vouchers = await db.orm.promotions.Voucher
                    .where({ isActive: true })
                    .all();
            }

            if (!userId) {
                return vouchers.map(v => ({
                    ...v,
                    isClaimed: false,
                    isUsed: false,
                }));
            }

            const userVouchers = await db.orm.promotions.UserVoucher
                .where({ userId })
                .all();

            const userVoucherMap = new Map(userVouchers.map(uv => [uv.voucherId, uv]));

            return vouchers.map(v => {
                const uv = userVoucherMap.get(v.id);
                return {
                    ...v,
                    isClaimed: !!uv,
                    isUsed: uv ? uv.isUsed : false,
                };
            });
        } catch (error: any) {
            throw new AppError(t('vouchers.get_vouchers_failed', { message: error.message }, lang), 500);
        }
    },

    async validateVoucher(
        code: string,
        subtotal: number,
        shippingCost: number = 0,
        lang: SupportedLanguage = 'id',
        userId?: string,
        context?: ValidateVoucherContext
    ) {
        try {
            let voucher = await db.orm.promotions.Voucher
                .where({ code: code.toUpperCase(), isActive: true })
                .first();

            // Fallback ke injected data seeder jika belum ter-insert
            if (!voucher) {
                const dummyMatch = injectedVouchers.find(v => v.code === code.toUpperCase());
                if (dummyMatch) {
                    voucher = await db.orm.promotions.Voucher.create(dummyMatch as any);
                }
            }

            if (!voucher) {
                throw new AppError(t('vouchers.voucher_invalid', {}, lang), 400);
            }

            const nowMs = Date.now();
            if (voucher.validUntil && new Date(voucher.validUntil).getTime() < nowMs) {
                throw new AppError(t('vouchers.voucher_invalid', {}, lang), 400);
            }

            const quota = Number((voucher as any).quota ?? 0);
            const usedCount = Number((voucher as any).usedCount ?? 0);
            if (quota > 0 && usedCount >= quota) {
                throw new AppError(t('vouchers.voucher_quota_exhausted', {}, lang), 400);
            }

            const rawConditions = ((voucher as any).conditions || {}) as VoucherConditionsPayload;

            // 1. Valid From Window
            if (rawConditions.validFrom) {
                const fromMs = new Date(rawConditions.validFrom).getTime();
                if (!isNaN(fromMs) && nowMs < fromMs) {
                    throw new AppError(
                        t('vouchers.voucher_not_started', { validFrom: rawConditions.validFrom.slice(0, 10) }, lang),
                        400
                    );
                }
            }

            // 2. Day of Week Window (gunakan WIB UTC+7 agar selaras dengan jadwal toko Indonesia)
            if (Array.isArray(rawConditions.allowedDaysOfWeek) && rawConditions.allowedDaysOfWeek.length > 0) {
                const allowedDays = rawConditions.allowedDaysOfWeek.map((d) => Number(d)).filter((d) => !Number.isNaN(d));
                const wibNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
                const todayDay = wibNow.getUTCDay();
                if (allowedDays.length > 0 && !allowedDays.includes(todayDay)) {
                    throw new AppError(t('vouchers.day_of_week_not_allowed', {}, lang), 400);
                }
            }

            // 3. Per-user usage limit
            const maxUsagePerUser = Number(rawConditions.maxUsagePerUser ?? 1);
            if (userId && userId !== "GUEST_USER") {
                const userVoucher = await db.orm.promotions.UserVoucher
                    .where({ userId, voucherId: voucher.id })
                    .first();
                const userUsage = Number((userVoucher as any)?.usageCount ?? (userVoucher?.isUsed ? 1 : 0));
                if (maxUsagePerUser > 0 && userUsage >= maxUsagePerUser) {
                    throw new AppError(t('vouchers.voucher_already_used', {}, lang), 400);
                }
            }

            // 4. Min Purchase (ambil nilai terbesar antara kolom voucher dan kondisi dinamis)
            const effectiveMinPurchase = Math.max(
                Number(voucher.minPurchase || 0),
                Number(rawConditions.minTransactionAmount || 0)
            );
            if (subtotal < effectiveMinPurchase) {
                throw new AppError(
                    t('vouchers.min_purchase_not_met', { minPurchase: effectiveMinPurchase }, lang),
                    400
                );
            }

            // 5. Audience & History Rules (Multi-Syarat AND)
            const audiences = Array.isArray(rawConditions.audienceTypes) && rawConditions.audienceTypes.length > 0
                ? rawConditions.audienceTypes
                : rawConditions.targetAudience && rawConditions.targetAudience !== "ALL"
                ? [rawConditions.targetAudience]
                : [];

            if (audiences.length > 0 || (rawConditions.minPurchaseCount && rawConditions.minPurchaseCount > 0)) {
                const isGuest = !userId || userId === "GUEST_USER";
                if (audiences.includes("SPECIFIC_USERS")) {
                    const allowedUsers = rawConditions.targetUserIds || [];
                    if (isGuest || !allowedUsers.includes(userId)) {
                        throw new AppError(t('vouchers.audience_specific_users_only', {}, lang), 400);
                    }
                }

                if (audiences.includes("AGENTS_ONLY") || audiences.includes("CONSUMERS_ONLY")) {
                    const hniProfile = !isGuest
                        ? await db.orm.core_auth.HNIProfile.where({ userId }).first()
                        : null;
                    const isAgent = Boolean(hniProfile?.hniMemberId);
                    if (audiences.includes("AGENTS_ONLY") && !isAgent) {
                        throw new AppError(t('vouchers.audience_agents_only', {}, lang), 400);
                    }
                    if (audiences.includes("CONSUMERS_ONLY") && isAgent) {
                        throw new AppError(t('vouchers.audience_consumers_only', {}, lang), 400);
                    }
                }

                if (audiences.includes("FIRST_TIME_BUYER") || (rawConditions.minPurchaseCount && rawConditions.minPurchaseCount > 0)) {
                    const userOrders = !isGuest
                        ? await db.orm.orders.Order.where({ userId }).all()
                        : [];
                    const completedOrders = userOrders.filter((o) => o.orderStatus === "COMPLETED");
                    if (audiences.includes("FIRST_TIME_BUYER") && userOrders.length > 0) {
                        throw new AppError(t('vouchers.audience_first_time_only', {}, lang), 400);
                    }
                    if (rawConditions.minPurchaseCount && completedOrders.length < rawConditions.minPurchaseCount) {
                        throw new AppError(
                            t('vouchers.min_history_not_met', { minCount: rawConditions.minPurchaseCount }, lang),
                            400
                        );
                    }
                }
            }

            // 6. Payment Method Restriction (Multi-Select)
            const allowedPayments = Array.isArray(rawConditions.allowedPaymentMethods) && rawConditions.allowedPaymentMethods.length > 0
                ? rawConditions.allowedPaymentMethods
                : rawConditions.paymentMethodRestriction && rawConditions.paymentMethodRestriction !== "ALL"
                ? [rawConditions.paymentMethodRestriction]
                : [];
            if (allowedPayments.length > 0 && context?.paymentMethod) {
                const pmGroups = normalizePaymentMethodGroup(context.paymentMethod);
                const ok = allowedPayments.some((ap) => pmGroups.includes(ap.toUpperCase()));
                if (!ok) {
                    throw new AppError(t('vouchers.payment_method_not_allowed', {}, lang), 400);
                }
            }

            // 6b. Shipping Type & Channel Restriction
            if (
                Array.isArray(rawConditions.allowedShippingTypes) &&
                rawConditions.allowedShippingTypes.length > 0 &&
                context?.shippingType
            ) {
                const st = context.shippingType.toUpperCase();
                if (!rawConditions.allowedShippingTypes.map((s) => s.toUpperCase()).includes(st)) {
                    throw new AppError(t('vouchers.shipping_type_not_allowed', {}, lang), 400);
                }
            }

            if (
                Array.isArray(rawConditions.applicableChannels) &&
                rawConditions.applicableChannels.length > 0 &&
                context?.channel
            ) {
                const ch = context.channel.toUpperCase();
                if (!rawConditions.applicableChannels.map((c) => c.toUpperCase()).includes(ch)) {
                    throw new AppError(t('vouchers.channel_not_allowed', {}, lang), 400);
                }
            }

            // 7. Cart Items Rules (Min Items, Categories, Specific SKUs, Custom Rules)
            const items = context?.items || [];
            const totalQty = items.reduce((s, it) => s + Number(it.qty || 1), 0);
            const totalTpPoints = items.reduce((s, it) => s + Number(it.tpPoints || 0) * Number(it.qty || 1), 0);

            if (rawConditions.minItemsCount && rawConditions.minItemsCount > 1 && items.length > 0) {
                if (totalQty < rawConditions.minItemsCount) {
                    throw new AppError(
                        t('vouchers.min_items_not_met', { minItems: rawConditions.minItemsCount }, lang),
                        400
                    );
                }
            }

            const allowedCats = Array.isArray(rawConditions.allowedCategories) && rawConditions.allowedCategories.length > 0
                ? rawConditions.allowedCategories
                : rawConditions.categoryRestriction && rawConditions.categoryRestriction !== "ALL"
                ? [rawConditions.categoryRestriction]
                : [];
            if (allowedCats.length > 0 && items.length > 0) {
                const hasMatchingCategory = items.some((it) => {
                    const groups = normalizeCategoryGroup(it.category);
                    return allowedCats.some((ac) => groups.includes(ac.toUpperCase()));
                });
                if (!hasMatchingCategory) {
                    throw new AppError(t('vouchers.category_not_allowed', {}, lang), 400);
                }
            }

            if (Array.isArray(rawConditions.allowedProductSkus) && rawConditions.allowedProductSkus.length > 0 && items.length > 0) {
                const allowedSet = new Set(rawConditions.allowedProductSkus.map((s) => s.toUpperCase()));
                const hasSku = items.some((it) => it.sku && allowedSet.has(it.sku.toUpperCase()));
                if (!hasSku) {
                    throw new AppError(t('vouchers.product_not_allowed', {}, lang), 400);
                }
            }

            if (Array.isArray(rawConditions.customRules) && rawConditions.customRules.length > 0) {
                for (const rule of rawConditions.customRules) {
                    const actual =
                        rule.field === "SUBTOTAL"
                            ? subtotal
                            : rule.field === "TOTAL_QTY"
                            ? totalQty
                            : totalTpPoints;
                    if (rule.field !== "SUBTOTAL" && items.length === 0) continue;
                    const targetVal = Number(rule.value || 0);
                    const pass =
                        rule.operator === ">="
                            ? actual >= targetVal
                            : rule.operator === "<="
                            ? actual <= targetVal
                            : actual === targetVal;
                    if (!pass) {
                        throw new AppError(t('vouchers.custom_rule_not_met', {}, lang), 400);
                    }
                }
            }

            // 8. Hitung Diskon (hormati maxDiscount & conditions.maxDiscountAmount)
            const maxCap =
                Number(rawConditions.maxDiscountAmount || 0) > 0
                    ? Number(rawConditions.maxDiscountAmount)
                    : voucher.maxDiscount
                    ? Number(voucher.maxDiscount)
                    : undefined;

            let discountAmount = 0;
            if (voucher.discountType === "FIXED") {
                discountAmount = Math.min(voucher.discountValue, subtotal);
                if (maxCap) discountAmount = Math.min(discountAmount, maxCap);
            } else if (voucher.discountType === "PERCENTAGE" || voucher.discountType === "PERCENT") {
                const calculated = (subtotal * voucher.discountValue) / 100;
                discountAmount = maxCap ? Math.min(calculated, maxCap) : calculated;
            } else if (voucher.discountType === "SHIPPING_SUBSIDY") {
                discountAmount = Math.min(voucher.discountValue, shippingCost);
                if (maxCap) discountAmount = Math.min(discountAmount, maxCap);
            }

            return {
                voucher,
                discountAmount,
            };
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            throw new AppError(t('vouchers.get_vouchers_failed', { message: error.message }, lang), 500);
        }
    },

    async markVoucherUsed(userId: string, voucherId: string) {
        if (!voucherId) return;
        const now = new Date().toISOString();

        const voucher = await db.orm.promotions.Voucher.where({ id: voucherId }).first();
        if (voucher) {
            const currentUsed = Number((voucher as any).usedCount ?? 0);
            await db.orm.promotions.Voucher.where({ id: voucherId }).update({
                usedCount: currentUsed + 1,
            } as any);
        }

        if (!userId || userId === "GUEST_USER") return;
        const existing = await db.orm.promotions.UserVoucher
            .where({ userId, voucherId })
            .first();
        if (existing) {
            const prevCount = Number((existing as any).usageCount ?? (existing.isUsed ? 1 : 0));
            await db.orm.promotions.UserVoucher
                .where({ id: existing.id })
                .update({ isUsed: true, usageCount: prevCount + 1, usedAt: now } as any);
        } else {
            await db.orm.promotions.UserVoucher.create({
                userId,
                voucherId,
                isUsed: true,
                usageCount: 1,
                usedAt: now,
            } as any);
        }
    }
};
