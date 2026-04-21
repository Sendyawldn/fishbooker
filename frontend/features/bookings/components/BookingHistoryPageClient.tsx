"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CircleCheckBig,
  CircleX,
  LoaderCircle,
  Lock,
  RefreshCw,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMyBookings, type BookingWithSlot, ApiError } from "@/lib/api";
import {
  AuthSession,
  readAuthSession,
  subscribeAuthSession,
} from "@/lib/auth-session";
import { cn } from "@/lib/utils";

function getBookingTone(status: BookingWithSlot["status"]): string {
  if (status === "SUCCESS") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "PENDING") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-rose-200 bg-rose-50 text-rose-700";
}

function getBookingLabel(status: BookingWithSlot["status"]): string {
  if (status === "SUCCESS") {
    return "Selesai";
  }

  if (status === "PENDING") {
    return "Masih Hold";
  }

  return "Batal / Expired";
}

function getBookingIcon(status: BookingWithSlot["status"]) {
  if (status === "SUCCESS") {
    return <CircleCheckBig className="h-5 w-5" />;
  }

  if (status === "PENDING") {
    return <Lock className="h-5 w-5" />;
  }

  return <CircleX className="h-5 w-5" />;
}

function formatDateTime(isoString?: string | null): string {
  if (!isoString) {
    return "-";
  }

  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "Riwayat booking belum bisa dimuat sekarang.";
}

export default function BookingHistoryPageClient() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [bookings, setBookings] = useState<BookingWithSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const nextSession = readAuthSession();
    setSession(nextSession);

    return subscribeAuthSession((updatedSession) => {
      setSession(updatedSession);
    });
  }, []);

  async function refreshBookings(isManual = false): Promise<void> {
    const activeSession = readAuthSession();

    if (!activeSession) {
      setIsLoading(false);
      setErrorMessage("Sesi login tidak ditemukan. Silakan login ulang.");
      return;
    }

    if (isManual) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setErrorMessage(null);

    try {
      const nextBookings = await getMyBookings(activeSession.accessToken);
      setBookings(nextBookings);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    if (!session) {
      return;
    }

    void refreshBookings();
  }, [session]);

  const bookingMetrics = useMemo(() => {
    return bookings.reduce(
      (metrics, booking) => {
        if (booking.status === "PENDING") {
          metrics.pendingCount += 1;
        }

        if (booking.status === "SUCCESS") {
          metrics.successCount += 1;
        }

        metrics.totalValue += booking.slot.price;

        return metrics;
      },
      {
        pendingCount: 0,
        successCount: 0,
        totalValue: 0,
      },
    );
  }, [bookings]);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eefbf6_0%,#f8fafc_45%,#ffffff_100%)]">
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-2xl shadow-emerald-100/70">
          <div className="absolute left-0 top-0 h-56 w-56 -translate-x-1/3 -translate-y-1/4 rounded-full bg-emerald-500/20 blur-[100px]" />
          <div className="absolute bottom-0 right-0 h-72 w-72 translate-x-1/3 translate-y-1/4 rounded-full bg-cyan-500/20 blur-[120px]" />

          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-200">
                <Ticket className="h-4 w-4" />
                Riwayat Booking Saya
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
                  Pantau lapak yang sedang kamu hold atau sudah selesai.
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                  Halaman ini mengambil data booking milik user yang sedang
                  login dan menampilkan detail slot, waktu hold, serta status
                  terbaru dari backend.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                onClick={() => void refreshBookings(true)}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={cn("h-4 w-4", isRefreshing && "animate-spin")}
                />
                Refresh Riwayat
              </Button>
              <Button className="bg-emerald-500 text-white hover:bg-emerald-600" asChild>
                <Link href="/">Booking Lagi</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-100/70">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Total Booking
            </p>
            <p className="mt-2 text-4xl font-black tracking-tight text-slate-900">
              {bookings.length}
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-100/70">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Booking Aktif
            </p>
            <p className="mt-2 text-4xl font-black tracking-tight text-amber-600">
              {bookingMetrics.pendingCount}
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-100/70">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Nilai Tercatat
            </p>
            <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">
              {formatCurrency(bookingMetrics.totalValue)}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {bookingMetrics.successCount} booking berstatus selesai
            </p>
          </div>
        </div>

        <section className="mt-8">
          {isLoading ? (
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500 shadow-lg shadow-slate-100/70">
              <span className="inline-flex items-center gap-3">
                <LoaderCircle className="h-5 w-5 animate-spin text-emerald-600" />
                Memuat riwayat booking...
              </span>
            </div>
          ) : null}

          {!isLoading && errorMessage ? (
            <div className="rounded-[1.75rem] border border-rose-200 bg-rose-50 p-6 text-sm font-semibold text-rose-700 shadow-lg shadow-rose-100/70">
              {errorMessage}
            </div>
          ) : null}

          {!isLoading && !errorMessage && bookings.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-8 text-center shadow-lg shadow-slate-100/70">
              <p className="text-base font-bold text-slate-800">
                Belum ada booking untuk akun ini.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Pilih lapak dari homepage untuk membuat booking pertamamu.
              </p>
            </div>
          ) : null}

          {!isLoading && !errorMessage && bookings.length > 0 ? (
            <div className="grid gap-4">
              {bookings.map((booking) => (
                <article
                  key={booking.id}
                  className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-100/70"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="rounded-2xl bg-slate-950 px-4 py-3 text-white">
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-300">
                            Lapak
                          </p>
                          <p className="mt-1 text-3xl font-black tracking-tight">
                            {booking.slot.slot_number}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em]",
                            getBookingTone(booking.status),
                          )}
                        >
                          {getBookingIcon(booking.status)}
                          {getBookingLabel(booking.status)}
                        </span>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                            Harga Slot
                          </p>
                          <p className="mt-1 text-lg font-black text-slate-900">
                            {formatCurrency(booking.slot.price)}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                            Waktu Booking
                          </p>
                          <p className="mt-1 text-sm font-bold text-slate-700">
                            {formatDateTime(booking.booking_time)}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                            Hold Sampai
                          </p>
                          <p className="mt-1 text-sm font-bold text-slate-700">
                            {formatDateTime(booking.expires_at)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600 lg:w-72">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                        Ringkasan
                      </p>
                      <div className="mt-3 space-y-3">
                        <div className="flex items-center justify-between gap-4">
                          <span className="inline-flex items-center gap-2 font-semibold">
                            <CalendarClock className="h-4 w-4 text-slate-400" />
                            Update terakhir
                          </span>
                          <span className="text-right font-bold text-slate-700">
                            {formatDateTime(booking.updated_at)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-semibold text-slate-500">
                            Status slot saat ini
                          </span>
                          <span className="font-black text-slate-700">
                            {booking.slot.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-semibold text-slate-500">
                            ID booking
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-700">
                            #{booking.id}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}
