import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { workspaceSchema } from "@/lib/validations";
import { generateInviteCode } from "@/lib/utils";
import {
  paginatedResponse,
  parseJsonBody,
  parsePagination,
  requireSession,
  unauthorized,
  withErrorHandling,
} from "@/lib/api-helpers";

export const GET = withErrorHandling(async (req) => {
  const session = await requireSession();
  if (!session) return unauthorized();

  const { page, limit, skip } = parsePagination(req);

  const where = { members: { some: { userId: session.user.id } } };

  const [workspaces, total] = await Promise.all([
    prisma.workspace.findMany({
      where,
      include: {
        members: { include: { user: { select: { id: true, name: true, image: true } } } },
        _count: { select: { boards: true, members: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.workspace.count({ where }),
  ]);

  return paginatedResponse(workspaces, total, page, limit);
});

export const POST = withErrorHandling(async (req) => {
  const session = await requireSession();
  if (!session) return unauthorized();

  const { error, data } = await parseJsonBody(req);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const parsed = workspaceSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const workspace = await prisma.workspace.create({
    data: {
      name: parsed.data.name,
      inviteCode: generateInviteCode(),
      members: {
        create: { userId: session.user.id, role: "OWNER" },
      },
    },
    include: {
      members: { include: { user: { select: { id: true, name: true, image: true } } } },
      _count: { select: { boards: true, members: true } },
    },
  });

  return NextResponse.json(workspace, { status: 201 });
});
