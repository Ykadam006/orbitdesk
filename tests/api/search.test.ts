import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { GET } from "@/app/api/workspaces/[workspaceId]/search/route";

const mockAuth = auth as jest.MockedFunction<typeof auth>;

function mockSession(userId: string) {
  mockAuth.mockResolvedValue({
    user: { id: userId, name: "Test", email: "test@test.com" },
    expires: "",
  } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
}

const memberMembership = { id: "mem1", userId: "user1", workspaceId: "ws1", role: "MEMBER" };

beforeEach(() => jest.clearAllMocks());

describe("GET /api/workspaces/:workspaceId/search", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as unknown as Awaited<ReturnType<typeof auth>>);
    const res = await GET(new Request("http://localhost/api/workspaces/ws1/search?q=test"), {
      params: Promise.resolve({ workspaceId: "ws1" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 403 when not a member", async () => {
    mockSession("user1");
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await GET(new Request("http://localhost/api/workspaces/ws1/search?q=test"), {
      params: Promise.resolve({ workspaceId: "ws1" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 400 when query is missing", async () => {
    mockSession("user1");
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue(memberMembership);

    const res = await GET(new Request("http://localhost/api/workspaces/ws1/search"), {
      params: Promise.resolve({ workspaceId: "ws1" }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Search query is required");
  });

  it("returns paginated search results", async () => {
    mockSession("user1");
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue(memberMembership);
    const cards = [
      {
        id: "card1",
        title: "Fix bug",
        description: "Search term here",
        board: { id: "board1", title: "Sprint" },
        assignedTo: null,
        labels: [],
      },
    ];
    (prisma.card.findMany as jest.Mock).mockResolvedValue(cards);
    (prisma.card.count as jest.Mock).mockResolvedValue(1);

    const res = await GET(
      new Request("http://localhost/api/workspaces/ws1/search?q=bug&page=1&limit=10"),
      { params: Promise.resolve({ workspaceId: "ws1" }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe("Fix bug");
    expect(body.pagination.total).toBe(1);
    expect(prisma.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          board: { workspaceId: "ws1" },
          OR: expect.arrayContaining([
            { title: { contains: "bug", mode: "insensitive" } },
            { description: { contains: "bug", mode: "insensitive" } },
          ]),
        }),
        skip: 0,
        take: 10,
      })
    );
  });
});
