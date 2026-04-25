import { NextResponse } from "next/server";
import {
  BackendApiError,
  getRequiredServerAccessToken,
  requestBackendJson,
} from "@/lib/server/backend-api";
import {
  getRequestCorrelationId,
  logServerEvent,
} from "@/lib/server/observability";

async function proxySlotMutation(
  request: Request,
  slotId: string,
  method: "PATCH" | "DELETE",
) {
  const requestId = getRequestCorrelationId(request);
  const startedAt = Date.now();
  const accessToken = await getRequiredServerAccessToken().catch((error) => {
    if (error instanceof BackendApiError) {
      return error;
    }

    throw error;
  });

  if (accessToken instanceof BackendApiError) {
    logServerEvent(
      "warn",
      `frontend.admin.slots.${method.toLowerCase()}.unauthorized`,
      {
        requestId,
        slotId,
        status: accessToken.status,
        durationMs: Date.now() - startedAt,
      },
    );

    return NextResponse.json(
      {
        message: accessToken.message,
      },
      { status: accessToken.status },
    );
  }

  try {
    const response = await requestBackendJson(`/api/v1/admin/slots/${slotId}`, {
      method,
      headers: {
        ...(method === "PATCH" ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${accessToken}`,
      },
      body: method === "PATCH" ? await request.text() : undefined,
    });

    logServerEvent(
      "info",
      `frontend.admin.slots.${method.toLowerCase()}.success`,
      {
        requestId,
        slotId,
        durationMs: Date.now() - startedAt,
      },
    );

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof BackendApiError) {
      logServerEvent(
        "warn",
        `frontend.admin.slots.${method.toLowerCase()}.backend_error`,
        {
          requestId,
          slotId,
          status: error.status,
          durationMs: Date.now() - startedAt,
        },
      );

      return NextResponse.json(
        {
          message: error.message,
          ...(typeof error.payload === "object" && error.payload !== null
            ? (error.payload as Record<string, unknown>)
            : {}),
        },
        { status: error.status },
      );
    }

    logServerEvent(
      "error",
      `frontend.admin.slots.${method.toLowerCase()}.unhandled_error`,
      {
        requestId,
        slotId,
        durationMs: Date.now() - startedAt,
      },
    );

    return NextResponse.json(
      {
        message:
          method === "PATCH"
            ? "Perubahan slot belum bisa disimpan sekarang."
            : "Slot belum bisa dihapus sekarang.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slotId: string }> },
) {
  const { slotId } = await context.params;

  return proxySlotMutation(request, slotId, "PATCH");
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ slotId: string }> },
) {
  const { slotId } = await context.params;

  return proxySlotMutation(request, slotId, "DELETE");
}
