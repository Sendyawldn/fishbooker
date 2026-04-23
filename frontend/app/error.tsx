"use client";

import { useEffect } from "react";
import Link from "next/link";
import AppStateShell from "@/components/AppStateShell";
import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("fishbooker.app.error", {
      message: error.message,
      digest: error.digest ?? null,
    });
  }, [error]);

  return (
    <AppStateShell
      eyebrow="Recovery"
      title="Halaman ini sedang bermasalah"
      description="Terjadi gangguan saat merender halaman. Kamu bisa mencoba memuat ulang state halaman atau kembali ke beranda."
      actions={
        <>
          <Button
            className="bg-slate-950 text-white hover:bg-slate-800"
            onClick={() => reset()}
          >
            Coba Lagi
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Kembali ke Beranda</Link>
          </Button>
        </>
      }
    />
  );
}
