"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "../api/profile.api";
import {
  UserOrderSummary,
  GetOrdersQueryParams,
  OrderStatusCounts,
  OrderStatusType,
} from "../types/profile.types";
import { useAuthStore } from "@/modules/auth/services/auth.store";

export interface UseOrdersOptions {
  status?: OrderStatusType;
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

const emptyCounts: OrderStatusCounts = {
  ALL: 0,
  PENDING_PAYMENT: 0,
  PROCESSING: 0,
  SHIPPED: 0,
  COMPLETED: 0,
  REJECTED: 0,
  CANCELLED: 0,
};

export function useOrders(options: UseOrdersOptions = {}) {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);
  const userId = authUser?.id;

  const queryParams: GetOrdersQueryParams = {
    userId,
    status: options.status,
    page: options.page || 1,
    limit: options.limit || 10,
    search: options.search,
    startDate: options.startDate,
    endDate: options.endDate,
  };

  // 1. Fetch Orders List (No mock fallback on error)
  const {
    data: ordersResponse,
    isLoading: isOrdersLoading,
    isError: isOrdersError,
    error: ordersError,
    refetch: refreshOrders,
  } = useQuery({
    queryKey: ["user-orders", userId, queryParams],
    queryFn: async () => {
      // Direct API call without silent mock fallback
      return await profileApi.getOrders(queryParams);
    },
    staleTime: 1000 * 60 * 2, // 2 menit
    retry: 1,
  });

  // 2. Fetch Status Counts
  const {
    data: countsData,
    isLoading: isCountsLoading,
  } = useQuery({
    queryKey: ["user-orders-status-counts", userId],
    queryFn: async () => {
      const res = await profileApi.getOrderStatusCounts(userId);
      return res || emptyCounts;
    },
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });

  // 3. Mutation: Batalkan Pesanan
  const cancelOrderMutation = useMutation({
    mutationFn: async ({
      orderId,
      reason,
      refundBankName,
      refundAccountNumber,
      refundAccountName,
    }: {
      orderId: string;
      reason?: string;
      refundBankName?: string;
      refundAccountNumber?: string;
      refundAccountName?: string;
    }) => {
      return await profileApi.cancelOrder(orderId, reason, {
        refundBankName,
        refundAccountNumber,
        refundAccountName,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-orders"] });
      queryClient.invalidateQueries({ queryKey: ["user-orders-status-counts"] });
      queryClient.invalidateQueries({ queryKey: ["credit-account"] });
    },
  });

  // 4. Mutation: Konfirmasi Pesanan Diterima
  const confirmDeliveredMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return await profileApi.confirmOrderDelivered(orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-orders"] });
      queryClient.invalidateQueries({ queryKey: ["user-orders-status-counts"] });
    },
  });

  const orders = ordersResponse?.data || [];
  const meta = ordersResponse?.meta;
  const counts: OrderStatusCounts = countsData || emptyCounts;

  const activeOrdersCount = orders.filter(
    (o) =>
      o.status === "PROCESSING" ||
      o.status === "SHIPPED" ||
      o.status === "PENDING_PAYMENT"
  ).length;

  return {
    orders,
    meta,
    counts,
    activeOrdersCount,
    isLoading: isOrdersLoading || isCountsLoading,
    isError: isOrdersError,
    error: ordersError?.message || null,
    refreshOrders,
    cancelOrder: cancelOrderMutation.mutateAsync,
    isCancelling: cancelOrderMutation.isPending,
    confirmDelivered: confirmDeliveredMutation.mutateAsync,
    isConfirming: confirmDeliveredMutation.isPending,
  };
}

export default useOrders;
