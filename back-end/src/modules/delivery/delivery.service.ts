import { pool } from "@/prisma/db";
import { AppError } from "@/utils/AppError";

export const deliveryService = {
    async getScanData(token: string, lang: string = "id") {
        // Token format: base64 encoded JSON { orderId, salt } or trackingNumber or orderId directly
        let orderId = token;
        try {
            const decoded = Buffer.from(token, "base64").toString("utf-8");
            const parsed = JSON.parse(decoded);
            if (parsed.orderId) {
                orderId = parsed.orderId;
            }
        } catch {
            // Keep token as string (might be orderId or trackingNumber)
            orderId = token;
        }

        const res = await pool.query(
            `
            SELECT 
                o.id,
                o."orderNumber",
                o."orderStatus",
                o."paymentStatus",
                o."recipientName",
                o."recipientPhone",
                o."shippingAddressText",
                o."shippingCourier",
                o."shippingType",
                o."trackingNumber",
                o."totalAmount",
                o."createdAt"
            FROM orders.orders o
            WHERE o.id = $1 OR o."orderNumber" = $1 OR o."trackingNumber" = $1
            LIMIT 1
            `,
            [orderId]
        );

        if (res.rows.length === 0) {
            throw new AppError(lang === "id" ? "Token pengiriman tidak valid atau pesanan tidak ditemukan" : "Delivery token invalid or order not found", 404);
        }

        const order = res.rows[0];

        // Ambil item produk untuk verifikasi barang bawaan
        const itemsRes = await pool.query(
            `
            SELECT "productName", qty, "unitPrice", "totalPrice"
            FROM orders.order_items
            WHERE "orderId" = $1
            `,
            [order.id]
        );

        return {
            orderId: order.id,
            orderNumber: order.orderNumber,
            orderStatus: order.orderStatus,
            paymentStatus: order.paymentStatus,
            recipientName: order.recipientName,
            recipientPhone: order.recipientPhone,
            shippingAddress: order.shippingAddressText,
            shippingCourier: order.shippingCourier,
            shippingType: order.shippingType,
            trackingNumber: order.trackingNumber,
            totalAmount: Number(order.totalAmount),
            items: itemsRes.rows,
            token,
        };
    },

    async submitScanEvent(
        token: string,
        payload: {
            latitude: number;
            longitude: number;
            photoBase64?: string;
            note?: string;
            event: string;
        },
        lang: string = "id"
    ) {
        const scanData = await this.getScanData(token, lang);

        let nextStatus = scanData.orderStatus;
        if (payload.event === "TAP_IN") {
            // Kurir mengambil barang di outlet / merchant
            nextStatus = "SHIPPED";
        } else if (payload.event === "TAP_OUT") {
            // Kurir telah sampai dan menyerahkan barang ke penerima
            nextStatus = "DELIVERED";
        }

        // Update status order jika berubah
        if (nextStatus !== scanData.orderStatus) {
            await pool.query(
                `
                UPDATE orders.orders
                SET "orderStatus" = $1, "updatedAt" = NOW()
                WHERE id = $2
                `,
                [nextStatus, scanData.orderId]
            );
        }

        return {
            success: true,
            orderId: scanData.orderId,
            orderNumber: scanData.orderNumber,
            previousStatus: scanData.orderStatus,
            currentStatus: nextStatus,
            event: payload.event,
            recordedAt: new Date().toISOString(),
            latitude: payload.latitude,
            longitude: payload.longitude,
            note: payload.note || null,
        };
    },
};
