import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { deliveryController } from "./delivery.controller";
import { deliveryScanGetSchema, deliveryScanPostSchema } from "./delivery.schema";

export async function deliveryRoutes(route: FastifyInstance) {
    const server = route.withTypeProvider<ZodTypeProvider>();

    // Guest kurir — tanpa login, diakses via QR code token pada label resi
    server.get("/scan/:token", deliveryScanGetSchema, deliveryController.getScanData);
    server.post("/scan/:token", deliveryScanPostSchema, deliveryController.submitScanEvent);
}
