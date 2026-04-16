"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react"; // Import icon
import { useRouter } from "next/navigation";

export default function SlotCard({ slot }: { slot: any }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false); // State untuk loading saat hit API
  const router = useRouter();

  // Fungsi untuk mengirim data booking ke API Laravel
  const handleBooking = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ slot_id: slot.id }),
      });

      if (response.ok) {
        setOpen(false);
        // Refresh data halaman (re-fetch server component) tanpa reload browser
        router.refresh();
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Gagal melakukan booking.");
      }
    } catch (error) {
      console.error("Error booking:", error);
      alert("Terjadi kesalahan koneksi ke server.");
    } finally {
      setLoading(false);
    }
  };

  // Fungsi helper untuk menentukan style berdasarkan status
  const getStatusStyles = () => {
    switch (slot.status) {
      case "TERSEDIA":
        return {
          border: "border-emerald-200 hover:border-emerald-500",
          bg: "bg-white",
          text: "text-emerald-700",
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
          badge: "bg-emerald-100 text-emerald-700",
        };
      case "DIBOOKING":
        return {
          border: "border-rose-200",
          bg: "bg-rose-50/50",
          text: "text-rose-700",
          icon: <XCircle className="w-5 h-5 text-rose-400" />,
          badge: "bg-rose-100 text-rose-700",
        };
      default: // PERBAIKAN
        return {
          border: "border-slate-200",
          bg: "bg-slate-50",
          text: "text-slate-500",
          icon: <AlertCircle className="w-5 h-5 text-slate-400" />,
          badge: "bg-slate-200 text-slate-600",
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <div
      className={`
      relative flex flex-col items-center justify-between
      p-6 rounded-2xl border-2 transition-all duration-300 transform
      ${styles.border} ${styles.bg}
      ${slot.status === "TERSEDIA" ? "hover:-translate-y-1 hover:shadow-xl cursor-pointer" : "opacity-80"}
    `}
    >
      {/* Icon Status di Pojok Kanan Atas */}
      <div className="absolute top-3 right-3">{styles.icon}</div>

      <div className="text-center space-y-1">
        <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
          Lapak
        </p>
        <h3 className="text-4xl font-black text-slate-800">
          {slot.slot_number}
        </h3>
      </div>

      <div className="mt-4 flex flex-col items-center gap-2">
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${styles.badge}`}
        >
          {slot.status}
        </span>
        <p className="text-lg font-bold text-slate-700">
          Rp {slot.price.toLocaleString("id-ID")}
        </p>
      </div>

      {slot.status === "TERSEDIA" && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="mt-6 w-full rounded-xl bg-slate-900 hover:bg-emerald-600 transition-colors shadow-lg shadow-slate-200">
              Pesan Sekarang
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                Konfirmasi Pesanan
              </DialogTitle>
              <DialogDescription className="text-slate-500">
                Lapak {slot.slot_number} akan segera menjadi milik Anda untuk
                sesi ini.
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 border-y border-slate-100 my-4 flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-400">Total Pembayaran</p>
                <p className="text-2xl font-black text-emerald-600">
                  Rp {slot.price.toLocaleString("id-ID")}
                </p>
              </div>
              <div className="h-12 w-12 bg-emerald-50 rounded-full flex items-center justify-center">
                <CheckCircle2 className="text-emerald-500 w-6 h-6" />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                className="rounded-xl"
                disabled={loading}
              >
                Batal
              </Button>
              <Button
                onClick={handleBooking}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 rounded-xl px-8"
              >
                {loading ? "Memproses..." : "Konfirmasi"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
