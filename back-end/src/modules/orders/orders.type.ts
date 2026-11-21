import { z } from "zod";
import {
    getUserOrdersQuerySchema,
    cancelOrderBodySchema,
} from "./orders.schema";

export type GetUserOrdersQuery = z.infer<typeof getUserOrdersQuerySchema>;
export type CancelOrderBody = z.infer<typeof cancelOrderBodySchema>;

export type OrderStatus =
    | "ALL"
    | "WAITING_APPROVAL"
    | "PROCESSING"
    | "SHIPPED"
    | "COMPLETED"
    | "REJECTED"
    | "CANCELLED"
    | "PENDING_PAYMENT";

export interface OrderItemData {
    productId: string;
    productName: string;
    sku?: string;
    price: number;
    qty: number;
    total: number;
    tpPoints?: number;
    imageUrl?: string;
}

export interface UserOrderSummary {
    id: string;
    orderNumber: string;
    invoiceNo: string;
    date: string;
    createdAt: string;
    status: OrderStatus;
    totalAmount: number;
    subtotal: number;
    shippingCost: number;
    discountAmount: number;
    totalTpPoints: number;
    paymentMethod: string;
    paymentStatus: string;
    shippingType: string;
    shippingCourier?: string;
    trackingNumber?: string;
    itemCount: number;
    items: OrderItemData[];
    dueDate?: string;
    rejectionReason?: string;
    cancellationReason?: string;
}
