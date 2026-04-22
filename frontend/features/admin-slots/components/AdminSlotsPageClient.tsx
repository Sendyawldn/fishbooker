"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CircleDollarSign,
  LayoutGrid,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Waves,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  deleteAdminSlot,
  listAdminSlots,
  createAdminSlot,
  updateAdminSlot,
} from "@/features/admin-slots/api/adminSlotsApi";
import AdminSlotFormDialog from "@/features/admin-slots/components/AdminSlotFormDialog";
import type {
  AdminSlotFormValues,
  AdminSlotsFeedback,
} from "@/features/admin-slots/types";
import {
  AuthSession,
  readAuthSession,
  subscribeAuthSession,
} from "@/lib/auth-session";
import { ApiError, type Slot, type SlotStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

const EMPTY_CREATE_VALUES: AdminSlotFormValues = {
  slotNumber: "",
  price: "",
  status: "TERSEDIA",
};

function getSlotTone(status: SlotStatus): string {
  if (status === "TERSEDIA") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "DIBOOKING") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-600";
}

function getSlotLabel(status: SlotStatus): string {
  if (status === "TERSEDIA") {
    return "Ready";
  }

  if (status === "DIBOOKING") {
    return "Hold";
  }

  return "Perbaikan";
}

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

function formatUpdatedAt(isoString?: string): string {
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
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function extractApiMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "Terjadi kendala saat menghubungkan halaman admin ke backend.";
}

function buildEditValues(slot: Slot): AdminSlotFormValues {
  return {
    slotNumber: String(slot.slot_number),
    price: String(slot.price),
    status: slot.status,
  };
}

function parsePositiveInteger(rawValue: string): number | null {
  const parsedValue = Number(rawValue);

  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    return null;
  }

  return parsedValue;
}

export default function AdminSlotsPageClient() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [hasHydratedSession, setHasHydratedSession] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);
  const [isRefreshingSlots, setIsRefreshingSlots] = useState(false);
  const [pageErrorMessage, setPageErrorMessage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<AdminSlotsFeedback | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [createErrorMessage, setCreateErrorMessage] = useState<string | null>(
    null,
  );
  const [editErrorMessage, setEditErrorMessage] = useState<string | null>(null);
  const [slotIdBeingDeleted, setSlotIdBeingDeleted] = useState<number | null>(
    null,
  );

  useEffect(() => {
    void readAuthSession().then((activeSession) => {
      setSession(activeSession);
      setHasHydratedSession(true);
    });

    return subscribeAuthSession((updatedSession) => {
      setSession(updatedSession);
      setFeedback(null);
    });
  }, []);

  const isAdmin = session?.user.role === "ADMIN";

  async function refreshSlots(options?: { isManual?: boolean }): Promise<void> {
    const shouldShowRefreshingState = options?.isManual ?? false;

    if (shouldShowRefreshingState) {
      setIsRefreshingSlots(true);
    } else {
      setIsLoadingSlots(true);
    }

    setPageErrorMessage(null);

    try {
      const nextSlots = await listAdminSlots();
      setSlots(nextSlots);
    } catch (error) {
      setPageErrorMessage(extractApiMessage(error));
    } finally {
      setIsLoadingSlots(false);
      setIsRefreshingSlots(false);
    }
  }

  useEffect(() => {
    if (!hasHydratedSession || !isAdmin) {
      setIsLoadingSlots(false);
      return;
    }

    void refreshSlots();
  }, [hasHydratedSession, isAdmin]);

  const slotMetrics = useMemo(() => {
    return slots.reduce(
      (metrics, slot) => {
        if (slot.status === "TERSEDIA") {
          metrics.availableCount += 1;
        }

        if (slot.status === "PERBAIKAN") {
          metrics.maintenanceCount += 1;
        }

        metrics.totalValue += slot.price;

        return metrics;
      },
      {
        availableCount: 0,
        maintenanceCount: 0,
        totalValue: 0,
      },
    );
  }, [slots]);

  async function handleCreateSlot(values: AdminSlotFormValues): Promise<void> {
    if (!session) {
      setCreateErrorMessage("Sesi admin tidak ditemukan. Silakan login ulang.");
      return;
    }

    const slotNumber = parsePositiveInteger(values.slotNumber);
    const price = parsePositiveInteger(values.price);

    if (!slotNumber || price === null) {
      setCreateErrorMessage(
        "Nomor lapak harus lebih dari 0 dan harga harus berupa angka valid.",
      );
      return;
    }

    setIsSubmittingCreate(true);
    setCreateErrorMessage(null);

    try {
      const response = await createAdminSlot({
        slotNumber,
        price,
        status: values.status,
      });

      setFeedback({
        tone: "success",
        message: response.message,
      });
      setIsCreateDialogOpen(false);
      await refreshSlots();
    } catch (error) {
      setCreateErrorMessage(extractApiMessage(error));
    } finally {
      setIsSubmittingCreate(false);
    }
  }

  async function handleUpdateSlot(values: AdminSlotFormValues): Promise<void> {
    if (!session || !editingSlot) {
      setEditErrorMessage("Slot yang ingin diperbarui tidak ditemukan.");
      return;
    }

    const price = parsePositiveInteger(values.price);

    if (price === null) {
      setEditErrorMessage("Harga harus berupa angka valid.");
      return;
    }

    setIsSubmittingEdit(true);
    setEditErrorMessage(null);

    try {
      const response = await updateAdminSlot(
        editingSlot.id,
        {
          price,
          status: values.status,
        },
      );

      setFeedback({
        tone: "success",
        message: response.message,
      });
      setEditingSlot(null);
      await refreshSlots();
    } catch (error) {
      setEditErrorMessage(extractApiMessage(error));
    } finally {
      setIsSubmittingEdit(false);
    }
  }

  async function handleDeleteSlot(slot: Slot): Promise<void> {
    if (!session) {
      setFeedback({
        tone: "error",
        message: "Sesi admin tidak ditemukan. Silakan login ulang.",
      });
      return;
    }

    const hasConfirmedDeletion = window.confirm(
      `Hapus lapak ${slot.slot_number}? Aksi ini akan menghapus data slot dari sistem.`,
    );

    if (!hasConfirmedDeletion) {
      return;
    }

    setSlotIdBeingDeleted(slot.id);
    setFeedback(null);

    try {
      const response = await deleteAdminSlot(slot.id);
      setFeedback({
        tone: "success",
        message: response.message,
      });
      await refreshSlots();
    } catch (error) {
      setFeedback({
        tone: "error",
        message: extractApiMessage(error),
      });
    } finally {
      setSlotIdBeingDeleted(null);
    }
  }

  function openCreateDialog(): void {
    setFeedback(null);
    setCreateErrorMessage(null);
    setIsCreateDialogOpen(true);
  }

  function openEditDialog(slot: Slot): void {
    setFeedback(null);
    setEditErrorMessage(null);
    setEditingSlot(slot);
  }

  if (!hasHydratedSession) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#eff6ff_0%,#f8fafc_55%,#ffffff_100%)] px-6 py-16">
        <div className="mx-auto flex max-w-5xl items-center justify-center rounded-[2rem] border border-slate-200 bg-white p-10 shadow-xl shadow-sky-100/70">
          <div className="inline-flex items-center gap-3 text-sm font-semibold text-slate-600">
            <LoaderCircle className="h-5 w-5 animate-spin text-emerald-600" />
            Menyiapkan sesi admin...
          </div>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#f8fafc_55%,#ffffff_100%)] px-6 py-16">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-amber-200 bg-white p-8 shadow-2xl shadow-amber-100/60">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-amber-700">
            <ShieldAlert className="h-4 w-4" />
            Akses Admin Diperlukan
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900">
            Halaman ini hanya untuk akun admin.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Backend tetap memverifikasi role admin di server. Di sisi frontend,
            route ini juga dikunci agar operator tidak salah masuk ke area
            manajemen slot.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="bg-slate-900 text-white hover:bg-slate-800">
              <Link href="/">Kembali ke Beranda</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/#pond-map">Lihat Denah Kolam</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eff6ff_0%,#f8fafc_45%,#ffffff_100%)]">
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-2xl shadow-cyan-100/70">
          <div className="absolute left-0 top-0 h-56 w-56 -translate-x-1/3 -translate-y-1/4 rounded-full bg-cyan-500/20 blur-[100px]" />
          <div className="absolute bottom-0 right-0 h-72 w-72 translate-x-1/3 translate-y-1/4 rounded-full bg-emerald-500/20 blur-[120px]" />

          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200">
                <ShieldCheck className="h-4 w-4" />
                Admin Slot Controller
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
                  Kelola lapak tanpa keluar dari frontend.
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                  Halaman ini memakai endpoint admin yang sudah ada di backend
                  untuk membuat slot baru, mengubah harga, dan menandai lapak
                  perbaikan secara langsung.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                onClick={() => void refreshSlots({ isManual: true })}
                disabled={isRefreshingSlots}
              >
                <RefreshCw
                  className={cn("h-4 w-4", isRefreshingSlots && "animate-spin")}
                />
                Refresh Data
              </Button>
              <Button
                className="bg-emerald-500 text-white hover:bg-emerald-600"
                onClick={openCreateDialog}
              >
                <Plus className="h-4 w-4" />
                Tambah Lapak
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-100/70">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Total Lapak
                </p>
                <p className="mt-2 text-4xl font-black tracking-tight text-slate-900">
                  {slots.length}
                </p>
              </div>
              <div className="rounded-2xl bg-cyan-50 p-3 text-cyan-700">
                <LayoutGrid className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-100/70">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Siap Dipakai
                </p>
                <p className="mt-2 text-4xl font-black tracking-tight text-emerald-600">
                  {slotMetrics.availableCount}
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                <Waves className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-100/70">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Nilai Harga
                </p>
                <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                  {formatRupiah(slotMetrics.totalValue)}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {slotMetrics.maintenanceCount} lapak sedang perbaikan
                </p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                <CircleDollarSign className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {feedback ? (
          <div
            className={cn(
              "mt-6 rounded-[1.5rem] border px-5 py-4 text-sm font-semibold",
              feedback.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700",
            )}
          >
            {feedback.message}
          </div>
        ) : null}

        {pageErrorMessage ? (
          <div className="mt-6 rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
            {pageErrorMessage}
          </div>
        ) : null}

        <section className="mt-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">
                Inventaris Lapak
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Tampilan kartu untuk mobile dan tabel padat untuk layar yang
                lebih lebar.
              </p>
            </div>
          </div>

          {isLoadingSlots ? (
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500 shadow-lg shadow-slate-100/70">
              Memuat data lapak dari backend...
            </div>
          ) : null}

          {!isLoadingSlots && slots.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-8 text-center shadow-lg shadow-slate-100/70">
              <p className="text-base font-bold text-slate-800">
                Belum ada lapak yang tercatat.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Tambahkan lapak pertama dari tombol di bagian atas halaman ini.
              </p>
            </div>
          ) : null}

          {!isLoadingSlots && slots.length > 0 ? (
            <>
              <div className="grid gap-4 lg:hidden">
                {slots.map((slot) => (
                  <article
                    key={slot.id}
                    className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-100/70"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                          Lapak
                        </p>
                        <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                          {slot.slot_number}
                        </h3>
                      </div>
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em]",
                          getSlotTone(slot.status),
                        )}
                      >
                        {getSlotLabel(slot.status)}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                          Harga
                        </p>
                        <p className="mt-1 text-lg font-black text-slate-900">
                          {formatRupiah(slot.price)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                          Update Terakhir
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-700">
                          {formatUpdatedAt(slot.updated_at)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => openEditDialog(slot)}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => void handleDeleteSlot(slot)}
                        disabled={slotIdBeingDeleted === slot.id}
                      >
                        <Trash2 className="h-4 w-4" />
                        {slotIdBeingDeleted === slot.id ? "Menghapus..." : "Hapus"}
                      </Button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="hidden overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-xl shadow-slate-100/70 lg:block">
                <div className="grid grid-cols-[1fr_1.4fr_1.3fr_1.2fr] gap-4 border-b border-slate-100 bg-slate-50 px-6 py-4 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                  <span>Lapak</span>
                  <span>Status dan Harga</span>
                  <span>Update Terakhir</span>
                  <span>Aksi</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="grid grid-cols-[1fr_1.4fr_1.3fr_1.2fr] items-center gap-4 px-6 py-5"
                    >
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                          Lapak
                        </p>
                        <p className="mt-1 text-3xl font-black tracking-tight text-slate-900">
                          {slot.slot_number}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em]",
                            getSlotTone(slot.status),
                          )}
                        >
                          {getSlotLabel(slot.status)}
                        </span>
                        <p className="text-lg font-black text-slate-900">
                          {formatRupiah(slot.price)}
                        </p>
                      </div>

                      <div className="text-sm font-semibold text-slate-600">
                        {formatUpdatedAt(slot.updated_at)}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => openEditDialog(slot)}
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => void handleDeleteSlot(slot)}
                          disabled={slotIdBeingDeleted === slot.id}
                        >
                          <Trash2 className="h-4 w-4" />
                          {slotIdBeingDeleted === slot.id
                            ? "Menghapus..."
                            : "Hapus"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </section>
      </section>

      <AdminSlotFormDialog
        key={isCreateDialogOpen ? "create-open" : "create-closed"}
        title="Tambah Lapak Baru"
        description="Buat slot baru agar langsung muncul di denah customer dan panel admin."
        submitLabel="Simpan Lapak"
        isOpen={isCreateDialogOpen}
        isSubmitting={isSubmittingCreate}
        errorMessage={createErrorMessage}
        initialValues={EMPTY_CREATE_VALUES}
        onOpenChange={(nextOpen) => {
          setIsCreateDialogOpen(nextOpen);
          if (!nextOpen) {
            setCreateErrorMessage(null);
          }
        }}
        onSubmit={handleCreateSlot}
      />

      <AdminSlotFormDialog
        key={editingSlot ? `edit-${editingSlot.id}` : "edit-empty"}
        title="Edit Lapak"
        description="Ubah harga atau status lapak sesuai kondisi operasional terbaru."
        submitLabel="Simpan Perubahan"
        isOpen={editingSlot !== null}
        isSubmitting={isSubmittingEdit}
        isSlotNumberLocked
        errorMessage={editErrorMessage}
        initialValues={
          editingSlot ? buildEditValues(editingSlot) : EMPTY_CREATE_VALUES
        }
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setEditingSlot(null);
            setEditErrorMessage(null);
          }
        }}
        onSubmit={handleUpdateSlot}
      />
    </main>
  );
}
