import {
  DeleteResponse,
  getSlots,
  requestAppJson,
  SlotMutationResponse,
  SlotStatus,
  type Slot,
} from "@/lib/api";

export interface CreateAdminSlotInput {
  slotNumber: number;
  price: number;
  status: SlotStatus;
}

export interface UpdateAdminSlotInput {
  price?: number;
  status?: SlotStatus;
}

export async function listAdminSlots(): Promise<Slot[]> {
  return getSlots();
}

export async function createAdminSlot(
  input: CreateAdminSlotInput,
): Promise<SlotMutationResponse> {
  return requestAppJson<SlotMutationResponse>("/api/admin/slots", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      slot_number: input.slotNumber,
      price: input.price,
      status: input.status,
    }),
  });
}

export async function updateAdminSlot(
  slotId: number,
  input: UpdateAdminSlotInput,
): Promise<SlotMutationResponse> {
  return requestAppJson<SlotMutationResponse>(`/api/admin/slots/${slotId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function deleteAdminSlot(slotId: number): Promise<DeleteResponse> {
  return requestAppJson<DeleteResponse>(`/api/admin/slots/${slotId}`, {
    method: "DELETE",
  });
}
