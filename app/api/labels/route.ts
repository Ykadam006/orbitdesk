import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { labelSchema } from "@/lib/validations";
import { requireMembership } from "@/lib/permissions";
import {
  paginatedResponse,
  parseJsonBody,
  parsePagination,
  requireSession,
  unauthorized,
  withErrorHandling,
} from "@/lib/api-helpers";

async function resolveWorkspaceId(req: NextRequest): Promise<string | null> {
  return new URL(req.url).searchParams.get("workspaceId");
}

export const GET = withErrorHandling(async (req) => {
  const session = await requireSession();
  if (!session) return unauthorized();

  const workspaceId = await resolveWorkspaceId(req);
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId query parameter is required" }, { status: 400 });
  }

  await requireMembership(session.user.id, workspaceId);

  const { page, limit, skip } = parsePagination(req);

  const [labels, total] = await Promise.all([
    prisma.label.findMany({
      where: { workspaceId },
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.label.count({ where: { workspaceId } }),
  ]);

  return paginatedResponse(labels, total, page, limit);
});

export const POST = withErrorHandling(async (req) => {
  const session = await requireSession();
  if (!session) return unauthorized();

  const workspaceId = await resolveWorkspaceId(req);
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId query parameter is required" }, { status: 400 });
  }

  await requireMembership(session.user.id, workspaceId);

  const { error, data } = await parseJsonBody(req);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const parsed = labelSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const label = await prisma.label.create({
    data: {
      name: parsed.data.name,
      color: parsed.data.color.trim(),
      workspaceId,
    },
  });

  return NextResponse.json(label, { status: 201 });
});
