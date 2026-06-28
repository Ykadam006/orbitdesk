import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { PrismaClient } from "../app/generated/prisma/client";
import { verifySocketToken } from "../lib/socket-token";
import { validateEnv } from "../lib/env";
import { logger } from "../lib/logger";

// Unlike the Next.js app, this standalone process does not auto-load .env.
// Load it in development; in production the platform injects real env vars
// and no .env file exists, so this is a no-op.
try {
  (process as { loadEnvFile?: (path?: string) => void }).loadEnvFile?.();
} catch {
  // No .env file present — rely on the environment-provided variables.
}

validateEnv();

const prisma = new PrismaClient();
const httpServer = createServer((_req, res) => {
  if (_req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

interface OnlineUser {
  userId: string;
  userName: string;
  socketId: string;
}

interface SocketData {
  userId: string;
  userName: string;
  joinedBoards: Set<string>;
}

const boardUsers = new Map<string, OnlineUser[]>();

async function verifyBoardAccess(userId: string, boardId: string): Promise<boolean> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { workspaceId: true },
  });
  if (!board) return false;

  const membership = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId: board.workspaceId } },
  });
  return !!membership;
}

function getSocketData(socket: Socket): SocketData {
  return socket.data as SocketData;
}

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) {
    return next(new Error("Authentication required"));
  }

  try {
    const { userId, userName } = await verifySocketToken(token);
    socket.data = { userId, userName, joinedBoards: new Set<string>() };
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  const { userId, userName } = getSocketData(socket);
  logger.info("Socket connected", { socketId: socket.id, userId });

  socket.on("board:join", async ({ boardId }: { boardId: string }) => {
    if (!boardId) return;

    const hasAccess = await verifyBoardAccess(userId, boardId);
    if (!hasAccess) {
      socket.emit("error", { message: "Access denied" });
      return;
    }

    socket.join(`board:${boardId}`);
    getSocketData(socket).joinedBoards.add(boardId);

    const users = boardUsers.get(boardId) || [];
    if (!users.find((u) => u.userId === userId)) {
      users.push({ userId, userName, socketId: socket.id });
      boardUsers.set(boardId, users);
    }

    io.to(`board:${boardId}`).emit("presence:updated", {
      users: boardUsers.get(boardId) || [],
    });
  });

  socket.on("board:leave", ({ boardId, userId: leaveUserId }: { boardId: string; userId: string }) => {
    if (leaveUserId !== userId) return;
    if (!getSocketData(socket).joinedBoards.has(boardId)) return;

    socket.leave(`board:${boardId}`);
    getSocketData(socket).joinedBoards.delete(boardId);

    const users = boardUsers.get(boardId) || [];
    boardUsers.set(
      boardId,
      users.filter((u) => u.userId !== userId)
    );

    io.to(`board:${boardId}`).emit("presence:updated", {
      users: boardUsers.get(boardId) || [],
    });
  });

  async function requireBoardMembership(boardId: string): Promise<boolean> {
    if (!getSocketData(socket).joinedBoards.has(boardId)) return false;
    return verifyBoardAccess(userId, boardId);
  }

  socket.on("card:created", async ({ boardId, card }) => {
    if (!(await requireBoardMembership(boardId))) return;
    socket.to(`board:${boardId}`).emit("card:created", { card });
  });

  socket.on("card:updated", async ({ boardId, card }) => {
    if (!(await requireBoardMembership(boardId))) return;
    socket.to(`board:${boardId}`).emit("card:updated", { card });
  });

  socket.on("card:moved", async ({ boardId, card }) => {
    if (!(await requireBoardMembership(boardId))) return;
    socket.to(`board:${boardId}`).emit("card:moved", { card });
  });

  socket.on("card:deleted", async ({ boardId, cardId }) => {
    if (!(await requireBoardMembership(boardId))) return;
    socket.to(`board:${boardId}`).emit("card:deleted", { cardId });
  });

  socket.on("activity:created", async ({ boardId, activity }) => {
    if (!(await requireBoardMembership(boardId))) return;
    socket.to(`board:${boardId}`).emit("activity:created", { activity });
  });

  socket.on("disconnect", () => {
    for (const [boardId, users] of boardUsers.entries()) {
      const filtered = users.filter((u) => u.socketId !== socket.id);
      if (filtered.length !== users.length) {
        boardUsers.set(boardId, filtered);
        io.to(`board:${boardId}`).emit("presence:updated", { users: filtered });
      }
    }
    logger.info("Socket disconnected", { socketId: socket.id, userId });
  });
});

const PORT = process.env.SOCKET_PORT || 3001;
httpServer.listen(PORT, () => {
  logger.info("Socket.IO server running", { port: PORT });
});
