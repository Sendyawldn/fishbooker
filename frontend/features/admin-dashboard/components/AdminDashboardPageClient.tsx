"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Banknote,
  BarChart3,
  CalendarClock,
  CircleCheckBig,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  TimerReset,
  Wrench,
} from "lucide-react";
import {
  ApiError,
  confirmCashPayment,
  getAdminDashboard,
  type AdminDashboardData,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

function getStatusTone(status: string): string {
  if (status === "PAID") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "PENDING") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-600";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "Dashboard admin belum bisa dimuat sekarang.";
}

export default function AdminDashboardPageClient() {
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cashPaymentIdBeingConfirmed, setCashPaymentIdBeingConfirmed] =
    useState<number | null>(null);

  async function refreshDashboard(isManual = false): Promise<void> {
    if (isManual) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setErrorMessage(null);

    try {
      const nextDashboard = await getAdminDashboard();
      setDashboard(nextDashboard);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    void refreshDashboard();
  }, []);

  const summaryCards = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    return [
      {
        label: "Revenue Hari Ini",
        value: formatCurrency(dashboard.metrics.gross_revenue_today),
        helper: `${dashboard.metrics.paid_today} pembayaran lunas`,
        icon: <Banknote className="h-5 w-5" />,
      },
      {
        label: "Occupancy",
        value: `${dashboard.metrics.occupancy_rate_percent}%`,
        helper: `${dashboard.metrics.occupied_slots} lapak aktif`,
        icon: <Activity className="h-5 w-5" />,
      },
      {
        label: "Pending Payment",
        value: String(dashboard.metrics.pending_payments),
        helper: `${dashboard.metrics.active_holds} hold masih berjalan`,
        icon: <TimerReset className="h-5 w-5" />,
      },
      {
        label: "Perbaikan",
        value: String(dashboard.metrics.maintenance_slots),
        helper: `${dashboard.metrics.available_slots} lapak siap jual`,
        icon: <Wrench className="h-5 w-5" />,
      },
    ];
  }, [dashboard]);

  async function handleConfirmCashPayment(
    paymentId: number,
    customerName: string,
  ): Promise<void> {
    const shouldConfirm = window.confirm(
      `Konfirmasi pembayaran tunai untuk ${customerName}?`,
    );

    if (!shouldConfirm) {
      return;
    }

    setCashPaymentIdBeingConfirmed(paymentId);
    setErrorMessage(null);

    try {
      await confirmCashPayment(
        paymentId,
        "Dikonfirmasi dari dashboard analytics admin.",
      );
      await refreshDashboard();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setCashPaymentIdBeingConfirmed(null);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f3f9ff_0%,#f8fafc_45%,#ffffff_100%)]">
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-2xl shadow-sky-100/70">
          <div className="absolute left-0 top-0 h-72 w-72 -translate-x-1/3 -translate-y-1/4 rounded-full bg-sky-500/20 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-80 w-80 translate-x-1/3 translate-y-1/4 rounded-full bg-emerald-500/20 blur-[140px]" />

          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-sky-200">
                <ShieldCheck className="h-4 w-4" />
                Command Center
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                  Dashboard operasional, transaksi, dan occupancy FishBooker.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  Semua metrik ini dibangun dari data booking, payment, webhook,
                  dan jurnal keuangan yang sama, jadi admin bisa melihat alur
                  bisnis tanpa menebak-nebak status terakhir.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                onClick={() => void refreshDashboard(true)}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={cn("h-4 w-4", isRefreshing && "animate-spin")}
                />
                Refresh
              </Button>
              <Button asChild className="bg-emerald-500 text-white hover:bg-emerald-600">
                <Link href="/api/admin/reports/finance/export">
                  Export CSV
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/slots">Kelola Slot</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/bookings">Kelola Booking</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/controls">Booking Controls</Link>
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
              <LoaderCircle className="h-5 w-5 animate-spin text-sky-600" />
              Menyiapkan data analytics admin...
            </span>
          </div>
        ) : null}

        {!isLoading && dashboard ? (
          <>
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => (
                <article
                  key={card.label}
                  className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-100/70"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                      {card.label}
                    </p>
                    <div className="rounded-full bg-slate-100 p-2 text-slate-700">
                      {card.icon}
                    </div>
                  </div>
                  <p className="mt-4 text-3xl font-black tracking-tight text-slate-900">
                    {card.value}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    {card.helper}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
              <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-100/70">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Revenue 7 Hari
                    </p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                      Tren pemasukan harian
                    </h2>
                  </div>
                  <BarChart3 className="h-5 w-5 text-slate-400" />
                </div>

                <div className="mt-6 space-y-4">
                  {dashboard.revenue_trend.map((entry) => {
                    const highestRevenue = Math.max(
                      ...dashboard.revenue_trend.map((item) => item.gross_revenue),
                      1,
                    );
                    const widthPercent =
                      (entry.gross_revenue / highestRevenue) * 100;

                    return (
                      <div key={entry.date}>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-semibold text-slate-600">
                            {entry.date}
                          </span>
                          <span className="font-black text-slate-900">
                            {formatCurrency(entry.gross_revenue)}
                          </span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-[linear-gradient(90deg,#0ea5e9_0%,#10b981_100%)]"
                            style={{ width: `${Math.max(widthPercent, 6)}%` }}
                          />
                        </div>
                        <p className="mt-1 text-[11px] font-semibold text-slate-500">
                          {entry.paid_count} pembayaran lunas
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-100/70">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Status Lapak
                    </p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                      Breakdown inventory real-time
                    </h2>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-slate-400" />
                </div>

                <div className="mt-6 grid gap-3">
                  {dashboard.slot_status_breakdown.map((item) => (
                    <div
                      key={item.status}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-700">
                          {item.status}
                        </span>
                        <span className="text-2xl font-black tracking-tight text-slate-900">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_1fr]">
              <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-100/70">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Transaksi Terbaru
                    </p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                      Payment feed terbaru
                    </h2>
                  </div>
                  <CircleCheckBig className="h-5 w-5 text-slate-400" />
                </div>

                <div className="mt-6 grid gap-3">
                  {dashboard.recent_transactions.map((transaction) => (
                    <article
                      key={transaction.reference}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                            {transaction.customer_name}
                          </p>
                          <p className="mt-1 text-lg font-black text-slate-900">
                            Lapak {transaction.slot_number}
                          </p>
                          <p className="mt-1 font-mono text-[11px] text-slate-500">
                            {transaction.reference}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em]",
                              getStatusTone(transaction.status),
                            )}
                          >
                            {transaction.status}
                          </span>
                          <p className="mt-3 text-xl font-black text-slate-900">
                            {formatCurrency(transaction.amount)}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {formatDateTime(
                              transaction.paid_at ?? transaction.created_at,
                            )}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-100/70">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Pending Cash
                    </p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                      Konfirmasi pembayaran tunai
                    </h2>
                  </div>
                  <CalendarClock className="h-5 w-5 text-slate-400" />
                </div>

                <div className="mt-6 grid gap-3">
                  {dashboard.pending_cash_payments.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">
                      Tidak ada pembayaran cash yang menunggu konfirmasi.
                    </div>
                  ) : null}

                  {dashboard.pending_cash_payments.map((payment) => (
                    <article
                      key={payment.reference}
                      className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-4"
                    >
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">
                        {payment.customer_name}
                      </p>
                      <p className="mt-1 text-lg font-black text-slate-900">
                        Lapak {payment.slot_number}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-600">
                        {formatCurrency(payment.amount)}
                      </p>
                      <p className="mt-2 font-mono text-[11px] text-slate-500">
                        {payment.reference}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        Dibuat {formatDateTime(payment.created_at)}
                      </p>
                      <Button
                        className="mt-4 w-full bg-slate-900 text-white hover:bg-slate-800"
                        onClick={() =>
                          void handleConfirmCashPayment(
                            payment.payment_id,
                            payment.customer_name,
                          )
                        }
                        disabled={
                          cashPaymentIdBeingConfirmed === payment.payment_id
                        }
                      >
                        {cashPaymentIdBeingConfirmed === payment.payment_id
                          ? "Mengonfirmasi..."
                          : "Konfirmasi Cash"}
                      </Button>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
