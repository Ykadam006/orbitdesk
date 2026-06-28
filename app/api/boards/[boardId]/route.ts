import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMembership, requireRole } from "@/lib/permissions";
import { boardSchema } from "@/lib/validations";
import {
  parseJsonBody,
  parsePagination,
  requireSession,
  unauthorized,
  withErrorHandling,
} from "@/lib/api-helpers";

export const GET = withErrorHandling(async (req, { params }: { params: Promise<{ boardId: string }> }) => {
  const session = await requireSession();
  if (!session) return unauthorized();

  const { boardId } = await params;

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      workspace: { select: { id: true, name: true } },
    },
  });

  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  await requireMembership(session.user.id, board.workspaceId);

  const { page, limit, skip } = parsePagination(req);
  const cardWhere = { boardId };

  const [cards, total] = await Promise.all([
    prisma.card.findMany({
      where: cardWhere,
      include: {
        assignedTo: { select: { id: true, name: true, image: true } },
        labels: true,
      },
      orderBy: { position: "asc" },
      skip,
      take: limit,
    }),
    prisma.card.count({ where: cardWhere }),
  ]);

  return NextResponse.json({
    ...board,
    cards: {
      data: cards,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

export const PATCH = withErrorHandling(async (req, { params }: { params: Promise<{ boardId: string }> }) => {
  const session = await requireSession();
  if (!session) return unauthorized();

  const { boardId } = await params;

  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  try {
    await requireRole(session.user.id, board.workspaceId, ["OWNER", "ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const { error, data } = await parseJsonBody(req);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const parsed = boardSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const updated = await prisma.board.update({
    where: { id: boardId },
    data: { title: parsed.data.title },
  });

  return NextResponse.json(updated);
});

export const DELETE = withErrorHandling(async (req, { params }: { params: Promise<{ boardId: string }> }) => {
  const session = await requireSession();
  if (!session) return unauthorized();

  const { boardId } = await params;

  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  try {
    await requireRole(session.user.id, board.workspaceId, ["OWNER", "ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  await prisma.board.delete({ where: { id: boardId } });

  await prisma.activityLog.create({
    data: {
      action: `deleted board "${board.title}"`,
      userId: session.user.id,
      workspaceId: board.workspaceId,
    },
  });

  return NextResponse.json({ success: true });
});
