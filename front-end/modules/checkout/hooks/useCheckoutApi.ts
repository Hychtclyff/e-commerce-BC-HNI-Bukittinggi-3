"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { checkoutApi } from "../api/checkout.api";
import {
  CalculateCheckoutPayload,
  ProcessCheckoutPayload,
} from "../types/checkout.api.types";
import { showToast, handleApiError } from "@/utils/toast";

export function useCheckoutApi() {
  const queryClient = useQueryClient();
  const t = useTranslations("Checkout");

  // 1. Mutation untuk Kalkulasi Real-time
  const calculateMutation = useMutation({
    mutationFn: async (payload: CalculateCheckoutPayload) => {
      return await checkoutApi.calculateCheckout(payload);
    },
    onError: (err: any) => {
      // Kalkulasi silent warning jika gagal terkoneksi API backend (agar UI tetap usable)
      console.warn("Kalkulasi checkout server error:", err?.message);
    },
  });

  // 2. Mutation untuk Eksekusi Order Checkout
  const processCheckoutMutation = useMutation({
    mutationFn: async (payload: ProcessCheckoutPayload) => {
      return await checkoutApi.processCheckout(payload);
    },
    onSuccess: () => {
      // Invalidate cache riwayat pesanan, plafon kasbon, dan notifikasi
      queryClient.invalidateQueries({ queryKey: ["user-orders"] });
      queryClient.invalidateQueries({
        queryKey: ["user-orders-status-counts"],
      });
      queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["user-notifications-unread"],
      });
      queryClient.invalidateQueries({ queryKey: ["b2b-credit"] });
      queryClient.invalidateQueries({ queryKey: ["vouchers-list"] });
    },
    onError: (err: any) => {
      handleApiError(err, t("toastProcessError"));
    },
  });

  // 3. Mutation untuk Simulasi Pembayaran QRIS / Transfer
  const mockPayMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return await checkoutApi.mockPay(orderId);
    },
    onSuccess: (result) => {
      showToast.success(
        t("toastMockPaySuccessTitle"),
        t("toastMockPaySuccessDesc", { orderNumber: result.orderNumber }),
      );
      queryClient.invalidateQueries({ queryKey: ["user-orders"] });
      queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["user-notifications-unread"] });
    },
    onError: (err: any) => {
      handleApiError(err, t("toastMockPayError"));
    },
  });

  // 4. Mutation untuk Simulasi Persetujuan Owner
  const approveMutation = useMutation({
    mutationFn: async ({
      orderId,
      notes,
    }: {
      orderId: string;
      notes?: string;
    }) => {
      return await checkoutApi.approveOrder(orderId, notes);
    },
    onSuccess: (result) => {
      showToast.success(
        t("toastApproveSuccessTitle"),
        t("toastApproveSuccessDesc", { orderNumber: result.orderNumber }),
      );
      queryClient.invalidateQueries({ queryKey: ["user-orders"] });
      queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["user-notifications-unread"] });
    },
    onError: (err: any) => {
      handleApiError(err, t("toastApproveError"));
    },
  });

  // 5. Mutation untuk Simulasi Pengiriman Pesanan
  const shipMutation = useMutation({
    mutationFn: async ({
      orderId,
      trackingNumber,
      courierName,
    }: {
      orderId: string;
      trackingNumber?: string;
      courierName?: string;
    }) => {
      return await checkoutApi.shipOrder(orderId, {
        trackingNumber,
        courierName,
      });
    },
    onSuccess: (result) => {
      showToast.success(
        t("toastShipSuccessTitle"),
        t("toastShipSuccessDesc", { orderNumber: result.orderNumber }),
      );
      queryClient.invalidateQueries({ queryKey: ["user-orders"] });
      queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["user-notifications-unread"] });
    },
    onError: (err: any) => {
      handleApiError(err, t("toastShipError"));
    },
  });

  // 6. Mutation untuk Simulasi Penolakan Pesanan & Refund Kasbon
  const rejectMutation = useMutation({
    mutationFn: async ({
      orderId,
      rejectionReason,
    }: {
      orderId: string;
      rejectionReason: string;
    }) => {
      return await checkoutApi.rejectOrder(orderId, rejectionReason);
    },
    onSuccess: (result) => {
      showToast.warning(
        t("toastRejectSuccessTitle"),
        t("toastRejectSuccessDesc", { orderNumber: result.orderNumber }),
      );
      queryClient.invalidateQueries({ queryKey: ["user-orders"] });
      queryClient.invalidateQueries({ queryKey: ["b2b-credit"] });
      queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["user-notifications-unread"] });
    },
    onError: (err: any) => {
      handleApiError(err, t("toastRejectError"));
    },
  });

  return {
    calculateCheckout: calculateMutation.mutateAsync,
    isCalculating: calculateMutation.isPending,
    calculationResult: calculateMutation.data,

    processCheckout: processCheckoutMutation.mutateAsync,
    isProcessing: processCheckoutMutation.isPending,

    simulateMockPay: mockPayMutation.mutateAsync,
    isMockPaying: mockPayMutation.isPending,

    simulateApprove: approveMutation.mutateAsync,
    simulateShip: shipMutation.mutateAsync,
    simulateReject: rejectMutation.mutateAsync,
  };
}

export default useCheckoutApi;
