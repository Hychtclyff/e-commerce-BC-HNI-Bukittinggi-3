import { VoucherItem } from "@/modules/vouchers/types/vouchers.types";
import { formatCurrency } from "./formatters";

const DAY_NAMES_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export interface VoucherEligibilityContext {
  subtotal: number;
  shippingType?: string;
  paymentMethod?: string;
}

/**
 * Mengembalikan alasan pelanggaran syarat voucher (null jika memenuhi semua syarat).
 */
export function getVoucherViolationReason(
  voucher: VoucherItem & {
    conditions?: any;
    quota?: number;
    usedCount?: number;
    validFrom?: string;
  },
  ctx: VoucherEligibilityContext
): string | null {
  const nowMs = Date.now();
  const cond = (voucher as any).conditions || {};

  if (voucher.validUntil) {
    const untilMs = new Date(voucher.validUntil).getTime();
    if (!Number.isNaN(untilMs) && untilMs < nowMs) {
      return "Masa berlaku voucher sudah berakhir";
    }
  }

  const validFrom = cond.validFrom || (voucher as any).validFrom;
  if (validFrom) {
    const fromMs = new Date(validFrom).getTime();
    if (!Number.isNaN(fromMs) && nowMs < fromMs) {
      return `Belum berlaku (mulai ${new Date(validFrom).toLocaleDateString("id-ID")})`;
    }
  }

  const quota = Number((voucher as any).quota ?? 0);
  const usedCount = Number((voucher as any).usedCount ?? 0);
  if (quota > 0 && usedCount >= quota) {
    return "Kuota pemakaian voucher sudah habis";
  }

  if (Array.isArray(cond.allowedDaysOfWeek) && cond.allowedDaysOfWeek.length > 0) {
    const allowedDays = cond.allowedDaysOfWeek.map((d: any) => Number(d)).filter((d: number) => !Number.isNaN(d));
    const wibNow = new Date(nowMs + 7 * 60 * 60 * 1000);
    const todayDay = wibNow.getUTCDay();
    if (allowedDays.length > 0 && !allowedDays.includes(todayDay)) {
      const dayLabels = allowedDays.map((d: number) => DAY_NAMES_ID[d] || String(d)).join(", ");
      return `Tidak sesuai jadwal (khusus hari ${dayLabels})`;
    }
  }

  if (Array.isArray(cond.allowedShippingTypes) && cond.allowedShippingTypes.length > 0 && ctx.shippingType) {
    const allowed = cond.allowedShippingTypes.map((s: string) => s.toUpperCase());
    if (!allowed.includes(ctx.shippingType.toUpperCase())) {
      return `Khusus pengiriman ${allowed.join(" / ")}`;
    }
  }

  if (Array.isArray(cond.allowedPaymentMethods) && cond.allowedPaymentMethods.length > 0 && ctx.paymentMethod) {
    const allowed = cond.allowedPaymentMethods.map((p: string) => p.toUpperCase());
    if (!allowed.includes(ctx.paymentMethod.toUpperCase())) {
      return `Khusus metode bayar ${allowed.join(" / ")}`;
    }
  }

  const minPurchase = Math.max(Number(voucher.minPurchase || 0), Number(cond.minTransactionAmount || 0));
  if (ctx.subtotal < minPurchase) {
    return `Minimal belanja ${formatCurrency(minPurchase)}`;
  }

  return null;
}
