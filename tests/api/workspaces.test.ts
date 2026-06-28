import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { GET, POST } from "@/app/api/workspaces/route";

const mockAuth = auth as unknown as jest.Mock;

function mockSession(userId: string) {
  mockAuth.mockResolvedValue({ user: { id: userId, name: "Test", email: "test@test.com" }, expires: "" } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
}

beforeEach(() => jest.clearAllMocks());

describe("GET /api/workspaces", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as unknown as Awaited<ReturnType<typeof auth>>);
    const res = await GET(new Request("http://localhost/api/workspaces"));
    expect(res.status).toBe(401);
  });

  it("returns user workspaces", async () => {
    mockSession("user1");
    const workspaces = [
      { id: "ws1", name: "Test WS", _count: { boards: 2, members: 3 }, members: [] },
    ];
    (prisma.workspace.findMany as jest.Mock).mockResolvedValue(workspaces);
    (prisma.workspace.count as jest.Mock).mockResolvedValue(1);

    const res = await GET(new Request("http://localhost/api/workspaces"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe("Test WS");
    expect(body.pagination.total).toBe(1);
  });
});

describe("POST /api/workspaces", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as unknown as Awaited<ReturnType<typeof auth>>);
    const req = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New WS" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid name", async () => {
    mockSession("user1");
    const req = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("creates workspace with owner membership", async () => {
    mockSession("user1");
    const ws = { id: "ws1", name: "New WS", inviteCode: "abc123", members: [], _count: { boards: 0, members: 1 } };
    (prisma.workspace.create as jest.Mock).mockResolvedValue(ws);

    const req = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New WS" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(prisma.workspace.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "New WS",
          members: expect.objectContaining({
            create: expect.objectContaining({ role: "OWNER" }),
          }),
        }),
      })
    );
  });
});
