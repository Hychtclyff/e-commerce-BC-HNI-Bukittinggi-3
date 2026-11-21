"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { showToast } from "@/utils/toast";
import {
  MapPin,
  Camera,
  PackageCheck,
  Package,
  Truck,
  Navigation,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

type ScanEvent = "TAP_IN" | "TAP_OUT" | "SIGNATURE";

interface DeliveryScanResponse {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  recipientName: string;
  recipientPhone?: string;
  shippingAddress: string;
  shippingCourier?: string;
  shippingType?: string;
  trackingNumber?: string;
  totalAmount: number;
  items: Array<{
    productName: string;
    qty: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  token: string;
}

export default function CourierScanPage() {
  const params = useParams();
  const token = (params?.token as string) || "";
  const [data, setData] = useState<DeliveryScanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [event, setEvent] = useState<ScanEvent>("TAP_IN");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string>("");
  const [note, setNote] = useState("");
  const [locationError, setLocationError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const res = await fetch(`/api/v1/delivery/scan/${encodeURIComponent(token)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Token tidak valid");
      }
      const json = (await res.json()) as { status: string; message: string; data: DeliveryScanResponse };
      setData(json.data);
    } catch (err: any) {
      showToast.error("Gagal Memuat Data", err?.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Browser tidak mendukung GPS");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(Number(position.coords.latitude.toFixed(6)));
        setLongitude(Number(position.coords.longitude.toFixed(6)));
        setLocationError(null);
      },
      (err) => {
        setLocationError("Izin lokasi ditolak oleh browser");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePhotoCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      setPhotoBase64(canvas.toDataURL("image/jpeg", 0.7));

      stream.getTracks().forEach((track) => track.stop());
    } catch {
      showToast.error("Kamera tidak dapat diakses", "Pastikan browser mengizinkan akses kamera.");
    }
  };

  const handleSubmit = async () => {
    if (latitude === null || longitude === null) {
      showToast.error("Lokasi belum tercatat", "Aktifkan GPS sebelum mengirim event.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/delivery/scan/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude, photoBase64, note, event }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Gagal menyimpan event");
      }
      const json = (await res.json()) as { status: string; message: string; data: any };
      showToast.success("Tersimpan", json.message || "Event pengiriman berhasil disimpan.");
      setData((prev) => (prev ? { ...prev, orderStatus: json.data?.currentStatus || prev.orderStatus } : prev));
    } catch (err: any) {
      showToast.error("Gagal", err?.message || "Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas text-text-primary">
        <Package className="w-8 h-8 animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas text-text-primary px-4">
        <TijarahCard className="p-6 max-w-md w-full border border-border-subtle rounded-3xl bg-surface text-center">
          <AlertCircle className="w-10 h-10 text-status-danger mx-auto mb-3" />
          <h2 className="text-lg font-bold">Token Tidak Valid</h2>
          <p className="text-xs text-text-muted mt-2">
            QR atau link resi tidak dikenali. Periksa kembali label pengiriman atau hubungi CS BC HNI 3 Bukittinggi.
          </p>
        </TijarahCard>
      </div>
    );
  }

  const statusLabel = {
    PENDING_PAYMENT: "Menunggu Pembayaran",
    PROCESSING: "Sedang Dipersiapkan",
    SHIPPED: "Sedang Dikirim",
    DELIVERED: "Barang Diterima",
    COMPLETED: "Selesai",
    REJECTED: "Ditolak",
    CANCELLED: "Dibatalkan",
  }[data.orderStatus] || data.orderStatus;

  return (
    <div className="min-h-screen bg-canvas">
      <header className="bg-surface border-b border-border-subtle">
        <div className="container mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary-sage" />
            <span className="font-black text-sm text-text-primary">Guest Courier · Scan QR</span>
          </div>
          <span className="font-mono text-xs text-text-muted">{data.orderNumber}</span>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-6">
        <div className="grid gap-4">
          <TijarahCard className="p-5 border border-border-subtle rounded-3xl bg-surface">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-xs text-text-muted font-medium">Status Pesanan</p>
                <p className="text-sm font-bold text-text-primary mt-1">{statusLabel}</p>
              </div>
              <TijarahBadge
                tijarahVariant={data.paymentStatus === "PAID" ? "success" : "warning"}
                className="text-xs px-2 py-1 font-bold"
              >
                {data.paymentStatus === "PAID" ? "Lunas" : "Belum Bayar"}
              </TijarahBadge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-xs">
              <div>
                <span className="text-text-muted block font-medium">Penerima</span>
                <span className="font-bold text-text-primary">{data.recipientName}</span>
              </div>
              <div>
                <span className="text-text-muted block font-medium">Alamat</span>
                <span className="font-bold text-text-primary">{data.shippingAddress}</span>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-text-muted font-medium mb-2">Barang yang Dikirim</p>
              <div className="space-y-1">
                {data.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs rounded-2xl border border-border-subtle bg-canvas px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary-sage" />
                      <span className="font-semibold text-text-primary truncate">{item.productName}</span>
                    </div>
                    <span className="text-text-muted font-medium">x{item.qty}</span>
                  </div>
                ))}
              </div>
            </div>
          </TijarahCard>

          <TijarahCard className="p-5 border border-border-subtle rounded-3xl bg-surface">
            <p className="text-xs font-bold text-text-primary mb-3 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-primary-sage" /> Lokasi GPS Saat Ini
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleLocation}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-sage border border-primary-sage/40 hover:bg-primary-sage/10 px-3 py-2 rounded-2xl"
              >
                <MapPin className="w-3.5 h-3.5" />
                {latitude === null ? "Ambil Lokasi" : `Update Lokasi`}
              </button>
              <button
                type="button"
                onClick={handlePhotoCapture}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-gold border border-accent-gold/40 hover:bg-accent-gold/10 px-3 py-2 rounded-2xl"
              >
                <Camera className="w-3.5 h-3.5" />
                {photoBase64 ? "Ganti Foto" : "Ambil Foto Bukti"}
              </button>
            </div>
            {latitude !== null && longitude !== null && (
              <p className="mt-2 text-[11px] font-mono text-text-muted">
                Koordinat: {latitude}, {longitude}
              </p>
            )}
            {locationError && (
              <p className="mt-2 text-[11px] text-status-danger font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {locationError}
              </p>
            )}
          </TijarahCard>

          <TijarahCard className="p-5 border border-border-subtle rounded-3xl bg-surface">
            <p className="text-xs font-bold text-text-primary mb-3">Event Pengiriman</p>
            <div className="flex flex-wrap gap-2">
              {(["TAP_IN", "TAP_OUT", "SIGNATURE"] as ScanEvent[]).map((ev) => (
                <button
                  key={ev}
                  type="button"
                  onClick={() => setEvent(ev)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-colors ${
                    event === ev
                      ? "bg-primary-sage text-white border-primary-sage"
                      : "bg-canvas text-text-primary border-border-subtle hover:border-primary-sage/40"
                  }`}
                >
                  {ev === "TAP_IN" ? "Tap-In (Ambil Paket)" : ev === "TAP_OUT" ? "Tap-Out (Serahkan Paket)" : "Tanda Tangan"}
                </button>
              ))}
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Catatan opsional (misal: paket diantar ke pos RT)"
              className="mt-3 w-full rounded-2xl border border-border-subtle bg-canvas px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-sage"
              rows={3}
            />
          </TijarahCard>

          <TijarahButton
            type="button"
            onClick={handleSubmit}
            isDisabled={submitting}
            tijarahVariant="primary"
            className="w-full py-3 rounded-2xl font-bold flex items-center justify-center gap-2"
          >
            {submitting ? (
              "Menyimpan..."
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Kirim Event Pengiriman
              </>
            )}
          </TijarahButton>
        </div>
      </main>
    </div>
  );
}
