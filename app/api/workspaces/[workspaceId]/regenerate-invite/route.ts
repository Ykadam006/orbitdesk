import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { generateInviteCode } from "@/lib/utils";
import { requireSession, unauthorized, withErrorHandling } from "@/lib/api-helpers";

export const POST = withErrorHandling(async (req, { params }: { params: Promise<{ workspaceId: string }> }) => {
  const session = await requireSession();
  if (!session) return unauthorized();

  const { workspaceId } = await params;

  try {
    await requireRole(session.user.id, workspaceId, ["OWNER"]);
  } catch {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const inviteCode = generateInviteCode();
  const workspace = await prisma.workspace.update({
    where: { id: workspaceId },
    data: { inviteCode },
    select: { id: true, inviteCode: true },
  });

  return NextResponse.json(workspace);
});
