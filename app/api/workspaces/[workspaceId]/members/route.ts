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

  const { page, limit, skip } = parsePagination(req);

  const where = { workspaceId };

  const [members, total] = await Promise.all([
    prisma.membership.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
      orderBy: { createdAt: "asc" },
      skip,
      take: limit,
    }),
    prisma.membership.count({ where }),
  ]);

  return paginatedResponse(members, total, page, limit);
});
