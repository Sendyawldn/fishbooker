"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  LoaderCircle,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
} from "lucide-react";
import {
  ApiError,
  getAdminBookingControls,
  getAdminCustomers,
  updateAdminBookingControls,
  updateAdminCustomerBookingAccess,
  type AdminBookingControls,
  type AdminCustomer,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getCustomerAccessTone,
  summarizeAdminCustomers,
} from "@/features/admin-controls/lib/admin-controls-helpers";

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "Booking controls admin belum bisa dimuat sekarang.";
}

export default function AdminBookingControlsPageClient() {
  const [controls, setControls] = useState<AdminBookingControls | null>(null);
  const [draftLimit, setDraftLimit] = useState("2");
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSavingControls, setIsSavingControls] = useState(false);
  const [customerIdBeingUpdated, setCustomerIdBeingUpdated] = useState<number | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function refreshPage(isManual = false): Promise<void> {
    if (isManual) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setErrorMessage(null);

    try {
      const [nextControls, nextCustomers] = await Promise.all([
        getAdminBookingControls(),
        getAdminCustomers({
          search: appliedSearch || undefined,
          page: currentPage,
        }),
      ]);

      setControls(nextControls);
      setDraftLimit(String(nextControls.max_active_holds_per_user));
      setCustomers(nextCustomers.data);
      setMeta(nextCustomers.meta);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  const handleInitialRefresh = useEffectEvent(async () => {
    await refreshPage();
  });

  useEffect(() => {
    void handleInitialRefresh();
  }, [appliedSearch, currentPage]);

  const summary = useMemo(() => summarizeAdminCustomers(customers), [customers]);

  async function handleToggleBookingsEnabled(): Promise<void> {
    if (!controls) {
      return;
    }

    setIsSavingControls(true);
    setErrorMessage(null);

    try {
      const response = await updateAdminBookingControls({
        bookings_enabled: !controls.bookings_enabled,
      });
      setControls(response.data);
      setDraftLimit(String(response.data.max_active_holds_per_user));
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSavingControls(false);
    }
  }

  async function handleSaveLimit(): Promise<void> {
    const parsedLimit = Number.parseInt(draftLimit, 10);

    if (!Number.isFinite(parsedLimit) || parsedLimit < 1) {
      setErrorMessage("Limit hold aktif per pelanggan harus minimal 1.");
      return;
    }

    setIsSavingControls(true);
    setErrorMessage(null);

    try {
      const response = await updateAdminBookingControls({
        max_active_holds_per_user: parsedLimit,
      });
      setControls(response.data);
      setDraftLimit(String(response.data.max_active_holds_per_user));
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSavingControls(false);
    }
  }

  async function handleToggleCustomerAccess(customer: AdminCustomer): Promise<void> {
    const shouldBlock = !customer.is_booking_blocked;
    const bookingBlockReason = shouldBlock
      ? window.prompt(
          `Alasan blokir booking untuk ${customer.name}:`,
          customer.booking_block_reason ?? "Terlalu sering booking tanpa pembayaran.",
        )
      : null;

    if (shouldBlock && (!bookingBlockReason || !bookingBlockReason.trim())) {
      return;
    }

    setCustomerIdBeingUpdated(customer.id);
    setErrorMessage(null);

    try {
      await updateAdminCustomerBookingAccess(customer.id, {
        is_booking_blocked: shouldBlock,
        booking_block_reason: shouldBlock ? bookingBlockReason?.trim() : null,
      });
      await refreshPage(true);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setCustomerIdBeingUpdated(null);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff8f1_0%,#f8fafc_45%,#ffffff_100%)]">
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-2xl shadow-orange-100/70">
          <div className="absolute left-0 top-0 h-72 w-72 -translate-x-1/3 -translate-y-1/4 rounded-full bg-orange-500/20 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-80 w-80 translate-x-1/3 translate-y-1/4 rounded-full bg-sky-500/20 blur-[140px]" />

          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-orange-200">
                <Shield className="h-4 w-4" />
                Booking Controls
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                  Kill switch, limit hold, dan blacklist pelanggan dari satu panel.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  Gunakan panel ini saat payment bermasalah, terjadi spam booking,
                  atau Anda perlu membatasi pelanggan tertentu tanpa mengubah kode.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                onClick={() => void refreshPage(true)}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                Refresh
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/dashboard">Kembali ke Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-8 rounded-[1.5rem] border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div className="mt-8 rounded-[1.75rem] border border-slate-200 bg-white p-10 text-center shadow-lg shadow-slate-100/70">
            <span className="inline-flex items-center gap-3 text-sm font-semibold text-slate-600">
              <LoaderCircle className="h-5 w-5 animate-spin text-orange-600" />
              Menyiapkan booking controls admin...
            </span>
          </div>
        ) : null}

        {!isLoading && controls ? (
          <>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-100/70">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Reservasi
                </p>
                <p className="mt-2 text-4xl font-black tracking-tight text-slate-900">
                  {controls.bookings_enabled ? "ON" : "OFF"}
                </p>
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  Kill switch untuk seluruh flow booking baru
                </p>
              </article>
              <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-100/70">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Limit Hold
                </p>
                <p className="mt-2 text-4xl font-black tracking-tight text-slate-900">
                  {controls.max_active_holds_per_user}
                </p>
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  Maksimum hold aktif per pelanggan
                </p>
              </article>
              <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-100/70">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Pelanggan Terblokir
                </p>
                <p className="mt-2 text-4xl font-black tracking-tight text-rose-600">
                  {summary.blockedCount}
                </p>
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  {summary.activeHoldCount} hold aktif terdeteksi di halaman ini
                </p>
              </article>
            </div>

            <section className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-100/70">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-orange-100 p-2 text-orange-700">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Global Controls
                    </p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
                      Booking governance
                    </h2>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-black text-slate-900">
                          Kill switch reservasi
                        </p>
                        <p className="mt-2 text-sm font-medium text-slate-600">
                          Matikan booking baru ketika ada gangguan payment atau operasional kolam.
                        </p>
                      </div>
                      <Button
                        className={cn(
                          controls.bookings_enabled
                            ? "bg-rose-600 text-white hover:bg-rose-700"
                            : "bg-emerald-600 text-white hover:bg-emerald-700",
                        )}
                        onClick={() => void handleToggleBookingsEnabled()}
                        disabled={isSavingControls}
                      >
                        {controls.bookings_enabled ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-black text-slate-900">
                      Limit hold aktif per pelanggan
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-600">
                      Mencegah satu akun menahan terlalu banyak lapak sekaligus.
                    </p>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={draftLimit}
                        onChange={(event) => setDraftLimit(event.target.value)}
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-orange-300"
                      />
                      <Button onClick={() => void handleSaveLimit()} disabled={isSavingControls}>
                        Simpan Limit
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-100/70">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Customer Controls
                    </p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
                      Blacklist pelanggan
                    </h2>
                  </div>

                  <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 lg:max-w-sm">
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
                      placeholder="Cari nama atau email pelanggan"
                      className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {customers.map((customer) => (
                    <article
                      key={customer.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                          <div>
                            <p className="text-base font-black text-slate-900">
                              {customer.name}
                            </p>
                            <p className="text-sm font-medium text-slate-500">
                              {customer.email}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em]",
                                getCustomerAccessTone(customer),
                              )}
                            >
                              {customer.is_booking_blocked ? "Blocked" : "Active"}
                            </span>
                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-slate-600">
                              Hold aktif {customer.active_pending_bookings_count}
                            </span>
                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-slate-600">
                              Sukses {customer.successful_bookings_count}
                            </span>
                          </div>
                          {customer.booking_block_reason ? (
                            <p className="text-sm font-semibold text-rose-700">
                              Alasan: {customer.booking_block_reason}
                            </p>
                          ) : null}
                        </div>

                        <Button
                          className={cn(
                            customer.is_booking_blocked
                              ? "bg-emerald-600 text-white hover:bg-emerald-700"
                              : "bg-rose-600 text-white hover:bg-rose-700",
                          )}
                          onClick={() => void handleToggleCustomerAccess(customer)}
                          disabled={customerIdBeingUpdated === customer.id}
                        >
                          {customerIdBeingUpdated === customer.id ? (
                            <>
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                              Menyimpan...
                            </>
                          ) : customer.is_booking_blocked ? (
                            <>
                              <ShieldCheck className="h-4 w-4" />
                              Buka Blokir
                            </>
                          ) : (
                            <>
                              <Ban className="h-4 w-4" />
                              Blokir Booking
                            </>
                          )}
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between text-sm font-semibold text-slate-500">
                  <span>
                    Halaman {meta.current_page} dari {meta.last_page} • {meta.total} pelanggan
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                      disabled={meta.current_page <= 1}
                    >
                      Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setCurrentPage((page) => Math.min(page + 1, meta.last_page))
                      }
                      disabled={meta.current_page >= meta.last_page}
                    >
                      Berikutnya
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}
