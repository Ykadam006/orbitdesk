import { prisma } from "@/lib/prisma";

describe("POST /api/auth/register", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 400 for missing fields", async () => {
    const { POST } = await import("@/app/api/auth/register/route");
    const req = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 409 when email already exists", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "existing" });
    const { POST } = await import("@/app/api/auth/register/route");
    const req = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test", email: "test@test.com", password: "password123" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  it("creates user on valid input", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: "new-user",
      name: "Test",
      email: "new@test.com",
    });
    const { POST } = await import("@/app/api/auth/register/route");
    const req = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test", email: "new@test.com", password: "password123" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          emailVerified: null,
          emailVerifications: expect.objectContaining({
            create: expect.objectContaining({ token: expect.any(String) }),
          }),
        }),
      })
    );
  });
});

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns success even for non-existent email", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    const { POST } = await import("@/app/api/auth/forgot-password/route");
    const req = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "nonexistent@test.com" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("creates reset token for existing user", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "user1", email: "test@test.com" });
    (prisma.passwordReset.deleteMany as jest.Mock).mockResolvedValue({});
    (prisma.passwordReset.create as jest.Mock).mockResolvedValue({});
    const { POST } = await import("@/app/api/auth/forgot-password/route");
    const req = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@test.com" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(prisma.passwordReset.create).toHaveBeenCalled();
  });
});

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 400 for expired token", async () => {
    (prisma.passwordReset.findUnique as jest.Mock).mockResolvedValue({
      id: "reset1",
      token: "expired",
      userId: "user1",
      expiresAt: new Date(Date.now() - 1000),
      user: { id: "user1" },
    });
    const { POST } = await import("@/app/api/auth/reset-password/route");
    const req = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "expired", password: "newpass123" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("resets password with valid token", async () => {
    (prisma.passwordReset.findUnique as jest.Mock).mockResolvedValue({
      id: "reset1",
      token: "valid",
      userId: "user1",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      user: { id: "user1" },
    });
    (prisma.passwordReset.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
    (prisma.user.update as jest.Mock).mockResolvedValue({});
    const { POST } = await import("@/app/api/auth/reset-password/route");
    const req = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "valid", password: "newpass123" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          password: expect.any(String),
          passwordChangedAt: expect.any(Date),
        }),
      })
    );
    expect(prisma.passwordReset.deleteMany).toHaveBeenCalled();
  });
});
