import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { requireSession, unauthorized, withErrorHandling } from "@/lib/api-helpers";

export const DELETE = withErrorHandling(async (
  req,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) => {
  const session = await requireSession();
  if (!session) return unauthorized();

  const { workspaceId, memberId } = await params;

  const target = await prisma.membership.findUnique({ where: { id: memberId } });
  if (!target || target.workspaceId !== workspaceId) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (target.role === "OWNER") {
    return NextResponse.json({ error: "Cannot remove the owner" }, { status: 403 });
  }

  if (target.userId === session.user.id) {
    await prisma.membership.delete({ where: { id: memberId } });
    return NextResponse.json({ success: true });
  }

  try {
    await requireRole(session.user.id, workspaceId, ["OWNER", "ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  await prisma.membership.delete({ where: { id: memberId } });
  return NextResponse.json({ success: true });
});
