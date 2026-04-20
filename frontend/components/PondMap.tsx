"use client";

import { Slot } from "@/lib/api";
import { cn } from "@/lib/utils";

interface PondMapProps {
  slots: Slot[];
  selectedSlotId: number | null;
  onSelectSlot: (slotId: number) => void;
}

function getSlotStateClass(status: Slot["status"]): string {
  if (status === "TERSEDIA") {
    return "border-emerald-400 bg-emerald-100 text-emerald-800";
  }

  if (status === "DIBOOKING") {
    return "border-rose-400 bg-rose-100 text-rose-800";
  }

  return "border-slate-300 bg-slate-200 text-slate-600";
}

export default function PondMap({
  slots,
  selectedSlotId,
  onSelectSlot,
}: PondMapProps) {
  return (
    <section className="relative rounded-3xl border border-cyan-200 bg-gradient-to-br from-cyan-50 via-sky-50 to-teal-50 p-6 shadow-xl shadow-cyan-100/70">
      <div className="absolute inset-0 opacity-50" aria-hidden>
        <div className="h-full w-full bg-[radial-gradient(circle_at_1px_1px,rgba(2,132,199,0.2)_1px,transparent_0)] [background-size:20px_20px]" />
      </div>

      <div className="relative z-10 mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black tracking-tight text-slate-900">
            Denah Interaktif Kolam
          </h3>
          <p className="text-sm font-medium text-slate-600">
            Klik lapak untuk melihat detail dan booking.
          </p>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {slots.map((slot) => {
          const isSelected = selectedSlotId === slot.id;

          return (
            <button
              key={slot.id}
              type="button"
              onClick={() => onSelectSlot(slot.id)}
              className={cn(
                "group relative rounded-2xl border-2 p-3 text-left transition-all duration-200",
                "hover:-translate-y-0.5 hover:shadow-lg",
                getSlotStateClass(slot.status),
                isSelected && "ring-4 ring-cyan-300/60",
              )}
            >
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] opacity-70">
                Lapak
              </p>
              <p className="text-2xl font-black">{slot.slot_number}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em]">
                {slot.status}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
