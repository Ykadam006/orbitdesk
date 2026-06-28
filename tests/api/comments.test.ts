import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { GET, POST } from "@/app/api/cards/[cardId]/comments/route";
import { NextRequest } from "next/server";

const mockAuth = auth as unknown as jest.Mock;

function mockSession(userId: string) {
  mockAuth.mockResolvedValue({ user: { id: userId, name: "Test", email: "test@test.com" }, expires: "" } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
}

beforeEach(() => jest.clearAllMocks());

describe("GET /api/cards/:cardId/comments", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as unknown as Awaited<ReturnType<typeof auth>>);
    const req = new NextRequest("http://localhost");
    const res = await GET(req, { params: Promise.resolve({ cardId: "card1" }) });
    expect(res.status).toBe(401);
  });

  it("returns comments for card when member", async () => {
    mockSession("user1");
    (prisma.card.findUnique as jest.Mock).mockResolvedValue({
      id: "card1",
      board: { workspaceId: "ws1" },
    });
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue({ role: "MEMBER" });
    const comments = [
      { id: "c1", content: "Hello", cardId: "card1", user: { id: "user1", name: "Test", image: null } },
    ];
    (prisma.comment.findMany as jest.Mock).mockResolvedValue(comments);
    (prisma.comment.count as jest.Mock).mockResolvedValue(1);

    const req = new NextRequest("http://localhost");
    const res = await GET(req, { params: Promise.resolve({ cardId: "card1" }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data).toHaveLength(1);
  });
});

describe("POST /api/cards/:cardId/comments", () => {
  it("returns 400 for empty content", async () => {
    mockSession("user1");
    const req = new NextRequest("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "" }),
    });
    const res = await POST(req, { params: Promise.resolve({ cardId: "card1" }) });
    expect(res.status).toBe(400);
  });

  it("creates comment when authorized", async () => {
    mockSession("user1");
    (prisma.card.findUnique as jest.Mock).mockResolvedValue({
      id: "card1",
      board: { workspaceId: "ws1" },
    });
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue({ role: "MEMBER" });
    (prisma.comment.create as jest.Mock).mockResolvedValue({
      id: "c1",
      content: "Nice work",
      user: { id: "user1", name: "Test", image: null },
    });

    const req = new NextRequest("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "Nice work" }),
    });
    const res = await POST(req, { params: Promise.resolve({ cardId: "card1" }) });
    expect(res.status).toBe(201);
    expect(prisma.comment.create).toHaveBeenCalled();
  });
});
