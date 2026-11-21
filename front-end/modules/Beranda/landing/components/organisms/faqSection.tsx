"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import { ChevronDown, HelpCircle } from "lucide-react";

export const FaqSection: React.FC = () => {
  const locale = useLocale();
  const isEn = locale === "en";
  const [openIndex, setOpenIndex] = useState<number>(0);

  const faqs = isEn
    ? [
        {
          q: "Are all herbal products sold at TIJARAH BC 3 100% official HNI?",
          a: "Yes. Every product comes directly from Business Center HNI 3 Bukittinggi with intact official seals, verified batch codes, and real-time warehouse stock.",
        },
        {
          q: "How do I get Agent Pricing (HA) and automatic TP points?",
          a: "Log in to your TIJARAH account, open your Profile page, and link your HNI Member ID. Once verified, all catalog prices automatically switch to Agent Price and TP points are recorded on every checkout.",
        },
        {
          q: "Can I pick up my order directly at the Bukittinggi outlet?",
          a: "Yes. Choose 'Store Pickup' during checkout. Once our staff marks your order ready, simply show your order number or QR code at Jl. Panorama No. 18, Bukittinggi.",
        },
        {
          q: "How are shipping fees calculated for delivery outside Bukittinggi?",
          a: "Shipping costs are calculated dynamically based on your destination city/district using our regional expedition and courier rate tables before you confirm payment.",
        },
        {
          q: "What payment methods are supported?",
          a: "We support QRIS, Virtual Accounts (BSI, Mandiri, BCA, BRI, BNI), E-Wallets via Xendit, as well as direct cashier payment for counter pickup.",
        },
      ]
    : [
        {
          q: "Apakah semua produk herbal di TIJARAH BC 3 dijamin asli dan resmi HNI?",
          a: "Ya. Seluruh produk didistribusikan langsung dari gudang Business Center HNI 3 Bukittinggi dengan segel utuh, stok riil terpantau, dan jaminan keaslian.",
        },
        {
          q: "Bagaimana cara mendapatkan Harga Agen (HA) dan Poin TP otomatis?",
          a: "Masuk ke akun TIJARAH Anda, buka halaman Profil, lalu tautkan ID Member HNI Anda. Setelah terverifikasi, seluruh katalog otomatis menampilkan Harga Agen dan poin TP tercatat pada setiap transaksi.",
        },
        {
          q: "Apakah pesanan bisa diambil langsung di gerai Bukittinggi?",
          a: "Bisa. Pilih metode 'Ambil di Toko' saat checkout. Setelah status pesanan siap diambil, cukup tunjukkan nomor nota atau QR verifikasi ke kasir di Jl. Panorama No. 18, Bukittinggi.",
        },
        {
          q: "Bagaimana perhitungan ongkos kirim untuk pengiriman ke luar kota?",
          a: "Ongkos kirim dihitung secara dinamis berdasarkan kota/kecamatan tujuan Anda sebelum pembayaran dikonfirmasi.",
        },
        {
          q: "Metode pembayaran apa saja yang tersedia?",
          a: "Kami mendukung pembayaran instan melalui Xendit (QRIS, Virtual Account bank syariah & nasional, E-Wallet) serta pembayaran tunai di kasir gerai.",
        },
      ];

  return (
    <section id="faq" className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
      {/* Left: Accordion List */}
      <div className="lg:col-span-7 space-y-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary-sage mb-1">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{isEn ? "Frequently Asked Questions" : "Pertanyaan yang Sering Diajukan"}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-text-primary">
            {isEn ? "Everything You Need to Know" : "Informasi Seputar Belanja & Kemitraan"}
          </h2>
        </div>

        <div className="divide-y divide-border-subtle border-y border-border-subtle">
          {faqs.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="py-4">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 text-left cursor-pointer group"
                >
                  <span className="text-sm sm:text-base font-bold text-text-primary group-hover:text-primary-sage transition-colors">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-text-muted shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-primary-sage" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="mt-2.5 text-xs sm:text-sm text-text-muted leading-relaxed pr-6">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Illustration / Store Visual */}
      <div className="lg:col-span-5">
        <div className="relative overflow-hidden rounded-xl border border-border-subtle bg-canvas aspect-[4/3] lg:aspect-square">
          <img
            src="/images/bc3-storefront.jpg"
            alt="Layanan Pelanggan Business Center HNI 3 Bukittinggi"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 p-5 text-white space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">
              {isEn ? "Customer & Partner Support" : "Layanan Gerai & Mitra"}
            </span>
            <p className="text-sm sm:text-base font-extrabold leading-snug">
              {isEn
                ? "Need help with your order or HNI ID verification?"
                : "Butuh bantuan pesanan atau verifikasi ID HNI Anda?"}
            </p>
            <p className="text-xs text-white/80">
              Jl. Panorama No. 18, Bukittinggi • 08:00 - 17:00 WIB
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
