import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, parseJsonBody, unauthorized, withErrorHandling } from "@/lib/api-helpers";

export const POST = withErrorHandling(async (req) => {
  const session = await requireSession();
  if (!session) return unauthorized();

  const { error, data } = await parseJsonBody(req);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const { inviteCode } = data as { inviteCode?: string };
  if (!inviteCode) {
    return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { inviteCode },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  }

  const existing = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId: session.user.id, workspaceId: workspace.id } },
  });

  if (existing) {
    return NextResponse.json({ error: "Already a member", workspaceId: workspace.id }, { status: 409 });
  }

  await prisma.membership.create({
    data: { userId: session.user.id, workspaceId: workspace.id, role: "MEMBER" },
  });

  await prisma.activityLog.create({
    data: {
      action: "joined the workspace",
      userId: session.user.id,
      workspaceId: workspace.id,
    },
  });

  return NextResponse.json({ workspaceId: workspace.id }, { status: 201 });
});
