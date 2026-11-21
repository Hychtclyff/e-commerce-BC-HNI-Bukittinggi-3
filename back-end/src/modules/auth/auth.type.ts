import { z } from "zod";
import { registerBodySchema, loginBodySchema } from "./auth.schema";

export type typePayloadReg = z.infer<typeof registerBodySchema>;
export type typePayloadLog = z.infer<typeof loginBodySchema>;