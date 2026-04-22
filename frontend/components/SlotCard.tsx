"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Lock,
  Wrench,
  Clock3,
  Fish,
} from "lucide-react";
import {
  ApiError,
  createBooking,
  initiateBookingPayment,
  type PaymentMethod,
  Slot,
} from "@/lib/api";
import {
  AuthSession,
  readAuthSession,
  subscribeAuthSession,
} from "@/lib/auth-session";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SlotCardProps {
  slot: Slot;
}

function getSlotLabel(status: Slot["status"]): string {
  if (status === "TERSEDIA") {
    return "Ready";
  }

  if (status === "DIBOOKING") {
    return "Sedang Hold";
  }

  return "Perbaikan";
}

function getSlotIcon(status: Slot["status"]) {
  if (status === "TERSEDIA") {
    return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
  }

  if (status === "DIBOOKING") {
    return <Lock className="h-5 w-5 text-rose-500" />;
  }

  return <Wrench className="h-5 w-5 text-slate-500" />;
}

function formatTime(isoString?: string): string {
  if (!isoString) {
    return "-";
  }

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function SlotCard({ slot }: SlotCardProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("MANUAL_TRANSFER");

  const isAvailable = slot.status === "TERSEDIA";

  const panelClassName = useMemo(() => {
    if (slot.status === "TERSEDIA") {
      return "border-emerald-200 bg-white hover:border-emerald-500";
    }

    if (slot.status === "DIBOOKING") {
      return "border-rose-200 bg-rose-50/70";
    }

    return "border-slate-200 bg-slate-100";
  }, [slot.status]);

  useEffect(() => {
    void readAuthSession().then((activeSession) => {
      setSession(activeSession);
    });

    return subscribeAuthSession((nextSession) => {
      setSession(nextSession);
    });
  }, []);

  const handleBooking = async () => {
    const activeSession = await readAuthSession();
    if (!activeSession) {
      setSuccessMessage(null);
      setLockedUntil(null);
      setErrorMessage(
        "Silakan login dulu dari header untuk melanjutkan booking.",
      );
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setLockedUntil(null);

    try {
      const bookingResponse = await createBooking(slot.id);
      const paymentResponse = await initiateBookingPayment(
        bookingResponse.data.id,
        paymentMethod,
      );

      setSuccessMessage(
        paymentMethod === "CASH"
          ? "Booking dikunci dan pembayaran tunai menunggu konfirmasi admin."
          : "Booking dikunci. Mengarahkan ke halaman pembayaran...",
      );

      if (paymentResponse.data.expires_at) {
        setLockedUntil(paymentResponse.data.expires_at);
      }

      setTimeout(() => {
        setOpen(false);
        router.push(`/payments/${paymentResponse.data.reference}`);
        router.refresh();
      }, 700);
    } catch (error) {
      if (error instanceof ApiError) {
        const payload = error.payload;

        if (
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          (payload as { error?: unknown }).error === "SLOT_LOCKED"
        ) {
          setErrorMessage(
            "Lapak sedang di-hold user lain. Pilih lapak lain atau tunggu hold selesai.",
          );

          if (
            "locked_until" in payload &&
            typeof (payload as { locked_until?: unknown }).locked_until ===
              "string"
          ) {
            setLockedUntil((payload as { locked_until: string }).locked_until);
          }
        } else {
          setErrorMessage(error.message);
        }
      } else {
        setErrorMessage("Terjadi kesalahan koneksi saat booking.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <article
      className={`rounded-2xl border p-4 shadow-sm transition-all ${panelClassName}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
            Lapak
          </p>
          <h4 className="text-3xl font-black tracking-tight text-slate-900">
            {slot.slot_number}
          </h4>
        </div>
        <div>{getSlotIcon(slot.status)}</div>
      </div>

      <div className="mb-4 space-y-1">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
          Status
        </p>
        <p className="text-sm font-extrabold text-slate-800">
          {getSlotLabel(slot.status)}
        </p>
      </div>

      <div className="mb-4 rounded-xl bg-slate-900 px-3 py-2 text-white">
        <p className="text-[10px] uppercase tracking-[0.14em] text-slate-300">
          Harga
        </p>
        <p className="text-lg font-black">
          Rp {slot.price.toLocaleString("id-ID")}
        </p>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-400"
            disabled={!isAvailable}
          >
            {isAvailable ? "Booking Lapak" : "Tidak Tersedia"}
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">
              Konfirmasi Booking
            </DialogTitle>
            <DialogDescription>
              Lapak {slot.slot_number} akan di-lock 15 menit setelah konfirmasi.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-500">Nomor Lapak</span>
              <span className="font-black text-slate-900">
                {slot.slot_number}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-500">Harga</span>
              <span className="font-black text-emerald-700">
                Rp {slot.price.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-500">Status Login</span>
              {session ? (
                <span className="font-bold text-emerald-700">
                  {session.user.name} ({session.user.role})
                </span>
              ) : (
                <span className="font-bold text-rose-700">Belum Login</span>
              )}
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
              Metode Pembayaran
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("MANUAL_TRANSFER")}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  paymentMethod === "MANUAL_TRANSFER"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                <p className="text-xs font-black uppercase tracking-[0.12em]">
                  Transfer
                </p>
                <p className="mt-1 text-xs font-medium">
                  Gunakan sandbox pembayaran dan webhook otomatis.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  paymentMethod === "CASH"
                    ? "border-amber-500 bg-amber-50 text-amber-700"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                <p className="text-xs font-black uppercase tracking-[0.12em]">
                  Cash
                </p>
                <p className="mt-1 text-xs font-medium">
                  Bayar di lokasi, lalu admin akan konfirmasi dari dashboard.
                </p>
              </button>
            </div>
          </div>

          {successMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              <p className="font-bold">{successMessage}</p>
              {lockedUntil && (
                <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold">
                  <Clock3 className="h-3.5 w-3.5" />
                  Hold sampai {formatTime(lockedUntil)}
                </p>
              )}
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <p className="inline-flex items-start gap-2 font-semibold">
                <AlertTriangle className="mt-0.5 h-4 w-4" />
                {errorMessage}
              </p>
              {lockedUntil && (
                <p className="mt-1 text-xs">
                  Estimasi terbuka lagi: {formatTime(lockedUntil)}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Tutup
            </Button>
            <Button
              onClick={handleBooking}
              disabled={loading || !session}
              className="bg-slate-900 text-white hover:bg-slate-800"
            >
              {loading
                ? "Memproses..."
                : session
                  ? "Booking + Lanjut Bayar"
                  : "Login Dulu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
        <Fish className="h-3.5 w-3.5" />
        Live status sinkron dengan API
      </p>
    </article>
  );
}
