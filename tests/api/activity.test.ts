import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { GET } from "@/app/api/workspaces/[workspaceId]/activity/route";

const mockAuth = auth as unknown as jest.Mock;

function mockSession(userId: string) {
  mockAuth.mockResolvedValue({
    user: { id: userId, name: "Test", email: "test@test.com" },
    expires: "",
  } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
}

const memberMembership = { id: "mem1", userId: "user1", workspaceId: "ws1", role: "MEMBER" };

beforeEach(() => jest.clearAllMocks());

describe("GET /api/workspaces/:workspaceId/activity", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as unknown as Awaited<ReturnType<typeof auth>>);
    const res = await GET(new Request("http://localhost/api/workspaces/ws1/activity"), {
      params: Promise.resolve({ workspaceId: "ws1" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 403 when not a member", async () => {
    mockSession("user1");
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await GET(new Request("http://localhost/api/workspaces/ws1/activity"), {
      params: Promise.resolve({ workspaceId: "ws1" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns paginated activity log", async () => {
    mockSession("user1");
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue(memberMembership);
    const activities = [
      {
        id: "act1",
        action: "created a card",
        workspaceId: "ws1",
        userId: "user1",
        user: { id: "user1", name: "Test", image: null },
      },
    ];
    (prisma.activityLog.findMany as jest.Mock).mockResolvedValue(activities);
    (prisma.activityLog.count as jest.Mock).mockResolvedValue(1);

    const res = await GET(
      new Request("http://localhost/api/workspaces/ws1/activity?page=1&limit=10"),
      { params: Promise.resolve({ workspaceId: "ws1" }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].action).toBe("created a card");
    expect(body.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
    expect(prisma.activityLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { workspaceId: "ws1" },
        skip: 0,
        take: 10,
      })
    );
  });
});
