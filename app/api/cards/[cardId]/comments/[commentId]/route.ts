import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { commentSchema } from "@/lib/validations";
import { parseJsonBody, requireSession, unauthorized, withErrorHandling } from "@/lib/api-helpers";

export const PATCH = withErrorHandling(async (
  req,
  { params }: { params: Promise<{ cardId: string; commentId: string }> }
) => {
  const session = await requireSession();
  if (!session) return unauthorized();

  const { cardId, commentId } = await params;

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { card: { include: { board: { select: { workspaceId: true } } } } },
  });

  if (!comment || comment.cardId !== cardId) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  if (comment.userId !== session.user.id) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const { error, data } = await parseJsonBody(req);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const parsed = commentSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { content: parsed.data.content },
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  return NextResponse.json(updated);
});

export const DELETE = withErrorHandling(async (
  req,
  { params }: { params: Promise<{ cardId: string; commentId: string }> }
) => {
  const session = await requireSession();
  if (!session) return unauthorized();

  const { cardId, commentId } = await params;

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });

  if (!comment || comment.cardId !== cardId) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  if (comment.userId !== session.user.id) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  await prisma.comment.delete({ where: { id: commentId } });
  return NextResponse.json({ success: true });
});
