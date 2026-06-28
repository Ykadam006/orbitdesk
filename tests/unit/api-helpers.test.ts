import {
  parseJsonBody,
  validateCsrf,
  isSafeHttpUrl,
  parsePagination,
  paginatedResponse,
} from "@/lib/api-helpers";

const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv, AUTH_URL: "http://localhost:3000", NODE_ENV: "test" };
});

afterAll(() => {
  process.env = originalEnv;
});

describe("parseJsonBody", () => {
  it("parses valid JSON", async () => {
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ name: "Test" }),
    });
    const result = await parseJsonBody(req);
    expect(result.data).toEqual({ name: "Test" });
    expect(result.error).toBeUndefined();
  });

  it("returns error for invalid JSON", async () => {
    const req = new Request("http://localhost", {
      method: "POST",
      body: "not-json",
    });
    const result = await parseJsonBody(req);
    expect(result.error).toBe("Invalid JSON body");
    expect(result.data).toBeUndefined();
  });
});

describe("validateCsrf", () => {
  it("allows GET requests without origin", () => {
    const req = new Request("http://localhost", { method: "GET" });
    expect(validateCsrf(req)).toBeNull();
  });

  it("allows POST with matching origin", () => {
    const req = new Request("http://localhost", {
      method: "POST",
      headers: { origin: "http://localhost:3000" },
    });
    expect(validateCsrf(req)).toBeNull();
  });

  it("blocks POST with mismatched origin", () => {
    const req = new Request("http://localhost", {
      method: "POST",
      headers: { origin: "http://evil.com" },
    });
    const res = validateCsrf(req);
    expect(res?.status).toBe(403);
  });

  it("allows POST with matching referer when origin absent", () => {
    const req = new Request("http://localhost", {
      method: "POST",
      headers: { referer: "http://localhost:3000/dashboard" },
    });
    expect(validateCsrf(req)).toBeNull();
  });

  it("blocks POST with mismatched referer", () => {
    const req = new Request("http://localhost", {
      method: "POST",
      headers: { referer: "http://evil.com/page" },
    });
    const res = validateCsrf(req);
    expect(res?.status).toBe(403);
  });

  it("allows POST without origin/referer in test environment", () => {
    process.env.NODE_ENV = "test";
    const req = new Request("http://localhost", { method: "POST" });
    expect(validateCsrf(req)).toBeNull();
  });

  it("blocks POST without origin/referer in production", () => {
    process.env.NODE_ENV = "production";
    const req = new Request("http://localhost", { method: "POST" });
    const res = validateCsrf(req);
    expect(res?.status).toBe(403);
  });
});

describe("isSafeHttpUrl", () => {
  it("accepts http URLs", () => {
    expect(isSafeHttpUrl("http://example.com/image.png")).toBe(true);
  });

  it("accepts https URLs", () => {
    expect(isSafeHttpUrl("https://example.com/image.png")).toBe(true);
  });

  it("rejects javascript URLs", () => {
    expect(isSafeHttpUrl("javascript:alert(1)")).toBe(false);
  });

  it("rejects data URLs", () => {
    expect(isSafeHttpUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
  });

  it("rejects invalid URLs", () => {
    expect(isSafeHttpUrl("not-a-url")).toBe(false);
  });
});

describe("parsePagination", () => {
  it("uses defaults when params absent", () => {
    const req = new Request("http://localhost/api/items");
    expect(parsePagination(req)).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it("parses page and limit from query string", () => {
    const req = new Request("http://localhost/api/items?page=3&limit=10");
    expect(parsePagination(req)).toEqual({ page: 3, limit: 10, skip: 20 });
  });

  it("clamps page to minimum of 1", () => {
    const req = new Request("http://localhost/api/items?page=-5");
    expect(parsePagination(req).page).toBe(1);
  });

  it("clamps limit to maximum of 100", () => {
    const req = new Request("http://localhost/api/items?limit=500");
    expect(parsePagination(req).limit).toBe(100);
  });

  it("falls back to defaults for non-numeric values", () => {
    const req = new Request("http://localhost/api/items?page=abc&limit=xyz");
    expect(parsePagination(req)).toEqual({ page: 1, limit: 20, skip: 0 });
  });
});

describe("paginatedResponse", () => {
  it("returns data with pagination metadata", async () => {
    const res = paginatedResponse(["a", "b"], 25, 2, 10);
    const body = await res.json();
    expect(body.data).toEqual(["a", "b"]);
    expect(body.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
    });
  });
});
