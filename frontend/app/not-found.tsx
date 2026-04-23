import Link from "next/link";
import AppStateShell from "@/components/AppStateShell";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <AppStateShell
      eyebrow="404"
      title="Halaman tidak ditemukan"
      description="Rute yang kamu buka tidak tersedia lagi atau referensinya tidak valid."
      actions={
        <>
          <Button asChild className="bg-slate-950 text-white hover:bg-slate-800">
            <Link href="/">Kembali ke Beranda</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/bookings">Lihat Riwayat Booking</Link>
          </Button>
        </>
      }
    />
  );
}
