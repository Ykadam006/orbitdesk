import { prisma } from "@/lib/prisma";
import { GET } from "@/app/api/auth/verify-email/route";

beforeEach(() => jest.clearAllMocks());

describe("GET /api/auth/verify-email", () => {
  it("returns 400 when token is missing", async () => {
    const res = await GET(new Request("http://localhost/api/auth/verify-email"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Token is required");
  });

  it("returns 400 for invalid token", async () => {
    (prisma.emailVerification.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await GET(
      new Request("http://localhost/api/auth/verify-email?token=invalid")
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid or expired verification token");
  });

  it("returns 400 for expired token", async () => {
    (prisma.emailVerification.findUnique as jest.Mock).mockResolvedValue({
      id: "ev1",
      token: "expired",
      userId: "user1",
      expiresAt: new Date(Date.now() - 1000),
      user: { id: "user1" },
    });

    const res = await GET(
      new Request("http://localhost/api/auth/verify-email?token=expired")
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid or expired verification token");
  });

  it("verifies email and redirects to login", async () => {
    (prisma.emailVerification.findUnique as jest.Mock).mockResolvedValue({
      id: "ev1",
      token: "valid",
      userId: "user1",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      user: { id: "user1" },
    });
    (prisma.emailVerification.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
    (prisma.user.update as jest.Mock).mockResolvedValue({});

    const res = await GET(
      new Request("http://localhost/api/auth/verify-email?token=valid")
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login?verified=1");
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user1" },
      data: { emailVerified: expect.any(Date) },
    });
  });
});
