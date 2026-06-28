import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { GET } from "@/app/api/workspaces/[workspaceId]/analytics/route";

const mockAuth = auth as unknown as jest.Mock;

function mockSession(userId: string) {
  mockAuth.mockResolvedValue({
    user: { id: userId, name: "Test", email: "test@test.com" },
    expires: "",
  } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
}

const memberMembership = { id: "mem1", userId: "user1", workspaceId: "ws1", role: "MEMBER" };

beforeEach(() => jest.clearAllMocks());

describe("GET /api/workspaces/:workspaceId/analytics", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as unknown as Awaited<ReturnType<typeof auth>>);
    const res = await GET(new Request("http://localhost/api/workspaces/ws1/analytics"), {
      params: Promise.resolve({ workspaceId: "ws1" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 403 when not a member", async () => {
    mockSession("user1");
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await GET(new Request("http://localhost/api/workspaces/ws1/analytics"), {
      params: Promise.resolve({ workspaceId: "ws1" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns workspace analytics", async () => {
    mockSession("user1");
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue(memberMembership);
    (prisma.card.count as jest.Mock)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(3);
    (prisma.card.groupBy as jest.Mock)
      .mockResolvedValueOnce([
        { status: "TODO", _count: { _all: 4 } },
        { status: "DONE", _count: { _all: 2 } },
      ])
      .mockResolvedValueOnce([
        { priority: "HIGH", _count: { _all: 3 } },
      ])
      .mockResolvedValueOnce([
        { assignedToId: "user2", _count: { _all: 5 } },
      ]);
    (prisma.user.findMany as jest.Mock).mockResolvedValue([
      { id: "user2", name: "Alice" },
    ]);

    const res = await GET(new Request("http://localhost/api/workspaces/ws1/analytics"), {
      params: Promise.resolve({ workspaceId: "ws1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.totalCards).toBe(10);
    expect(body.completedThisWeek).toBe(3);
    expect(body.byStatus).toEqual(
      expect.arrayContaining([
        { name: "Todo", value: 4 },
        { name: "Done", value: 2 },
      ])
    );
    expect(body.byPriority).toEqual(
      expect.arrayContaining([
        { name: "High", value: 3 },
      ])
    );
    expect(body.byMember).toEqual([{ name: "Alice", count: 5 }]);
  });
});
