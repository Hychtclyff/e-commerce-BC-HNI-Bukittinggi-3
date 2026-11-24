import { FastifyInstance } from "fastify";
import { authRoutes } from "../modules/auth/auth.routes";
import { productRoutes } from "../modules/products/products.routes";
import { profileRoutes } from "../modules/profile/profile.routes";
import { creditRoutes } from "../modules/credit/credit.routes";
import { addressRoutes } from "../modules/addresses/address.routes";
import { voucherRoutes } from "../modules/vouchers/voucher.routes";
import { checkoutRoutes } from "../modules/checkout/checkout.routes";
import { ordersRoutes } from "../modules/orders/orders.routes";
import { notificationRoutes } from "../modules/notifications/notifications.routes";
import { paymentRoutes } from "../modules/payments/payment.routes";
import { i18nRoutes } from "./i18n.routes";
import { metaRoutes } from "./meta.routes";
import { storeRoutes, hsisDynamicRoutes } from "../modules/store/store.routes";
import { deliveryRoutes } from "../modules/delivery/delivery.routes";
import { newsRoutes } from "../modules/news/news.routes";
import { khasitRoutes } from "../modules/khasit/khasit.routes";
import { reportRoutes } from "../modules/report/report.routes";
import { mediaRoutes } from "../modules/media/media.routes";
import { devQaRoutes } from "../modules/dev-qa/devQa.routes";

export async function apiRoutes(app: FastifyInstance) {
    // Daftarkan semua modul route di sini
    app.register(authRoutes, { prefix: '/auth' });
    app.register(productRoutes, { prefix: '/products' });
    app.register(profileRoutes, { prefix: '/profile' });
    app.register(creditRoutes, { prefix: '/credit' });
    app.register(addressRoutes, { prefix: '/user/addresses' });
    app.register(voucherRoutes, { prefix: '/vouchers' });
    app.register(voucherRoutes, { prefix: '/user/vouchers' });
    app.register(checkoutRoutes, { prefix: '/checkout' });
    app.register(ordersRoutes, { prefix: '/user/orders' });
    app.register(ordersRoutes, { prefix: '/orders' });
    app.register(notificationRoutes, { prefix: '/notifications' });
    app.register(notificationRoutes, { prefix: '/user/notifications' });
    app.register(paymentRoutes, { prefix: '/payments' });
    app.register(i18nRoutes, { prefix: '/i18n' });
    app.register(metaRoutes, { prefix: '/meta' });
    app.register(deliveryRoutes, { prefix: '/delivery' });
    app.register(storeRoutes, { prefix: '/store' });
    app.register(hsisDynamicRoutes, { prefix: '/hsis' });
    app.register(newsRoutes, { prefix: '/news' });
    app.register(khasitRoutes, { prefix: '/khasit' });
    app.register(reportRoutes, { prefix: '/reports' });
    app.register(mediaRoutes, { prefix: '/media' });
    app.register(devQaRoutes, { prefix: '/dev-qa' });
}




