"use client";

import React, { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { apiClient } from "@/lib/axios/client";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahTextArea } from "@/components/atom/tijarahTextArea";
import { TijarahSelect } from "@/components/atom/tijarahSelect";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { DeleteConfirmModal } from "../modals/DeleteConfirmModal";
import { showToast } from "@/utils/toast";
import { formatDate } from "@/utils/formatters";
import { Mail, Phone, MapPin, Clock, Save, Trash2, RefreshCw, MessageSquare } from "lucide-react";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: "NEW" | "IN_PROGRESS" | "RESOLVED";
  adminNotes: string;
  createdAt: string;
}

interface ContactSettings {
  storeName: string;
  whatsapp: string;
  phone: string;
  email: string;
  address: string;
  operationalHours: string;
}

export const ContactsPanel: React.FC = () => {
  const locale = useLocale();
  const isEn = locale === "en";

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ContactMessage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [settings, setSettings] = useState<ContactSettings>({
    storeName: "",
    whatsapp: "",
    phone: "",
    email: "",
    address: "",
    operationalHours: "",
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const loadData = async () => {
    setLoadingMessages(true);
    try {
      const [msgRes, infoRes] = await Promise.all([
        apiClient.get<{ status: string; data: ContactMessage[] }>("/store/contact-messages", {
          params: statusFilter !== "ALL" ? { status: statusFilter } : undefined,
        }),
        apiClient.get<{ status: string; data: ContactSettings }>("/store/contact-info"),
      ]);
      if (Array.isArray(msgRes.data?.data)) setMessages(msgRes.data.data);
      if (infoRes.data?.data) setSettings(infoRes.data.data);
    } catch (err: any) {
      showToast.error(isEn ? "Error" : "Gagal", err?.message || "Gagal memuat data kontak.");
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await apiClient.put("/store/contact-info", settings);
      showToast.success(
        isEn ? "Contact Info Saved" : "Info Kontak Disimpan",
        isEn ? "Public store contact details updated." : "Informasi kontak publik gerai berhasil diperbarui."
      );
    } catch (err: any) {
      showToast.error(isEn ? "Error" : "Gagal", err?.message || "Gagal menyimpan info kontak.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: ContactMessage["status"]) => {
    try {
      await apiClient.patch(`/store/contact-messages/${id}`, { status });
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
      showToast.success(
        isEn ? "Status Updated" : "Status Diperbarui",
        isEn ? `Message marked as ${status}.` : `Status pesan diperbarui menjadi ${status}.`
      );
    } catch (err: any) {
      showToast.error(isEn ? "Error" : "Gagal", err?.message || "Gagal memperbarui status.");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/store/contact-messages/${deleteTarget.id}`);
      setMessages((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      setDeleteTarget(null);
      showToast.success(isEn ? "Deleted" : "Dihapus", isEn ? "Message deleted." : "Pesan kontak dihapus.");
    } catch (err: any) {
      showToast.error(isEn ? "Error" : "Gagal", err?.message || "Gagal menghapus pesan.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-text-primary tracking-tight">
            {isEn ? "Contact & Inquiry Management" : "Manajemen Kontak & Pesan Pelanggan"}
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            {isEn
              ? "Manage public store contact details and respond to incoming customer inquiries."
              : "Kelola informasi kontak publik gerai dan tindak lanjuti pesan masuk dari halaman Kontak Kami."}
          </p>
        </div>
        <TijarahButton
          type="button"
          tijarahVariant="outline"
          size="sm"
          onClick={loadData}
          className="text-xs font-bold self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          {isEn ? "Refresh" : "Muat Ulang"}
        </TijarahButton>
      </div>

      {/* Store Public Contact Settings */}
      <TijarahCard tijarahVariant="default" className="p-5 border border-border-subtle rounded-2xl">
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary-sage" />
            {isEn ? "Public Store Contact Information" : "Pengaturan Informasi Kontak Publik Gerai"}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <TijarahInput
              label={isEn ? "Store Name" : "Nama Gerai"}
              value={settings.storeName}
              onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
              className="text-xs"
            />
            <TijarahInput
              label="WhatsApp (628...)"
              value={settings.whatsapp}
              onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
              className="text-xs font-mono"
            />
            <TijarahInput
              label={isEn ? "Phone" : "Telepon"}
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              className="text-xs"
            />
            <TijarahInput
              label="Email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              className="text-xs"
            />
            <TijarahInput
              label={isEn ? "Operational Hours" : "Jam Operasional"}
              value={settings.operationalHours}
              onChange={(e) => setSettings({ ...settings, operationalHours: e.target.value })}
              className="text-xs"
            />
            <TijarahInput
              label={isEn ? "Address" : "Alamat Lengkap"}
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="text-xs"
            />
          </div>

          <div className="flex justify-end">
            <TijarahButton
              type="submit"
              tijarahVariant="primary"
              size="sm"
              isLoading={savingSettings}
              className="text-xs font-bold px-5"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              {isEn ? "Save Contact Info" : "Simpan Info Kontak"}
            </TijarahButton>
          </div>
        </form>
      </TijarahCard>

      {/* Incoming Messages */}
      <TijarahCard tijarahVariant="default" className="p-5 border border-border-subtle rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary-sage" />
            {isEn ? `Customer Inquiries (${messages.length})` : `Pesan Masuk Pelanggan (${messages.length})`}
          </h3>
          <div className="w-48">
            <TijarahSelect
              selectedKey={statusFilter}
              onSelectionChange={(k) => {
                if (k) setStatusFilter(String(k));
              }}
              className="text-xs"
            >
              <TijarahSelect.Item id="ALL">{isEn ? "All Status" : "Semua Status"}</TijarahSelect.Item>
              <TijarahSelect.Item id="NEW">{isEn ? "New" : "Baru"}</TijarahSelect.Item>
              <TijarahSelect.Item id="IN_PROGRESS">{isEn ? "In Progress" : "Diproses"}</TijarahSelect.Item>
              <TijarahSelect.Item id="RESOLVED">{isEn ? "Resolved" : "Selesai"}</TijarahSelect.Item>
            </TijarahSelect>
          </div>
        </div>

        {loadingMessages ? (
          <div className="py-8 text-center text-xs text-text-muted">
            {isEn ? "Loading messages..." : "Memuat pesan..."}
          </div>
        ) : messages.length === 0 ? (
          <div className="py-10 text-center text-xs text-text-muted">
            {isEn ? "No customer messages yet." : "Belum ada pesan kontak masuk."}
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="p-4 rounded-xl border border-border-subtle bg-canvas/50 space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-text-primary">{msg.subject}</span>
                      <TijarahBadge
                        tijarahVariant={
                          msg.status === "RESOLVED"
                            ? "success"
                            : msg.status === "IN_PROGRESS"
                              ? "warning"
                              : "primary"
                        }
                        className="text-[10px] font-bold"
                      >
                        {msg.status}
                      </TijarahBadge>
                    </div>
                    <div className="text-xs text-text-muted flex flex-wrap items-center gap-3 mt-1">
                      <span className="font-semibold text-text-primary">{msg.name}</span>
                      {msg.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {msg.phone}
                        </span>
                      )}
                      {msg.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {msg.email}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDate(msg.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-36">
                      <TijarahSelect
                        selectedKey={msg.status}
                        onSelectionChange={(k) => {
                          if (k) handleUpdateStatus(msg.id, String(k) as ContactMessage["status"]);
                        }}
                        className="text-xs"
                      >
                        <TijarahSelect.Item id="NEW">{isEn ? "New" : "Baru"}</TijarahSelect.Item>
                        <TijarahSelect.Item id="IN_PROGRESS">{isEn ? "In Progress" : "Diproses"}</TijarahSelect.Item>
                        <TijarahSelect.Item id="RESOLVED">{isEn ? "Resolved" : "Selesai"}</TijarahSelect.Item>
                      </TijarahSelect>
                    </div>
                    <TijarahButton
                      type="button"
                      heroVariant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(msg)}
                      className="text-status-danger hover:bg-status-danger/10 h-8 w-8 p-0 min-w-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </TijarahButton>
                  </div>
                </div>

                <p className="text-xs text-text-primary whitespace-pre-line bg-surface p-3 rounded-lg border border-border-subtle">
                  {msg.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </TijarahCard>

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={isEn ? "Delete Inquiry" : "Hapus Pesan Kontak"}
        itemName={deleteTarget?.subject || "Pesan"}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ContactsPanel;
