"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useState } from "react";
import {
  ArrowRight,
  Banknote,
  CircleAlert,
  CircleCheckBig,
  LoaderCircle,
  ReceiptText,
  RefreshCw,
  WalletCards,
} from "lucide-react";
import {
  ApiError,
  getPaymentDetail,
  simulatePayment,
  type PaymentDetails,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getPaymentMethodLabel,
  getPaymentStatusTone,
} from "@/features/payments/lib/payment-helpers";

interface PaymentPageClientProps {
  reference: string;
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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "Halaman pembayaran belum bisa dimuat sekarang.";
}

export default function PaymentPageClient({
  reference,
}: PaymentPageClientProps) {
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoadingState, setActionLoadingState] = useState<
    "paid" | "failed" | null
  >(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function refreshPayment(isManual = false): Promise<void> {
    if (isManual) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setErrorMessage(null);

    try {
      const nextPayment = await getPaymentDetail(reference);
      setPayment(nextPayment);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  const handleInitialLoad = useEffectEvent(async () => {
    await refreshPayment();
  });

  useEffect(() => {
    void handleInitialLoad();
  }, [reference]);

  async function handleSimulation(status: "PAID" | "FAILED"): Promise<void> {
    setActionLoadingState(status === "PAID" ? "paid" : "failed");
    setErrorMessage(null);

    try {
      const updatedPayment = await simulatePayment(reference, status);
      setPayment(updatedPayment);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setActionLoadingState(null);
    }
  }

  const canSimulateTransferPayment =
    payment?.status === "PENDING" &&
    payment.method === "MANUAL_TRANSFER" &&
    payment.provider === "MANUAL";
  const canOpenMidtransCheckout =
    payment?.status === "PENDING" &&
    payment.provider === "MIDTRANS" &&
    Boolean(payment.checkout_url);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eff6ff_0%,#f8fafc_45%,#ffffff_100%)]">
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-2xl shadow-sky-100/70">
          <div className="absolute left-0 top-0 h-64 w-64 -translate-x-1/3 -translate-y-1/4 rounded-full bg-sky-500/20 blur-[110px]" />
          <div className="absolute bottom-0 right-0 h-64 w-64 translate-x-1/3 translate-y-1/4 rounded-full bg-emerald-500/20 blur-[120px]" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-sky-200">
                <WalletCards className="h-4 w-4" />
                Payment Flow
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                  Selesaikan pembayaran booking lapakmu.
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Halaman ini memantau status payment sandbox dan sinkron dengan
                  webhook backend. Untuk mode transfer, kamu bisa mensimulasikan
                  event gateway agar alur{" "}
                  <code className="font-mono text-sky-200">PENDING -&gt; PAID</code>{" "}
                  berjalan utuh.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                onClick={() => void refreshPayment(true)}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={cn("h-4 w-4", isRefreshing && "animate-spin")}
                />
                Refresh
              </Button>
              <Button asChild className="bg-emerald-500 text-white hover:bg-emerald-600">
                <Link href="/bookings">Lihat Riwayat</Link>
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
              Menyiapkan detail pembayaran...
            </span>
          </div>
        ) : null}

        {!isLoading && payment ? (
          <>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-100/70">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Reference
                </p>
                <p className="mt-3 font-mono text-sm font-bold text-slate-700">
                  {payment.reference}
                </p>
              </article>
              <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-100/70">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Total Bayar
                </p>
                <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">
                  {formatCurrency(payment.amount)}
                </p>
              </article>
              <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-100/70">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Status
                </p>
                <div
                  className={cn(
                    "mt-3 inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em]",
                    getPaymentStatusTone(payment),
                  )}
                >
                  {payment.status}
                </div>
              </article>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-100/70">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-slate-100 p-2 text-slate-700">
                    <ReceiptText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Detail Booking
                    </p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
                      Lapak {payment.booking.slot.slot_number}
                    </h2>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 px-4 py-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                      Metode
                    </p>
                    <p className="mt-2 text-lg font-black text-slate-900">
                      {getPaymentMethodLabel(payment.method)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                      Booking Time
                    </p>
                    <p className="mt-2 text-sm font-bold text-slate-700">
                      {formatDateTime(payment.booking.booking_time)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                      Hold Sampai
                    </p>
                    <p className="mt-2 text-sm font-bold text-slate-700">
                      {formatDateTime(payment.expires_at)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                      Paid At
                    </p>
                    <p className="mt-2 text-sm font-bold text-slate-700">
                      {formatDateTime(payment.paid_at)}
                    </p>
                  </div>
                </div>

                {payment.status === "PENDING" && payment.method === "CASH" ? (
                  <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-semibold text-amber-800">
                    Pembayaran cash sudah tercatat. Datang ke lokasi dan admin
                    akan mengonfirmasi dari dashboard setelah pembayaran
                    diterima.
                  </div>
                ) : null}

                {payment.status === "PAID" ? (
                  <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-800">
                    Pembayaran berhasil. Booking kamu sudah berpindah ke status
                    sukses dan tercatat ke jurnal keuangan.
                  </div>
                ) : null}

                {payment.status !== "PAID" &&
                payment.status !== "PENDING" ? (
                  <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-semibold text-rose-700">
                    Pembayaran berakhir dengan status {payment.status}. Buat
                    booking baru jika lapak masih tersedia.
                  </div>
                ) : null}
              </section>

              <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-100/70">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-slate-100 p-2 text-slate-700">
                    <Banknote className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Aksi Pembayaran
                    </p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
                      Payment actions
                    </h2>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {canOpenMidtransCheckout ? (
                    <Button
                      asChild
                      className="w-full bg-sky-600 text-white hover:bg-sky-700"
                    >
                      <a
                        href={payment.checkout_url ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Lanjut ke Midtrans Demo
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    </Button>
                  ) : null}

                  {canSimulateTransferPayment ? (
                    <>
                      <Button
                        className="w-full bg-emerald-500 text-white hover:bg-emerald-600"
                        onClick={() => void handleSimulation("PAID")}
                        disabled={actionLoadingState !== null}
                      >
                        {actionLoadingState === "paid" ? (
                          <>
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                            Memproses webhook sukses...
                          </>
                        ) : (
                          <>
                            <CircleCheckBig className="h-4 w-4" />
                            Simulasikan Pembayaran Lunas
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => void handleSimulation("FAILED")}
                        disabled={actionLoadingState !== null}
                      >
                        {actionLoadingState === "failed" ? (
                          <>
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                            Memproses webhook gagal...
                          </>
                        ) : (
                          <>
                            <CircleAlert className="h-4 w-4" />
                            Simulasikan Pembayaran Gagal
                          </>
                        )}
                      </Button>
                    </>
                  ) : null}

                  {!canSimulateTransferPayment && payment.status === "PAID" ? (
                    <Button asChild className="w-full bg-slate-900 text-white hover:bg-slate-800">
                      <Link href="/bookings">
                        Buka Riwayat Booking
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  ) : null}

                  {!canSimulateTransferPayment && payment.status !== "PAID" ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-500">
                      {canOpenMidtransCheckout
                        ? "Checkout Midtrans sudah siap. Buka provider checkout lalu gunakan tombol refresh untuk mengecek settlement terbaru."
                        : "Status pembayaran sedang menunggu aksi eksternal atau konfirmasi admin. Gunakan tombol refresh untuk mengecek perubahan terbaru."}
                    </div>
                  ) : null}
                </div>
              </section>
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
