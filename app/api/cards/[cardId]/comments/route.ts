import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { commentSchema } from "@/lib/validations";
import {
  paginatedResponse,
  parseJsonBody,
  parsePagination,
  requireSession,
  unauthorized,
  withErrorHandling,
} from "@/lib/api-helpers";

async function getCardWithMembership(cardId: string, userId: string) {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { board: { select: { workspaceId: true } } },
  });

  if (!card) return { error: NextResponse.json({ error: "Card not found" }, { status: 404 }) };

  const membership = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId: card.board.workspaceId } },
  });

  if (!membership) return { error: NextResponse.json({ error: "Not a member" }, { status: 403 }) };

  return { card, membership };
}

export const GET = withErrorHandling(async (
  req: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) => {
  const session = await requireSession();
  if (!session) return unauthorized();

  const { cardId } = await params;
  const result = await getCardWithMembership(cardId, session.user.id);
  if ("error" in result && result.error) return result.error;

  const { page, limit, skip } = parsePagination(req);
  const where = { cardId };

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      include: { user: { select: { id: true, name: true, image: true } } },
      orderBy: { createdAt: "asc" },
      skip,
      take: limit,
    }),
    prisma.comment.count({ where }),
  ]);

  return paginatedResponse(comments, total, page, limit);
});

export const POST = withErrorHandling(async (
  req: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) => {
  const session = await requireSession();
  if (!session) return unauthorized();

  const { cardId } = await params;
  const result = await getCardWithMembership(cardId, session.user.id);
  if ("error" in result && result.error) return result.error;

  const { error, data } = await parseJsonBody(req);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const parsed = commentSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: { content: parsed.data.content, cardId, userId: session.user.id },
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  return NextResponse.json(comment, { status: 201 });
});
