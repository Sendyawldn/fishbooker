"use client";

import { useMemo, useState } from "react";
import type { Slot } from "@/lib/api";
import PondMap from "@/components/PondMap";
import SlotCard from "@/components/SlotCard";

interface InteractivePondSectionProps {
  slots: Slot[];
}

export default function InteractivePondSection({
  slots,
}: InteractivePondSectionProps) {
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(
    slots[0]?.id ?? null,
  );

  const selectedSlot = useMemo(() => {
    if (slots.length === 0) {
      return null;
    }

    return slots.find((slot) => slot.id === selectedSlotId) ?? slots[0];
  }, [selectedSlotId, slots]);

  if (slots.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm font-medium text-slate-500">
        Belum ada data lapak dari backend.
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] lg:items-start">
      <PondMap
        slots={slots}
        selectedSlotId={selectedSlot ? selectedSlot.id : null}
        onSelectSlot={setSelectedSlotId}
      />

      {selectedSlot ? <SlotCard slot={selectedSlot} /> : null}
    </div>
  );
}
