"use client";

import React from "react";
import { TijarahModal } from "@/components/atom/tijarahModal";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import type { StoreCustomer } from "../../../types/store.types";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { Users, ShoppingBag, CreditCard, Award, Phone } from "lucide-react";

export interface ICustomerTransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: StoreCustomer | null;
}

export const CustomerTransactionHistoryModal: React.FC<ICustomerTransactionHistoryModalProps> = ({
  isOpen,
  onClose,
  customer,
}) => {
  if (!customer) return null;

  const transactions = customer.transactions || [];

  return (
    <TijarahModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Riwayat Transaksi: ${customer.name}`}
      description={`ID Member: ${customer.hniMemberId || "Konsumen Umum"} • Tier: ${customer.loyaltyTier}`}
      showCancelButton={false}
      closeButtonText="Tutup"
      maxWidth="2xl"
    >
      <div className="space-y-4 pt-1 max-h-[70vh] overflow-y-auto pr-1">
        {/* Ringkasan Profil & LTV Pelanggan */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-canvas rounded-xl border border-border-subtle text-xs">
            <span className="text-text-muted block text-[10px] uppercase font-bold">Total Belanja (LTV)</span>
            <span className="text-base font-black text-primary-sage block mt-0.5">
              {formatCurrency(customer.totalSpent)}
            </span>
          </div>

          <div className="p-3 bg-canvas rounded-xl border border-border-subtle text-xs">
            <span className="text-text-muted block text-[10px] uppercase font-bold">Tier Loyalitas</span>
            <span className="text-sm font-bold text-text-primary block mt-0.5">
              {customer.loyaltyTier} Member
            </span>
          </div>

          <div className="p-3 bg-canvas rounded-xl border border-border-subtle text-xs">
            <span className="text-text-muted block text-[10px] uppercase font-bold">Terakhir Belanja</span>
            <span className="text-xs font-semibold text-text-primary block mt-0.5">
              {formatDate(customer.lastPurchase)}
            </span>
          </div>
        </div>

        {/* Tabel Riwayat Transaksi */}
        <div className="border border-border-subtle rounded-xl overflow-hidden bg-surface">
          <div className="px-4 py-2.5 bg-canvas/80 border-b border-border-subtle flex items-center justify-between">
            <span className="font-bold text-xs text-text-primary flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-primary-sage" />
              Daftar Pesanan Sebelumnya ({transactions.length} Transaksi)
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="py-8 text-center text-xs text-text-muted">
              Belum ada riwayat transaksi yang tercatat untuk pelanggan ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle bg-canvas/40 text-text-muted uppercase text-[10px] font-bold">
                    <th className="py-2.5 px-3">No. Order</th>
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Item Belanja</th>
                    <th className="py-2.5 px-3 text-right">Total Tagihan</th>
                    <th className="py-2.5 px-3 text-right">Poin TP</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-canvas/30 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-text-primary">
                        {tx.orderNumber}
                      </td>
                      <td className="py-2.5 px-3 text-text-muted">{tx.date}</td>
                      <td className="py-2.5 px-3 text-text-primary font-medium">{tx.itemsSummary}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-text-primary">
                        {formatCurrency(tx.totalAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-status-success">
                        +{tx.points} TP
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <TijarahBadge
                          tijarahVariant={tx.status === "COMPLETED" ? "success" : "primary"}
                          className="text-[10px] font-bold"
                        >
                          {tx.status}
                        </TijarahBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </TijarahModal>
  );
};

export default CustomerTransactionHistoryModal;
