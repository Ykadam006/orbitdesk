import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { parseJsonBody, requireSession, unauthorized, withErrorHandling } from "@/lib/api-helpers";

export const PATCH = withErrorHandling(async (
  req,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) => {
  const session = await requireSession();
  if (!session) return unauthorized();

  const { workspaceId, memberId } = await params;

  try {
    await requireRole(session.user.id, workspaceId, ["OWNER"]);
  } catch {
    return NextResponse.json({ error: "Only the owner can change roles" }, { status: 403 });
  }

  const { error, data } = await parseJsonBody(req);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const { role } = data as { role?: string };
  if (!["ADMIN", "MEMBER"].includes(role ?? "")) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const target = await prisma.membership.findUnique({ where: { id: memberId } });
  if (!target || target.workspaceId !== workspaceId) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (target.role === "OWNER") {
    return NextResponse.json({ error: "Cannot change the owner's role" }, { status: 403 });
  }

  const updated = await prisma.membership.update({
    where: { id: memberId },
    data: { role: role as "ADMIN" | "MEMBER" },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  });

  return NextResponse.json(updated);
});
