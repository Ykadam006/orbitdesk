import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMembership, requireRole } from "@/lib/permissions";
import { workspaceSchema } from "@/lib/validations";
import {
  parseJsonBody,
  requireSession,
  unauthorized,
  withErrorHandling,
} from "@/lib/api-helpers";

export const GET = withErrorHandling(async (req, { params }: { params: Promise<{ workspaceId: string }> }) => {
  const session = await requireSession();
  if (!session) return unauthorized();

  const { workspaceId } = await params;
  await requireMembership(session.user.id, workspaceId);

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
        orderBy: { createdAt: "asc" },
      },
      boards: { orderBy: { createdAt: "desc" } },
      activities: {
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      _count: { select: { boards: true, members: true } },
    },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  return NextResponse.json(workspace);
});

export const PATCH = withErrorHandling(async (req, { params }: { params: Promise<{ workspaceId: string }> }) => {
  const session = await requireSession();
  if (!session) return unauthorized();

  const { workspaceId } = await params;
  await requireRole(session.user.id, workspaceId, ["OWNER", "ADMIN"]);

  const { error, data } = await parseJsonBody(req);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const parsed = workspaceSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const workspace = await prisma.workspace.update({
    where: { id: workspaceId },
    data: { name: parsed.data.name },
  });

  return NextResponse.json(workspace);
});

export const DELETE = withErrorHandling(async (req, { params }: { params: Promise<{ workspaceId: string }> }) => {
  const session = await requireSession();
  if (!session) return unauthorized();

  const { workspaceId } = await params;

  try {
    await requireRole(session.user.id, workspaceId, ["OWNER"]);
  } catch {
    return NextResponse.json({ error: "Only the owner can delete a workspace" }, { status: 403 });
  }

  await prisma.workspace.delete({ where: { id: workspaceId } });
  return NextResponse.json({ success: true });
});
