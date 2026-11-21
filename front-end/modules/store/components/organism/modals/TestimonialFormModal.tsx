"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TijarahModal } from "@/components/atom/tijarahModal";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahTextArea } from "@/components/atom/tijarahTextArea";
import { testimonialSchema, type TestimonialFormData } from "../../../schemas/store.schema";
import type { StoreProductTestimonial } from "../../../types/store.types";
import type { TestimonialPayload } from "../../../api/store.api";

export interface ITestimonialFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  testimonial: StoreProductTestimonial | null;
  onSubmit: (payload: TestimonialPayload) => Promise<void>;
  isLoading: boolean;
}

export const TestimonialFormModal: React.FC<ITestimonialFormModalProps> = ({
  isOpen,
  onClose,
  productName,
  testimonial,
  onSubmit,
  isLoading,
}) => {
  const isEdit = !!testimonial;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<any, any, TestimonialFormData>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      customerName: "",
      customerRole: "Konsumen",
      rating: 5 as any,
      content: "",
      date: new Date().toISOString().slice(0, 10),
      isVerifiedPurchase: true as any,
    },
  });

  useEffect(() => {
    if (testimonial) {
      reset({
        customerName: testimonial.customerName,
        customerRole: testimonial.customerRole,
        rating: testimonial.rating as any,
        content: testimonial.content,
        date: testimonial.date,
        isVerifiedPurchase: testimonial.isVerifiedPurchase as any,
      });
    } else {
      reset({
        customerName: "",
        customerRole: "Konsumen",
        rating: 5 as any,
        content: "",
        date: new Date().toISOString().slice(0, 10),
        isVerifiedPurchase: true as any,
      });
    }
  }, [testimonial, reset, isOpen]);

  const handleFormSubmit = async (data: TestimonialFormData) => {
    await onSubmit({
      customerName: data.customerName,
      customerRole: data.customerRole,
      rating: data.rating,
      content: data.content,
      date: data.date,
      isVerifiedPurchase: data.isVerifiedPurchase,
    });
    onClose();
  };

  return (
    <TijarahModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Testimoni Pelanggan" : `Tambah Testimoni untuk ${productName}`}
      description="Dokumentasikan ulasan pengalaman nyata kesembuhan atau kepuasan konsumen."
      confirmText={isEdit ? "Simpan Testimoni" : "Publikasikan Testimoni"}
      confirmVariant="primary"
      isConfirmLoading={isLoading}
      onConfirm={handleSubmit(handleFormSubmit)}
      showCancelButton
      cancelText="Batal"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3 pt-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <TijarahInput
              label="Nama Pelanggan / Agen*"
              placeholder="Contoh: Ibu Rosnaida"
              {...register("customerName")}
              isInvalid={!!errors.customerName}
              errorMessage={errors.customerName?.message as string}
              className="text-xs font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-primary">Tipe Pengguna*</label>
            <select
              {...register("customerRole")}
              className="w-full text-xs h-10 px-3 rounded-lg border border-border-subtle bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-sage cursor-pointer"
            >
              <option value="Konsumen">Konsumen Umum</option>
              <option value="Agen">Mitra Agen HNI</option>
              <option value="Stokis">Stokis / Pengelola Gerai</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-primary">Rating Kepuasan (1-5)*</label>
            <select
              {...register("rating")}
              className="w-full text-xs h-10 px-3 rounded-lg border border-border-subtle bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-sage cursor-pointer"
            >
              <option value="5">★★★★★ (5 Bintang - Sangat Puas)</option>
              <option value="4">★★★★☆ (4 Bintang - Puas)</option>
              <option value="3">★★★☆☆ (3 Bintang - Cukup)</option>
              <option value="2">★★☆☆☆ (2 Bintang - Kurang)</option>
              <option value="1">★☆☆☆☆ (1 Bintang - Kecewa)</option>
            </select>
          </div>

          <div>
            <TijarahInput
              type="date"
              label="Tanggal Testimoni*"
              {...register("date")}
              isInvalid={!!errors.date}
              errorMessage={errors.date?.message as string}
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-primary">Status Verifikasi*</label>
            <select
              {...register("isVerifiedPurchase")}
              className="w-full text-xs h-10 px-3 rounded-lg border border-border-subtle bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-sage cursor-pointer"
            >
              <option value="true">Pembeli Terverifikasi</option>
              <option value="false">Belum Verifikasi</option>
            </select>
          </div>
        </div>

        <div>
          <TijarahTextArea
            label="Isi Testimoni Pengalaman Sembuh / Khasiat*"
            placeholder="Alhamdulillah setelah rutin mengonsumsi herbal ini selama 1 minggu..."
            {...register("content")}
            className="text-xs min-h-[80px]"
          />
          {errors.content && (
            <span className="text-xs text-status-danger font-medium">
              {errors.content?.message as string}
            </span>
          )}
        </div>
      </form>
    </TijarahModal>
  );
};

export default TestimonialFormModal;
