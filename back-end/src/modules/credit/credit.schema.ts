import { z } from "zod";
import { zUUID, validateSchema } from "@/schemas/common.schema";
import { enumSupportedLanguage } from "@/i18n";

export const getCreditParamsSchema = z.object({
    userId: zUUID.optional(),
    id: z.string().optional(),
});

export const getCreditQuerySchema = z.object({
    lang: z.enum(enumSupportedLanguage).optional(),
    status: z.string().optional(),
    page: z.coerce.number().optional().default(1),
    limit: z.coerce.number().optional().default(20),
});

export const applyCreditBodySchema = z.object({
    userId: zUUID.optional(),
    requestedLimit: z.number().min(500000).max(10000000).optional().default(2000000),
    purpose: z.string().optional(),
    alternativePhone: z.string().optional(),
    notes: z.string().optional(),
    agreementAccepted: z.boolean().refine(val => val === true, {
        message: "credit.agreement_required",
    }),
});

export const approveCreditApplicationBodySchema = z.object({
    approvedLimit: z.number().min(500000).optional().default(2000000),
    notes: z.string().optional(),
});

export const rejectCreditApplicationBodySchema = z.object({
    rejectionReason: z.string().min(3, "Rejection reason is required"),
});

export const getCreditAccountSchema = validateSchema({
    params: getCreditParamsSchema,
    querystring: getCreditQuerySchema,
});

export const applyCreditSchema = validateSchema({
    body: applyCreditBodySchema,
});

export const getCreditLedgerSchema = validateSchema({
    params: getCreditParamsSchema,
    querystring: getCreditQuerySchema,
});

export const getApplicationsSchema = validateSchema({
    querystring: getCreditQuerySchema,
});

export const approveApplicationSchema = validateSchema({
    params: getCreditParamsSchema,
    body: approveCreditApplicationBodySchema,
});

export const rejectApplicationSchema = validateSchema({
    params: getCreditParamsSchema,
    body: rejectCreditApplicationBodySchema,
});

export type GetCreditParams = z.infer<typeof getCreditParamsSchema>;
export type GetCreditQuery = z.infer<typeof getCreditQuerySchema>;
export type ApplyCreditBody = z.infer<typeof applyCreditBodySchema>;
export type ApproveCreditApplicationBody = z.infer<typeof approveCreditApplicationBodySchema>;
export type RejectCreditApplicationBody = z.infer<typeof rejectCreditApplicationBodySchema>;
