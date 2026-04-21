export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type SlotStatus = "TERSEDIA" | "DIBOOKING" | "PERBAIKAN";

export interface Slot {
  id: number;
  slot_number: number;
  status: SlotStatus;
  price: number;
  created_at?: string;
  updated_at?: string;
}

export interface Booking {
  id: number;
  user_id: number;
  slot_id: number;
  booking_time: string;
  expires_at: string | null;
  status: "PENDING" | "SUCCESS" | "CANCELLED";
  created_at?: string;
  updated_at?: string;
}

export interface BookingWithSlot extends Booking {
  slot: Slot;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: "ADMIN" | "PELANGGAN";
  };
}

export interface BookingResponse {
  success: boolean;
  message: string;
  valid_until?: string;
  data: Booking;
}

export interface BookingListResponse {
  success: boolean;
  message: string;
  data: BookingWithSlot[];
}

export interface SlotMutationResponse {
  success: boolean;
  message: string;
  data: Slot;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export async function requestJson<T>(
  endpoint: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const data = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    const fallbackMessage = "Terjadi kesalahan saat mengakses API.";
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof (data as { message?: unknown }).message === "string"
        ? (data as { message: string }).message
        : fallbackMessage;

    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

export async function getSlots(): Promise<Slot[]> {
  const result = await requestJson<{ success: boolean; data: Slot[] }>(
    "/api/v1/slots",
    {
      cache: "no-store",
    },
  );

  return result.data;
}

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  return requestJson<LoginResponse>("/api/v1/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
}

export async function createBooking(
  slotId: number,
  token: string,
): Promise<BookingResponse> {
  return requestJson<BookingResponse>("/api/v1/bookings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ slot_id: slotId }),
  });
}

export async function getMyBookings(token: string): Promise<BookingWithSlot[]> {
  const result = await requestJson<BookingListResponse>("/api/v1/bookings/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  return result.data;
}
