import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMembership } from "@/lib/permissions";
import {
  paginatedResponse,
  parsePagination,
  requireSession,
  unauthorized,
  withErrorHandling,
} from "@/lib/api-helpers";

export const GET = withErrorHandling(async (req, { params }: { params: Promise<{ workspaceId: string }> }) => {
  const session = await requireSession();
  if (!session) return unauthorized();

  const { workspaceId } = await params;
  await requireMembership(session.user.id, workspaceId);

  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Search query is required" }, { status: 400 });
  }

  const { page, limit, skip } = parsePagination(req);
  const where = {
    board: { workspaceId },
    OR: [
      { title: { contains: q, mode: "insensitive" as const } },
      { description: { contains: q, mode: "insensitive" as const } },
    ],
  };

  const [cards, total] = await Promise.all([
    prisma.card.findMany({
      where,
      include: {
        board: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, name: true, image: true } },
        labels: true,
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.card.count({ where }),
  ]);

  return paginatedResponse(cards, total, page, limit);
});
