import type { AuthSessionUser } from "@/lib/auth-session-shared";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type SlotStatus = "TERSEDIA" | "DIBOOKING" | "PERBAIKAN";
export type PaymentMethod = "MANUAL_TRANSFER" | "CASH";
export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "EXPIRED"
  | "CANCELLED";

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
  paid_at?: string | null;
  status: "PENDING" | "SUCCESS" | "CANCELLED";
  created_at?: string;
  updated_at?: string;
}

export interface BookingWithSlot extends Booking {
  slot: Slot;
}

export interface LoginResponse {
  user: AuthSessionUser;
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

export interface PaymentDetails {
  reference: string;
  provider: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  currency: string;
  checkout_url: string | null;
  expires_at: string | null;
  paid_at: string | null;
  booking: {
    id: number;
    status: Booking["status"];
    booking_time: string;
    expires_at: string | null;
    paid_at: string | null;
    slot: {
      id: number;
      slot_number: number;
      status: SlotStatus;
      price: number;
    };
  };
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  data: PaymentDetails;
}

export interface AdminDashboardData {
  generated_at: string;
  metrics: {
    total_slots: number;
    available_slots: number;
    maintenance_slots: number;
    occupied_slots: number;
    active_holds: number;
    pending_payments: number;
    paid_today: number;
    gross_revenue_today: number;
    gross_revenue_month: number;
    occupancy_rate_percent: number;
  };
  revenue_trend: Array<{
    date: string;
    gross_revenue: number;
    paid_count: number;
  }>;
  slot_status_breakdown: Array<{
    status: SlotStatus;
    count: number;
  }>;
  recent_transactions: Array<{
    payment_id: number;
    reference: string;
    method: PaymentMethod;
    status: PaymentStatus;
    amount: number;
    created_at: string | null;
    paid_at: string | null;
    booking_id: number;
    slot_number: number;
    customer_name: string;
  }>;
  pending_cash_payments: Array<{
    payment_id: number;
    reference: string;
    amount: number;
    booking_id: number;
    created_at: string | null;
    slot_number: number;
    customer_name: string;
  }>;
}

interface RequestJsonOptions {
  baseUrl?: string;
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

async function performJsonRequest<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
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

export async function requestJson<T>(
  endpoint: string,
  init?: RequestInit,
  options?: RequestJsonOptions,
): Promise<T> {
  return performJsonRequest<T>(
    `${options?.baseUrl ?? API_BASE_URL}${endpoint}`,
    init,
  );
}

export async function requestAppJson<T>(
  endpoint: string,
  init?: RequestInit,
): Promise<T> {
  return performJsonRequest<T>(endpoint, init);
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
  return requestAppJson<LoginResponse>("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
}

export async function createBooking(
  slotId: number,
): Promise<BookingResponse> {
  return requestAppJson<BookingResponse>("/api/bookings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ slot_id: slotId }),
  });
}

export async function getMyBookings(): Promise<BookingWithSlot[]> {
  const result = await requestAppJson<BookingListResponse>("/api/bookings/me", {
    cache: "no-store",
  });

  return result.data;
}

export async function initiateBookingPayment(
  bookingId: number,
  method: PaymentMethod,
): Promise<PaymentResponse> {
  return requestAppJson<PaymentResponse>(`/api/bookings/${bookingId}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ method }),
  });
}

export async function getPaymentDetail(
  reference: string,
): Promise<PaymentDetails> {
  const result = await requestAppJson<PaymentResponse>(`/api/payments/${reference}`, {
    cache: "no-store",
  });

  return result.data;
}

export async function simulatePayment(
  reference: string,
  status: Extract<PaymentStatus, "PAID" | "FAILED" | "CANCELLED">,
): Promise<PaymentDetails> {
  const result = await requestAppJson<PaymentResponse>(
    `/api/payments/${reference}/simulate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    },
  );

  return result.data;
}

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  const result = await requestAppJson<{
    success: boolean;
    data: AdminDashboardData;
  }>("/api/admin/dashboard", {
    cache: "no-store",
  });

  return result.data;
}

export async function confirmCashPayment(
  paymentId: number,
  note?: string,
): Promise<{
  success: boolean;
  message: string;
  data: {
    reference: string;
    status: PaymentStatus;
    paid_at: string | null;
  };
}> {
  return requestAppJson(`/api/admin/payments/${paymentId}/confirm-cash`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ note }),
  });
}
