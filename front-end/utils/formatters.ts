/**
 * Utility functions for currency, date, and points formatting
 * Consistent with Tijarah-3 B2B standards
 */

/**
 * Format number to Indonesian Rupiah or localized currency string
 */
export function formatCurrency(
  amount: number,
  locale: string = "id-ID",
  currency: string = "IDR"
): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return "Rp 0";
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `Rp ${Math.round(amount).toLocaleString("id-ID")}`;
  }
}

/**
 * Format ISO date string or Date object to localized readable date
 */
export function formatDate(
  dateInput: string | Date | number,
  locale: string = "id-ID",
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return "-";

  const date = typeof dateInput === "object" ? dateInput : new Date(dateInput);

  if (isNaN(date.getTime())) return "-";

  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };

  try {
    return new Intl.DateTimeFormat(locale, options || defaultOptions).format(date);
  } catch {
    return date.toLocaleDateString(locale);
  }
}

/**
 * Format TP (Tijarah Points / Poin HSIS)
 */
export function formatPoints(points: number): string {
  if (!points || points <= 0) return "0 TP";
  return `${points.toLocaleString("id-ID")} TP`;
}
