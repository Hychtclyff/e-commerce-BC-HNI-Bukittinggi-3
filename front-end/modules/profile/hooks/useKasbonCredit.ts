"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "../api/profile.api";
import { B2BCreditProfileData, CreditLedgerEntry, CreditApplicationPayload } from "../types/profile.types";
import { useAuthStore } from "@/modules/auth/services/auth.store";

export function useKasbonCredit(initialAccount?: B2BCreditProfileData | null) {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);
  const userId = authUser?.id;

  // ── 1. Fetch Akun Kasbon B2B ──────────────────────────────────────────────
  const {
    data: creditAccountData,
    isLoading: isAccountLoading,
    isError: isAccountError,
    error: accountError,
    refetch: refetchAccount,
  } = useQuery<B2BCreditProfileData, Error>({
    queryKey: ["credit-account", userId],
    queryFn: async () => {
      try {
        return await profileApi.getCreditAccount(userId);
      } catch (err: any) {
        console.warn("API credit account error, fallback to initial/unregistered:", err?.message);
        if (initialAccount) return initialAccount;

        // Default: Pengguna baru belum terdaftar kasbon (UNREGISTERED)
        return {
          id: "cred_mock_001",
          userId: userId || "usr_mock_001",
          status: "UNREGISTERED",
          creditLimit: 2000000,
          currentBalance: 2000000,
          usedBalance: 0,
          dueDate: null,
          isLocked: false,
          postingMode: "STRICT_HOLD",
          appliedAt: null,
        };
      }
    },
    staleTime: 1000 * 60 * 3, // 3 menit
    retry: 1,
  });

  // ── 2. Mutation Pengajuan Plafon Kasbon B2B ───────────────────────────────
  const applyCreditMutation = useMutation<B2BCreditProfileData, Error, CreditApplicationPayload>({
    mutationFn: async (payload: CreditApplicationPayload) => {
      try {
        return await profileApi.applyCreditAccount(payload);
      } catch (err: any) {
        // Fallback simulasi respons jika backend belum live
        return {
          id: "cred_mock_pending",
          userId: userId || "usr_mock_001",
          status: "PENDING_APPROVAL",
          creditLimit: payload.requestedLimit || 2000000,
          currentBalance: payload.requestedLimit || 2000000,
          usedBalance: 0,
          dueDate: null,
          isLocked: false,
          postingMode: "STRICT_HOLD",
          appliedAt: new Date().toISOString(),
        };
      }
    },
    onSuccess: (newAccount) => {
      queryClient.setQueryData(["credit-account", userId], newAccount);
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    },
  });

  // ── 2. Fetch Riwayat Mutasi Kasbon (Ledger) ───────────────────────────────
  const {
    data: ledgerEntriesData,
    isLoading: isLedgerLoading,
    isError: isLedgerError,
    error: ledgerError,
    refetch: refetchLedger,
  } = useQuery<CreditLedgerEntry[], Error>({
    queryKey: ["credit-ledger", userId],
    queryFn: async () => {
      try {
        return await profileApi.getCreditLedger(userId);
      } catch (err: any) {
        console.warn("API credit ledger error, fallback to mock:", err?.message);
        return [
          {
            id: "led_01",
            creditProfileId: "cred_mock_001",
            type: "DISBURSEMENT",
            amount: 750000,
            runningBalance: 750000,
            referenceNo: "INV/2026/09/BC3-0042",
            description: "Pengambilan Barang Tempo 1 Koli Herba HNI",
            createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
            items: [
              {
                id: "item_1",
                productName: "Minyak Herba Sinergi (MHS 100ml)",
                qty: 5,
                unitPrice: 45000,
                tpPoints: 10,
                totalPrice: 225000,
              },
              {
                id: "item_2",
                productName: "Sari Kurma Healthy Dates 350g",
                qty: 3,
                unitPrice: 50000,
                tpPoints: 12,
                totalPrice: 150000,
              },
              {
                id: "item_3",
                productName: "Susu Kambing Etta Goat Milk HNI",
                qty: 5,
                unitPrice: 75000,
                tpPoints: 20,
                totalPrice: 375000,
              },
            ],
          },
          {
            id: "led_00",
            creditProfileId: "cred_mock_001",
            type: "REPAYMENT",
            amount: 500000,
            runningBalance: 250000,
            referenceNo: "PAY/2026/09/BC3-0012",
            description: "Pelunasan Sebagian Kasbon Via QRIS BC 3",
            createdAt: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
            items: [],
          },
        ];
      }
    },
    staleTime: 1000 * 60 * 3,
    retry: 1,
  });

  const creditAccount = creditAccountData || initialAccount || null;
  const ledgerEntries = ledgerEntriesData || [];

  // Hitung sisa hari jatuh tempo H+14
  const getDaysUntilDue = (): number | null => {
    if (!creditAccount?.dueDate) return null;
    const due = new Date(creditAccount.dueDate).getTime();
    const now = new Date().getTime();
    return Math.ceil((due - now) / (1000 * 3600 * 24));
  };

  const refetchAll = async () => {
    await Promise.all([refetchAccount(), refetchLedger()]);
  };

  return {
    creditAccount,
    ledgerEntries,
    isLoading: isAccountLoading || isLedgerLoading,
    isError: isAccountError || isLedgerError,
    error: accountError?.message || ledgerError?.message || null,
    daysUntilDue: getDaysUntilDue(),
    refreshKasbon: refetchAll,
    applyCredit: applyCreditMutation.mutateAsync,
    isApplying: applyCreditMutation.isPending,
    applyError: applyCreditMutation.error?.message || null,
  };
}

export default useKasbonCredit;
