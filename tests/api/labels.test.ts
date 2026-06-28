import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { GET, POST } from "@/app/api/labels/route";
import { NextRequest } from "next/server";

const mockAuth = auth as jest.MockedFunction<typeof auth>;

function mockSession(userId: string) {
  mockAuth.mockResolvedValue({ user: { id: userId, name: "Test", email: "test@test.com" }, expires: "" } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
}

beforeEach(() => jest.clearAllMocks());

describe("GET /api/labels", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as unknown as Awaited<ReturnType<typeof auth>>);
    const res = await GET(new NextRequest("http://localhost/api/labels?workspaceId=ws1"));
    expect(res.status).toBe(401);
  });

  it("returns 400 without workspaceId", async () => {
    mockSession("user1");
    const res = await GET(new NextRequest("http://localhost/api/labels"));
    expect(res.status).toBe(400);
  });

  it("returns workspace labels", async () => {
    mockSession("user1");
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue({ userId: "user1", workspaceId: "ws1" });
    const labels = [
      { id: "l1", name: "Bug", color: "#ef4444", workspaceId: "ws1" },
      { id: "l2", name: "Feature", color: "#3b82f6", workspaceId: "ws1" },
    ];
    (prisma.label.findMany as jest.Mock).mockResolvedValue(labels);
    (prisma.label.count as jest.Mock).mockResolvedValue(2);

    const res = await GET(new NextRequest("http://localhost/api/labels?workspaceId=ws1"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data).toHaveLength(2);
  });
});

describe("POST /api/labels", () => {
  it("returns 400 for missing fields", async () => {
    mockSession("user1");
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue({ userId: "user1", workspaceId: "ws1" });
    const req = new NextRequest("http://localhost/api/labels?workspaceId=ws1", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
      body: JSON.stringify({ name: "" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("creates label", async () => {
    mockSession("user1");
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue({ userId: "user1", workspaceId: "ws1" });
    (prisma.label.create as jest.Mock).mockResolvedValue({
      id: "l1",
      name: "Bug",
      color: "#ef4444",
      workspaceId: "ws1",
    });

    const req = new NextRequest("http://localhost/api/labels?workspaceId=ws1", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
      body: JSON.stringify({ name: "Bug", color: "#ef4444" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(prisma.label.create).toHaveBeenCalled();
  });
});
