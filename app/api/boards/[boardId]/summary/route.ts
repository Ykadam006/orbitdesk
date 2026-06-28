import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMembership } from "@/lib/permissions";
import { generateBoardSummary } from "@/lib/ai";
import { requireSession, unauthorized, withErrorHandling } from "@/lib/api-helpers";

export const POST = withErrorHandling(async (req, { params }: { params: Promise<{ boardId: string }> }) => {
  const session = await requireSession();
  if (!session) return unauthorized();

  const { boardId } = await params;

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      cards: {
        include: { assignedTo: { select: { name: true } } },
      },
    },
  });

  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  await requireMembership(session.user.id, board.workspaceId);

  const cards = board.cards.map((c) => ({
    title: c.title,
    status: c.status,
    priority: c.priority,
    assignedTo: c.assignedTo?.name,
    dueDate: c.dueDate?.toISOString().split("T")[0],
  }));

  const summary = await generateBoardSummary(board.title, cards, session.user.id);
  return NextResponse.json({ summary });
});
