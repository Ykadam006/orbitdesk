import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { POST } from "@/app/api/workspaces/[workspaceId]/regenerate-invite/route";

const mockAuth = auth as jest.MockedFunction<typeof auth>;

function mockSession(userId: string) {
  mockAuth.mockResolvedValue({
    user: { id: userId, name: "Test", email: "test@test.com" },
    expires: "",
  } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
}

const ownerMembership = { id: "mem1", userId: "owner1", workspaceId: "ws1", role: "OWNER" };
const memberMembership = { id: "mem2", userId: "user1", workspaceId: "ws1", role: "MEMBER" };

function postRequest() {
  return new Request("http://localhost/api/workspaces/ws1/regenerate-invite", {
    method: "POST",
    headers: { Origin: "http://localhost:3000" },
  });
}

beforeEach(() => jest.clearAllMocks());

describe("POST /api/workspaces/:workspaceId/regenerate-invite", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as unknown as Awaited<ReturnType<typeof auth>>);
    const res = await POST(postRequest(), {
      params: Promise.resolve({ workspaceId: "ws1" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 403 when not owner", async () => {
    mockSession("user1");
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue(memberMembership);

    const res = await POST(postRequest(), {
      params: Promise.resolve({ workspaceId: "ws1" }),
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Insufficient permissions");
  });

  it("regenerates invite code for owner", async () => {
    mockSession("owner1");
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue(ownerMembership);
    (prisma.workspace.update as jest.Mock).mockResolvedValue({
      id: "ws1",
      inviteCode: "newcode123",
    });

    const res = await POST(postRequest(), {
      params: Promise.resolve({ workspaceId: "ws1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("ws1");
    expect(body.inviteCode).toBe("newcode123");
    expect(prisma.workspace.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ws1" },
        data: { inviteCode: expect.any(String) },
      })
    );
  });
});
