import {
  DeleteResponse,
  getSlots,
  requestJson,
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

function createAuthorizedHeaders(token: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function listAdminSlots(): Promise<Slot[]> {
  return getSlots();
}

export async function createAdminSlot(
  input: CreateAdminSlotInput,
  token: string,
): Promise<SlotMutationResponse> {
  return requestJson<SlotMutationResponse>("/api/v1/admin/slots", {
    method: "POST",
    headers: createAuthorizedHeaders(token),
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
  token: string,
): Promise<SlotMutationResponse> {
  return requestJson<SlotMutationResponse>(`/api/v1/admin/slots/${slotId}`, {
    method: "PATCH",
    headers: createAuthorizedHeaders(token),
    body: JSON.stringify(input),
  });
}

export async function deleteAdminSlot(
  slotId: number,
  token: string,
): Promise<DeleteResponse> {
  return requestJson<DeleteResponse>(`/api/v1/admin/slots/${slotId}`, {
    method: "DELETE",
    headers: createAuthorizedHeaders(token),
  });
}
