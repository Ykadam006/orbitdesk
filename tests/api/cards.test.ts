import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PATCH, DELETE } from "@/app/api/cards/[cardId]/route";

const mockAuth = auth as unknown as jest.Mock;

function mockSession(userId: string) {
  mockAuth.mockResolvedValue({ user: { id: userId, name: "Test", email: "test@test.com" }, expires: "" } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
}

const mockCard = {
  id: "card1",
  title: "Test Card",
  status: "TODO",
  priority: "MEDIUM",
  boardId: "board1",
  assignedToId: "user1",
  board: { workspaceId: "ws1" },
};

beforeEach(() => jest.clearAllMocks());

describe("PATCH /api/cards/:cardId", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as unknown as Awaited<ReturnType<typeof auth>>);
    const req = new Request("http://localhost", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ cardId: "card1" }) });
    expect(res.status).toBe(401);
  });

  it("returns 404 when card not found", async () => {
    mockSession("user1");
    (prisma.card.findUnique as jest.Mock).mockResolvedValue(null);

    const req = new Request("http://localhost", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ cardId: "nonexistent" }) });
    expect(res.status).toBe(404);
  });

  it("returns 403 when not a member", async () => {
    mockSession("user1");
    (prisma.card.findUnique as jest.Mock).mockResolvedValue(mockCard);
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue(null);

    const req = new Request("http://localhost", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ cardId: "card1" }) });
    expect(res.status).toBe(403);
  });

  it("updates card successfully", async () => {
    mockSession("user1");
    (prisma.card.findUnique as jest.Mock).mockResolvedValue(mockCard);
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue({ role: "MEMBER" });
    (prisma.card.update as jest.Mock).mockResolvedValue({ ...mockCard, title: "Updated" });
    (prisma.activityLog.create as jest.Mock).mockResolvedValue({});

    const req = new Request("http://localhost", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ cardId: "card1" }) });
    expect(res.status).toBe(200);
    expect(prisma.card.update).toHaveBeenCalled();
  });
});

describe("DELETE /api/cards/:cardId", () => {
  it("deletes card when member owns assignment", async () => {
    mockSession("user1");
    (prisma.card.findUnique as jest.Mock).mockResolvedValue(mockCard);
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue({ role: "MEMBER" });
    (prisma.card.delete as jest.Mock).mockResolvedValue(mockCard);
    (prisma.activityLog.create as jest.Mock).mockResolvedValue({});

    const req = new Request("http://localhost", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ cardId: "card1" }) });
    expect(res.status).toBe(200);
    expect(prisma.card.delete).toHaveBeenCalledWith({ where: { id: "card1" } });
  });

  it("returns 403 when member tries to delete unassigned card", async () => {
    mockSession("user1");
    (prisma.card.findUnique as jest.Mock).mockResolvedValue({ ...mockCard, assignedToId: "user2" });
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue({ role: "MEMBER" });

    const req = new Request("http://localhost", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ cardId: "card1" }) });
    expect(res.status).toBe(403);
  });
});
