import type { AuthSessionUser } from "@/lib/auth-session-shared";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type SlotStatus = "TERSEDIA" | "DIBOOKING" | "PERBAIKAN";
export type PaymentMethod = "MANUAL_TRANSFER" | "MIDTRANS_SNAP" | "CASH";
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

export interface AdminBooking extends BookingWithSlot {
  user: {
    id: number;
    name: string;
    email: string;
    role: AuthSessionUser["role"];
    is_booking_blocked: boolean;
    booking_block_reason: string | null;
  };
  latest_payment?: {
    id: number;
    reference: string;
    provider: string;
    method: PaymentMethod;
    status: PaymentStatus;
    amount: number;
    checkout_url: string | null;
    expires_at: string | null;
    paid_at: string | null;
    created_at?: string;
    updated_at?: string;
  } | null;
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
  operations_health: {
    minutes_threshold: number;
    stale_pending_payments: number;
    expired_pending_bookings: number;
    needs_attention: boolean;
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

export interface AdminBookingsResponse {
  success: boolean;
  message: string;
  data: AdminBooking[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface AdminBookingControls {
  bookings_enabled: boolean;
  max_active_holds_per_user: number;
}

export interface AdminBookingControlsResponse {
  success: boolean;
  message: string;
  data: AdminBookingControls;
}

export interface AdminCustomer {
  id: number;
  name: string;
  email: string;
  role: AuthSessionUser["role"];
  is_booking_blocked: boolean;
  booking_block_reason: string | null;
  active_pending_bookings_count: number;
  successful_bookings_count: number;
  cancelled_bookings_count: number;
}

export interface AdminCustomersResponse {
  success: boolean;
  message: string;
  data: AdminCustomer[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
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

export async function getAdminBookings(
  params?: {
    status?: "ALL" | "PENDING" | "SUCCESS" | "CANCELLED";
    paymentStatus?:
      | "ALL"
      | "NONE"
      | "PENDING"
      | "PAID"
      | "FAILED"
      | "EXPIRED"
      | "CANCELLED";
    customerAccess?: "ALL" | "ACTIVE" | "BLOCKED";
    search?: string;
    page?: number;
    perPage?: number;
  },
): Promise<AdminBookingsResponse> {
  const searchParams = new URLSearchParams();

  if (params?.status) {
    searchParams.set("status", params.status);
  }

  if (params?.paymentStatus) {
    searchParams.set("payment_status", params.paymentStatus);
  }

  if (params?.customerAccess) {
    searchParams.set("customer_access", params.customerAccess);
  }

  if (params?.search) {
    searchParams.set("search", params.search);
  }

  if (params?.page) {
    searchParams.set("page", String(params.page));
  }

  if (params?.perPage) {
    searchParams.set("per_page", String(params.perPage));
  }

  const querySuffix = searchParams.toString();

  return requestAppJson<AdminBookingsResponse>(
    `/api/admin/bookings${querySuffix ? `?${querySuffix}` : ""}`,
    {
      cache: "no-store",
    },
  );
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

export async function cancelAdminBooking(
  bookingId: number,
  note?: string,
): Promise<{ success: boolean; message: string; data: AdminBooking }> {
  return requestAppJson(`/api/admin/bookings/${bookingId}/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ note }),
  });
}

export async function getAdminBookingControls(): Promise<AdminBookingControls> {
  const result = await requestAppJson<AdminBookingControlsResponse>(
    "/api/admin/operations/booking-controls",
    {
      cache: "no-store",
    },
  );

  return result.data;
}

export async function updateAdminBookingControls(
  payload: Partial<AdminBookingControls>,
): Promise<AdminBookingControlsResponse> {
  return requestAppJson<AdminBookingControlsResponse>(
    "/api/admin/operations/booking-controls",
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
}

export async function getAdminCustomers(params?: {
  search?: string;
  page?: number;
  perPage?: number;
}): Promise<AdminCustomersResponse> {
  const searchParams = new URLSearchParams();

  if (params?.search) {
    searchParams.set("search", params.search);
  }

  if (params?.page) {
    searchParams.set("page", String(params.page));
  }

  if (params?.perPage) {
    searchParams.set("per_page", String(params.perPage));
  }

  const querySuffix = searchParams.toString();

  return requestAppJson<AdminCustomersResponse>(
    `/api/admin/customers${querySuffix ? `?${querySuffix}` : ""}`,
    {
      cache: "no-store",
    },
  );
}

export async function updateAdminCustomerBookingAccess(
  customerId: number,
  payload: {
    is_booking_blocked: boolean;
    booking_block_reason?: string | null;
  },
): Promise<{ success: boolean; message: string; data: AdminCustomer }> {
  return requestAppJson(`/api/admin/customers/${customerId}/booking-access`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}
