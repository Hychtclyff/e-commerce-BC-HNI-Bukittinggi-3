import { z } from "zod";
import { validateSchema } from "@/schemas/common.schema";

export const deliveryScanParamsSchema = z.object({
    token: z.string().min(5),
});

export const deliveryScanBodySchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    photoBase64: z.string().optional(),
    note: z.string().optional(),
    event: z.enum(["TAP_IN", "TAP_OUT", "SIGNATURE"]),
});

export const deliveryScanGetSchema = validateSchema({
    params: deliveryScanParamsSchema,
    description: "Ambil informasi ringkas pesanan untuk webview kurir guest via token QR",
    tags: ["Delivery"],
});

export const deliveryScanPostSchema = validateSchema({
    params: deliveryScanParamsSchema,
    body: deliveryScanBodySchema,
    description: "Catat event tap-in / tap-out kurir dengan koordinat GPS dan bukti foto",
    tags: ["Delivery"],
});

export type DeliveryScanParams = z.infer<typeof deliveryScanParamsSchema>;
export type DeliveryScanBody = z.infer<typeof deliveryScanBodySchema>;
