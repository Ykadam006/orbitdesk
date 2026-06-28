import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { GET as listBoards, POST as createBoard } from "@/app/api/workspaces/[workspaceId]/boards/route";
import { GET, PATCH, DELETE } from "@/app/api/boards/[boardId]/route";

const mockAuth = auth as jest.MockedFunction<typeof auth>;

function mockSession(userId: string) {
  mockAuth.mockResolvedValue({
    user: { id: userId, name: "Test", email: "test@test.com" },
    expires: "",
  } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
}

const mockBoard = {
  id: "board1",
  title: "Sprint Board",
  workspaceId: "ws1",
};

beforeEach(() => jest.clearAllMocks());

describe("GET /api/workspaces/:workspaceId/boards", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as unknown as Awaited<ReturnType<typeof auth>>);
    const res = await listBoards(new Request("http://localhost"), {
      params: Promise.resolve({ workspaceId: "ws1" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 403 when not a member", async () => {
    mockSession("user1");
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await listBoards(new Request("http://localhost"), {
      params: Promise.resolve({ workspaceId: "ws1" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns workspace boards", async () => {
    mockSession("user1");
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue({ role: "MEMBER" });
    (prisma.board.findMany as jest.Mock).mockResolvedValue([
      { id: "board1", title: "Sprint Board", _count: { cards: 3 } },
    ]);
    (prisma.board.count as jest.Mock).mockResolvedValue(1);

    const res = await listBoards(new Request("http://localhost"), {
      params: Promise.resolve({ workspaceId: "ws1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe("Sprint Board");
    expect(body.pagination.total).toBe(1);
  });
});

describe("POST /api/workspaces/:workspaceId/boards", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as unknown as Awaited<ReturnType<typeof auth>>);
    const req = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Board" }),
    });
    const res = await createBoard(req, { params: Promise.resolve({ workspaceId: "ws1" }) });
    expect(res.status).toBe(401);
  });

  it("returns 403 when member lacks admin role", async () => {
    mockSession("user1");
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue({ role: "MEMBER" });

    const req = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Board" }),
    });
    const res = await createBoard(req, { params: Promise.resolve({ workspaceId: "ws1" }) });
    expect(res.status).toBe(403);
  });

  it("returns 400 for empty title", async () => {
    mockSession("user1");
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue({ role: "ADMIN" });

    const req = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "" }),
    });
    const res = await createBoard(req, { params: Promise.resolve({ workspaceId: "ws1" }) });
    expect(res.status).toBe(400);
  });

  it("creates board with activity log", async () => {
    mockSession("user1");
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue({ role: "OWNER" });
    (prisma.board.create as jest.Mock).mockResolvedValue(mockBoard);
    (prisma.activityLog.create as jest.Mock).mockResolvedValue({});

    const req = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Sprint Board" }),
    });
    const res = await createBoard(req, { params: Promise.resolve({ workspaceId: "ws1" }) });
    expect(res.status).toBe(201);
    expect(prisma.board.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { title: "Sprint Board", workspaceId: "ws1" },
      })
    );
    expect(prisma.activityLog.create).toHaveBeenCalled();
  });

  it("creates board with template cards", async () => {
    mockSession("user1");
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue({ role: "ADMIN" });
    (prisma.board.create as jest.Mock).mockResolvedValue(mockBoard);
    (prisma.card.createMany as jest.Mock).mockResolvedValue({ count: 2 });
    (prisma.activityLog.create as jest.Mock).mockResolvedValue({});

    const req = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Sprint Board",
        templateCards: [
          { title: "Task 1", status: "TODO", priority: "HIGH" },
          { title: "Task 2", status: "IN_PROGRESS", priority: "MEDIUM" },
        ],
      }),
    });
    const res = await createBoard(req, { params: Promise.resolve({ workspaceId: "ws1" }) });
    expect(res.status).toBe(201);
    expect(prisma.card.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ title: "Task 1", boardId: "board1" }),
        ]),
      })
    );
  });
});

describe("GET /api/boards/:boardId", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as unknown as Awaited<ReturnType<typeof auth>>);
    const res = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ boardId: "board1" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 404 when board not found", async () => {
    mockSession("user1");
    (prisma.board.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ boardId: "nonexistent" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 403 when not a workspace member", async () => {
    mockSession("user1");
    (prisma.board.findUnique as jest.Mock).mockResolvedValue({
      ...mockBoard,
      workspace: { id: "ws1", name: "Test WS" },
    });
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ boardId: "board1" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns board with cards", async () => {
    mockSession("user1");
    const board = {
      ...mockBoard,
      workspace: { id: "ws1", name: "Test WS" },
    };
    (prisma.board.findUnique as jest.Mock).mockResolvedValue(board);
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue({ role: "MEMBER" });
    (prisma.card.findMany as jest.Mock).mockResolvedValue([
      { id: "card1", title: "Task", position: 0, assignedTo: null, labels: [] },
    ]);
    (prisma.card.count as jest.Mock).mockResolvedValue(1);

    const res = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ boardId: "board1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.title).toBe("Sprint Board");
    expect(body.cards.data).toHaveLength(1);
    expect(body.cards.pagination.total).toBe(1);
  });
});

describe("PATCH /api/boards/:boardId", () => {
  it("returns 403 when member lacks admin role", async () => {
    mockSession("user1");
    (prisma.board.findUnique as jest.Mock).mockResolvedValue(mockBoard);
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue({ role: "MEMBER" });

    const req = new Request("http://localhost", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated Board" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ boardId: "board1" }) });
    expect(res.status).toBe(403);
  });

  it("returns 400 for invalid title", async () => {
    mockSession("user1");
    (prisma.board.findUnique as jest.Mock).mockResolvedValue(mockBoard);
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue({ role: "ADMIN" });

    const req = new Request("http://localhost", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ boardId: "board1" }) });
    expect(res.status).toBe(400);
  });

  it("updates board title", async () => {
    mockSession("user1");
    (prisma.board.findUnique as jest.Mock).mockResolvedValue(mockBoard);
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue({ role: "ADMIN" });
    (prisma.board.update as jest.Mock).mockResolvedValue({ ...mockBoard, title: "Updated Board" });

    const req = new Request("http://localhost", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated Board" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ boardId: "board1" }) });
    expect(res.status).toBe(200);
    expect(prisma.board.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "board1" },
        data: { title: "Updated Board" },
      })
    );
  });
});

describe("DELETE /api/boards/:boardId", () => {
  it("returns 404 when board not found", async () => {
    mockSession("user1");
    (prisma.board.findUnique as jest.Mock).mockResolvedValue(null);

    const req = new Request("http://localhost", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ boardId: "nonexistent" }) });
    expect(res.status).toBe(404);
  });

  it("returns 403 when member lacks admin role", async () => {
    mockSession("user1");
    (prisma.board.findUnique as jest.Mock).mockResolvedValue(mockBoard);
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue({ role: "MEMBER" });

    const req = new Request("http://localhost", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ boardId: "board1" }) });
    expect(res.status).toBe(403);
  });

  it("deletes board and logs activity", async () => {
    mockSession("user1");
    (prisma.board.findUnique as jest.Mock).mockResolvedValue(mockBoard);
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue({ role: "OWNER" });
    (prisma.board.delete as jest.Mock).mockResolvedValue(mockBoard);
    (prisma.activityLog.create as jest.Mock).mockResolvedValue({});

    const req = new Request("http://localhost", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ boardId: "board1" }) });
    expect(res.status).toBe(200);
    expect(prisma.board.delete).toHaveBeenCalledWith({ where: { id: "board1" } });
    expect(prisma.activityLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: expect.stringContaining("deleted board"),
          userId: "user1",
          workspaceId: "ws1",
        }),
      })
    );
  });
});
