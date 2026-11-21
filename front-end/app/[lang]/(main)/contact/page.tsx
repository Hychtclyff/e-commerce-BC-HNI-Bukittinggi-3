"use client";

import React, { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { apiClient } from "@/lib/axios/client";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahTextArea } from "@/components/atom/tijarahTextArea";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { showToast } from "@/utils/toast";
import { MapPin, Phone, Mail, Clock, Send, MessageCircle } from "lucide-react";

interface ContactInfo {
  storeName: string;
  whatsapp: string;
  phone: string;
  email: string;
  address: string;
  operationalHours: string;
}

export default function ContactPage() {
  const locale = useLocale();
  const isEn = locale === "en";

  const [info, setInfo] = useState<ContactInfo>({
    storeName: "Business Center HNI 3 Bukittinggi",
    whatsapp: "6281267890123",
    phone: "(0752) 624510",
    email: "admin@tijarahbc3.id",
    address: "Jl. Panorama No. 18, Guguk Panjang, Kota Bukittinggi, Sumatera Barat 26116",
    operationalHours: "Senin - Sabtu: 08:00 - 17:00 WIB",
  });

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiClient
      .get<{ data: ContactInfo }>("/store/contact-info")
      .then((res) => {
        if (res.data?.data) setInfo(res.data.data);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.subject.trim() || !form.message.trim()) {
      showToast.error(
        isEn ? "Incomplete Form" : "Form Belum Lengkap",
        isEn ? "Name, subject, and message are required." : "Nama, subjek, dan pesan wajib diisi."
      );
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post("/store/contact-messages", form);
      showToast.success(
        isEn ? "Message Sent" : "Pesan Terkirim",
        isEn
          ? "Thank you! Our store team will respond shortly."
          : "Terima kasih! Tim gerai kami akan segera menindaklanjuti pesan Anda."
      );
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err: any) {
      showToast.error(isEn ? "Failed" : "Gagal", err?.message || "Gagal mengirim pesan.");
    } finally {
      setSubmitting(false);
    }
  };

  const waHref = `https://wa.me/${(info.whatsapp || "").replace(/\D/g, "")}`;

  return (
    <div className="flex flex-col gap-0 pb-0">
      {/* 1. Full-Bleed Editorial Hero (Same style as Landing Page) */}
      <section className="relative w-screen left-1/2 -translate-x-1/2 -mt-6 overflow-hidden min-h-[340px] sm:min-h-[400px] flex flex-col justify-between text-white">
        <img
          src="/images/bc3-storefront.jpg"
          alt={info.storeName}
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

        <div className="relative z-10 container mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-12 flex flex-col justify-between flex-grow">
          <div className="text-[11px] font-semibold tracking-wider uppercase text-white/80">
            TIJARAH • {info.storeName}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end my-auto py-4">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-medium text-white/95">
                  {isEn ? "Customer Care" : "Layanan Pelanggan"}
                </span>
                <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-medium text-white/95">
                  {info.operationalHours}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl leading-[1.1] tracking-tight">
                <span className="block font-light text-white/90">
                  {isEn ? "Get in Touch" : "Hubungi"}
                </span>
                <span className="block font-black text-white">
                  {isEn ? "With Our Team" : "Tim Gerai Kami"}
                </span>
              </h1>
            </div>

            <div className="lg:col-span-5">
              <p className="text-xs sm:text-sm text-white/85 leading-relaxed max-w-md">
                {isEn
                  ? "Have questions about HNI products, agent registration, or order delivery? Send a message directly to our Bukittinggi team."
                  : "Punya pertanyaan seputar produk herba HNI, pendaftaran agen, atau pengiriman pesanan? Kirim pesan langsung ke tim kami."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Contact Info & Inquiry Form */}
      <section className="py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left: Clean Editorial Contact List */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary-sage">
                {isEn ? "Direct Channels" : "Saluran Resmi"}
              </span>
              <h2 className="text-2xl font-black text-text-primary mt-1">
                {info.storeName}
              </h2>
            </div>

            <div className="divide-y divide-border-subtle border-y border-border-subtle text-sm">
              <div className="py-4 flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary-sage shrink-0 mt-1" />
                <div>
                  <div className="text-xs font-bold uppercase text-text-muted">
                    {isEn ? "Store Address" : "Alamat Gerai"}
                  </div>
                  <div className="font-semibold text-text-primary mt-0.5">{info.address}</div>
                </div>
              </div>

              <div className="py-4 flex items-start gap-3">
                <Phone className="w-4 h-4 text-primary-sage shrink-0 mt-1" />
                <div>
                  <div className="text-xs font-bold uppercase text-text-muted">
                    {isEn ? "Phone & WhatsApp" : "Telepon & WhatsApp"}
                  </div>
                  <div className="font-semibold text-text-primary mt-0.5">{info.phone}</div>
                </div>
              </div>

              <div className="py-4 flex items-start gap-3">
                <Mail className="w-4 h-4 text-primary-sage shrink-0 mt-1" />
                <div>
                  <div className="text-xs font-bold uppercase text-text-muted">Email</div>
                  <div className="font-semibold text-text-primary mt-0.5">{info.email}</div>
                </div>
              </div>

              <div className="py-4 flex items-start gap-3">
                <Clock className="w-4 h-4 text-primary-sage shrink-0 mt-1" />
                <div>
                  <div className="text-xs font-bold uppercase text-text-muted">
                    {isEn ? "Operational Hours" : "Jam Operasional"}
                  </div>
                  <div className="font-semibold text-text-primary mt-0.5">
                    {info.operationalHours}
                  </div>
                </div>
              </div>
            </div>

            {info.whatsapp && (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#1e3a2d] text-white text-xs sm:text-sm font-bold py-3 px-5 hover:opacity-90 transition-opacity"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{isEn ? "Chat via WhatsApp" : "Chat Langsung via WhatsApp"}</span>
              </a>
            )}
          </div>

          {/* Right: Crisp Inquiry Form */}
          <div className="lg:col-span-7">
            <form
              onSubmit={handleSubmit}
              className="rounded-xl border border-border-subtle bg-surface p-6 sm:p-8 space-y-4"
            >
              <div>
                <h2 className="text-lg sm:text-xl font-black text-text-primary">
                  {isEn ? "Send Us a Message" : "Kirim Pesan ke Admin Gerai"}
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  {isEn
                    ? "Your inquiry goes directly to our ERP Contact Management queue."
                    : "Pesan Anda akan langsung masuk ke sistem manajemen kontak admin gerai."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TijarahInput
                  label={isEn ? "Full Name*" : "Nama Lengkap*"}
                  placeholder={isEn ? "Your name" : "Nama Anda"}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="text-xs"
                />
                <TijarahInput
                  label={isEn ? "Phone / WhatsApp" : "Nomor HP / WhatsApp"}
                  placeholder="0812..."
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TijarahInput
                  type="email"
                  label="Email"
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="text-xs"
                />
                <TijarahInput
                  label={isEn ? "Subject*" : "Subjek*"}
                  placeholder={isEn ? "Order / Agent / Product inquiry" : "Pertanyaan pesanan / produk"}
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="text-xs"
                />
              </div>

              <TijarahTextArea
                label={isEn ? "Message*" : "Isi Pesan*"}
                placeholder={isEn ? "Write your message here..." : "Tulis pesan atau pertanyaan Anda di sini..."}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="text-xs min-h-[130px]"
              />

              <div className="flex justify-end pt-1">
                <TijarahButton
                  type="submit"
                  tijarahVariant="primary"
                  size="md"
                  isLoading={submitting}
                  className="rounded-lg text-xs sm:text-sm font-bold px-6 h-10 flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isEn ? "Send Message" : "Kirim Pesan"}</span>
                </TijarahButton>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
