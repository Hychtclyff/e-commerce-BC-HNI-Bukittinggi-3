"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { GlobalError401State } from "@/components/molecules/states/GlobalError401State";

function UnauthorizedContent() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/profile";

  return (
    <div className="w-full min-h-[65vh] flex items-center justify-center p-4">
      <div className="max-w-xl w-full">
        <GlobalError401State
          title="Sesi Anda Telah Berakhir atau Belum Masuk"
          description="Halaman atau data ini memerlukan autentikasi aktif. Silakan masuk dengan akun mitra Tijarah Anda untuk melanjutkan akses."
          nextUrl={nextPath}
        />
      </div>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[60vh] flex items-center justify-center text-xs text-text-muted">
          Memuat halaman...
        </div>
      }
    >
      <UnauthorizedContent />
    </Suspense>
  );
}
