"use client";

import { useState, type FormEvent } from "react";
import type { SlotStatus } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AdminSlotFormValues } from "@/features/admin-slots/types";

const SLOT_STATUS_OPTIONS: SlotStatus[] = [
  "TERSEDIA",
  "DIBOOKING",
  "PERBAIKAN",
];

export interface AdminSlotFormDialogProps {
  title: string;
  description: string;
  submitLabel: string;
  isOpen: boolean;
  isSubmitting: boolean;
  isSlotNumberLocked?: boolean;
  errorMessage: string | null;
  initialValues: AdminSlotFormValues;
  onOpenChange: (nextOpen: boolean) => void;
  onSubmit: (values: AdminSlotFormValues) => Promise<void>;
}

export default function AdminSlotFormDialog({
  title,
  description,
  submitLabel,
  isOpen,
  isSubmitting,
  isSlotNumberLocked = false,
  errorMessage,
  initialValues,
  onOpenChange,
  onSubmit,
}: AdminSlotFormDialogProps) {
  const [slotNumber, setSlotNumber] = useState(initialValues.slotNumber);
  const [price, setPrice] = useState(initialValues.price);
  const [status, setStatus] = useState<SlotStatus>(initialValues.status);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    await onSubmit({
      slotNumber,
      price,
      status,
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-[2rem] border-slate-200 p-0">
        <DialogHeader className="border-b border-slate-100 px-6 py-5">
          <DialogTitle className="text-2xl font-black tracking-tight text-slate-900">
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form className="space-y-5 px-6 py-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="slot-number"
                className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500"
              >
                Nomor Lapak
              </label>
              <input
                id="slot-number"
                type="number"
                min="1"
                inputMode="numeric"
                value={slotNumber}
                onChange={(event) => setSlotNumber(event.target.value)}
                disabled={isSlotNumberLocked || isSubmitting}
                className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 outline-none ring-emerald-200 transition focus:border-emerald-500 focus:ring-2 disabled:bg-slate-100 disabled:text-slate-400"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="slot-price"
                className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500"
              >
                Harga
              </label>
              <input
                id="slot-price"
                type="number"
                min="0"
                inputMode="numeric"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                disabled={isSubmitting}
                className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 outline-none ring-emerald-200 transition focus:border-emerald-500 focus:ring-2 disabled:bg-slate-100 disabled:text-slate-400"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="slot-status"
              className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500"
            >
              Status
            </label>
            <select
              id="slot-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as SlotStatus)}
              disabled={isSubmitting}
              className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 outline-none ring-emerald-200 transition focus:border-emerald-500 focus:ring-2 disabled:bg-slate-100 disabled:text-slate-400"
            >
              {SLOT_STATUS_OPTIONS.map((slotStatus) => (
                <option key={slotStatus} value={slotStatus}>
                  {slotStatus}
                </option>
              ))}
            </select>
          </div>

          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          <DialogFooter className="rounded-b-[2rem] border-t border-slate-100 bg-slate-50/80 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="bg-slate-900 text-white hover:bg-slate-800"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Menyimpan..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
