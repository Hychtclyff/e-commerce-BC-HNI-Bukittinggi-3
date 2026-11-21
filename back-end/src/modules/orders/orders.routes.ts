import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {
    getUserOrdersSchema,
    getOrderStatusCountsSchema,
    getOrderDetailSchema,
    cancelOrderSchema,
    confirmDeliveredSchema,
} from "./orders.schema";
import { ordersController } from "./orders.controller";

export async function ordersRoutes(route: FastifyInstance) {
    const server = route.withTypeProvider<ZodTypeProvider>();

    // GET /api/v1/user/orders
    server.get(
        "/",
        getUserOrdersSchema,
        ordersController.getUserOrders
    );

    // GET /api/v1/user/orders/status-counts
    server.get(
        "/status-counts",
        getOrderStatusCountsSchema,
        ordersController.getOrderStatusCounts
    );

    // GET /api/v1/user/orders/:id
    server.get(
        "/:id",
        getOrderDetailSchema,
        ordersController.getOrderDetail
    );

    // POST /api/v1/user/orders/:id/cancel
    server.post(
        "/:id/cancel",
        cancelOrderSchema,
        ordersController.cancelOrder
    );

    // POST /api/v1/user/orders/:id/confirm-delivered
    server.post(
        "/:id/confirm-delivered",
        confirmDeliveredSchema,
        ordersController.confirmDelivered
    );
}
