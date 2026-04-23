import assert from "node:assert/strict";
import { createHmac, timingSafeEqual } from "node:crypto";
import test from "node:test";
import {
  buildSignedAuthContext,
  createAuthContext,
  getAuthCookieMaxAgeSeconds,
  parseSignedAuthContext,
  type AuthenticatedUser,
} from "../lib/auth-context.ts";

const DEMO_USER: AuthenticatedUser = {
  id: 7,
  name: "Admin FishBooker",
  email: "admin@example.com",
  role: "ADMIN",
};

test("should create auth context using configured max age", () => {
  process.env.AUTH_SESSION_MAX_AGE_SECONDS = "600";
  const baseline = Date.parse("2026-04-23T00:00:00.000Z");

  const context = createAuthContext(DEMO_USER, baseline);

  assert.equal(getAuthCookieMaxAgeSeconds(), 600);
  assert.equal(context.userId, DEMO_USER.id);
  assert.equal(context.role, DEMO_USER.role);
  assert.equal(context.expiresAt, "2026-04-23T00:10:00.000Z");
});

test("should parse a signed auth context when signature and expiry are valid", () => {
  process.env.AUTH_SESSION_COOKIE_SECRET = "test-auth-secret";
  process.env.AUTH_SESSION_MAX_AGE_SECONDS = "900";
  const baseline = Date.parse("2026-04-23T01:00:00.000Z");
  const context = createAuthContext(DEMO_USER, baseline);
  const signedValue = buildSignedAuthContext(context, createHmac);

  const parsedValue = parseSignedAuthContext(
    signedValue,
    createHmac,
    timingSafeEqual,
    baseline,
  );

  assert.deepEqual(parsedValue, context);
});

test("should reject a tampered auth context", () => {
  process.env.AUTH_SESSION_COOKIE_SECRET = "test-auth-secret";
  const baseline = Date.parse("2026-04-23T02:00:00.000Z");
  const context = createAuthContext(DEMO_USER, baseline);
  const signedValue = buildSignedAuthContext(context, createHmac);
  const tamperedValue = `${signedValue.slice(0, -1)}x`;

  const parsedValue = parseSignedAuthContext(
    tamperedValue,
    createHmac,
    timingSafeEqual,
    baseline,
  );

  assert.equal(parsedValue, null);
});

test("should reject an expired auth context", () => {
  process.env.AUTH_SESSION_COOKIE_SECRET = "test-auth-secret";
  process.env.AUTH_SESSION_MAX_AGE_SECONDS = "60";
  const baseline = Date.parse("2026-04-23T03:00:00.000Z");
  const context = createAuthContext(DEMO_USER, baseline);
  const signedValue = buildSignedAuthContext(context, createHmac);

  const parsedValue = parseSignedAuthContext(
    signedValue,
    createHmac,
    timingSafeEqual,
    baseline + 61_000,
  );

  assert.equal(parsedValue, null);
});
