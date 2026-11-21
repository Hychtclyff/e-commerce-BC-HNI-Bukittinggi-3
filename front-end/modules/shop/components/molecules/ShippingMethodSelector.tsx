"use client";

import React from "react";
import { Truck, MapPin, CheckCircle2, Building2, Phone } from "lucide-react";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { ShippingType } from "../../types/shop.types";
import { AddressData } from "@/modules/profile/types/profile.types";
import { formatCurrency } from "@/utils/formatters";
import { CourierOptionCard, CourierOption } from "@/components/molecules/CourierOptionCard";

export interface ShippingMethodSelectorProps {
  shippingType: ShippingType;
  onSelectShippingType: (type: ShippingType) => void;
  addresses: AddressData[];
  selectedAddressId: string;
  onSelectAddressId: (id: string) => void;
  customAddressText: string;
  onChangeCustomAddress: (text: string) => void;
  courier: string;
  onSelectCourier: (courier: string) => void;
  notes: string;
  onChangeNotes: (notes: string) => void;
  courierOptions?: Array<{
    id: string;
    name: string;
    desc: string;
    cost: number;
    etd: string;
    badge?: string;
  }>;
  isCustomAddressRequired?: boolean;
}

export const ShippingMethodSelector: React.FC<ShippingMethodSelectorProps> = ({
  shippingType,
  onSelectShippingType,
  addresses,
  selectedAddressId,
  onSelectAddressId,
  customAddressText,
  onChangeCustomAddress,
  courier,
  onSelectCourier,
  notes,
  onChangeNotes,
  courierOptions,
  isCustomAddressRequired = false,
}) => {
  const defaultOptions: CourierOption[] = [
    {
      id: "L300-REGIONAL",
      name: "Travel L300",
      desc: "Armada Regional Sumbar",
      cost: 20000,
      etd: "Hari Ini",
      badge: "Rekomendasi",
    },
    {
      id: "JNT-EXPRESS",
      name: "J&T Express",
      desc: "Reguler Pengiriman Paket",
      cost: 25000,
      etd: "1-2 Hari",
    },
    {
      id: "KARGO-TRUK",
      name: "Indah Kargo",
      desc: "Khusus Belanja Grosir >20kg",
      cost: 35000,
      etd: "2-3 Hari",
    },
  ];

  const activeOptions = courierOptions && courierOptions.length > 0 ? courierOptions : defaultOptions;
  return (
    <div className="flex flex-col gap-4">
      {/* 1. Fulfillment Type Tabs (Delivery vs Pickup) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-canvas p-1 rounded-xl border border-border-subtle">
        <button
          type="button"
          onClick={() => onSelectShippingType("DELIVERY")}
          className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
            shippingType === "DELIVERY"
              ? "bg-primary-sage text-surface"
              : "text-text-muted hover:text-text-primary"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Diantar Kurir / Travel</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectShippingType("PICKUP")}
          className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
            shippingType === "PICKUP"
              ? "bg-primary-sage text-surface"
              : "text-text-muted hover:text-text-primary"
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Ambil di Toko BC3</span>
        </button>
      </div>

      {/* 2. Options Content */}
      {shippingType === "DELIVERY" ? (
        <div className="flex flex-col gap-3.5">
          {/* Address Picker */}
          <div>
            <span className="text-xs font-bold text-text-primary block mb-1.5">
              {addresses.length > 0
                ? "Alamat Pengiriman"
                : isCustomAddressRequired
                ? "Alamat / Daerah Tujuan Pengiriman *"
                : "Alamat / Patokan Tambahan (Opsional)"}
            </span>

            {addresses.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => onSelectAddressId(addr.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isSelected
                          ? "border-primary-sage bg-primary-sage/10 shadow-xs"
                          : "border-border-subtle bg-surface hover:border-primary-sage/40"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-text-primary">
                            {addr.recipientName}
                          </span>
                          {addr.isPrimary && (
                            <TijarahBadge tijarahVariant="primary" className="text-[10px]">
                              Utama
                            </TijarahBadge>
                          )}
                        </div>
                        <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
                          {addr.fullAddress}, {addr.district}, {addr.city} {addr.postalCode}
                        </p>
                        <span className="text-[11px] text-text-muted font-mono mt-1 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-primary-sage shrink-0" />
                          <span>{addr.phoneNumber}</span>
                        </span>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-primary-sage shrink-0 mt-0.5" />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <TijarahInput
                id="custom-address-input"
                placeholder="Masukkan alamat lengkap penerima dan nomor telepon..."
                value={customAddressText}
                onChange={(e) => onChangeCustomAddress(e.target.value)}
                startContent={<MapPin className="w-4 h-4 text-text-muted" />}
              />
            )}
          </div>

          {/* Courier Selection */}
          <div>
            <span className="text-xs font-bold text-text-primary block mb-1.5">
              Pilihan Ekspedisi & Armada Logistik
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {activeOptions.map((c) => (
                <CourierOptionCard
                  key={c.id}
                  courier={c}
                  isSelected={courier === c.id}
                  onSelect={onSelectCourier}
                />
              ))}
            </div>
          </div>

          {/* Courier Delivery Notes */}
          <div>
            <TijarahInput
              id="delivery-notes"
              label="Catatan Khusus Pengiriman (Opsional)"
              placeholder="Contoh: Titip di loket Travel L300 Aur Kuning..."
              value={notes}
              onChange={(e) => onChangeNotes(e.target.value)}
            />
          </div>
        </div>
      ) : (
        /* Pickup Information Card */
        <div className="p-4 rounded-2xl bg-canvas border border-border-subtle flex flex-col gap-2">
          <div className="flex items-center gap-2 text-primary-sage">
            <Building2 className="w-5 h-5 shrink-0" />
            <h4 className="text-xs sm:text-sm font-extrabold text-text-primary">
              Outlet Resmi BC HNI 3 Bukittinggi (Verifikasi Kasir)
            </h4>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            Jl. Raya Bukittinggi - Payakumbuh KM 4, Kota Bukittinggi, Sumatera Barat.
          </p>
          <div className="p-2.5 rounded-xl bg-primary-sage/10 border border-primary-sage/20 text-xs text-text-primary flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary-sage shrink-0 mt-0.5" />
            <span>
              <strong>Alur Pickup:</strong> Tunjukkan kode pesanan atau QR nota kepada kasir saat mengambil barang di toko untuk verifikasi serah terima langsung.
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-border-subtle">
            <span className="text-text-muted font-medium">Biaya Pengambilan:</span>
            <span className="font-bold text-status-success">Gratis (Rp 0)</span>
          </div>
        </div>
      )}
    </div>
  );
};
export default ShippingMethodSelector;
