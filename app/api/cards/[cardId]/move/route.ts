import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMembership } from "@/lib/permissions";
import { getStatusLabel } from "@/lib/utils";
import { moveCardSchema } from "@/lib/validations";
import {
  parseJsonBody,
  requireSession,
  unauthorized,
  withErrorHandling,
} from "@/lib/api-helpers";

export const PATCH = withErrorHandling(async (req, { params }: { params: Promise<{ cardId: string }> }) => {
  const session = await requireSession();
  if (!session) return unauthorized();

  const { cardId } = await params;

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { board: { select: { workspaceId: true } } },
  });
  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const { error, data } = await parseJsonBody(req);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const parsed = moveCardSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  await requireMembership(session.user.id, card.board.workspaceId);

  const oldStatus = card.status;
  const targetStatus = parsed.data.status;

  const updated = await prisma.$transaction(async (tx) => {
    let newPosition = parsed.data.position;

    if (newPosition === undefined) {
      const maxPosition = await tx.card.aggregate({
        where: { boardId: card.boardId, status: targetStatus },
        _max: { position: true },
      });
      newPosition = (maxPosition._max.position ?? -1) + 1;
    }

    const result = await tx.card.update({
      where: { id: cardId },
      data: { status: targetStatus, position: newPosition },
      include: { assignedTo: { select: { id: true, name: true, image: true } } },
    });

    if (oldStatus !== targetStatus) {
      await tx.activityLog.create({
        data: {
          action: `moved "${card.title}" from ${getStatusLabel(oldStatus)} to ${getStatusLabel(targetStatus)}`,
          userId: session.user.id,
          workspaceId: card.board.workspaceId,
          cardId: card.id,
        },
      });
    }

    return result;
  });

  return NextResponse.json(updated);
});
