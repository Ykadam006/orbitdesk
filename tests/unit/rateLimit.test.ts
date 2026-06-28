import { rateLimit, authRateLimit, resetRateLimitStore } from "@/lib/rateLimit";

describe("rateLimit", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it("allows requests within the limit", () => {
    const result = rateLimit("test-ip", 5, 60_000);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("blocks requests over the limit", () => {
    for (let i = 0; i < 5; i++) {
      rateLimit("test-ip", 5, 60_000);
    }
    const result = rateLimit("test-ip", 5, 60_000);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("resets after the window expires", () => {
    jest.useFakeTimers();
    rateLimit("test-ip", 2, 1000);
    rateLimit("test-ip", 2, 1000);
    const blocked = rateLimit("test-ip", 2, 1000);
    expect(blocked.success).toBe(false);

    jest.advanceTimersByTime(1001);
    const allowed = rateLimit("test-ip", 2, 1000);
    expect(allowed.success).toBe(true);
    jest.useRealTimers();
  });

  it("tracks keys independently", () => {
    rateLimit("ip-a", 1, 60_000);
    const blockedA = rateLimit("ip-a", 1, 60_000);
    const allowedB = rateLimit("ip-b", 1, 60_000);
    expect(blockedA.success).toBe(false);
    expect(allowedB.success).toBe(true);
  });
});

describe("authRateLimit", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it("uses a stricter limit than general rate limiting", () => {
    for (let i = 0; i < 10; i++) {
      authRateLimit("attacker");
    }
    const result = authRateLimit("attacker");
    expect(result.success).toBe(false);
    expect(result.limit).toBe(10);
  });
});
