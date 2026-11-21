import { z } from "zod";

/**
 * Skema validasi form ERP Toko (Zod v4).
 *
 * Menggunakan z.preprocess untuk mengubah input string dari elemen form menjadi
 * tipe yang sesuai (number, boolean, array baris), sehingga form input tetap
 * kompatibel dengan react-hook-form dan menghasilkan output yang bersih.
 */

const IPV4_REGEX = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const PHONE_REGEX = /^(\+62|62|0)8\d{8,12}$/;

interface INumberOptions {
  min?: number;
  max?: number;
  isInteger?: boolean;
  requiredMessage?: string;
}

const numberField = ({
  min = 0,
  max,
  isInteger = false,
  requiredMessage = "Wajib diisi",
}: INumberOptions = {}) => {
  return z.preprocess((val) => {
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (trimmed === "") return undefined;
      const num = Number(trimmed);
      return Number.isNaN(num) ? val : num;
    }
    return val;
  }, (() => {
    let s = z.number({ error: requiredMessage });
    if (isInteger) s = s.int("Harus bilangan bulat");
    s = s.min(min, `Minimal ${min}`);
    if (max !== undefined) s = s.max(max, `Maksimal ${max}`);
    return s;
  })());
};

const optionalNumberField = (min = 0) => {
  return z.preprocess((val) => {
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (trimmed === "") return undefined;
      const num = Number(trimmed);
      return Number.isNaN(num) ? val : num;
    }
    return val;
  }, z.number({ error: "Harus berupa angka" }).min(min, `Minimal ${min}`).optional());
};

const optionalTextField = z.preprocess((val) => {
  if (typeof val === "string") {
    const trimmed = val.trim();
    return trimmed === "" ? undefined : trimmed;
  }
  return val;
}, z.string().optional());

const booleanField = z.preprocess((val) => {
  if (typeof val === "string") {
    return val === "true";
  }
  return Boolean(val);
}, z.boolean());

const linesField = (message: string) => {
  return z.preprocess((val) => {
    if (typeof val === "string") {
      return val
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
    }
    return val;
  }, z.array(z.string()).min(1, message));
};

// --- Inventori ---
export const inventorySchema = z
  .object({
    sku: z.string().trim().min(3, "SKU minimal 3 karakter").toUpperCase(),
    name: z.string().trim().min(3, "Nama produk minimal 3 karakter"),
    category: z.string().trim().min(2, "Kategori wajib diisi"),
    unit: z.string().trim().min(1, "Satuan wajib diisi"),
    stock: numberField({ isInteger: true }),
    safetyStock: numberField({ isInteger: true }),
    regularPrice: numberField({ min: 1 }),
    agentPrice: numberField({ min: 0 }),
    points: numberField({ isInteger: true }),
    expirationDate: optionalTextField,
    description: optionalTextField,
    isSeparable: z.boolean().optional(),
    defaultBreakdownQty: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : Number(val)), z.number().nullable().optional()),
    breakdownType: z.enum(["SINGLE", "MIX"]).optional(),
    allowAgentPrice: z.boolean().optional(),
    physicalStock: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : Number(val)), z.number().nullable().optional()),
    pointStock: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : Number(val)), z.number().nullable().optional()),
  })
  .refine((data) => {
    if (data.allowAgentPrice === false) return true;
    return data.agentPrice <= data.regularPrice;
  }, {
    path: ["agentPrice"],
    message: "Harga agen tidak boleh melebihi harga konsumen",
  });
export type InventoryFormData = z.infer<typeof inventorySchema>;

// --- Voucher ---
export const voucherSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{4,20}$/, "INVALID_CODE"),
    title: optionalTextField,
    description: optionalTextField,
    discountType: z.enum(["PERCENT", "FIXED", "SHIPPING_SUBSIDY"]).default("FIXED"),
    discountValue: optionalNumberField(0).default(0),
    minPurchase: optionalNumberField(0).default(0),
    maxDiscount: optionalNumberField(0),
    quota: optionalNumberField(1).default(100),
    isActive: booleanField.default(true),
    expiresAt: optionalTextField,
  })
  .refine((data) => data.discountType !== "PERCENT" || (data.discountValue ?? 0) <= 100, {
    path: ["discountValue"],
    message: "MAX_100_PERCENT",
  });
export type VoucherFormData = z.infer<typeof voucherSchema>;

// --- Perangkat ---
export const deviceSchema = z.object({
  name: z.string().trim().min(3, "Nama perangkat minimal 3 karakter"),
  type: z.enum(["Thermal", "Inkjet", "Laser", "Scanner"]),
  status: z.enum(["ONLINE", "OFFLINE", "ERROR"]),
  ip: z.preprocess((val) => {
    if (typeof val === "string") {
      const trimmed = val.trim();
      return trimmed === "" ? undefined : trimmed;
    }
    return val;
  }, z.string().regex(IPV4_REGEX, "Alamat IP tidak valid").optional()),
  port: optionalNumberField(1),
  location: optionalTextField,
});
export type DeviceFormData = z.infer<typeof deviceSchema>;

// --- Agen & Password ---
export const agentSchema = z.object({
  name: z.string().trim().min(3, "Nama minimal 3 karakter"),
  hniMemberId: z.string().trim().regex(/^\d{6,10}$/, "ID Member HNI 6-10 digit angka"),
  phoneNumber: z.string().trim().regex(PHONE_REGEX, "Nomor HP tidak valid (contoh 081234567890)"),
  rank: z.enum(["AB", "Manager", "SM", "EM", "LED"]),
  tier: z.enum(["AGEN_BIAYA", "STOCKIES", "DC", "BC"]),
  role: z.enum(["Kasir", "Gudang", "Owner", "Manager", "Admin"]),
  roles: z.array(z.enum(["Kasir", "Gudang", "Owner", "Manager", "Admin"])).min(1, "Pilih minimal 1 role").optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});
export type AgentFormData = z.infer<typeof agentSchema>;

export const passwordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .regex(/[A-Z]/, "Harus mengandung huruf besar")
      .regex(/[a-z]/, "Harus mengandung huruf kecil")
      .regex(/\d/, "Harus mengandung angka"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi password tidak sama",
  });
export type PasswordFormData = z.infer<typeof passwordSchema>;

// --- Merchant & Produk Non-HNI ---
export const merchantSchema = z.object({
  name: z.string().trim().min(3, "Nama merchant minimal 3 karakter"),
  branchCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{3,12}$/, "Kode cabang 3-12 karakter (huruf, angka, -)"),
  picName: z.string().trim().min(3, "Nama PIC minimal 3 karakter"),
  phone: z.string().trim().regex(PHONE_REGEX, "Nomor HP tidak valid (contoh 081234567890)"),
  address: z.string().trim().min(10, "Alamat minimal 10 karakter"),
  status: z.enum(["ACTIVE", "PENDING", "INACTIVE"]),
  commissionRate: numberField({ min: 0, max: 50 }),
});
export type MerchantFormData = z.infer<typeof merchantSchema>;

export const nonHniProductSchema = z.object({
  name: z.string().trim().min(3, "Nama produk minimal 3 karakter"),
  category: z.string().trim().min(2, "Kategori wajib diisi"),
  price: numberField({ min: 1 }),
  stock: numberField({ isInteger: true }),
  merchantId: optionalTextField,
  weight: optionalNumberField(0),
  dimensions: optionalTextField,
  warranty: optionalTextField,
});
export type NonHniProductFormData = z.infer<typeof nonHniProductSchema>;

// --- Tanda Tangan Digital Karyawan ---
export const esignatureSchema = z.object({
  userId: z.string().min(1, "Pilih karyawan terlebih dahulu"),
  signer: z.enum(["Kasir", "Gudang", "Owner"]),
  signerName: z.string().trim().min(3, "Nama penandatangan minimal 3 karakter"),
  notes: optionalTextField,
});
export type EsignatureFormData = z.infer<typeof esignatureSchema>;

// --- Khasiat, Komposisi & Testimoni ---
export const productKnowledgeSchema = z.object({
  sku: z.string().trim().min(3, "SKU minimal 3 karakter").toUpperCase(),
  name: z.string().trim().min(3, "Nama produk minimal 3 karakter"),
  category: z.string().trim().min(2, "Kategori wajib diisi"),
  bpomNumber: z.string().trim().min(3, "Nomor BPOM wajib diisi"),
  halalNumber: z.string().trim().min(3, "Nomor Halal MUI wajib diisi"),
  benefits: linesField("Isi minimal 1 khasiat/manfaat (satu per baris)"),
  composition: linesField("Isi minimal 1 komposisi (satu per baris)"),
  usageRules: z.string().trim().min(10, "Aturan pakai minimal 10 karakter"),
  contraindications: optionalTextField,
  imageUrl: optionalTextField,
});
export type ProductKnowledgeFormData = z.infer<typeof productKnowledgeSchema>;

export const testimonialSchema = z.object({
  customerName: z.string().trim().min(3, "Nama minimal 3 karakter"),
  customerRole: z.enum(["Konsumen", "Agen", "Stokis"]),
  rating: numberField({ min: 1, max: 5, isInteger: true }),
  content: z.string().trim().min(10, "Testimoni minimal 10 karakter"),
  date: z.string().min(1, "Tanggal wajib diisi"),
  isVerifiedPurchase: booleanField,
});
export type TestimonialFormData = z.infer<typeof testimonialSchema>;
