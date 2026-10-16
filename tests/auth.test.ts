import { describe, it, expect } from "vitest";
import {
  createAdminToken,
  verifyAdminToken,
  checkLoginRateLimit,
} from "@/lib/auth";

describe("Admin Authentication & Security", () => {
  it("should create and verify valid admin JWT session tokens", async () => {
    const token = await createAdminToken();
    expect(typeof token).toBe("string");

    const isValid = await verifyAdminToken(token);
    expect(isValid).toBe(true);
  });

  it("should reject tampered or corrupted session tokens", async () => {
    const validToken = await createAdminToken();
    const tamperedToken = validToken.slice(0, -6) + "xxxxxx";

    const isValid = await verifyAdminToken(tamperedToken);
    expect(isValid).toBe(false);
  });

  it("should reject invalid token formats", async () => {
    const isValid = await verifyAdminToken("not.a.valid.jwt");
    expect(isValid).toBe(false);
  });

  it("should enforce rate limiting on consecutive attempts", () => {
    const testIp = `192.0.2.${Math.floor(Math.random() * 200) + 10}`;

    // 5 allowed attempts
    for (let i = 0; i < 5; i++) {
      const res = checkLoginRateLimit(testIp);
      expect(res.allowed).toBe(true);
    }

    // 6th attempt must be rejected
    const blockedRes = checkLoginRateLimit(testIp);
    expect(blockedRes.allowed).toBe(false);
    expect(blockedRes.remainingAttempts).toBe(0);
  });
});
