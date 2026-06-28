import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMembership } from "@/lib/permissions";
import { requireSession, unauthorized, withErrorHandling } from "@/lib/api-helpers";

const STATUS_LABELS: Record<string, string> = {
  TODO: "Todo",
  IN_PROGRESS: "In Progress",
  REVIEW: "Review",
  DONE: "Done",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const GET = withErrorHandling(async (req, { params }: { params: Promise<{ workspaceId: string }> }) => {
  const session = await requireSession();
  if (!session) return unauthorized();

  const { workspaceId } = await params;
  await requireMembership(session.user.id, workspaceId);

  const cardWhere = { board: { workspaceId } };

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [totalCards, completedThisWeek, statusGroups, priorityGroups, memberGroups] = await Promise.all([
    prisma.card.count({ where: cardWhere }),
    prisma.card.count({
      where: { ...cardWhere, status: "DONE", updatedAt: { gte: weekAgo } },
    }),
    prisma.card.groupBy({
      by: ["status"],
      where: cardWhere,
      _count: { _all: true },
    }),
    prisma.card.groupBy({
      by: ["priority"],
      where: cardWhere,
      _count: { _all: true },
    }),
    prisma.card.groupBy({
      by: ["assignedToId"],
      where: { ...cardWhere, assignedToId: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const byStatus = Object.entries(STATUS_LABELS).map(([status, name]) => ({
    name,
    value: statusGroups.find((g) => g.status === status)?._count._all ?? 0,
  }));

  const byPriority = Object.entries(PRIORITY_LABELS).map(([priority, name]) => ({
    name,
    value: priorityGroups.find((g) => g.priority === priority)?._count._all ?? 0,
  }));

  const assigneeIds = memberGroups
    .map((g) => g.assignedToId)
    .filter((id): id is string => id !== null);

  const users = assigneeIds.length
    ? await prisma.user.findMany({
        where: { id: { in: assigneeIds } },
        select: { id: true, name: true },
      })
    : [];

  const userMap = new Map(users.map((u) => [u.id, u.name || "Unknown"]));

  const byMember = memberGroups
    .map((g) => ({
      name: userMap.get(g.assignedToId!) || "Unknown",
      count: g._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({
    totalCards,
    completedThisWeek,
    byStatus,
    byPriority,
    byMember,
  });
});
