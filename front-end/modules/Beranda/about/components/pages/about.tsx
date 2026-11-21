"use client";

import React, { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { apiClient } from "@/lib/axios/client";
import { MapPin, Clock, Phone, Mail } from "lucide-react";

interface ContactInfo {
  storeName: string;
  whatsapp: string;
  phone: string;
  email: string;
  address: string;
  operationalHours: string;
}

export default function About() {
  const locale = useLocale();
  const isEn = locale === "en";
  const [contact, setContact] = useState<ContactInfo>({
    storeName: "Business Center HNI 3 Bukittinggi",
    whatsapp: "6281267890123",
    phone: "(0752) 624510",
    email: "admin@tijarahbc3.id",
    address: "Jl. Panorama No. 18, Guguk Panjang, Kota Bukittinggi, Sumatera Barat",
    operationalHours: "Senin - Sabtu: 08:00 - 17:00 WIB",
  });

  useEffect(() => {
    apiClient
      .get<{ data: ContactInfo }>("/store/contact-info")
      .then((res) => {
        if (res.data?.data) setContact(res.data.data);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-0 pb-0">
      {/* 1. Full-Bleed Editorial Hero */}
      <section className="relative w-screen left-1/2 -translate-x-1/2 -mt-6 overflow-hidden min-h-[380px] sm:min-h-[440px] flex flex-col justify-between text-white">
        <img
          src="/images/bc3-storefront.jpg"
          alt={contact.storeName}
          style={{
            maskImage: "linear-gradient(to bottom, black 90%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 90%, transparent 100%)",
          }}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div
          style={{
            maskImage: "linear-gradient(to bottom, black 90%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 90%, transparent 100%)",
          }}
          className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/40"
        />

        <div className="relative z-10 container mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14 flex flex-col justify-between flex-grow">
          <div className="text-[11px] font-semibold tracking-wider uppercase text-white/80">
            TIJARAH • {contact.storeName}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end my-auto py-4">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-medium text-white/95">
                  {isEn ? "Official Distribution Hub" : "Pusat Distribusi Resmi"}
                </span>
                <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-medium text-white/95">
                  Bukittinggi, Sumatera Barat
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl leading-[1.1] tracking-tight">
                <span className="block font-light text-white/90">
                  {isEn ? "About" : "Tentang"}
                </span>
                <span className="block font-black text-white">BC HNI 3 Bukittinggi</span>
              </h1>
            </div>

            <div className="lg:col-span-5">
              <p className="text-xs sm:text-sm text-white/85 leading-relaxed max-w-md">
                {isEn
                  ? "Connecting retail consumers and registered HNI partners with authentic halal herbal products, transparent pricing, and reliable regional fulfillment."
                  : "Menghubungkan konsumen retail dan mitra agen HNI dengan produk herba halal resmi, harga transparan, serta layanan pengiriman regional terpercaya."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Story & Operational Details (2-Column Editorial) */}
      <section className="py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-6 space-y-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary-sage">
                {isEn ? "Our Profile & Outlet" : "Profil & Operasional Gerai"}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-text-primary mt-1">
                {contact.storeName}
              </h2>
            </div>

            <p className="text-sm text-text-muted leading-relaxed">
              {isEn
                ? "TIJARAH-3 serves as the digital storefront and partner hub for Business Center HNI 3 Bukittinggi. Every transaction is backed by real-time warehouse stock, verified staff digital signatures, and official thermal receipts."
                : "TIJARAH-3 merupakan etalase digital dan pusat layanan mitra resmi Business Center HNI 3 Bukittinggi. Setiap transaksi didukung stok gudang riil, tanda tangan digital petugas, dan nota resmi terverifikasi."}
            </p>

            <div className="divide-y divide-border-subtle border-y border-border-subtle text-sm">
              <div className="py-3.5 flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary-sage shrink-0 mt-1" />
                <div>
                  <div className="text-xs font-bold uppercase text-text-muted">
                    {isEn ? "Outlet Address" : "Alamat Gerai"}
                  </div>
                  <div className="font-semibold text-text-primary mt-0.5">{contact.address}</div>
                </div>
              </div>

              <div className="py-3.5 flex items-start gap-3">
                <Clock className="w-4 h-4 text-primary-sage shrink-0 mt-1" />
                <div>
                  <div className="text-xs font-bold uppercase text-text-muted">
                    {isEn ? "Operational Hours" : "Jam Operasional"}
                  </div>
                  <div className="font-semibold text-text-primary mt-0.5">
                    {contact.operationalHours}
                  </div>
                </div>
              </div>

              <div className="py-3.5 flex items-start gap-3">
                <Phone className="w-4 h-4 text-primary-sage shrink-0 mt-1" />
                <div>
                  <div className="text-xs font-bold uppercase text-text-muted">
                    {isEn ? "Phone & Email" : "Telepon & Email"}
                  </div>
                  <div className="font-semibold text-text-primary mt-0.5 flex flex-wrap items-center gap-3">
                    <span>{contact.phone}</span>
                    <span className="text-text-muted">•</span>
                    <span className="inline-flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-primary-sage" />
                      {contact.email}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative overflow-hidden rounded-xl border border-border-subtle aspect-[4/3]">
              <img
                src="/images/bc3-storefront.jpg"
                alt={contact.storeName}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
