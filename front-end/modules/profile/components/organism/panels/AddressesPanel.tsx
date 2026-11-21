"use client";

import React, { useState } from "react";
import { AddressData } from "../../../types/profile.types";
import { AddressCard } from "../../molecules/AddressCard";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { AddressForm } from "../form/addressForm";
import { AddressFormData } from "@/modules/profile/schemas/address.schema";
import { useTranslations } from "next-intl";
import { MapPin, Plus, X, RefreshCw } from "lucide-react";

interface AddressesPanelProps {
  addresses: AddressData[];
  onAddAddress: (payload: any) => Promise<any>;
  onSetPrimary: (id: string) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
  isError?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

export function AddressesPanel({
  addresses,
  onAddAddress,
  onSetPrimary,
  onDelete,
  isLoading,
  isError,
  error,
  onRefresh,
}: AddressesPanelProps) {
  const t = useTranslations("addressForm");
  const tRoot = useTranslations();
  const tBtn = useTranslations("commonBtn");
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (data: AddressFormData) => {
    setIsSubmitting(true);
    try {
      await onAddAddress({
        ...data,
        isPrimary: addresses.length === 0,
      });
      setShowAddForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold text-text-primary">{tRoot("myAddressList")}</h3>
          <p className="text-xs text-text-muted mt-0.5">
            {tRoot("myAddressSubtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="p-2 rounded-xl border border-border-subtle hover:bg-canvas text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              title={tRoot("reloadBtn")}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          )}

          <TijarahButton
            id="add-address-btn"
            tijarahVariant="primary"
            size="sm"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="font-bold whitespace-nowrap flex items-center gap-1.5"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showAddForm ? tBtn("Cancel") : t("title")}</span>
          </TijarahButton>
        </div>
      </div>

      {isError && (
        <div className="p-3 rounded-xl bg-status-danger/10 border border-status-danger/30 text-xs text-status-danger">
          {error}
        </div>
      )}

      {showAddForm && (
        <TijarahCard tijarahVariant="default" className="p-6 border border-primary-sage/40 shadow-lg">
          <h4 className="font-bold text-base text-text-primary mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-sage" />
            <span>{t("title")}</span>
          </h4>
          <AddressForm
            onSubmit={handleCreate}
            onCancel={() => setShowAddForm(false)}
            isLoading={isSubmitting}
          />
        </TijarahCard>
      )}

      {/* Address List */}
      {addresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              onSetPrimary={onSetPrimary}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <TijarahCard tijarahVariant="default" className="p-8 text-center border border-dashed border-border-subtle">
          <p className="text-xs sm:text-sm text-text-muted">{tRoot("noAddresses")}</p>
        </TijarahCard>
      )}
    </div>
  );
}

export default AddressesPanel;
