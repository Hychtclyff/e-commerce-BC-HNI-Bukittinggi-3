import { z } from "zod";
import {
    orderIdParamSchema,
    confirmTransferBodySchema,
    codConfirmBodySchema,
} from "./payment.schema";

export type OrderIdParams = z.infer<typeof orderIdParamSchema>;
export type ConfirmTransferBody = z.infer<typeof confirmTransferBodySchema>;
export type CodConfirmBody = z.infer<typeof codConfirmBodySchema>;
