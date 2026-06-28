import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { requireMembership, requireRole } from "@/lib/permissions";
import { boardSchema, templateCardSchema } from "@/lib/validations";
import {
  paginatedResponse,
  parseJsonBody,
  parsePagination,
  requireSession,
  unauthorized,
  withErrorHandling,
} from "@/lib/api-helpers";

const createBoardSchema = boardSchema.extend({
  templateCards: z.array(templateCardSchema).optional(),
});

export const GET = withErrorHandling(async (req, { params }: { params: Promise<{ workspaceId: string }> }) => {
  const session = await requireSession();
  if (!session) return unauthorized();

  const { workspaceId } = await params;
  await requireMembership(session.user.id, workspaceId);

  const { page, limit, skip } = parsePagination(req);
  const where = { workspaceId };

  const [boards, total] = await Promise.all([
    prisma.board.findMany({
      where,
      include: { _count: { select: { cards: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.board.count({ where }),
  ]);

  return paginatedResponse(boards, total, page, limit);
});

export const POST = withErrorHandling(async (req, { params }: { params: Promise<{ workspaceId: string }> }) => {
  const session = await requireSession();
  if (!session) return unauthorized();

  const { workspaceId } = await params;

  try {
    await requireRole(session.user.id, workspaceId, ["OWNER", "ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const { error, data } = await parseJsonBody(req);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const parsed = createBoardSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const board = await prisma.board.create({
    data: { title: parsed.data.title, workspaceId },
  });

  const templateCards = parsed.data.templateCards;
  if (templateCards && templateCards.length > 0) {
    await prisma.card.createMany({
      data: templateCards.map((card, index) => ({
        title: card.title,
        status: card.status,
        priority: card.priority,
        position: index,
        boardId: board.id,
      })),
    });
  }

  await prisma.activityLog.create({
    data: {
      action: `created board "${board.title}"`,
      userId: session.user.id,
      workspaceId,
    },
  });

  return NextResponse.json(board, { status: 201 });
});
