import { randomUUID } from "node:crypto";

type LogLevel = "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

export function getRequestCorrelationId(request: Request): string {
  return request.headers.get("x-request-id") ?? randomUUID();
}

export function logServerEvent(
  level: LogLevel,
  eventName: string,
  context: LogContext,
): void {
  const payload = {
    event: eventName,
    timestamp: new Date().toISOString(),
    ...context,
  };

  if (level === "error") {
    console.error(payload);
    return;
  }

  if (level === "warn") {
    console.warn(payload);
    return;
  }

  console.info(payload);
}
