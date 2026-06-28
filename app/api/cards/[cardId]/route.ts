import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canDeleteCard, requireMembership } from "@/lib/permissions";
import { cardSchema, labelIdsSchema } from "@/lib/validations";
import {
  parseJsonBody,
  requireSession,
  unauthorized,
  validateAssignee,
  validateLabelIds,
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

  await requireMembership(session.user.id, card.board.workspaceId);

  const { error, data } = await parseJsonBody(req);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const body = data as Record<string, unknown>;
  const { labelIds, ...cardFields } = body;
  const parsed = cardSchema.partial().safeParse(cardFields);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  let parsedLabelIds: string[] | undefined;
  if (labelIds !== undefined) {
    const labelParsed = labelIdsSchema.safeParse(labelIds);
    if (!labelParsed.success) {
      return NextResponse.json({ error: labelParsed.error.issues[0].message }, { status: 400 });
    }
    parsedLabelIds = labelParsed.data;
    await validateLabelIds(card.board.workspaceId, parsedLabelIds);
  }

  if (parsed.data.assignedToId !== undefined) {
    await validateAssignee(card.board.workspaceId, parsed.data.assignedToId);
  }

  const labelConnect = parsedLabelIds !== undefined
    ? { labels: { set: parsedLabelIds.map((id) => ({ id })) } }
    : {};

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.card.update({
      where: { id: cardId },
      data: {
        ...(parsed.data.title !== undefined && { title: parsed.data.title }),
        ...(parsed.data.description !== undefined && { description: parsed.data.description }),
        ...(parsed.data.status !== undefined && { status: parsed.data.status }),
        ...(parsed.data.priority !== undefined && { priority: parsed.data.priority }),
        ...(parsed.data.dueDate !== undefined && { dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null }),
        ...(parsed.data.assignedToId !== undefined && { assignedToId: parsed.data.assignedToId || null }),
        ...labelConnect,
      },
      include: {
        assignedTo: { select: { id: true, name: true, image: true } },
        labels: true,
      },
    });

    await tx.activityLog.create({
      data: {
        action: `updated card "${result.title}"`,
        userId: session.user.id,
        workspaceId: card.board.workspaceId,
        cardId: result.id,
      },
    });

    return result;
  });

  return NextResponse.json(updated);
});

export const DELETE = withErrorHandling(async (req, { params }: { params: Promise<{ cardId: string }> }) => {
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

  const membership = await requireMembership(session.user.id, card.board.workspaceId);

  if (!canDeleteCard(membership.role, session.user.id, card)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.card.delete({ where: { id: cardId } });
    await tx.activityLog.create({
      data: {
        action: `deleted card "${card.title}"`,
        userId: session.user.id,
        workspaceId: card.board.workspaceId,
        cardId: card.id,
      },
    });
  });

  return NextResponse.json({ success: true });
});
