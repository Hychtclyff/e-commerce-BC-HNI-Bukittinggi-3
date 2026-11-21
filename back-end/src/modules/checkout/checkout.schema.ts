import { z } from "zod";
import { zUUID, validateSchema } from "@/schemas/common.schema";
import { enumSupportedLanguage } from "@/i18n";

export const checkoutItemSchema = z.object({
    productId: z.string().min(1, "Product ID is required"),
    qty: z.number().int().min(1),
});

export const calculateCheckoutBodySchema = z.object({
    userId: z.string().optional(),
    shippingType: z.enum(["DELIVERY", "PICKUP"]).default("DELIVERY"),
    addressId: z.string().optional(),
    shippingCourier: z.string().optional(),
    shippingCost: z.number().min(0).optional().default(0),
    voucherCode: z.string().optional(),
    items: z.array(checkoutItemSchema).min(1, "Checkout items cannot be empty"),
});

export const processCheckoutBodySchema = z.object({
    userId: z.string().optional(),
    shippingType: z.enum(["DELIVERY", "PICKUP"]).default("DELIVERY"),
    addressId: z.string().optional(),
    shippingCourier: z.string().optional(),
    shippingCost: z.number().min(0).optional().default(0),
    voucherCode: z.string().optional(),
    paymentMethod: z.enum([
        "B2B_CREDIT",
        "ONLINE_XENDIT",
        "QRIS",
        "VA_BCA",
        "VA_BNI",
        "VA_BRI",
        "VA_MANDIRI",
        "VA_PERMATA",
        "VA_BSI",
        "VA_CIMB",
        "VA_MUAMALAT",
        "EWALLET_SHOPEEPAY",
        "EWALLET_OVO",
        "EWALLET_DANA",
        "EWALLET_GOPAY",
        "QRIS_MOCKUP",
        "BANK_TRANSFER_MOCKUP",
        "CASH_STORE",
        "COD",
    ]),
    notes: z.string().optional(),
    items: z.array(checkoutItemSchema).min(1, "Checkout items cannot be empty"),
});

export const approveOrderBodySchema = z.object({
    notes: z.string().optional(),
});

export const rejectOrderBodySchema = z.object({
    rejectionReason: z.string().min(3, "Rejection reason is required"),
});

export const shipOrderBodySchema = z.object({
    trackingNumber: z.string().optional(),
    courierName: z.string().optional(),
});

export const calculateCheckoutSchema = validateSchema({
    body: calculateCheckoutBodySchema,
});

export const processCheckoutSchema = validateSchema({
    body: processCheckoutBodySchema,
});

export const approveOrderSchema = validateSchema({
    params: z.object({ id: z.string() }),
    body: approveOrderBodySchema,
});

export const rejectOrderSchema = validateSchema({
    params: z.object({ id: z.string() }),
    body: rejectOrderBodySchema,
});

export const shipOrderSchema = validateSchema({
    params: z.object({ id: z.string() }),
    body: shipOrderBodySchema,
});

export type CheckoutItem = z.infer<typeof checkoutItemSchema>;
export type CalculateCheckoutBody = z.infer<typeof calculateCheckoutBodySchema>;
export type ProcessCheckoutBody = z.infer<typeof processCheckoutBodySchema>;
export type ApproveOrderBody = z.infer<typeof approveOrderBodySchema>;
export type RejectOrderBody = z.infer<typeof rejectOrderBodySchema>;
export type ShipOrderBody = z.infer<typeof shipOrderBodySchema>;
