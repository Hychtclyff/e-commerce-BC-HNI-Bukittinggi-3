"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { TijarahModal } from "@/components/atom/tijarahModal";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import {
  Camera,
  CameraOff,
  SwitchCamera,
  CheckCircle2,
  Volume2,
  VolumeX,
  ScanBarcode,
  AlertCircle,
} from "lucide-react";

interface CameraBarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult: (scannedText: string) => void;
  targetItemsHint?: Array<{ sku: string; name: string }>;
}

export const CameraBarcodeScannerModal: React.FC<CameraBarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanResult,
  targetItemsHint = [],
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Play Beep Sound sintetis via Web Audio API
  const playBeep = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio context might fail on restricted policy
    }
  }, [soundEnabled]);

  // Inisialisasi daftar kamera
  useEffect(() => {
    if (!isOpen) {
      if (readerRef.current) {
        readerRef.current.reset();
      }
      setIsScanning(false);
      setLastScanned(null);
      setErrorMessage(null);
      return;
    }

    const codeReader = new BrowserMultiFormatReader();
    readerRef.current = codeReader;

    codeReader
      .listVideoInputDevices()
      .then((devices) => {
        setVideoDevices(devices);
        if (devices.length > 0) {
          // Prioritaskan kamera belakang (environment) jika ada
          const backCam = devices.find((d) =>
            d.label.toLowerCase().includes("back") ||
            d.label.toLowerCase().includes("belakang") ||
            d.label.toLowerCase().includes("environment")
          );
          setSelectedDeviceId(backCam ? backCam.deviceId : devices[0].deviceId);
          setHasCameraPermission(true);
        } else {
          setHasCameraPermission(false);
          setErrorMessage("Tidak ada perangkat kamera yang terdeteksi di perangkat ini.");
        }
      })
      .catch((err) => {
        console.error("Gagal mendeteksi kamera:", err);
        setHasCameraPermission(false);
        setErrorMessage("Izin akses kamera ditolak. Silakan izinkan browser mengakses kamera Anda.");
      });

    return () => {
      codeReader.reset();
    };
  }, [isOpen]);

  // Mulai memindai video stream
  useEffect(() => {
    if (!isOpen || !selectedDeviceId || !readerRef.current || !videoRef.current) return;

    const codeReader = readerRef.current;
    setIsScanning(true);
    let lastScanTime = 0;
    let prevText = "";

    codeReader.decodeFromVideoDevice(
      selectedDeviceId,
      videoRef.current,
      (result, err) => {
        if (result) {
          const text = result.getText().trim();
          const now = Date.now();

          // Debounce scan 1.2 detik untuk barcode yang sama
          if (text === prevText && now - lastScanTime < 1200) {
            return;
          }

          lastScanTime = now;
          prevText = text;
          setLastScanned(text);
          playBeep();
          onScanResult(text);
        }
      }
    );

    return () => {
      codeReader.reset();
      setIsScanning(false);
    };
  }, [isOpen, selectedDeviceId, onScanResult, playBeep]);

  // Switch ke kamera berikutnya
  const handleSwitchCamera = () => {
    if (videoDevices.length <= 1) return;
    const currentIndex = videoDevices.findIndex((d) => d.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % videoDevices.length;
    setSelectedDeviceId(videoDevices[nextIndex].deviceId);
  };

  return (
    <TijarahModal
      isOpen={isOpen}
      onClose={onClose}
      title="Pemindai Barcode Kamera Live"
      description="Arahkan lensa kamera perangkat ke label barcode atau QR SKU produk untuk verifikasi barang datang secara instan."
      maxWidth="lg"
      showCloseIcon
    >
      <div className="flex flex-col items-center gap-4 pt-2">
        {/* Viewfinder Video Container */}
        <div className="relative w-full aspect-4/3 max-w-md bg-black rounded-2xl overflow-hidden border border-border-subtle shadow-2xl flex items-center justify-center">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />

          {/* Viewfinder Target Crosshairs & Laser Line */}
          {isScanning && !errorMessage && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Darkened overlay edges */}
              <div className="w-64 h-64 border-2 border-emerald-400/80 rounded-2xl relative shadow-lg">
                {/* 4 Corner Markers */}
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-md" />
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-md" />
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-md" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-md" />

                {/* Animated Horizontal Laser Scan Line */}
                <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] animate-bounce top-1/2 -translate-y-1/2" />
              </div>

              <div className="absolute bottom-3 text-center bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-semibold text-white/90">
                Posisikan barcode di dalam kotak hijau
              </div>
            </div>
          )}

          {/* Error / No Permission State */}
          {errorMessage && (
            <div className="absolute inset-0 bg-canvas/90 flex flex-col items-center justify-center p-6 text-center gap-3">
              <CameraOff className="w-10 h-10 text-status-danger" />
              <p className="text-xs font-semibold text-text-primary">{errorMessage}</p>
              <TijarahButton
                type="button"
                heroVariant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="text-xs"
              >
                Muat Ulang Halaman
              </TijarahButton>
            </div>
          )}
        </div>

        {/* Status Hasil Scan Real-Time */}
        {lastScanned && (
          <div className="w-full max-w-md p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <span className="font-bold text-text-primary block">Barcode Terdeteksi:</span>
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">{lastScanned}</span>
              </div>
            </div>
            <TijarahBadge tijarahVariant="success">+1 Terverifikasi</TijarahBadge>
          </div>
        )}

        {/* Toolbar Kontrol Kamera */}
        <div className="flex items-center justify-between w-full max-w-md pt-2 border-t border-border-subtle">
          <div className="flex items-center gap-2">
            {videoDevices.length > 1 && (
              <TijarahButton
                type="button"
                heroVariant="outline"
                size="sm"
                onClick={handleSwitchCamera}
                className="text-xs px-3 h-8 font-bold flex items-center gap-1.5"
                title="Ganti Kamera Depan / Belakang"
              >
                <SwitchCamera className="w-3.5 h-3.5" />
                <span>Ganti Kamera</span>
              </TijarahButton>
            )}

            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl border border-border-subtle text-text-muted hover:text-text-primary bg-surface transition-colors cursor-pointer"
              title={soundEnabled ? "Nonaktifkan Suara Beep" : "Aktifkan Suara Beep"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-primary-sage" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          <TijarahButton
            type="button"
            tijarahVariant="primary"
            size="sm"
            onClick={onClose}
            className="text-xs px-4 h-8 font-bold"
          >
            Selesai Scan
          </TijarahButton>
        </div>
      </div>
    </TijarahModal>
  );
};

export default CameraBarcodeScannerModal;
