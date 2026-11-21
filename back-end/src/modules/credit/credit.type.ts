import { z } from "zod";
import {
    getCreditParamsSchema,
    getCreditQuerySchema,
    applyCreditBodySchema,
    approveCreditApplicationBodySchema,
    rejectCreditApplicationBodySchema,
} from "./credit.schema";

export type GetCreditParams = z.infer<typeof getCreditParamsSchema>;
export type GetCreditQuery = z.infer<typeof getCreditQuerySchema>;
export type ApplyCreditBody = z.infer<typeof applyCreditBodySchema>;
export type ApproveCreditApplicationBody = z.infer<typeof approveCreditApplicationBodySchema>;
export type RejectCreditApplicationBody = z.infer<typeof rejectCreditApplicationBodySchema>;

export interface CreditAccountResponse {
    id: string;
    userId: string;
    status: string;
    approvedLimit: number;
    usedAmount: number;
    availableBalance: number;
    dueDateDays: number;
}
