"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { StoreAgent, StoreCustomer } from "../../../types/store.types";
import type { AgentPayload } from "../../../api/store.api";
import { storeApi } from "../../../api/store.api";
import { AgentFormModal } from "../modals/AgentFormModal";
import { AgentPasswordModal } from "../modals/AgentPasswordModal";
import { DeleteConfirmModal } from "../modals/DeleteConfirmModal";
import { UserDetailView } from "./UserDetailView";
import { UserFormModal } from "../modals/UserFormModal";
import { UserResetPasswordModal } from "../modals/UserResetPasswordModal";
import { showToast } from "@/utils/toast";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahSelect, TijarahSelectItem } from "@/components/atom/tijarahSelect";
import { formatCurrency, formatDate } from "@/utils/formatters";
import {
  Users,
  RefreshCw,
  Plus,
  KeyRound,
  Edit2,
  Trash2,
  UserCheck,
  ShieldCheck,
  Lock,
  Search,
  Eye,
  ShoppingBag,
  Award,
  Sparkles,
  UserX,
  Phone,
  Mail,
  Filter,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { AgentNetworkPanel } from "./AgentNetworkPanel";

export interface IAgentsPanelProps {
  agents: StoreAgent[];
  customers?: StoreCustomer[];
  isLoading: boolean;
  isCustomersLoading?: boolean;
  onRefresh: () => void;
  onCreateAgent?: (payload: AgentPayload) => Promise<any>;
  onUpdateAgent?: (params: { id: string; payload: AgentPayload }) => Promise<any>;
  onDeleteAgent?: (id: string) => Promise<any>;
  onSetPassword?: (id: string, newPass: string) => Promise<any>;
  onResetPassword?: (id: string) => Promise<any>;
  isSaving?: boolean;
  isDeleting?: boolean;
}

export const AgentsPanel: React.FC<IAgentsPanelProps> = ({
  agents,
  customers = [],
  isLoading: isAgentsLoading,
  isCustomersLoading = false,
  onRefresh: onRefreshAgents,
  onCreateAgent,
  onUpdateAgent,
  onDeleteAgent,
  onSetPassword,
  onResetPassword,
  isSaving = false,
  isDeleting = false,
}) => {
  const t = useTranslations("storeErp.agents");
  const locale = useLocale();
  const isEn = locale === "en";

  // Sub-Tab Switcher: 'ALL_USERS' | 'NETWORK_TREE' | 'STAFF_LIST'
  const [subTab, setSubTab] = useState<"ALL_USERS" | "NETWORK_TREE" | "STAFF_LIST">("ALL_USERS");

  // State Manajemen Seluruh Pengguna Sistem
  const [users, setUsers] = useState<any[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterUserType, setFilterUserType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [totalUsers, setTotalUsers] = useState(0);

  // Modal State untuk Pengguna Sistem
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<string | null>(null);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<any | null>(null);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<any | null>(null);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<any | null>(null);
  const [isUserMutating, setIsUserMutating] = useState(false);

  // Modal State untuk Staf Gerai
  const [isAgentFormOpen, setIsAgentFormOpen] = useState(false);
  const [selectedAgentForEdit, setSelectedAgentForEdit] = useState<StoreAgent | null>(null);
  const [selectedAgentForPassword, setSelectedAgentForPassword] = useState<StoreAgent | null>(null);
  const [selectedAgentForDelete, setSelectedAgentForDelete] = useState<StoreAgent | null>(null);

  // Load Data Pengguna Sistem dari Backend
  const loadUsers = useCallback(async () => {
    setIsUsersLoading(true);
    try {
      const res = await storeApi.getSystemUsers({
        search: searchQuery.trim() || undefined,
        userType: filterUserType !== "ALL" ? filterUserType : undefined,
        isActive: filterStatus !== "ALL" ? filterStatus : undefined,
        limit: 100,
      });
      setUsers(res.users || []);
      setTotalUsers(res.pagination?.total || 0);
    } catch (err) {
      console.error("Gagal memuat pengguna sistem:", err);
    } finally {
      setIsUsersLoading(false);
    }
  }, [searchQuery, filterUserType, filterStatus]);

  useEffect(() => {
    if (subTab === "ALL_USERS") {
      loadUsers();
    }
  }, [subTab, loadUsers]);

  // Handler CRUD Pengguna Sistem
  const handleOpenCreateUser = () => {
    setSelectedUserForEdit(null);
    setIsUserFormOpen(true);
  };

  const handleOpenEditUser = (user: any) => {
    setSelectedUserForEdit(user);
    setIsUserFormOpen(true);
  };

  const handleSubmitUserForm = async (payload: any) => {
    setIsUserMutating(true);
    try {
      if (selectedUserForEdit) {
        await storeApi.updateSystemUser(selectedUserForEdit.id, payload);
      } else {
        await storeApi.createSystemUser(payload);
      }
      await loadUsers();
      onRefreshAgents();
      showToast.success(isEn ? "User saved" : "Data pengguna disimpan");
    } catch (err: any) {
      console.error("Gagal menyimpan pengguna:", err);
      showToast.error(isEn ? "Failed to save user" : "Gagal menyimpan data pengguna", err?.message);
    } finally {
      setIsUserMutating(false);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!selectedUserForDelete) return;
    setIsUserMutating(true);
    try {
      await storeApi.deleteSystemUser(selectedUserForDelete.id);
      setSelectedUserForDelete(null);
      await loadUsers();
      onRefreshAgents();
      showToast.success(isEn ? "User deactivated" : "Pengguna dinonaktifkan");
    } catch (err: any) {
      console.error("Gagal menonaktifkan pengguna:", err);
      showToast.error(isEn ? "Failed to deactivate user" : "Gagal menonaktifkan pengguna", err?.message);
    } finally {
      setIsUserMutating(false);
    }
  };

  const handleResetUserPassword = async (userId: string, newPass: string) => {
    setIsUserMutating(true);
    try {
      await storeApi.resetSystemUserPassword(userId, newPass);
      setSelectedUserForPassword(null);
      showToast.success(isEn ? "Password updated" : "Kata sandi berhasil diperbarui");
    } catch (err: any) {
      console.error("Gagal reset password:", err);
      showToast.error(isEn ? "Failed to reset password" : "Gagal reset kata sandi", err?.message);
    } finally {
      setIsUserMutating(false);
    }
  };

  // Helper Staf Toko (Dukungan Multi-Role)
  const getRoleBadges = (agent: StoreAgent) => {
    const roles = agent.roles && agent.roles.length > 0 ? agent.roles : [agent.role];
    const map: Record<string, { variant: "primary" | "secondary" | "success"; label: string }> = {
      Owner: { variant: "primary", label: "Owner" },
      Manager: { variant: "secondary", label: "Manager" },
      Admin: { variant: "success", label: "Admin" },
      Kasir: { variant: "secondary", label: "Kasir" },
      Gudang: { variant: "secondary", label: "Gudang" },
    };
    return (
      <div className="flex flex-wrap gap-1">
        {roles.map((r) => {
          const m = map[r] || { variant: "secondary", label: r };
          return (
            <TijarahBadge key={r} tijarahVariant={m.variant} className="text-[10px] px-1.5 py-0.5">
              {m.label}
            </TijarahBadge>
          );
        })}
      </div>
    );
  };

  const getRoleBadge = (role: string) => {
    const map: Record<string, { variant: "primary" | "secondary" | "success"; label: string }> = {
      Owner: { variant: "primary", label: "Owner" },
      Manager: { variant: "secondary", label: "Manager" },
      Admin: { variant: "success", label: "Admin" },
      Kasir: { variant: "secondary", label: "Kasir" },
      Gudang: { variant: "secondary", label: "Gudang" },
    };
    const r = map[role] || { variant: "secondary", label: role };
    return <TijarahBadge tijarahVariant={r.variant}>{r.label}</TijarahBadge>;
  };

  const getTierLabel = (tier: string) => {
    const map: Record<string, string> = {
      BC: "Business Center",
      DC: "Distribution Center",
      STOCKIES: "Stockies",
      AGEN_BIAYA: "Agen Biasa",
    };
    return map[tier] || tier;
  };

  // Metrik counter cepat
  const countAgents = users.filter((u) => u.userType === "agen" || u.hniProfile).length;
  const countCustomers = users.filter((u) => u.userType === "customer" && !u.hniProfile).length;
  const countStaff = users.filter((u) => ["staff", "kasir", "admin"].includes(u.userType)).length;

  if (selectedUserForDetail) {
    return (
      <UserDetailView
        userId={selectedUserForDetail}
        onBack={() => setSelectedUserForDetail(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header Panel */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-text-primary tracking-tight">
              {isEn ? "Users, CRM & Partner Agents" : "Pengguna, CRM & Mitra Agen"}
            </h2>
            <TijarahBadge tijarahVariant="primary" className="text-[10px]">
              {totalUsers > 0 ? `${totalUsers} ${isEn ? "Registered" : "Terdaftar"}` : "Live DB"}
            </TijarahBadge>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            {isEn
              ? "Manage system users, customer loyalty & LTV, HNI agent hierarchy, and store staff in one workspace."
              : "Kelola pengguna sistem, loyalitas & riwayat belanja pelanggan, jaringan mitra HNI, dan staf toko dalam satu panel."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sub-tab Switcher Pills */}
          <div className="flex flex-wrap items-center bg-surface border border-border-subtle p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSubTab("ALL_USERS")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                subTab === "ALL_USERS"
                  ? "bg-primary-sage text-white"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{isEn ? "All Users" : "Semua Pengguna"}</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab("NETWORK_TREE")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                subTab === "NETWORK_TREE"
                  ? "bg-primary-sage text-white"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>{isEn ? "Agent Network" : "Jaringan Mitra HNI"}</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab("STAFF_LIST")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                subTab === "STAFF_LIST"
                  ? "bg-primary-sage text-white"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isEn ? `Store Staff (${agents.length})` : `Staf Toko (${agents.length})`}</span>
            </button>
          </div>

          {subTab === "ALL_USERS" ? (
            <TijarahButton
              type="button"
              tijarahVariant="primary"
              size="sm"
              onClick={handleOpenCreateUser}
              className="text-xs px-3.5 h-9 font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pengguna</span>
            </TijarahButton>
          ) : subTab === "STAFF_LIST" ? (
            <TijarahButton
              type="button"
              tijarahVariant="primary"
              size="sm"
              onClick={() => {
                setSelectedAgentForEdit(null);
                setIsAgentFormOpen(true);
              }}
              className="text-xs px-3.5 h-9 font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Daftar Staf Toko</span>
            </TijarahButton>
          ) : null}
        </div>
      </div>

      {/* Konten Berdasarkan Sub-Tab */}
      {subTab === "ALL_USERS" ? (
        <div className="flex flex-col gap-5">
          {/* Ribbon Metrik Cepat (Aligned 4-Column Strip) */}
          <div className="bg-surface border border-border-subtle rounded-xl grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border-subtle">
            <div className="px-4 py-3.5 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-text-muted">
                {isEn ? "Total Users" : "Total Pengguna"}
              </span>
              <span className="text-lg font-bold text-text-primary tabular-nums mt-1">
                {totalUsers}
              </span>
              <span className="text-[11px] text-text-muted mt-0.5">
                {isEn ? "Registered in auth & CRM" : "Terdaftar di auth & CRM"}
              </span>
            </div>

            <div className="px-4 py-3.5 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-text-muted">
                {isEn ? "HNI Partner Agents" : "Mitra Agen HNI"}
              </span>
              <span className="text-lg font-bold text-primary-sage tabular-nums mt-1">
                {countAgents}
              </span>
              <span className="text-[11px] text-text-muted mt-0.5">
                {isEn ? "Has HNI Member ID" : "Memiliki ID Member HNI"}
              </span>
            </div>

            <div className="px-4 py-3.5 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-text-muted">
                {isEn ? "Retail Customers" : "Pelanggan Umum"}
              </span>
              <span className="text-lg font-bold text-text-primary tabular-nums mt-1">
                {countCustomers}
              </span>
              <span className="text-[11px] text-text-muted mt-0.5">
                {isEn ? "Non-member HNI" : "Non-member HNI"}
              </span>
            </div>

            <div className="px-4 py-3.5 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-text-muted">
                {isEn ? "Staff & Cashiers" : "Staf & Kasir"}
              </span>
              <span className="text-lg font-bold text-accent-gold tabular-nums mt-1">
                {countStaff}
              </span>
              <span className="text-[11px] text-text-muted mt-0.5">
                {isEn ? "POS & operations access" : "Akses kasir & operasional"}
              </span>
            </div>
          </div>

          {/* Bar Filter & Pencarian */}
          <div className="p-4 bg-surface border border-border-subtle mac-glass mac-shadow rounded-2xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama pengguna, email, nomor HP, atau ID Member HNI..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-canvas/60 border border-border-subtle rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary-sage transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="w-44">
                <TijarahSelect
                  value={filterUserType}
                  onChange={(val) => setFilterUserType(String(val || "ALL"))}
                >
                  <TijarahSelectItem id="ALL">Semua Tipe Akun</TijarahSelectItem>
                  <TijarahSelectItem id="agen">Mitra / Agen HNI</TijarahSelectItem>
                  <TijarahSelectItem id="customer">Pelanggan Umum</TijarahSelectItem>
                  <TijarahSelectItem id="kasir">Kasir Toko</TijarahSelectItem>
                  <TijarahSelectItem id="staff">Staf Toko</TijarahSelectItem>
                  <TijarahSelectItem id="admin">Administrator</TijarahSelectItem>
                </TijarahSelect>
              </div>

              <div className="w-36">
                <TijarahSelect
                  value={filterStatus}
                  onChange={(val) => setFilterStatus(String(val || "ALL"))}
                >
                  <TijarahSelectItem id="ALL">Semua Status</TijarahSelectItem>
                  <TijarahSelectItem id="true">Hanya Aktif</TijarahSelectItem>
                  <TijarahSelectItem id="false">Nonaktif</TijarahSelectItem>
                </TijarahSelect>
              </div>

              <TijarahButton
                type="button"
                heroVariant="outline"
                size="sm"
                onClick={loadUsers}
                isDisabled={isUsersLoading}
                className="h-9 px-3 text-xs font-bold text-text-primary"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isUsersLoading ? "animate-spin" : ""}`} />
              </TijarahButton>
            </div>
          </div>

          {/* Tabel Pengguna Lengkap */}
          <TijarahCard
            tijarahVariant="default"
            className="border border-border-subtle overflow-hidden mac-glass mac-shadow rounded-2xl"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border-subtle bg-canvas/60 text-text-muted uppercase text-[10px] tracking-wider font-bold">
                    <th className="py-3 px-4">Pengguna &amp; Kontak</th>
                    <th className="py-3 px-4">Tipe Akun</th>
                    <th className="py-3 px-4">Keanggotaan HNI</th>
                    <th className="py-3 px-4">Aktivitas Belanja</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {isUsersLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-text-muted text-xs">
                        <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-primary-sage" />
                        Memuat direktori pengguna sistem...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-text-muted text-xs">
                        Tidak ada pengguna yang sesuai dengan kriteria filter.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const initial = u.fullName?.charAt(0)?.toUpperCase() || "U";
                      return (
                        <tr key={u.id} className="hover:bg-canvas/40 transition-colors">
                          {/* Nama & Kontak */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-primary-sage/15 text-primary-sage flex items-center justify-center font-black text-sm shrink-0">
                                {initial}
                              </div>
                              <div>
                                <span className="font-bold text-text-primary block hover:text-primary-sage transition-colors">
                                  {u.fullName}
                                </span>
                                <div className="flex items-center gap-2 text-[11px] text-text-muted mt-0.5">
                                  {u.email && (
                                    <span className="flex items-center gap-1">
                                      <Mail className="w-3 h-3" />
                                      {u.email}
                                    </span>
                                  )}
                                  {u.phoneNumber && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="w-3 h-3" />
                                      {u.phoneNumber}
                                    </span>
                                  )}
                                  {!u.email && !u.phoneNumber && <span>Tanpa kontak terdaftar</span>}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Tipe Akun */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col items-start gap-1">
                              {u.userType === "agen" || u.hniProfile ? (
                                <TijarahBadge tijarahVariant="primary">Mitra Agen HNI</TijarahBadge>
                              ) : u.userType === "admin" ? (
                                <TijarahBadge tijarahVariant="success">Admin Toko</TijarahBadge>
                              ) : u.userType === "kasir" ? (
                                <TijarahBadge tijarahVariant="secondary">Kasir Toko</TijarahBadge>
                              ) : u.userType === "staff" ? (
                                <TijarahBadge tijarahVariant="secondary">Staf Toko</TijarahBadge>
                              ) : (
                                <TijarahBadge tijarahVariant="secondary">Pelanggan Umum</TijarahBadge>
                              )}
                              {u.agentMeta && (
                                <span className="text-[10px] text-text-muted font-mono font-bold">
                                  {u.agentMeta.role} ({u.agentMeta.tier})
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Keanggotaan HNI */}
                          <td className="py-3.5 px-4">
                            {u.hniProfile ? (
                              <div className="flex flex-col text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-black text-primary-sage">
                                    {u.hniProfile.hniMemberId}
                                  </span>
                                  <span className="px-1.5 py-0.2 bg-canvas border border-border-subtle rounded text-[10px] font-black text-text-primary">
                                    {u.hniProfile.rank}
                                  </span>
                                </div>
                                <span className="text-[11px] text-text-muted truncate max-w-[160px] mt-0.5">
                                  {u.hniProfile.uplineName || "Pusat / Langsung"}
                                </span>
                              </div>
                            ) : (
                              <span className="text-text-muted text-[11px] italic">Non-Mitra</span>
                            )}
                          </td>

                          {/* Aktivitas Belanja */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col text-xs">
                              <span className="font-black text-text-primary">
                                {formatCurrency(u.metrics?.totalSpent || 0)}
                              </span>
                              <span className="text-[11px] text-text-muted">
                                {u.metrics?.orderCount || 0} Transaksi Pesanan
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 text-center">
                            <TijarahBadge tijarahVariant={u.isActive ? "success" : "secondary"}>
                              {u.isActive ? "Aktif" : "Nonaktif"}
                            </TijarahBadge>
                          </td>

                          {/* Aksi Manajemen */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* Detail Modal */}
                              <TijarahButton
                                type="button"
                                heroVariant="outline"
                                size="sm"
                                onClick={() => setSelectedUserForDetail(u.id)}
                                className="text-xs px-2 h-7 font-bold text-text-primary flex items-center gap-1"
                                title="Lihat Detail Profil & Riwayat"
                              >
                                <Eye className="w-3.5 h-3.5 text-primary-sage" />
                                <span>Detail</span>
                              </TijarahButton>

                              {/* Edit Modal */}
                              <TijarahButton
                                type="button"
                                heroVariant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditUser(u)}
                                className="text-xs px-2 h-7 font-bold text-primary-sage"
                                title="Edit Data Pengguna"
                              >
                                <Edit2 className="w-3.5 h-3.5 mr-0.5" />
                                <span>Edit</span>
                              </TijarahButton>

                              {/* Reset Sandi */}
                              <TijarahButton
                                type="button"
                                heroVariant="ghost"
                                size="sm"
                                onClick={() => setSelectedUserForPassword(u)}
                                className="text-xs px-2 h-7 font-bold text-amber-600 hover:bg-amber-500/10"
                                title="Reset Kata Sandi"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </TijarahButton>

                              {/* Hapus / Nonaktifkan */}
                              <TijarahButton
                                type="button"
                                heroVariant="ghost"
                                size="sm"
                                onClick={() => setSelectedUserForDelete(u)}
                                className="text-xs px-2 h-7 font-bold text-status-danger hover:bg-status-danger/10"
                                title="Hapus / Nonaktifkan Pengguna"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </TijarahButton>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </TijarahCard>
        </div>
      ) : subTab === "NETWORK_TREE" ? (
        <AgentNetworkPanel onRefreshParent={onRefreshAgents} />
      ) : (
        /* Tab STAFF_LIST (Staf & Kasir Gerai Lokal) */
        <TijarahCard
          tijarahVariant="default"
          className="border border-border-subtle overflow-hidden mac-glass mac-shadow rounded-2xl"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-subtle bg-canvas/60 text-text-muted uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3 px-4">{t("memberId")}</th>
                  <th className="py-3 px-4">{t("agentName")}</th>
                  <th className="py-3 px-4">{t("tier")}</th>
                  <th className="py-3 px-4">{t("rank")}</th>
                  <th className="py-3 px-4">{t("role")}</th>
                  <th className="py-3 px-4">Keamanan Sandi</th>
                  <th className="py-3 px-4 text-center">{t("status")}</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {agents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-canvas/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-text-muted">
                      {agent.hniMemberId || "-"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-text-primary flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-primary-sage shrink-0" />
                        {agent.name}
                      </span>
                      <span className="text-[11px] text-text-muted block mt-0.5">
                        {agent.phoneNumber || "Tanpa No. HP"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-text-muted">{getTierLabel(agent.tier)}</td>
                    <td className="py-3.5 px-4 font-semibold text-text-primary">{agent.rank}</td>
                    <td className="py-3.5 px-4">{getRoleBadges(agent)}</td>
                    <td className="py-3.5 px-4 text-[11px] text-text-muted">
                      {agent.mustChangePassword ? (
                        <span className="text-status-warning font-bold flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Perlu Ganti Sandi
                        </span>
                      ) : (
                        <span className="text-status-success font-medium flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Aman
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <TijarahBadge tijarahVariant={agent.status === "ACTIVE" ? "success" : "secondary"}>
                        {agent.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
                      </TijarahBadge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <TijarahButton
                          type="button"
                          heroVariant="outline"
                          size="sm"
                          onClick={() => setSelectedAgentForPassword(agent)}
                          className="text-xs px-2.5 h-7 font-bold text-text-primary flex items-center gap-1"
                        >
                          <KeyRound className="w-3 h-3 text-primary-sage" />
                          <span>Sandi</span>
                        </TijarahButton>

                        <TijarahButton
                          type="button"
                          heroVariant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedAgentForEdit(agent);
                            setIsAgentFormOpen(true);
                          }}
                          className="text-xs px-2 h-7 font-bold text-primary-sage"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-0.5" />
                          <span>Edit</span>
                        </TijarahButton>

                        <TijarahButton
                          type="button"
                          heroVariant="ghost"
                          size="sm"
                          onClick={() => setSelectedAgentForDelete(agent)}
                          className="text-xs px-2 h-7 font-bold text-status-danger hover:bg-status-danger/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </TijarahButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TijarahCard>
      )}

      {/* Modal Form Pengguna Sistem (Buat & Edit) */}
      <UserFormModal
        isOpen={isUserFormOpen}
        onClose={() => setIsUserFormOpen(false)}
        user={selectedUserForEdit}
        onSubmit={handleSubmitUserForm}
        isLoading={isUserMutating}
      />

      {/* Modal Reset Sandi Pengguna Sistem */}
      <UserResetPasswordModal
        isOpen={!!selectedUserForPassword}
        onClose={() => setSelectedUserForPassword(null)}
        user={selectedUserForPassword}
        onReset={handleResetUserPassword}
        isLoading={isUserMutating}
      />

      {/* Modal Hapus Pengguna Sistem */}
      <DeleteConfirmModal
        isOpen={!!selectedUserForDelete}
        onClose={() => setSelectedUserForDelete(null)}
        onConfirm={handleConfirmDeleteUser}
        title="Nonaktifkan / Hapus Pengguna"
        itemName={selectedUserForDelete?.fullName || "Pengguna"}
        isLoading={isUserMutating}
      />

      {/* Modal Form Staf Gerai */}
      <AgentFormModal
        isOpen={isAgentFormOpen}
        onClose={() => setIsAgentFormOpen(false)}
        agent={selectedAgentForEdit}
        onSubmit={async (payload) => {
          if (selectedAgentForEdit && onUpdateAgent) {
            await onUpdateAgent({ id: selectedAgentForEdit.id, payload });
          } else if (onCreateAgent) {
            await onCreateAgent(payload);
          }
          setIsAgentFormOpen(false);
        }}
        isLoading={isSaving}
      />

      {/* Modal Manajemen Password Staf Gerai */}
      <AgentPasswordModal
        isOpen={!!selectedAgentForPassword}
        onClose={() => setSelectedAgentForPassword(null)}
        agent={selectedAgentForPassword}
        onSetPassword={onSetPassword || (async (id, newPass) => { console.warn('onSetPassword not provided for agent ', id); return Promise.resolve(); })}
        onResetPassword={onResetPassword || (async () => ({}))}
        isLoading={isSaving}
      />

      {/* Modal Hapus Staf Gerai */}
      <DeleteConfirmModal
        isOpen={!!selectedAgentForDelete}
        onClose={() => setSelectedAgentForDelete(null)}
        onConfirm={async () => {
          if (!selectedAgentForDelete || !onDeleteAgent) return;
          await onDeleteAgent(selectedAgentForDelete.id);
          setSelectedAgentForDelete(null);
        }}
        title="Hapus Akun Staf Gerai"
        itemName={selectedAgentForDelete?.name || "Staf"}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AgentsPanel;
