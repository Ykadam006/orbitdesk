import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { POST } from "@/app/api/workspaces/join/route";

const mockAuth = auth as jest.MockedFunction<typeof auth>;

function mockSession(userId: string) {
  mockAuth.mockResolvedValue({
    user: { id: userId, name: "Test", email: "test@test.com" },
    expires: "",
  } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
}

function postRequest(body: unknown) {
  return new Request("http://localhost/api/workspaces/join", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:3000",
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => jest.clearAllMocks());

describe("POST /api/workspaces/join", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as unknown as Awaited<ReturnType<typeof auth>>);
    const res = await POST(postRequest({ inviteCode: "abc123" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when invite code is missing", async () => {
    mockSession("user1");
    const res = await POST(postRequest({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invite code is required");
  });

  it("returns 404 for invalid invite code", async () => {
    mockSession("user1");
    (prisma.workspace.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await POST(postRequest({ inviteCode: "badcode" }));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Invalid invite code");
  });

  it("returns 409 when already a member", async () => {
    mockSession("user1");
    (prisma.workspace.findUnique as jest.Mock).mockResolvedValue({
      id: "ws1",
      inviteCode: "abc123",
    });
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue({
      id: "mem1",
      userId: "user1",
      workspaceId: "ws1",
      role: "MEMBER",
    });

    const res = await POST(postRequest({ inviteCode: "abc123" }));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("Already a member");
    expect(body.workspaceId).toBe("ws1");
  });

  it("joins workspace with valid invite code", async () => {
    mockSession("user1");
    (prisma.workspace.findUnique as jest.Mock).mockResolvedValue({
      id: "ws1",
      inviteCode: "abc123",
    });
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.membership.create as jest.Mock).mockResolvedValue({
      id: "mem1",
      userId: "user1",
      workspaceId: "ws1",
      role: "MEMBER",
    });
    (prisma.activityLog.create as jest.Mock).mockResolvedValue({});

    const res = await POST(postRequest({ inviteCode: "abc123" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.workspaceId).toBe("ws1");
    expect(prisma.membership.create).toHaveBeenCalledWith({
      data: { userId: "user1", workspaceId: "ws1", role: "MEMBER" },
    });
    expect(prisma.activityLog.create).toHaveBeenCalledWith({
      data: {
        action: "joined the workspace",
        userId: "user1",
        workspaceId: "ws1",
      },
    });
  });
});
