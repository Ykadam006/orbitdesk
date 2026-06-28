import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { GET, PATCH, DELETE } from "@/app/api/profile/route";
import { PATCH as changePassword } from "@/app/api/profile/password/route";

const mockAuth = auth as jest.MockedFunction<typeof auth>;

function mockSession(userId: string) {
  mockAuth.mockResolvedValue({
    user: { id: userId, name: "Test", email: "test@test.com" },
    expires: "",
  } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
}

const mockUser = {
  id: "user1",
  name: "Test User",
  email: "test@test.com",
  image: null,
  createdAt: new Date("2025-01-01"),
};

beforeEach(() => jest.clearAllMocks());

describe("GET /api/profile", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as unknown as Awaited<ReturnType<typeof auth>>);
    const res = await GET(new Request("http://localhost/api/profile"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when user not found", async () => {
    mockSession("user1");
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await GET(new Request("http://localhost/api/profile"));
    expect(res.status).toBe(404);
  });

  it("returns user profile", async () => {
    mockSession("user1");
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const res = await GET(new Request("http://localhost/api/profile"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.email).toBe("test@test.com");
    expect(body.name).toBe("Test User");
  });
});

describe("PATCH /api/profile", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as unknown as Awaited<ReturnType<typeof auth>>);
    const req = new Request("http://localhost", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Name" }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 for name shorter than 2 characters", async () => {
    mockSession("user1");
    const req = new Request("http://localhost", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "A" }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for unsafe image URL", async () => {
    mockSession("user1");
    const req = new Request("http://localhost", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: "javascript:alert(1)" }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("valid http or https URL");
  });

  it("updates profile name and image", async () => {
    mockSession("user1");
    (prisma.user.update as jest.Mock).mockResolvedValue({
      ...mockUser,
      name: "Updated Name",
      image: "https://example.com/avatar.png",
    });

    const req = new Request("http://localhost", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Updated Name",
        image: "https://example.com/avatar.png",
      }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user1" },
        data: expect.objectContaining({
          name: "Updated Name",
          image: "https://example.com/avatar.png",
        }),
      })
    );
  });

  it("allows clearing image with null", async () => {
    mockSession("user1");
    (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, image: null });

    const req = new Request("http://localhost", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: null }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ image: null }),
      })
    );
  });
});

describe("DELETE /api/profile", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as unknown as Awaited<ReturnType<typeof auth>>);
    const req = new Request("http://localhost", { method: "DELETE" });
    const res = await DELETE(req);
    expect(res.status).toBe(401);
  });

  it("deletes the authenticated user", async () => {
    mockSession("user1");
    (prisma.user.delete as jest.Mock).mockResolvedValue(mockUser);

    const req = new Request("http://localhost", { method: "DELETE" });
    const res = await DELETE(req);
    expect(res.status).toBe(200);
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: "user1" } });
  });
});

describe("PATCH /api/profile/password", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as unknown as Awaited<ReturnType<typeof auth>>);
    const req = new Request("http://localhost", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: "old", newPassword: "newpass" }),
    });
    const res = await changePassword(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 for short new password", async () => {
    mockSession("user1");
    const req = new Request("http://localhost", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: "oldpass", newPassword: "123" }),
    });
    const res = await changePassword(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when account has no password", async () => {
    mockSession("user1");
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ ...mockUser, password: null });

    const req = new Request("http://localhost", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: "oldpass", newPassword: "Newpass1" }),
    });
    const res = await changePassword(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Account has no password set");
  });

  it("returns 400 when current password is incorrect", async () => {
    mockSession("user1");
    const hashed = await bcrypt.hash("correctpass", 12);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ ...mockUser, password: hashed });

    const req = new Request("http://localhost", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: "wrongpass", newPassword: "Newpass1" }),
    });
    const res = await changePassword(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Current password is incorrect");
  });

  it("changes password successfully", async () => {
    mockSession("user1");
    const hashed = await bcrypt.hash("oldpass", 12);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ ...mockUser, password: hashed });
    (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

    const req = new Request("http://localhost", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: "oldpass", newPassword: "Newpass1" }),
    });
    const res = await changePassword(req);
    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user1" },
        data: expect.objectContaining({
          password: expect.any(String),
          passwordChangedAt: expect.any(Date),
        }),
      })
    );
  });
});
