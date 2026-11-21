import { db } from "@/prisma/db";
import { AppError } from "@/utils/AppError";
import { SupportedLanguage, t } from "@/i18n";
import { GetUserOrdersQuery, CancelOrderBody } from "./orders.schema";
import { notificationsService } from "../notifications/notifications.service";


export const ordersService = {
    async getUserOrders(userId: string, query: GetUserOrdersQuery, lang: SupportedLanguage = "id") {
        try {
            const page = query.page || 1;
            const limit = query.limit || 10;
            const skip = (page - 1) * limit;

            // Fetch all orders for this user
            let userOrders = await db.orm.orders.Order
                .where({ userId })
                .all();

            // Filter by status if not ALL
            if (query.status && query.status !== "ALL") {
                userOrders = userOrders.filter(o => o.orderStatus === query.status);
            }

            // Filter by paymentMethod
            if (query.paymentMethod) {
                userOrders = userOrders.filter(o => o.paymentMethod === query.paymentMethod);
            }

            // Filter by date range
            if (query.startDate) {
                const start = new Date(query.startDate).getTime();
                userOrders = userOrders.filter(o => new Date(o.createdAt).getTime() >= start);
            }
            if (query.endDate) {
                const end = new Date(query.endDate).getTime() + 86400000;
                userOrders = userOrders.filter(o => new Date(o.createdAt).getTime() <= end);
            }

            // Populate items and perform search filter if requested
            const orderList = [];
            for (const order of userOrders) {
                const items = await db.orm.orders.OrderItem
                    .where({ orderId: order.id })
                    .all();

                if (query.search) {
                    const searchLower = query.search.toLowerCase();
                    const matchesOrderNumber = order.orderNumber.toLowerCase().includes(searchLower);
                    const matchesProduct = items.some(i => i.productName.toLowerCase().includes(searchLower));
                    if (!matchesOrderNumber && !matchesProduct) {
                        continue;
                    }
                }

                const previewItems = items.map(item => ({
                    id: item.id,
                    productId: item.productId,
                    productName: item.productName,
                    productImageUrl: item.productImageUrl || null,
                    qty: item.qty,
                    unitPrice: item.unitPrice,
                    tpPoints: item.tpPoints,
                    totalPrice: item.totalPrice,
                }));

                orderList.push({
                    id: order.id,
                    slug: order.slug || order.orderNumber.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
                    orderNumber: order.orderNumber,
                    createdAt: order.createdAt,
                    status: order.orderStatus,
                    paymentMethod: order.paymentMethod,
                    paymentStatus: order.paymentStatus,
                    dueDate: order.dueDate || null,
                    hsisPostingStatus: order.hsisPostingStatus || "PENDING",
                    hsisReceiptNo: order.hsisReceiptNo || null,
                    shippingType: order.shippingType,
                    shippingCourier: order.shippingCourier || (order.shippingType === 'PICKUP' ? 'Ambil Mandiri di Outlet BC3' : 'Pengiriman Lokal'),
                    trackingNumber: order.trackingNumber || null,
                    totalAmount: order.totalAmount,
                    totalPoints: order.totalTpPoints,
                    itemsCount: items.length,
                    previewItems,
                });
            }

            // Sort by createdAt desc
            orderList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            const totalItems = orderList.length;
            const totalPages = Math.ceil(totalItems / limit) || 1;
            const paginatedData = orderList.slice(skip, skip + limit);

            // Calculate status counts
            const allUserOrders = await db.orm.orders.Order.where({ userId }).all();
            const countsPerStatus = {
                ALL: allUserOrders.length,
                PENDING_PAYMENT: allUserOrders.filter(o => o.orderStatus === "PENDING_PAYMENT").length,
                PROCESSING: allUserOrders.filter(o => o.orderStatus === "PROCESSING").length,
                SHIPPED: allUserOrders.filter(o => o.orderStatus === "SHIPPED").length,
                COMPLETED: allUserOrders.filter(o => o.orderStatus === "COMPLETED").length,
                REJECTED: allUserOrders.filter(o => o.orderStatus === "REJECTED").length,
                CANCELLED: allUserOrders.filter(o => o.orderStatus === "CANCELLED").length,
            };

            return {
                data: paginatedData,
                meta: {
                    page,
                    limit,
                    totalItems,
                    totalPages,
                    countsPerStatus,
                },
            };
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            throw new AppError(t('orders.get_orders_failed', { message: error.message }, lang), 500);
        }
    },

    async getStatusCounts(userId: string, lang: SupportedLanguage = "id") {
        try {
            const allUserOrders = await db.orm.orders.Order.where({ userId }).all();
            return {
                ALL: allUserOrders.length,
                PENDING_PAYMENT: allUserOrders.filter(o => o.orderStatus === "PENDING_PAYMENT").length,
                WAITING_APPROVAL: allUserOrders.filter(o => o.orderStatus === "WAITING_APPROVAL").length,
                PROCESSING: allUserOrders.filter(o => o.orderStatus === "PROCESSING").length,
                SHIPPED: allUserOrders.filter(o => o.orderStatus === "SHIPPED").length,
                COMPLETED: allUserOrders.filter(o => o.orderStatus === "COMPLETED").length,
                REJECTED: allUserOrders.filter(o => o.orderStatus === "REJECTED").length,
                CANCELLED: allUserOrders.filter(o => o.orderStatus === "CANCELLED").length,
            };
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            throw new AppError(t('orders.get_orders_failed', { message: error.message }, lang), 500);
        }
    },

    async getOrderDetail(orderId: string, userId?: string, lang: SupportedLanguage = "id") {
        try {
            let order = await db.orm.orders.Order.where({ id: orderId }).first();
            if (!order) {
                order = await db.orm.orders.Order.where({ slug: orderId }).first();
            }
            if (!order) {
                order = await db.orm.orders.Order.where({ orderNumber: orderId }).first();
            }
            if (!order) {
                throw new AppError(t('orders.order_not_found', {}, lang), 404);
            }

            if (userId && order.userId !== userId) {
                throw new AppError(t('common.forbidden', {}, lang), 403);
            }

            const user = await db.orm.core_auth.User
                .where({ id: order.userId })
                .include('hniProfile')
                .include('addresses')
                .first();

            const items = await db.orm.orders.OrderItem
                .where({ orderId: order.id })
                .all();

            const creditProfile = order.paymentMethod === "B2B_CREDIT"
                ? await db.orm.b2b_credit.CreditProfile.where({ userId: order.userId }).first()
                : null;

            const primaryAddress = user?.addresses?.find(a => a.isPrimary) || user?.addresses?.[0];

            return {
                id: order.id,
                slug: order.slug || order.orderNumber.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
                orderNumber: order.orderNumber,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
                status: order.orderStatus,
                rejectionReason: order.rejectionReason || null,
                cancellationReason: order.cancellationReason || null,

                customer: {
                    userId: order.userId,
                    fullName: user?.fullName || "Pelanggan",
                    email: user?.email || null,
                    phoneNumber: user?.phoneNumber || null,
                    hniMemberId: user?.hniProfile?.hniMemberId || null,
                    hniMemberName: user?.hniProfile?.hniMemberName || null,
                    isAgentPriceApplied: order.isAgentPriceApplied,
                },

                shipping: {
                    type: order.shippingType,
                    recipientName: order.recipientName || primaryAddress?.recipientName || user?.fullName || "Pelanggan",
                    recipientPhone: order.recipientPhone || primaryAddress?.phoneNumber || user?.phoneNumber || "-",
                    destinationAddress: order.shippingAddressText || primaryAddress?.fullAddress || "Pick Up Outlet BC HNI 3 Bukittinggi",
                    courierName: order.shippingCourier || (order.shippingType === 'PICKUP' ? 'Ambil Mandiri di Outlet BC3' : 'Pengiriman BC3'),
                    trackingNumber: order.trackingNumber || null,
                    shippingCost: order.shippingCost,
                    notes: order.notes || null,
                },

                payment: {
                    method: order.paymentMethod,
                    status: order.paymentStatus,
                    paidAt: order.paymentStatus === "PAID" ? order.updatedAt : null,
                    dueDate: order.dueDate || null,
                    vaNumber: null,
                    qrisPayload: null,
                    creditProfileId: creditProfile?.id || null,
                },

                hsisIntegration: {
                    status: order.hsisPostingStatus || "PENDING",
                    receiptNo: order.hsisReceiptNo || null,
                    postedAt: order.hsisPostedAt || null,
                    totalTpPoints: order.totalTpPoints,
                },

                items: items.map(item => ({
                    id: item.id,
                    productId: item.productId,
                    sku: item.sku || null,
                    productName: item.productName,
                    productImageUrl: item.productImageUrl || null,
                    qty: item.qty,
                    normalPrice: item.normalPrice || item.unitPrice,
                    unitPrice: item.unitPrice,
                    tpPoints: item.tpPoints,
                    totalPrice: item.totalPrice,
                    totalPoints: item.totalPoints || (item.tpPoints * item.qty),
                })),

                summary: {
                    subtotal: order.subtotal,
                    shippingCost: order.shippingCost,
                    voucherCode: order.voucherCode || null,
                    voucherDiscount: order.discountAmount,
                    totalAmount: order.totalAmount,
                    totalTpPoints: order.totalTpPoints,
                },

                timeline: [
                    {
                        status: "WAITING_APPROVAL",
                        title: "Pesanan Dibuat",
                        description: `Pesanan ${order.orderNumber} berhasil dibuat dengan metode ${order.paymentMethod}.`,
                        timestamp: order.createdAt,
                    },
                    ...(order.orderStatus === "PROCESSING" || order.orderStatus === "SHIPPED" || order.orderStatus === "COMPLETED" ? [{
                        status: "PROCESSING",
                        title: "Disetujui Toko & Sedang Dikemas",
                        description: "Owner menyetujui pesanan. Stok fisik tersedia dan paket sedang dikemas.",
                        timestamp: order.updatedAt,
                    }] : []),
                    ...(order.orderStatus === "SHIPPED" || order.orderStatus === "COMPLETED" ? [{
                        status: "SHIPPED",
                        title: "Sedang Dikirim / Siap Diambil",
                        description: "Paket diserahkan ke pengiriman atau siap diambil di toko.",
                        timestamp: order.updatedAt,
                    }] : []),
                    ...(order.orderStatus === "COMPLETED" ? [{
                        status: "COMPLETED",
                        title: "Pesanan Selesai",
                        description: "Paket telah diterima atau selesai diambil.",
                        timestamp: order.updatedAt,
                    }] : []),
                    ...(order.orderStatus === "REJECTED" ? [{
                        status: "REJECTED",
                        title: "Pesanan Ditolak",
                        description: order.rejectionReason || "Pesanan ditolak oleh toko.",
                        timestamp: order.updatedAt,
                    }] : []),
                    ...(order.orderStatus === "CANCELLED" ? [{
                        status: "CANCELLED",
                        title: "Pesanan Dibatalkan",
                        description: order.cancellationReason || "Dibatalkan oleh pelanggan.",
                        timestamp: order.updatedAt,
                    }] : []),
                ],
            };
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            throw new AppError(t('orders.get_orders_failed', { message: error.message }, lang), 500);
        }
    },

    async cancelOrder(orderId: string, userId: string, payload: CancelOrderBody, lang: SupportedLanguage = "id") {
        try {
            const order = await db.orm.orders.Order.where({ id: orderId }).first();
            if (!order) {
                throw new AppError(t('orders.order_not_found', {}, lang), 404);
            }

            if (order.userId !== userId) {
                throw new AppError(t('common.forbidden', {}, lang), 403);
            }

            // HANYA PENDING_PAYMENT yang bisa dibatalkan
            if (order.orderStatus !== "PENDING_PAYMENT") {
                throw new AppError(t('orders.cannot_cancel', {}, lang), 400);
            }

            let creditRestored = false;
            let restoredAmount = 0;

            // Restore Kasbon B2B jika digunakan
            if (order.paymentMethod === "B2B_CREDIT" && order.paymentStatus === "TEMPO_ACTIVE") {
                const creditProfile = await db.orm.b2b_credit.CreditProfile.where({ userId }).first();
                if (creditProfile) {
                    const newCurrentBalance = creditProfile.currentBalance + order.totalAmount;
                    const newUsedBalance = Math.max(0, creditProfile.usedBalance - order.totalAmount);

                    await db.orm.b2b_credit.CreditProfile
                        .where({ id: creditProfile.id })
                        .update({
                            currentBalance: newCurrentBalance,
                            usedBalance: newUsedBalance,
                        });

                    await db.orm.b2b_credit.CreditLedgerEntry.create({
                        creditProfileId: creditProfile.id,
                        type: "ADJUSTMENT",
                        amount: order.totalAmount,
                        runningBalance: newUsedBalance,
                        referenceNo: order.orderNumber,
                        description: `Pembatalan Pesanan User (${order.orderNumber}): ${payload.reason || "Pembatalan oleh pelanggan"}`,
                    });

                    creditRestored = true;
                    restoredAmount = order.totalAmount;
                }
            }

            // Restore product stock
            const items = await db.orm.orders.OrderItem.where({ orderId: order.id }).all();
            for (const item of items) {
                const product = await db.orm.products.Product.where({ id: item.productId }).first();
                if (product) {
                    await db.orm.products.Product
                        .where({ id: product.id })
                        .update({ stock: product.stock + item.qty });
                }
            }

            // Update order status
            await db.orm.orders.Order
                .where({ id: order.id })
                .update({
                    orderStatus: "CANCELLED",
                    cancellationReason: payload.reason || "Pembatalan oleh pelanggan",
                    paymentStatus: creditRestored ? "REFUNDED" : order.paymentStatus,
                });

            await notificationsService.createNotification({
                userId,
                title: "Pesanan Dibatalkan",
                message: `Pesanan ${order.orderNumber} telah dibatalkan: ${payload.reason || "Dibatalkan oleh pelanggan"}.`,
                category: "ORDER_STATUS",
                referenceId: order.id,
            });

            return {
                id: order.id,
                slug: order.slug || order.orderNumber.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
                orderNumber: order.orderNumber,
                status: "CANCELLED",
                cancelledAt: new Date().toISOString(),
                cancellationReason: payload.reason || "Pembatalan oleh pelanggan",
                creditRestored,
                restoredAmount,
            };
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            throw new AppError(t('orders.cancel_failed', { message: error.message }, lang), 500);
        }
    },

    async confirmDelivered(orderId: string, userId: string, lang: SupportedLanguage = "id") {
        try {
            const order = await db.orm.orders.Order.where({ id: orderId }).first();
            if (!order) {
                throw new AppError(t('orders.order_not_found', {}, lang), 404);
            }

            if (order.userId !== userId) {
                throw new AppError(t('common.forbidden', {}, lang), 403);
            }

            if (order.orderStatus !== "SHIPPED") {
                throw new AppError(t('orders.cannot_confirm_delivered', {}, lang), 400);
            }

            await db.orm.orders.Order
                .where({ id: order.id })
                .update({
                    orderStatus: "COMPLETED",
                });

            await notificationsService.createNotification({
                userId,
                title: "Pesanan Selesai",
                message: `Pesanan ${order.orderNumber} telah dikonfirmasi selesai. Terima kasih telah berbelanja di BC HNI 3 Bukittinggi!`,
                category: "ORDER_STATUS",
                referenceId: order.id,
            });

            return {
                id: order.id,
                slug: order.slug || order.orderNumber.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
                orderNumber: order.orderNumber,
                status: "COMPLETED",
                completedAt: new Date().toISOString(),
            };
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            throw new AppError(t('orders.confirm_delivered_failed', { message: error.message }, lang), 500);
        }
    }

};
