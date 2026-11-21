import z from "zod";
import { authSchema } from "./auth.schema";

export type LoginDto = z.infer<typeof authSchema.login>
export type RegisterDto = z.infer<typeof authSchema.register>