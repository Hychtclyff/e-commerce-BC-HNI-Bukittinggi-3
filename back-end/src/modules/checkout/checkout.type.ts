import { z } from "zod";
import {
    checkoutItemSchema,
    calculateCheckoutBodySchema,
    processCheckoutBodySchema,
    approveOrderBodySchema,
    rejectOrderBodySchema,
    shipOrderBodySchema,
} from "./checkout.schema";

export type CheckoutItem = z.infer<typeof checkoutItemSchema>;
export type CalculateCheckoutBody = z.infer<typeof calculateCheckoutBodySchema>;
export type ProcessCheckoutBody = z.infer<typeof processCheckoutBodySchema>;
export type ApproveOrderBody = z.infer<typeof approveOrderBodySchema>;
export type RejectOrderBody = z.infer<typeof rejectOrderBodySchema>;
export type ShipOrderBody = z.infer<typeof shipOrderBodySchema>;

export interface CheckoutCalculateResponse {
    subtotal: number;
    shippingCost: number;
    discountAmount: number;
    totalPoints: number;
    grandTotal: number;
    isAgent: boolean;
    kasbonEligible: boolean;
    kasbonAvailableBalance: number;
}
