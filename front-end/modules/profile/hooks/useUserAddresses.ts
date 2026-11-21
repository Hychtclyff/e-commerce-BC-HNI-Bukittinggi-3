"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi, AddressPayload } from "../api/profile.api";
import { AddressData } from "../types/profile.types";
import { useAuthStore } from "@/modules/auth/services/auth.store";

export function useUserAddresses(initialAddresses?: AddressData[]) {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);
  const userId = authUser?.id;

  // ── 1. Fetch Addresses Query with TanStack Query ───────────────────────────
  const {
    data: addressesData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<AddressData[], Error>({
    queryKey: ["addresses", userId],
    queryFn: async () => {
      try {
        return await profileApi.getAddresses(userId);
      } catch (err: any) {
        console.warn("API addresses error:", err?.message);
        return initialAddresses && initialAddresses.length > 0 ? initialAddresses : [];
      }
    },
    staleTime: 1000 * 60 * 3,
    retry: 1,
  });

  const addresses = addressesData || initialAddresses || [];

  // ── 2. Add Address Mutation ───────────────────────────────────────────────
  const addAddressMutation = useMutation<AddressData, Error, AddressPayload>({
    mutationFn: async (payload: AddressPayload) => {
      return await profileApi.createAddress({
        ...payload,
        userId: userId || "usr_mock_001",
      });
    },
    onSuccess: (newAddr) => {
      queryClient.setQueryData<AddressData[]>(["addresses", userId], (old = []) => {
        if (newAddr.isPrimary) {
          return [newAddr, ...old.map((a) => ({ ...a, isPrimary: false }))];
        }
        return [newAddr, ...old];
      });
      queryClient.invalidateQueries({ queryKey: ["addresses", userId] });
    },
  });

  // ── 3. Update Address Mutation ────────────────────────────────────────────
  const updateAddressMutation = useMutation<
    AddressData,
    Error,
    { id: string; payload: Partial<AddressPayload> }
  >({
    mutationFn: async ({ id, payload }) => {
      return await profileApi.updateAddress(id, payload);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<AddressData[]>(["addresses", userId], (old = []) =>
        old.map((a) => (a.id === updated.id ? { ...a, ...updated } : a))
      );
      queryClient.invalidateQueries({ queryKey: ["addresses", userId] });
    },
  });

  // ── 4. Set Primary Address Mutation (PATCH /primary) ──────────────────────
  const setPrimaryMutation = useMutation<AddressData | void, Error, string>({
    mutationFn: async (id: string) => {
      return await profileApi.setPrimaryAddress(id);
    },
    onMutate: async (id: string) => {
      // Optimistic update
      queryClient.setQueryData<AddressData[]>(["addresses", userId], (old = []) =>
        old.map((addr) => ({
          ...addr,
          isPrimary: addr.id === id,
        }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses", userId] });
    },
  });

  // ── 5. Delete Address Mutation ────────────────────────────────────────────
  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      return await profileApi.deleteAddress(id);
    },
    onMutate: async (id: string) => {
      // Optimistic delete
      queryClient.setQueryData<AddressData[]>(["addresses", userId], (old = []) =>
        old.filter((a) => a.id !== id)
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses", userId] });
    },
  });

  return {
    addresses,
    isLoading,
    isError,
    error: error?.message || null,
    isSubmitting:
      addAddressMutation.isPending ||
      updateAddressMutation.isPending ||
      setPrimaryMutation.isPending ||
      deleteMutation.isPending,
    refreshAddresses: refetch,
    addAddress: addAddressMutation.mutateAsync,
    updateAddress: (id: string, payload: Partial<AddressPayload>) =>
      updateAddressMutation.mutateAsync({ id, payload }),
    setPrimaryAddress: setPrimaryMutation.mutateAsync,
    deleteAddress: deleteMutation.mutateAsync,
  };
}

export default useUserAddresses;
