"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import Link from "next/link";
import {
  ApiError,
  cancelAdminBooking,
  getAdminBookings,
  type AdminBooking,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  TicketX,
} from "lucide-react";
import {
  getAdminBookingTone,
  summarizeAdminBookings,
} from "@/features/admin-bookings/lib/admin-booking-helpers";

type BookingStatusFilter = "ALL" | "PENDING" | "SUCCESS" | "CANCELLED";

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "Console booking admin belum bisa dimuat sekarang.";
}

function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

function formatDateTime(value?: string | null): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

const STATUS_OPTIONS: BookingStatusFilter[] = [
  "ALL",
  "PENDING",
  "SUCCESS",
  "CANCELLED",
];

export default function AdminBookingsPageClient() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [statusFilter, setStatusFilter] = useState<BookingStatusFilter>("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bookingIdBeingCancelled, setBookingIdBeingCancelled] = useState<
    number | null
  >(null);

  async function refreshBookings(isManual = false): Promise<void> {
    if (isManual) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setErrorMessage(null);

    try {
      const response = await getAdminBookings({
        status: statusFilter,
        search: appliedSearch || undefined,
        page: currentPage,
      });

      setBookings(response.data);
      setMeta(response.meta);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  const handleListRefresh = useEffectEvent(async () => {
    await refreshBookings();
  });

  useEffect(() => {
    void handleListRefresh();
  }, [statusFilter, appliedSearch, currentPage]);

  const metrics = useMemo(() => {
    return summarizeAdminBookings(bookings);
  }, [bookings]);

  async function handleCancelBooking(
    bookingId: number,
    customerName: string,
  ): Promise<void> {
    const shouldContinue = window.confirm(
      `Batalkan booking pending milik ${customerName}?`,
    );

    if (!shouldContinue) {
      return;
    }

    setBookingIdBeingCancelled(bookingId);
    setErrorMessage(null);

    try {
      await cancelAdminBooking(
        bookingId,
        "Dibatalkan dari console booking admin.",
      );
      await refreshBookings(true);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setBookingIdBeingCancelled(null);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbff_0%,#f8fafc_45%,#ffffff_100%)]">
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-2xl shadow-sky-100/70">
          <div className="absolute left-0 top-0 h-72 w-72 -translate-x-1/3 -translate-y-1/4 rounded-full bg-sky-500/20 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-80 w-80 translate-x-1/3 translate-y-1/4 rounded-full bg-emerald-500/20 blur-[140px]" />

          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-sky-200">
                <ShieldCheck className="h-4 w-4" />
                Booking Operations
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                  Pantau hold aktif, pelanggan, dan aksi pembatalan operasional.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  Console ini membantu admin mencari booking pending, melihat
                  payment terbaru, dan membatalkan hold yang perlu dilepas.
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
                Refresh
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/dashboard">Kembali ke Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-100/70">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Booking Terlihat
            </p>
            <p className="mt-2 text-4xl font-black tracking-tight text-slate-900">
              {bookings.length}
            </p>
            <p className="mt-2 text-xs font-semibold text-slate-500">
              Total data di halaman saat ini
            </p>
          </article>
          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-100/70">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Hold Aktif
            </p>
            <p className="mt-2 text-4xl font-black tracking-tight text-amber-600">
              {metrics.pendingCount}
            </p>
            <p className="mt-2 text-xs font-semibold text-slate-500">
              Booking pending di hasil filter ini
            </p>
          </article>
          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-100/70">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Nilai Booking
            </p>
            <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">
              {formatCurrency(metrics.visibleAmount)}
            </p>
            <p className="mt-2 text-xs font-semibold text-slate-500">
              {metrics.paidCount} payment sudah lunas
            </p>
          </article>
        </div>

        <section className="mt-8 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-100/70">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    setCurrentPage(1);
                    setAppliedSearch(searchInput.trim());
                  }
                }}
                placeholder="Cari nama pelanggan, email, atau nomor lapak"
                className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((statusOption) => (
                <Button
                  key={statusOption}
                  variant={statusFilter === statusOption ? "default" : "outline"}
                  className={cn(
                    statusFilter === statusOption &&
                      "bg-slate-950 text-white hover:bg-slate-800",
                  )}
                  onClick={() => {
                    setCurrentPage(1);
                    setStatusFilter(statusOption);
                  }}
                >
                  {statusOption}
                </Button>
              ))}
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentPage(1);
                  setAppliedSearch(searchInput.trim());
                }}
              >
                Terapkan Filter
              </Button>
            </div>
          </div>
        </section>

        {errorMessage ? (
          <div className="mt-8 rounded-[1.5rem] border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div className="mt-8 rounded-[1.75rem] border border-slate-200 bg-white p-10 text-center shadow-lg shadow-slate-100/70">
            <span className="inline-flex items-center gap-3 text-sm font-semibold text-slate-600">
              <LoaderCircle className="h-5 w-5 animate-spin text-sky-600" />
              Menyiapkan daftar booking admin...
            </span>
          </div>
        ) : null}

        {!isLoading && bookings.length === 0 ? (
          <div className="mt-8 rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-lg shadow-slate-100/70">
            <p className="text-base font-bold text-slate-800">
              Tidak ada booking yang cocok dengan filter ini.
            </p>
          </div>
        ) : null}

        {!isLoading && bookings.length > 0 ? (
          <div className="mt-8 grid gap-4">
            {bookings.map((booking) => (
              <article
                key={booking.id}
                className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-100/70"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
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
                          "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em]",
                          getAdminBookingTone(booking.status),
                        )}
                      >
                        {booking.status}
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl bg-slate-50 px-4 py-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                          Pelanggan
                        </p>
                        <p className="mt-2 text-sm font-bold text-slate-900">
                          {booking.user.name}
                        </p>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          {booking.user.email}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                          Booking Time
                        </p>
                        <p className="mt-2 text-sm font-bold text-slate-700">
                          {formatDateTime(booking.booking_time)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                          Hold Sampai
                        </p>
                        <p className="mt-2 text-sm font-bold text-slate-700">
                          {formatDateTime(booking.expires_at)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                          Payment Terbaru
                        </p>
                        <p className="mt-2 text-sm font-bold text-slate-900">
                          {booking.latest_payment?.provider ?? "Belum ada"}
                        </p>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          {booking.latest_payment?.status ?? "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="xl:w-80">
                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                        Aksi Operasional
                      </p>
                      <p className="mt-3 text-xl font-black tracking-tight text-slate-900">
                        {formatCurrency(booking.slot.price)}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-500">
                        Referensi payment:{" "}
                        {booking.latest_payment?.reference ?? "Belum ada"}
                      </p>

                      {booking.status === "PENDING" ? (
                        <Button
                          className="mt-4 w-full bg-rose-600 text-white hover:bg-rose-700"
                          onClick={() =>
                            void handleCancelBooking(booking.id, booking.user.name)
                          }
                          disabled={bookingIdBeingCancelled === booking.id}
                        >
                          {bookingIdBeingCancelled === booking.id ? (
                            <>
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                              Membatalkan booking...
                            </>
                          ) : (
                            <>
                              <TicketX className="h-4 w-4" />
                              Batalkan Hold
                            </>
                          )}
                        </Button>
                      ) : null}

                      {booking.latest_payment?.checkout_url &&
                      booking.latest_payment.status === "PENDING" ? (
                        <Button asChild variant="outline" className="mt-3 w-full">
                          <a
                            href={booking.latest_payment.checkout_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Buka Checkout Provider
                          </a>
                        </Button>
                      ) : null}

                      {booking.status !== "PENDING" ? (
                        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-700">
                          Booking ini sudah tidak punya hold aktif untuk
                          dibatalkan.
                        </div>
                      ) : (
                        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-semibold text-amber-800">
                          Hold aktif ini bisa dilepas jika pelanggan tidak
                          melanjutkan pembayaran atau perlu intervensi admin.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}

            <div className="flex flex-col items-start justify-between gap-3 rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4 shadow-lg shadow-slate-100/70 sm:flex-row sm:items-center">
              <p className="text-sm font-semibold text-slate-500">
                Halaman {meta.current_page} dari {meta.last_page} • Total{" "}
                {meta.total} booking
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={meta.current_page <= 1}
                  onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  disabled={meta.current_page >= meta.last_page}
                  onClick={() =>
                    setCurrentPage((page) => Math.min(page + 1, meta.last_page))
                  }
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-600 shadow-lg shadow-slate-100/70">
          <span className="inline-flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-500" />
            Pembatalan admin akan mencoba menutup payment eksternal yang masih
            pending lebih dulu sebelum hold slot dilepas.
          </span>
        </div>
      </section>
    </main>
  );
}
