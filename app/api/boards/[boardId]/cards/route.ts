import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMembership } from "@/lib/permissions";
import { cardSchema } from "@/lib/validations";
import {
  paginatedResponse,
  parseJsonBody,
  parsePagination,
  requireSession,
  unauthorized,
  validateAssignee,
  withErrorHandling,
} from "@/lib/api-helpers";

export const GET = withErrorHandling(async (req, { params }: { params: Promise<{ boardId: string }> }) => {
  const session = await requireSession();
  if (!session) return unauthorized();

  const { boardId } = await params;

  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  await requireMembership(session.user.id, board.workspaceId);

  const { page, limit, skip } = parsePagination(req);
  const where = { boardId };

  const [cards, total] = await Promise.all([
    prisma.card.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, name: true, image: true } },
        labels: true,
      },
      orderBy: { position: "asc" },
      skip,
      take: limit,
    }),
    prisma.card.count({ where }),
  ]);

  return paginatedResponse(cards, total, page, limit);
});

export const POST = withErrorHandling(async (req, { params }: { params: Promise<{ boardId: string }> }) => {
  const session = await requireSession();
  if (!session) return unauthorized();

  const { boardId } = await params;

  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  await requireMembership(session.user.id, board.workspaceId);

  const { error, data } = await parseJsonBody(req);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const parsed = cardSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const status = parsed.data.status || "TODO";
  await validateAssignee(board.workspaceId, parsed.data.assignedToId);

  const card = await prisma.$transaction(async (tx) => {
    const maxPosition = await tx.card.aggregate({
      where: { boardId, status },
      _max: { position: true },
    });

    const created = await tx.card.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        status,
        priority: parsed.data.priority || "MEDIUM",
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        assignedToId: parsed.data.assignedToId || null,
        position: (maxPosition._max.position ?? -1) + 1,
        boardId,
      },
      include: {
        assignedTo: { select: { id: true, name: true, image: true } },
        labels: true,
      },
    });

    await tx.activityLog.create({
      data: {
        action: `created card "${created.title}"`,
        userId: session.user.id,
        workspaceId: board.workspaceId,
        cardId: created.id,
      },
    });

    return created;
  });

  return NextResponse.json(card, { status: 201 });
});
