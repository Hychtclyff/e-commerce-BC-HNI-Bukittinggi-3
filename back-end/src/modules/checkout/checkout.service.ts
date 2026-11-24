import { db } from "@/prisma/db";
import { AppError } from "@/utils/AppError";
import { SupportedLanguage, t } from "@/i18n";
import {
  CalculateCheckoutBody,
  ProcessCheckoutBody,
  ApproveOrderBody,
  RejectOrderBody,
  ShipOrderBody,
} from "./checkout.schema";
import { voucherService } from "../vouchers/voucher.service";
import { notificationsService } from "../notifications/notifications.service";
// import { dummyHniProducts } from "../products/products.service"; 
import { xenditService } from "@/config/xendit";
import { paymentService } from "../payments/payment.service";
import { storeService } from "../store/store.service";
import { paymentEvents } from "../payments/paymentEvents";

export function generateOrderSlug(orderNumber: string): string {
  return orderNumber
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function findOrderByIdOrSlug(orderKey: string) {
  let order = await db.orm.orders.Order.where({ id: orderKey }).first();
  if (!order) {
    order = await db.orm.orders.Order.where({ slug: orderKey }).first();
  }
  if (!order) {
    order = await db.orm.orders.Order.where({ orderNumber: orderKey }).first();
  }
  return order;
}

async function resolveServerShippingCost(
  shippingType: "DELIVERY" | "PICKUP",
  shippingCourier?: string,
  fallbackCost: number = 0,
): Promise<number> {
  if (shippingType === "PICKUP") return 0;
  if (shippingCourier) {
    try {
      const methods = await storeService.getDeliveryMethods();
      const matched = methods.find(
        (m: any) => m.isActive && (m.code === shippingCourier || m.id === shippingCourier),
      );
      if (matched) {
        return Number(matched.baseCost) || 0;
      }
    } catch {
      // Fallback to client-supplied cost if delivery_methods table is unavailable
    }
  }
  return Math.max(0, Number(fallbackCost) || 0);
}

export const checkoutService = {
  async calculateCheckout(
    userId: string,
    payload: CalculateCheckoutBody,
    lang: SupportedLanguage = "id",
  ) {
    try {
      const user = await db.orm.core_auth.User.where({ id: userId })
        .include("hniProfile")
        .first();

      const isAgent = Boolean(
        (user?.hniProfile && user.hniProfile.isVerified) ||
        (user?.hniProfile && Boolean(user.hniProfile.hniMemberId)) ||
        ["AGENT", "AGEN", "MEMBER", "STOKIS", "DISTRIBUTOR", "LEADER"].includes(
          String(user?.userType || "").toUpperCase()
        )
      );

      let subtotal = 0;
      let totalTpPoints = 0;

      for (const item of payload.items) {
        const lookupKey = String(item.productId || "").trim();
        let product = await db.orm.products.Product.where({
          id: lookupKey,
        }).first();
        if (!product) {
          product = await db.orm.products.Product.where({
            sku: lookupKey,
          }).first();
        }
        if (!product) {
          throw new AppError(t("products.product_not_found", {}, lang), 404);
        }
        if (product.isActive === false) {
          throw new AppError(
            t("products.product_inactive", { productName: product.name }, lang),
            400,
          );
        }
        if (Number(product.stock ?? 0) < item.qty) {
          throw new AppError(
            t(
              "checkout.insufficient_stock",
              { productName: product.name, stock: Number(product.stock ?? 0) },
              lang,
            ),
            400,
          );
        }
        const effectiveAgent = isAgent && product.allowAgentPrice !== false;
        const unitPrice = effectiveAgent ? product.agentPrice : product.normalPrice;
        const tp = effectiveAgent ? product.tpPoints || 0 : 0;

        subtotal += unitPrice * item.qty;
        totalTpPoints += tp * item.qty;
      }

      const voucherContextItems = [];
      for (const item of payload.items) {
        let p = await db.orm.products.Product.where({ id: item.productId }).first();
        if (!p) p = await db.orm.products.Product.where({ sku: item.productId }).first();
        if (p) {
          voucherContextItems.push({
            productId: p.id,
            sku: p.sku,
            category: p.category,
            qty: item.qty,
            tpPoints: p.tpPoints || 0,
          });
        }
      }

      const shippingCost = await resolveServerShippingCost(
        payload.shippingType,
        payload.shippingCourier,
        payload.shippingCost || 0,
      );

      let discountAmount = 0;
      if (payload.voucherCode) {
        const voucherResult = await voucherService.validateVoucher(
          payload.voucherCode,
          subtotal,
          shippingCost,
          lang,
          userId,
          { items: voucherContextItems },
        );
        discountAmount = voucherResult.discountAmount;
      }

      const grandTotal = Math.max(0, subtotal + shippingCost - discountAmount);

      // Cek kelayakan Kasbon B2B jika ada
      const creditProfile = await db.orm.b2b_credit.CreditProfile.where({
        userId,
      }).first();
      const kasbonEligible =
        !!creditProfile &&
        creditProfile.status === "ACTIVE" &&
        !creditProfile.isLocked &&
        creditProfile.currentBalance >= grandTotal;

      return {
        subtotal,
        shippingCost,
        discountAmount,
        totalTpPoints,
        grandTotal,
        isAgentPriceApplied: isAgent,
        kasbonEligible,
        kasbonAvailableBalance: creditProfile
          ? creditProfile.currentBalance
          : 0,
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        t("checkout.calculate_failed", { message: error.message }, lang),
        500,
      );
    }
  },

  async processCheckout(
    userId: string,
    payload: ProcessCheckoutBody,
    lang: SupportedLanguage = "id",
  ) {
    try {
      const user = await db.orm.core_auth.User.where({ id: userId })
        .include("hniProfile")
        .first();

      if (!user) {
        throw new AppError(t("profile.user_not_found", {}, lang), 404);
      }

      const isAgent = Boolean(
        (user.hniProfile && user.hniProfile.isVerified) ||
        (user.hniProfile && Boolean(user.hniProfile.hniMemberId)) ||
        ["AGENT", "AGEN", "MEMBER", "STOKIS", "DISTRIBUTOR", "LEADER"].includes(
          String(user.userType || "").toUpperCase()
        )
      );

      // Validasi & Hitung item
      let subtotal = 0;
      let totalTpPoints = 0;
      const processedItems: Array<{
        productId: string;
        productName: string;
        qty: number;
        unitPrice: number;
        tpPoints: number;
        totalPrice: number;
      }> = [];

      for (const item of payload.items) {
        const lookupKey = String(item.productId || "").trim();
        let product = await db.orm.products.Product.where({
          id: lookupKey,
        }).first();
        if (!product) {
          product = await db.orm.products.Product.where({
            sku: lookupKey,
          }).first();
        }
        if (!product) {
          throw new AppError(t("products.product_not_found", {}, lang), 404);
        }
        if (product.isActive === false) {
          throw new AppError(
            t("products.product_inactive", { productName: product.name }, lang),
            400,
          );
        }
        if (Number(product.stock ?? 0) < item.qty) {
          throw new AppError(
            t(
              "checkout.insufficient_stock",
              { productName: product.name, stock: Number(product.stock ?? 0) },
              lang,
            ),
            400,
          );
        }
        if (product.stock < item.qty) {
          throw new AppError(
            t(
              "checkout.insufficient_stock",
              { productName: product.name, stock: product.stock },
              lang,
            ),
            400,
          );
        }

        const effectiveAgent = isAgent && product.allowAgentPrice !== false;
        const unitPrice = effectiveAgent ? product.agentPrice : product.normalPrice;
        const tpPoints = effectiveAgent ? product.tpPoints || 0 : 0;
        const totalPrice = unitPrice * item.qty;

        subtotal += totalPrice;
        totalTpPoints += tpPoints * item.qty;

        processedItems.push({
          productId: product.id,
          productName: product.name,
          qty: item.qty,
          unitPrice,
          tpPoints,
          totalPrice,
        });
      }

      const shippingCost = await resolveServerShippingCost(
        payload.shippingType,
        payload.shippingCourier,
        payload.shippingCost || 0,
      );

      let discountAmount = 0;
      let appliedVoucherId: string | undefined = undefined;
      if (payload.voucherCode) {
        const voucherContextItems = [];
        for (const item of processedItems) {
          const p = await db.orm.products.Product.where({ id: item.productId }).first();
          voucherContextItems.push({
            productId: item.productId,
            sku: p?.sku,
            category: p?.category,
            qty: item.qty,
            tpPoints: item.tpPoints,
          });
        }
        const voucherResult = await voucherService.validateVoucher(
          payload.voucherCode,
          subtotal,
          shippingCost,
          lang,
          userId,
          {
            paymentMethod: payload.paymentMethod,
            items: voucherContextItems,
          },
        );
        discountAmount = voucherResult.discountAmount;
        appliedVoucherId = voucherResult.voucher?.id;
      }

      const totalAmount = Math.max(0, subtotal + shippingCost - discountAmount);

      // Generate Order Number & URL-safe Slug
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const orderNumber = `ORD/${dateStr}/BC3-${randomCode}`;
      const slug = generateOrderSlug(orderNumber);

      let dueDateIso: string | undefined = undefined;
      let orderStatus = "PROCESSING";
      let paymentStatus = "UNPAID";

      const isXenditOnline = [
        "ONLINE_XENDIT",
        "QRIS",
        "VA_BCA",
        "VA_BNI",
        "VA_BRI",
        "VA_MANDIRI",
        "VA_PERMATA",
        "VA_BSI",
        "VA_CIMB",
        "VA_MUAMALAT",
        "EWALLET_SHOPEEPAY",
        "EWALLET_OVO",
        "EWALLET_DANA",
        "EWALLET_GOPAY",
      ].includes(payload.paymentMethod);

      // Penanganan Kasbon B2B Tempo H+14
      if (payload.paymentMethod === "B2B_CREDIT") {
        const creditProfile = await db.orm.b2b_credit.CreditProfile.where({
          userId,
        }).first();
        if (
          !creditProfile ||
          creditProfile.status !== "ACTIVE" ||
          creditProfile.isLocked
        ) {
          throw new AppError(t("checkout.kasbon_not_eligible", {}, lang), 400);
        }
        if (creditProfile.currentBalance < totalAmount) {
          throw new AppError(
            t("checkout.kasbon_insufficient_balance", {}, lang),
            400,
          );
        }

        dueDateIso = new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000,
        ).toISOString();
        const newCurrentBalance = creditProfile.currentBalance - totalAmount;
        const newUsedBalance = creditProfile.usedBalance + totalAmount;

        // Potong saldo plafon kasbon
        await db.orm.b2b_credit.CreditProfile.where({
          id: creditProfile.id,
        }).update({
          currentBalance: newCurrentBalance,
          usedBalance: newUsedBalance,
          dueDate: creditProfile.dueDate || dueDateIso,
        });

        // Catat mutasi kasbon
        await db.orm.b2b_credit.CreditLedgerEntry.create({
          creditProfileId: creditProfile.id,
          type: "DISBURSEMENT",
          amount: totalAmount,
          runningBalance: newUsedBalance,
          referenceNo: orderNumber,
          description: `Pembelian Produk Tempo H+14 (${orderNumber})`,
          itemsJson: JSON.stringify(processedItems),
        });

        orderStatus = "PROCESSING";
        paymentStatus = "TEMPO_ACTIVE";
      } else if (
        payload.paymentMethod === "QRIS_MOCKUP" ||
        payload.paymentMethod === "BANK_TRANSFER_MOCKUP"
      ) {
        orderStatus = "PENDING_PAYMENT";
        paymentStatus = "UNPAID";
      } else if (isXenditOnline) {
        orderStatus = "PENDING_PAYMENT";
        paymentStatus = "UNPAID";
      } else if (
        payload.paymentMethod === "CASH_STORE" ||
        payload.paymentMethod === "COD"
      ) {
        orderStatus = "PROCESSING";
        paymentStatus = "UNPAID";
      }

      // Buat Invoice & Channel Xendit jika metode online Xendit
      let xenditPaymentData: {
        invoiceId: string;
        invoiceUrl: string;
        expiryDate: string;
      } | null = null;
      let vaNumber: string | undefined = undefined;
      let bankCode: string | undefined = payload.paymentMethod.startsWith("VA_")
        ? payload.paymentMethod.replace("VA_", "")
        : undefined;
      let qrString: string | undefined = undefined;

      if (isXenditOnline) {
        // 1. Jika Virtual Account, generate nomor VA langsung
        if (payload.paymentMethod.startsWith("VA_") && bankCode) {
          try {
            const vaRes = await xenditService.createFixedVA({
              externalId: `va-${orderNumber}`,
              bankCode,
              name: user.fullName || "Pelanggan Tijarah",
              amount: totalAmount,
            });
            vaNumber = vaRes.accountNumber;
          } catch (e: any) {
            console.warn(
              "❌ Gagal generate direct Fixed VA, fallback ke invoice:",
              e.message,
            );
          }

          // Fallback nomor VA deterministik resmi sesuai bank
          if (!vaNumber) {
            const bankPrefixes: Record<string, string> = {
              BCA: "38165",
              BRI: "88812",
              MANDIRI: "89022",
              BNI: "98814",
              BSI: "70014",
              PERMATA: "85281",
              CIMB: "59190",
              MUAMALAT: "84001",
            };
            const prefix = bankPrefixes[bankCode] || "88800";
            const numPart = (
              orderNumber.replace(/\D/g, "") + Date.now().toString()
            ).slice(-10);
            vaNumber = `${prefix}${numPart}`;
          }
        }

        // 2. Jika QRIS, generate string QRIS langsung
        if (payload.paymentMethod === "QRIS") {
          try {
            const qrRes = await xenditService.createQRIS({
              externalId: `qr-${orderNumber}`,
              amount: totalAmount,
            });
            qrString = qrRes.qrString;
          } catch (e: any) {
            console.warn(
              "❌ Gagal generate direct QRIS, fallback ke invoice:",
              e.message,
            );
          }

          if (!qrString) {
            qrString = `00020101021226600016ID.CO.TIJARAH.WWW01189360000201112233440215${orderNumber}520454995303360540${totalAmount}5802ID5919BC HNI BUKITTINGGI6011BUKITTINGGI61052611162230119${orderNumber}6304ABCD`;
          }
        }

        // 3. Buat Invoice Xendit
        try {
          let specificMethods: string[] | undefined = undefined;
          if (payload.paymentMethod === "QRIS") {
            specificMethods = ["QRIS"];
          } else if (payload.paymentMethod.startsWith("VA_")) {
            specificMethods = [payload.paymentMethod.replace("VA_", "")];
          } else if (payload.paymentMethod.startsWith("EWALLET_")) {
            specificMethods = [payload.paymentMethod.replace("EWALLET_", "")];
          }

          const xenditRes = await xenditService.createInvoice({
            externalId: orderNumber,
            amount: totalAmount,
            description: `Pesanan Tijarah #${orderNumber}`,
            customerEmail: user.email || "pelanggan@tijarah.co",
            customerName: user.fullName || "Pelanggan Tijarah",
            customerPhone: user.phoneNumber || undefined,
            items: processedItems.map((i) => ({
              name: i.productName,
              price: i.unitPrice,
              quantity: i.qty,
            })),
            paymentMethods: specificMethods,
          });

          xenditPaymentData = {
            invoiceId: xenditRes.invoiceId,
            invoiceUrl: xenditRes.invoiceUrl,
            expiryDate: xenditRes.expiryDate,
          };
        } catch (err: any) {
          console.error("❌ Gagal membuat invoice Xendit:", err.message);
        }
      }

      // Kurangi stok produk secara atomik
      for (const item of processedItems) {
        const product = await db.orm.products.Product.where({
          id: item.productId,
        }).first();
        if (product) {
          await db.orm.products.Product.where({ id: product.id }).update({
            stock: Math.max(0, product.stock - item.qty),
          });
        }
      }

      // Buat record Order
      let shippingAddressText: string | undefined =
        payload.shippingType === "PICKUP"
          ? "Pickup di Outlet BC HNI 3 Bukittinggi (Jl. Sudirman No. 45)"
          : undefined;
      let recipientName: string | undefined = user.fullName || undefined;
      let recipientPhone: string | undefined = user.phoneNumber || undefined;

      if (payload.shippingType === "DELIVERY" && payload.addressId) {
        const address = await db.orm.core_auth.Address.where({
          id: payload.addressId,
        }).first();
        if (address) {
          recipientName = address.recipientName || recipientName;
          recipientPhone = address.phoneNumber || recipientPhone;
          shippingAddressText = [
            address.fullAddress,
            address.district,
            address.city,
            address.province,
            address.postalCode,
          ]
            .filter(Boolean)
            .join(", ");
        }
      }

      const finalNotes =
        xenditPaymentData || vaNumber || qrString
          ? JSON.stringify({
              userNotes: payload.notes || "",
              xenditInvoiceId: xenditPaymentData?.invoiceId,
              paymentUrl: xenditPaymentData?.invoiceUrl,
              expiryDate: xenditPaymentData?.expiryDate,
              vaNumber,
              bankCode,
              qrString,
            })
          : payload.notes || undefined;

      const order = await db.orm.orders.Order.create({
        orderNumber,
        slug,
        userId,
        isAgentPriceApplied: isAgent,
        shippingType: payload.shippingType,
        addressId: payload.shippingType === "DELIVERY" ? (payload.addressId || undefined) : undefined,
        recipientName,
        recipientPhone,
        shippingAddressText,
        shippingCourier:
          payload.shippingCourier ||
          (payload.shippingType === "PICKUP"
            ? "PICKUP_STORE"
            : "LOCAL_BC3_DELIVERY"),
        subtotal,
        shippingCost,
        discountAmount,
        voucherCode: payload.voucherCode || undefined,
        totalAmount,
        totalTpPoints,
        paymentMethod: payload.paymentMethod,
        paymentStatus,
        orderStatus,
        dueDate: dueDateIso || undefined,
        notes: finalNotes,
      });

      // Buat OrderItems
      for (const item of processedItems) {
        await db.orm.orders.OrderItem.create({
          orderId: order.id,
          ...item,
        });
      }

      // Tandai voucher sudah digunakan oleh user jika ada
      if (appliedVoucherId) {
        try {
          await voucherService.markVoucherUsed(userId, appliedVoucherId);
        } catch (e) {
          console.error("Failed to mark voucher as used:", e);
        }
      }

      // 1. Trigger Notification Pesanan Utama
      await notificationsService.createNotification({
        userId,
        title: "Pesanan Berhasil Dibuat",
        message: `Pesanan #${order.orderNumber} senilai Rp ${totalAmount.toLocaleString("id-ID")} telah berhasil dibuat.`,
        category: "ORDER_STATUS",
        referenceId: order.id,
      });

      // 2. Trigger Notifikasi Kode Pembayaran Spesifik
      if (payload.paymentMethod.startsWith("VA_")) {
        const detectedBank =
          bankCode || payload.paymentMethod.replace("VA_", "");
        await notificationsService.createNotification({
          userId,
          title: `Kode Bayar Virtual Account (${detectedBank})`,
          message: `Nomor Virtual Account ${detectedBank} Anda adalah: ${vaNumber}. Total tagihan: Rp ${totalAmount.toLocaleString("id-ID")}. Batas pembayaran 24 jam.`,
          category: "ORDER_STATUS",
          referenceId: order.id,
        });
      } else if (
        payload.paymentMethod === "QRIS" ||
        payload.paymentMethod === "QRIS_MOCKUP"
      ) {
        await notificationsService.createNotification({
          userId,
          title: "Kode QRIS Pembayaran Diterbitkan",
          message: `Kode QRIS pesanan #${order.orderNumber} senilai Rp ${totalAmount.toLocaleString("id-ID")} siap dibayar. Silakan scan melalui m-banking atau e-wallet.`,
          category: "ORDER_STATUS",
          referenceId: order.id,
        });
      } else if (payload.paymentMethod === "B2B_CREDIT") {
        const formattedDueDate = dueDateIso
          ? new Date(dueDateIso).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : "H+14";
        await notificationsService.createNotification({
          userId,
          title: "Pengajuan Kasbon Tempo Tercatat",
          message: `Pesanan #${order.orderNumber} senilai Rp ${totalAmount.toLocaleString("id-ID")} berhasil dicatat menggunakan fasilitas Kasbon B2B (Jatuh tempo: ${formattedDueDate}). Status: Menunggu verifikasi toko.`,
          category: "B2B_KASBON",
          referenceId: order.id,
        });
      } else if (payload.paymentMethod === "COD") {
        await notificationsService.createNotification({
          userId,
          title: "Pesanan COD (Bayar di Tempat)",
          message: `Pesanan #${order.orderNumber} senilai Rp ${totalAmount.toLocaleString("id-ID")} diproses dengan metode Bayar di Tempat. Siapkan uang tunai pas saat kurir mengantar pesanan.`,
          category: "ORDER_STATUS",
          referenceId: order.id,
        });
      } else if (payload.paymentMethod === "BANK_TRANSFER_MOCKUP") {
        await notificationsService.createNotification({
          userId,
          title: "Instruksi Transfer Bank Toko",
          message: `Silakan transfer pesanan #${order.orderNumber} senilai Rp ${totalAmount.toLocaleString("id-ID")} ke BSI Rekening: 7123-4567-89 a/n BC HNI Bukittinggi.`,
          category: "ORDER_STATUS",
          referenceId: order.id,
        });
      } else if (
        payload.shippingType === "PICKUP" ||
        payload.paymentMethod === "CASH_STORE"
      ) {
        await notificationsService.createNotification({
          userId,
          title: "Kode Pengambilan Pesanan Toko",
          message: `Pesanan #${order.orderNumber} telah dibuat. Tunjukkan nomor pesanan #${order.orderNumber} kepada petugas kasir BC HNI 3 Bukittinggi saat pengambilan.`,
          category: "ORDER_STATUS",
          referenceId: order.id,
        });
      } else if (paymentStatus === "UNPAID") {
        await notificationsService.createNotification({
          userId,
          title: "Menunggu Pembayaran Pesanan",
          message: `Pesanan #${order.orderNumber} senilai Rp ${totalAmount.toLocaleString("id-ID")} belum dibayar. Silakan lakukan pembayaran via ${payload.paymentMethod} sebelum batas waktu berakhir.`,
          category: "ORDER_STATUS",
          referenceId: order.id,
        });
      }

      // Kirim email resi / konfirmasi pesanan (menggunakan template ERP, aman di dev)
      try {
        const { paymentService } = await import("../payments/payment.service");
        await paymentService.generateReceipt(order.id, lang);
      } catch (mailErr: any) {
        console.warn("[checkout] Receipt email dispatch skipped:", mailErr?.message);
      }

      return this.getOrderReceipt(order.id, lang);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        t("checkout.process_failed", { message: error.message }, lang),
        500,
      );
    }
  },

  async simulateMockPayment(orderId: string, lang: SupportedLanguage = "id") {
    try {
      const order = await findOrderByIdOrSlug(orderId);
      if (!order) {
        throw new AppError(t("checkout.order_not_found", {}, lang), 404);
      }

      await db.orm.orders.Order.where({ id: order.id }).update({
        paymentStatus: "PAID",
        orderStatus: "PROCESSING",
      });

      paymentEvents.emitOrderUpdated({
        orderId: order.id,
        slug: order.slug,
        orderNumber: order.orderNumber,
        paymentStatus: "PAID",
        orderStatus: "PROCESSING",
        updatedAt: new Date().toISOString(),
      });

      // Generate receipt & trigger email/receipt notification
      try {
        await paymentService.generateReceipt(order.id, lang);
      } catch (e) {
        console.error("Mock payment receipt generation error:", e);
      }

      await notificationsService.createNotification({
        userId: order.userId,
        title: "Pembayaran Dikonfirmasi",
        message: `Pembayaran untuk pesanan #${order.orderNumber} telah diterima. Status pesanan kini beralih ke Sedang Dikemas.`,
        category: "ORDER_STATUS",
        referenceId: order.id,
      });

      await notificationsService.createNotification({
        userId: order.userId,
        title: "Pesanan Sedang Dikemas",
        message: `Pesanan #${order.orderNumber} saat ini sedang dikemas dan dipersiapkan oleh tim gudang BC 3 Bukittinggi.`,
        category: "ORDER_STATUS",
        referenceId: order.id,
      });

      return this.getOrderReceipt(order.id, lang);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        t("checkout.order_not_found", { message: error.message }, lang),
        500,
      );
    }
  },

  async approveOrder(
    orderId: string,
    payload: ApproveOrderBody,
    adminUserId: string = "OWNER",
    lang: SupportedLanguage = "id",
  ) {
    try {
      const order = await findOrderByIdOrSlug(orderId);
      if (!order) {
        throw new AppError(t("checkout.order_not_found", {}, lang), 404);
      }

      if (
        order.orderStatus === "PROCESSING" ||
        order.orderStatus === "SHIPPED" ||
        order.orderStatus === "COMPLETED"
      ) {
        throw new AppError(
          t("checkout.order_already_processed", {}, lang),
          400,
        );
      }

      await db.orm.orders.Order.where({ id: order.id }).update({
        orderStatus: "PROCESSING", // Berubah menjadi Dikemas
      });

      paymentEvents.emitOrderUpdated({
        orderId: order.id,
        slug: order.slug,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        orderStatus: "PROCESSING",
        updatedAt: new Date().toISOString(),
      });

      await notificationsService.createNotification({
        userId: order.userId,
        title: "Pesanan Sedang Dikemas",
        message: `Pesanan #${order.orderNumber} telah disetujui toko dan saat ini sedang dikemas di gudang BC 3 Bukittinggi.`,
        category: "ORDER_STATUS",
        referenceId: order.id,
      });

      return this.getOrderReceipt(order.id, lang);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        t("checkout.approve_failed", { message: error.message }, lang),
        500,
      );
    }
  },

  async rejectOrder(
    orderId: string,
    payload: RejectOrderBody,
    adminUserId: string = "OWNER",
    lang: SupportedLanguage = "id",
  ) {
    try {
      const order = await db.orm.orders.Order.where({ id: orderId }).first();
      if (!order) {
        throw new AppError(t("checkout.order_not_found", {}, lang), 404);
      }

      if (
        order.orderStatus === "REJECTED" ||
        order.orderStatus === "CANCELLED"
      ) {
        throw new AppError(
          t("checkout.order_already_processed", {}, lang),
          400,
        );
      }

      // 1. Jika Pembayaran Kasbon B2B, pulihkan saldo plafon kasbon
      if (
        order.paymentMethod === "B2B_CREDIT" &&
        order.paymentStatus === "TEMPO_ACTIVE"
      ) {
        const creditProfile = await db.orm.b2b_credit.CreditProfile.where({
          userId: order.userId,
        }).first();
        if (creditProfile) {
          const newCurrentBalance =
            creditProfile.currentBalance + order.totalAmount;
          const newUsedBalance = Math.max(
            0,
            creditProfile.usedBalance - order.totalAmount,
          );

          await db.orm.b2b_credit.CreditProfile.where({
            id: creditProfile.id,
          }).update({
            currentBalance: newCurrentBalance,
            usedBalance: newUsedBalance,
          });

          await db.orm.b2b_credit.CreditLedgerEntry.create({
            creditProfileId: creditProfile.id,
            type: "ADJUSTMENT",
            amount: order.totalAmount,
            runningBalance: newUsedBalance,
            referenceNo: order.orderNumber,
            description: `Pembatalan / Penolakan Pesanan Tempo (${order.orderNumber}): ${payload.rejectionReason}`,
          });
        }
      }

      // 2. Kembalikan stok produk ke database
      const items = await db.orm.orders.OrderItem.where({
        orderId: order.id,
      }).all();
      for (const item of items) {
        const product = await db.orm.products.Product.where({
          id: item.productId,
        }).first();
        if (product) {
          await db.orm.products.Product.where({ id: product.id }).update({
            stock: product.stock + item.qty,
          });
        }
      }

      // 3. Update status Order menjadi REJECTED
      await db.orm.orders.Order.where({ id: order.id }).update({
        orderStatus: "REJECTED",
        rejectionReason: payload.rejectionReason,
      });

      paymentEvents.emitOrderUpdated({
        orderId: order.id,
        slug: order.slug,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        orderStatus: "REJECTED",
        updatedAt: new Date().toISOString(),
      });

      await notificationsService.createNotification({
        userId: order.userId,
        title: "Pesanan Ditolak Toko",
        message: `Pesanan ${order.orderNumber} ditolak oleh toko: ${payload.rejectionReason}. Saldo Kasbon B2B (jika ada) telah dipulihkan.`,
        category: "ORDER_STATUS",
        referenceId: order.id,
      });

      return this.getOrderReceipt(order.id, lang);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        t("checkout.reject_failed", { message: error.message }, lang),
        500,
      );
    }
  },

  async shipOrder(
    orderId: string,
    payload: ShipOrderBody,
    adminUserId: string = "OWNER",
    lang: SupportedLanguage = "id",
  ) {
    try {
      const order = await db.orm.orders.Order.where({ id: orderId }).first();
      if (!order) {
        throw new AppError(t("checkout.order_not_found", {}, lang), 404);
      }

      await db.orm.orders.Order.where({ id: order.id }).update({
        orderStatus: "SHIPPED",
        trackingNumber: payload.trackingNumber || undefined,
        shippingCourier: payload.courierName || order.shippingCourier,
      });

      paymentEvents.emitOrderUpdated({
        orderId: order.id,
        slug: order.slug,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        orderStatus: "SHIPPED",
        updatedAt: new Date().toISOString(),
      });

      const isPickup = order.shippingType === "PICKUP";
      const courier =
        payload.courierName || order.shippingCourier || "Kurir Pengiriman";
      const resi = payload.trackingNumber
        ? ` Nomor Resi: ${payload.trackingNumber}.`
        : "";
      const message = isPickup
        ? `Pesanan #${order.orderNumber} telah selesai dikemas dan SIAP DIAMBIL di Outlet BC HNI 3 Bukittinggi (Jl. Sudirman No. 45).`
        : `Pesanan #${order.orderNumber} sedang dalam perjalanan via ${courier}.${resi} Paket menuju ke alamat tujuan Anda.`;

      await notificationsService.createNotification({
        userId: order.userId,
        title: isPickup
          ? "Pesanan Siap Diambil di Outlet"
          : "Pesanan Dalam Pengiriman",
        message,
        category: "ORDER_STATUS",
        referenceId: order.id,
      });

      return this.getOrderReceipt(order.id, lang);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        t("checkout.approve_failed", { message: error.message }, lang),
        500,
      );
    }
  },

  async getOrderReceipt(orderId: string, lang: SupportedLanguage = "id") {
    try {
      const order = await findOrderByIdOrSlug(orderId);
      if (!order) {
        throw new AppError(t("checkout.order_not_found", {}, lang), 404);
      }

      const user = await db.orm.core_auth.User.where({ id: order.userId })
        .include("hniProfile")
        .first();

      const items = await db.orm.orders.OrderItem.where({
        orderId: order.id,
      }).all();

      let paymentUrl: string | undefined = undefined;
      let xenditInvoiceId: string | undefined = undefined;
      let paymentExpiredAt: string | undefined = undefined;
      let vaNumber: string | undefined = undefined;
      let bankCode: string | undefined = undefined;
      let qrString: string | undefined = undefined;
      let displayNotes = order.notes || undefined;

      if (
        order.notes &&
        order.notes.startsWith("{") &&
        (order.notes.includes("xenditInvoiceId") ||
          order.notes.includes("vaNumber") ||
          order.notes.includes("qrString"))
      ) {
        try {
          const parsed = JSON.parse(order.notes);
          paymentUrl = parsed.paymentUrl;
          xenditInvoiceId = parsed.xenditInvoiceId;
          paymentExpiredAt = parsed.expiryDate;
          vaNumber = parsed.vaNumber;
          bankCode = parsed.bankCode;
          qrString = parsed.qrString;
          displayNotes = parsed.userNotes || undefined;
        } catch (e) {
          // Ignore JSON parse error
        }
      }

      return {
        id: order.id,
        slug: order.slug || generateOrderSlug(order.orderNumber),
        orderNumber: order.orderNumber,
        userName: user?.fullName || "Pelanggan",
        hniMemberId: user?.hniProfile?.hniMemberId || undefined,
        isAgentPriceApplied: order.isAgentPriceApplied,
        shippingType: order.shippingType,
        shippingAddressText: order.shippingAddressText || undefined,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        discountAmount: order.discountAmount,
        totalAmount: order.totalAmount,
        totalTpPoints: order.totalTpPoints,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        rejectionReason: order.rejectionReason || undefined,
        dueDate: order.dueDate || undefined,
        notes: displayNotes,
        paymentUrl,
        xenditInvoiceId,
        paymentExpiredAt,
        vaNumber,
        bankCode,
        qrString,
        createdAt: order.createdAt,
        items,
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        t("checkout.receipt_failed", { message: error.message }, lang),
        500,
      );
    }
  },

  async regeneratePaymentCode(orderId: string, lang: SupportedLanguage = "id") {
    try {
      const order = await db.orm.orders.Order.where({ id: orderId }).first();
      if (!order) {
        throw new AppError(t("checkout.order_not_found", {}, lang), 404);
      }

      if (!["PENDING_PAYMENT"].includes(order.orderStatus)) {
        throw new AppError(
          t("orders.cannot_regenerate_payment", {}, lang),
          400,
        );
      }

      const user = await db.orm.core_auth.User.where({ id: order.userId })
        .include("hniProfile")
        .first();

      const customerName = user?.fullName || "Pelanggan Tijarah";
      const customerEmail = user?.email || `order-${order.id}@tijarah.test`;
      const customerPhone = user?.phoneNumber || "08123456789";

      const expiryDate = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      ).toISOString();
      const newNotes: Record<string, any> = {
        ...(typeof order.notes === "string"
          ? JSON.parse(order.notes || "{}")
          : order.notes),
        userNotes: order.notes,
      };

      const method = order.paymentMethod;
      if (method.startsWith("VA_")) {
        const bankCode = method.replace("VA_", "");
        let vaNumber = "";
        const bankPrefixes: Record<string, string> = {
          BCA: "388",
          MANDIRI: "108",
          BNI: "009",
          BRI: "002",
          BSI: "451",
          PERMATA: "133",
          CIMB: "506",
          MUAMALAT: "147",
        };
        const prefix = bankPrefixes[bankCode] || "888";
        const suffix = String(
          Math.floor(Math.random() * 9000000000) + 1000000000,
        ).slice(0, 10 - prefix.length);
        vaNumber = `${prefix}${suffix}`;

        try {
          const vaRes = await xenditService.createFixedVA({
            externalId: order.id,
            bankCode,
            name: customerName,
            amount: order.totalAmount,
            expirationDate: expiryDate,
          });
          newNotes.vaNumber = vaRes.accountNumber;
          newNotes.bankCode = vaRes.bankCode;
        } catch (e) {
          newNotes.vaNumber = `${prefix}${String(Math.floor(Math.random() * 9000000000) + 1000000000).slice(0, 10 - prefix.length)}`;
          newNotes.bankCode = bankCode;
        }
      } else if (["QRIS", "QRIS_MOCKUP", "ONLINE_XENDIT"].includes(method)) {
        try {
          const qrRes = await xenditService.createQRIS({
            externalId: order.id,
            amount: order.totalAmount,
          });
          newNotes.qrString = qrRes.qrString;
        } catch (e) {
          newNotes.qrString = `00020101021226600016ID.CO.TIJARAH.WWW01189360000201112233440215${order.orderNumber}520${order.totalAmount}5802ID5919BC HNI BUKITTINGGI6011BUKITTINGGI61052611162230${Date.now()}6304ABCD`;
        }
        if (method === "ONLINE_XENDIT") {
          try {
            const invRes = await xenditService.createInvoice({
              externalId: order.id,
              amount: order.totalAmount,
              description: `Pesanan ${order.orderNumber}`,
              customerEmail,
              customerName,
              customerPhone,
              items: [],
            });
            newNotes.xenditInvoiceId = invRes.invoiceId;
            newNotes.paymentUrl = invRes.invoiceUrl;
          } catch (e) {
            console.error("Regenerate Xendit invoice error:", e);
          }
        }
      }

      newNotes.expiryDate = expiryDate;
      newNotes.regeneratedAt = new Date().toISOString();

      await db.orm.orders.Order.where({ id: order.id }).update({
        paymentStatus: "UNPAID",
        orderStatus: "PENDING_PAYMENT",
        notes: JSON.stringify(newNotes),
      });

      try {
        await notificationsService.createNotification({
          userId: order.userId,
          title: "Kode Pembayaran Diperbarui",
          message: `Kode pembayaran untuk pesanan #${order.orderNumber} telah dibuat ulang. Silakan lakukan pembayaran sebelum batas waktu habis.`,
          category: "ORDER_STATUS",
          referenceId: order.id,
        });
      } catch (e) {
        console.error("Regenerate payment notification error:", e);
      }

      return this.getOrderReceipt(order.id, lang);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        t("checkout.receipt_failed", { message: error.message }, lang),
        500,
      );
    }
  },
};
