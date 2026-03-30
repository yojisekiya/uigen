// @vitest-environment node
import { vi, describe, test, expect, beforeEach } from "vitest";
import { jwtVerify } from "jose";

vi.mock("server-only", () => ({}));

type CookieOptions = {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: string;
  expires?: Date;
  path?: string;
};

type CookieEntry = { value: string; options: CookieOptions };

const mockCookieStore = {
  store: new Map<string, CookieEntry>(),
  get(name: string) {
    return this.store.get(name);
  },
  set(name: string, value: string, options: CookieOptions) {
    this.store.set(name, { value, options });
  },
  delete(name: string) {
    this.store.delete(name);
  },
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

import { createSession } from "../auth";

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

describe("createSession", () => {
  beforeEach(() => {
    mockCookieStore.store.clear();
  });

  test("sets a cookie with the correct name and security options", async () => {
    await createSession("user-1", "test@example.com");

    const cookie = mockCookieStore.store.get("auth-token");
    expect(cookie).toBeDefined();
    expect(cookie!.options.httpOnly).toBe(true);
    expect(cookie!.options.sameSite).toBe("lax");
    expect(cookie!.options.path).toBe("/");
  });

  test("sets secure to false outside production", async () => {
    await createSession("user-1", "test@example.com");

    const cookie = mockCookieStore.store.get("auth-token");
    expect(cookie!.options.secure).toBe(false);
  });

  test("sets cookie expiry approximately 7 days from now", async () => {
    const before = Date.now();
    await createSession("user-1", "test@example.com");
    const after = Date.now();

    const cookie = mockCookieStore.store.get("auth-token");
    const expires = cookie!.options.expires!.getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    expect(expires).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
    expect(expires).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
  });

  test("stores a valid JWT containing userId and email", async () => {
    await createSession("user-1", "test@example.com");

    const cookie = mockCookieStore.store.get("auth-token");
    const { payload } = await jwtVerify(cookie!.value, JWT_SECRET);

    expect(payload.userId).toBe("user-1");
    expect(payload.email).toBe("test@example.com");
  });
});
