import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { GET } from "@/app/api/workspaces/[workspaceId]/members/route";
import { DELETE } from "@/app/api/workspaces/[workspaceId]/members/[memberId]/route";
import { PATCH as changeRole } from "@/app/api/workspaces/[workspaceId]/members/[memberId]/role/route";

const mockAuth = auth as jest.MockedFunction<typeof auth>;

function mockSession(userId: string) {
  mockAuth.mockResolvedValue({
    user: { id: userId, name: "Test", email: "test@test.com" },
    expires: "",
  } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
}

const ownerMembership = { id: "mem1", userId: "owner1", workspaceId: "ws1", role: "OWNER" };
const adminMembership = { id: "mem2", userId: "admin1", workspaceId: "ws1", role: "ADMIN" };
const memberMembership = { id: "mem3", userId: "user1", workspaceId: "ws1", role: "MEMBER" };
const otherMemberMembership = { id: "mem4", userId: "user2", workspaceId: "ws1", role: "MEMBER" };

function mockMembershipLookup(
  byUser: Record<string, typeof ownerMembership | null>,
  byId: Record<string, typeof ownerMembership | null>
) {
  (prisma.membership.findUnique as jest.Mock).mockImplementation(
    (args: { where: { id?: string; userId_workspaceId?: { userId: string; workspaceId: string } } }) => {
      if (args.where.userId_workspaceId) {
        const { userId, workspaceId } = args.where.userId_workspaceId;
        return Promise.resolve(byUser[`${userId}:${workspaceId}`] ?? null);
      }
      if (args.where.id) {
        return Promise.resolve(byId[args.where.id] ?? null);
      }
      return Promise.resolve(null);
    }
  );
}

beforeEach(() => jest.clearAllMocks());

describe("GET /api/workspaces/:workspaceId/members", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as unknown as Awaited<ReturnType<typeof auth>>);
    const res = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ workspaceId: "ws1" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 403 when not a member", async () => {
    mockSession("user1");
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ workspaceId: "ws1" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns paginated members", async () => {
    mockSession("user1");
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue(memberMembership);
    (prisma.membership.findMany as jest.Mock).mockResolvedValue([
      { ...ownerMembership, user: { id: "owner1", name: "Owner", email: "o@test.com", image: null } },
    ]);
    (prisma.membership.count as jest.Mock).mockResolvedValue(1);

    const res = await GET(new Request("http://localhost/api/workspaces/ws1/members?page=1&limit=10"), {
      params: Promise.resolve({ workspaceId: "ws1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.pagination.total).toBe(1);
  });
});

describe("DELETE /api/workspaces/:workspaceId/members/:memberId", () => {
  it("returns 404 when member belongs to different workspace (IDOR)", async () => {
    mockSession("owner1");
    mockMembershipLookup({}, { mem3: { ...memberMembership, workspaceId: "ws2" } });

    const req = new Request("http://localhost", { method: "DELETE" });
    const res = await DELETE(req, {
      params: Promise.resolve({ workspaceId: "ws1", memberId: "mem3" }),
    });
    expect(res.status).toBe(404);
    expect(prisma.membership.delete).not.toHaveBeenCalled();
  });

  it("returns 403 when trying to remove the owner", async () => {
    mockSession("admin1");
    mockMembershipLookup({ "admin1:ws1": adminMembership }, { mem1: ownerMembership });

    const req = new Request("http://localhost", { method: "DELETE" });
    const res = await DELETE(req, {
      params: Promise.resolve({ workspaceId: "ws1", memberId: "mem1" }),
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Cannot remove the owner");
  });

  it("allows member to leave workspace", async () => {
    mockSession("user1");
    mockMembershipLookup({}, { mem3: memberMembership });
    (prisma.membership.delete as jest.Mock).mockResolvedValue(memberMembership);

    const req = new Request("http://localhost", { method: "DELETE" });
    const res = await DELETE(req, {
      params: Promise.resolve({ workspaceId: "ws1", memberId: "mem3" }),
    });
    expect(res.status).toBe(200);
    expect(prisma.membership.delete).toHaveBeenCalledWith({ where: { id: "mem3" } });
  });

  it("allows admin to remove another member", async () => {
    mockSession("admin1");
    mockMembershipLookup({ "admin1:ws1": adminMembership }, { mem3: memberMembership });
    (prisma.membership.delete as jest.Mock).mockResolvedValue(memberMembership);

    const req = new Request("http://localhost", { method: "DELETE" });
    const res = await DELETE(req, {
      params: Promise.resolve({ workspaceId: "ws1", memberId: "mem3" }),
    });
    expect(res.status).toBe(200);
    expect(prisma.membership.delete).toHaveBeenCalledWith({ where: { id: "mem3" } });
  });

  it("returns 403 when regular member tries to remove another member", async () => {
    mockSession("user1");
    mockMembershipLookup({ "user1:ws1": memberMembership }, { mem4: otherMemberMembership });

    const req = new Request("http://localhost", { method: "DELETE" });
    const res = await DELETE(req, {
      params: Promise.resolve({ workspaceId: "ws1", memberId: "mem4" }),
    });
    expect(res.status).toBe(403);
    expect(prisma.membership.delete).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/workspaces/:workspaceId/members/:memberId/role", () => {
  it("returns 403 when non-owner tries to change roles", async () => {
    mockSession("admin1");
    mockMembershipLookup({ "admin1:ws1": adminMembership }, {});

    const req = new Request("http://localhost", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "ADMIN" }),
    });
    const res = await changeRole(req, {
      params: Promise.resolve({ workspaceId: "ws1", memberId: "mem3" }),
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Only the owner can change roles");
  });

  it("returns 404 when member belongs to different workspace (IDOR)", async () => {
    mockSession("owner1");
    mockMembershipLookup(
      { "owner1:ws1": ownerMembership },
      { mem3: { ...memberMembership, workspaceId: "ws2" } }
    );

    const req = new Request("http://localhost", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "ADMIN" }),
    });
    const res = await changeRole(req, {
      params: Promise.resolve({ workspaceId: "ws1", memberId: "mem3" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid role", async () => {
    mockSession("owner1");
    mockMembershipLookup({ "owner1:ws1": ownerMembership }, {});

    const req = new Request("http://localhost", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "OWNER" }),
    });
    const res = await changeRole(req, {
      params: Promise.resolve({ workspaceId: "ws1", memberId: "mem3" }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid role");
  });

  it("returns 403 when trying to change owner role", async () => {
    mockSession("owner1");
    mockMembershipLookup({ "owner1:ws1": ownerMembership }, { mem1: ownerMembership });

    const req = new Request("http://localhost", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "ADMIN" }),
    });
    const res = await changeRole(req, {
      params: Promise.resolve({ workspaceId: "ws1", memberId: "mem1" }),
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Cannot change the owner's role");
  });

  it("promotes member to admin", async () => {
    mockSession("owner1");
    mockMembershipLookup({ "owner1:ws1": ownerMembership }, { mem3: memberMembership });
    (prisma.membership.update as jest.Mock).mockResolvedValue({
      ...memberMembership,
      role: "ADMIN",
      user: { id: "user1", name: "Test", email: "test@test.com", image: null },
    });

    const req = new Request("http://localhost", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "ADMIN" }),
    });
    const res = await changeRole(req, {
      params: Promise.resolve({ workspaceId: "ws1", memberId: "mem3" }),
    });
    expect(res.status).toBe(200);
    expect(prisma.membership.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "mem3" },
        data: { role: "ADMIN" },
      })
    );
  });
});
