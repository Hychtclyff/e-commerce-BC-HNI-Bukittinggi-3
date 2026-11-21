"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi, UpdateProfilePayload } from "../api/profile.api";
import {
  FullProfileResponse,
  UserProfileData,
  HniProfileData,
  SaveHniProfilePayload,
  CreditApplicationPayload,
  B2BCreditProfileData,
} from "../types/profile.types";
import { useAuthStore } from "@/modules/auth/services/auth.store";

export function useProfile() {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);
  const setAuthUser = useAuthStore((state) => state.setUser);
  const userId = authUser?.id;

  // ── 1. Fetch Profile Data with TanStack Query ──────────────────────────────
  const {
    data,
    isLoading,
    isPending,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery<FullProfileResponse, Error>({
    queryKey: ["profile", userId],
    enabled: !!userId || (typeof window !== "undefined" && !!useAuthStore.getState().accessToken),
    queryFn: async () => {
      try {
        return await profileApi.getProfile(userId);
      } catch (err: any) {
        console.warn("API profile fetch error:", err?.message);
        if (authUser) {
          return {
            user: {
              id: authUser.id,
              email: authUser.email,
              emailVerified: true,
              fullName: authUser.fullName || authUser.name || "Pengguna",
              phoneNumber: authUser.phone || "",
              userType: (authUser.role as any) || "agen",
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              roles: [],
            },
            hniProfile: null,
            addresses: [],
            creditProfile: null,
          };
        }
        throw err;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 menit cache
    retry: 1,
  });

  // ── 2. Update Profile Mutation with TanStack Query ─────────────────────────
  const updateMutation = useMutation<UserProfileData, Error, UpdateProfilePayload>({
    mutationFn: async (payload: UpdateProfilePayload) => {
      const targetId = data?.user?.id || userId || "";
      return await profileApi.updateProfile(targetId, payload);
    },
    onSuccess: (updatedUser) => {
      // Optimistic cache update
      queryClient.setQueryData<FullProfileResponse>(["profile", userId], (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          user: updatedUser,
        };
      });

      // Sinkronisasi data user global di Zustand AuthStore
      if (authUser) {
        setAuthUser({
          ...authUser,
          fullName: updatedUser.fullName,
          email: updatedUser.email || authUser.email,
          phone: updatedUser.phoneNumber || authUser.phone,
        });
      }
    },
  });

  const updateProfile = async (payload: UpdateProfilePayload) => {
    return await updateMutation.mutateAsync(payload);
  };

  // ── 3. Save HNI Profile Mutation with TanStack Query ─────────────────────
  const saveHniMutation = useMutation<HniProfileData, Error, SaveHniProfilePayload>({
    mutationFn: async (payload: SaveHniProfilePayload) => {
      const targetId = data?.user?.id || userId || "";
      return await profileApi.saveHniProfile(targetId, payload);
    },
    onSuccess: (savedHni) => {
      queryClient.setQueryData<FullProfileResponse>(["profile", userId], (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          hniProfile: savedHni,
        };
      });
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    },
  });

  const saveHniProfile = async (payload: SaveHniProfilePayload) => {
    return await saveHniMutation.mutateAsync(payload);
  };

  // ── 4. Apply Kasbon / B2B Credit Mutation with TanStack Query ─────────────
  const applyCreditMutation = useMutation<B2BCreditProfileData, Error, CreditApplicationPayload>({
    mutationFn: async (payload: CreditApplicationPayload) => {
      return await profileApi.applyCreditAccount(payload);
    },
    onSuccess: (newCreditData) => {
      queryClient.setQueryData<FullProfileResponse>(["profile", userId], (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          creditProfile: newCreditData,
        };
      });
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["credit", userId] });
    },
  });

  const applyCreditAccount = async (payload: CreditApplicationPayload) => {
    return await applyCreditMutation.mutateAsync(payload);
  };

  return {
    user: data?.user || null,
    hniProfile: data?.hniProfile || null,
    initialAddresses: data?.addresses || [],
    initialCreditProfile: data?.creditProfile || null,
    isLoading: isLoading || isPending,
    isFetching,
    isError,
    error: error ? error.message : null,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error ? updateMutation.error.message : null,
    isSavingHni: saveHniMutation.isPending,
    saveHniError: saveHniMutation.error ? saveHniMutation.error.message : null,
    isApplyingCredit: applyCreditMutation.isPending,
    applyCreditError: applyCreditMutation.error ? applyCreditMutation.error.message : null,
    refreshProfile: refetch,
    updateProfile,
    saveHniProfile,
    applyCreditAccount,
  };
}

export default useProfile;
