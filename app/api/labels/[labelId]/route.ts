import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { labelSchema } from "@/lib/validations";
import { requireMembership } from "@/lib/permissions";
import { parseJsonBody, requireSession, unauthorized, withErrorHandling } from "@/lib/api-helpers";

export const PATCH = withErrorHandling(async (
  req,
  { params }: { params: Promise<{ labelId: string }> }
) => {
  const session = await requireSession();
  if (!session) return unauthorized();

  const { labelId } = await params;

  const label = await prisma.label.findUnique({ where: { id: labelId } });
  if (!label) {
    return NextResponse.json({ error: "Label not found" }, { status: 404 });
  }

  await requireMembership(session.user.id, label.workspaceId);

  const { error, data } = await parseJsonBody(req);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const parsed = labelSchema.partial().safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const updated = await prisma.label.update({
    where: { id: labelId },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.color !== undefined && { color: parsed.data.color.trim() }),
    },
  });

  return NextResponse.json(updated);
});

export const DELETE = withErrorHandling(async (
  _req,
  { params }: { params: Promise<{ labelId: string }> }
) => {
  const session = await requireSession();
  if (!session) return unauthorized();

  const { labelId } = await params;

  const label = await prisma.label.findUnique({ where: { id: labelId } });
  if (!label) {
    return NextResponse.json({ error: "Label not found" }, { status: 404 });
  }

  await requireMembership(session.user.id, label.workspaceId);

  await prisma.label.delete({ where: { id: labelId } });
  return NextResponse.json({ success: true });
});
