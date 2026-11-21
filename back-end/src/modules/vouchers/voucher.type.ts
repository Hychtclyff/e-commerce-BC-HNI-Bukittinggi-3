import { z } from "zod";
import {
    getVouchersParamsSchema,
    validateVoucherBodySchema,
} from "./voucher.schema";

export type GetVouchersParams = z.infer<typeof getVouchersParamsSchema>;
export type ValidateVoucherBody = z.infer<typeof validateVoucherBodySchema>;

export type VoucherDiscountType = "FIXED" | "PERCENTAGE" | "SHIPPING_SUBSIDY";

export interface VoucherItem {
    id: string;
    code: string;
    title: string;
    description: string;
    discountType: VoucherDiscountType;
    discountValue: number;
    maxDiscount?: number;
    minPurchase: number;
    validUntil: string;
    isUsed?: boolean;
}
