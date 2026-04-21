import type { SlotStatus } from "@/lib/api";

export interface AdminSlotFormValues {
  slotNumber: string;
  price: string;
  status: SlotStatus;
}

export interface AdminSlotsFeedback {
  tone: "success" | "error";
  message: string;
}

export interface AdminSlotMutationDraft {
  price?: number;
  status?: SlotStatus;
}
