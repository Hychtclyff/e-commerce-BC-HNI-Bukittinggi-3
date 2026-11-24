"use client";

import React, { useRef, useState } from "react";
import { TijarahModal } from "@/components/atom/tijarahModal";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { ReceiptTemplate } from "../templates/ReceiptTemplate";
import { StoreOrder } from "../../../types/store.types";
import { Download, Printer } from "lucide-react";
import { showToast } from "@/utils/toast";

interface ReceiptPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: StoreOrder | null;
  onPrinted?: (orderId: string) => void;
}

export const ReceiptPrintModal: React.FC<ReceiptPrintModalProps> = ({
  isOpen,
  onClose,
  order,
  onPrinted,
}) => {
  const receiptRef = useRef<HTMLDivElement | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  if (!order) return null;

  const handlePrint = () => {
    const node = receiptRef.current;
    if (!node) {
      window.print();
      return;
    }

    const printWin = window.open("", "_blank", "width=460,height=720");
    if (!printWin) {
      window.print();
      return;
    }

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((el) => el.outerHTML)
      .join("\n");

    printWin.document.open();
    printWin.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Resi ${order.orderNumber}</title>
  ${styles}
  <style>
    @page { size: auto; margin: 6mm; }
    body { background: #ffffff !important; margin: 0; padding: 12px; display: flex; justify-content: center; }
  </style>
</head>
<body>
  ${node.innerHTML}
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 250);
    };
  </script>
</body>
</html>`);
    printWin.document.close();
    onPrinted?.(order.id);
  };

  const handleDownloadPdf = async () => {
    const node = receiptRef.current;
    if (!node) return;
    setIsDownloadingPdf(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(node, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdfWidth = 80;
      const pdfHeight = Math.max(120, Math.round((canvas.height * pdfWidth) / canvas.width));
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [pdfWidth, pdfHeight],
      });
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`resi-${order.orderNumber}.pdf`);
      onPrinted?.(order.id);
      showToast.success("PDF Berhasil Diunduh", `File resi-${order.orderNumber}.pdf siap digunakan.`);
    } catch (err: any) {
      showToast.error("Gagal Unduh PDF", err?.message || "Gunakan tombol Cetak Sekarang -> Save as PDF.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <TijarahModal
      isOpen={isOpen}
      onClose={onClose}
      title="Cetak Resi & Nota Pengesahan Digital"
      description={`Format resi thermal 80mm dengan e-signature untuk pesanan ${order.orderNumber}`}
      confirmText="Cetak Sekarang"
      confirmVariant="primary"
      onConfirm={handlePrint}
      showCancelButton
      cancelText="Tutup"
      maxWidth="lg"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-end gap-2">
          <TijarahButton
            type="button"
            size="sm"
            tijarahVariant="outline"
            isLoading={isDownloadingPdf}
            onClick={handleDownloadPdf}
            className="text-xs font-bold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </TijarahButton>
          <TijarahButton
            type="button"
            size="sm"
            tijarahVariant="primary"
            onClick={handlePrint}
            className="text-xs font-bold flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Template</span>
          </TijarahButton>
        </div>

        <div className="max-h-[65vh] overflow-y-auto py-2 px-1 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-border-subtle">
          <div ref={receiptRef} className="w-full flex justify-center">
            <ReceiptTemplate order={order} />
          </div>
        </div>
      </div>
    </TijarahModal>
  );
};

export default ReceiptPrintModal;
