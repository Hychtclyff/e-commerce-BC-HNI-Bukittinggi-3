import { z } from "zod";
import { validateSchema } from "@/schemas/common.schema";

export const orderIdParamSchema = z.object({
    orderId: z.string().min(1, "Order ID is required"),
});

export const confirmTransferBodySchema = z.object({
    orderId: z.string().min(1, "Order ID is required"),
    bankName: z.string().min(1, "Bank name is required"),
});

export const codConfirmBodySchema = z.object({
    courierUserId: z.string().min(1, "Courier user ID is required"),
    signature: z.string().min(1, "Signature is required"),
});

export const syncPaymentStatusSchema = validateSchema({
    params: orderIdParamSchema,
});

export const confirmTransferSchema = validateSchema({
    body: confirmTransferBodySchema,
});

export const codConfirmSchema = validateSchema({
    params: orderIdParamSchema,
    body: codConfirmBodySchema,
});

export const getReceiptSchema = validateSchema({
    params: orderIdParamSchema,
});
