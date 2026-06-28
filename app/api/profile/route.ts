import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isSafeHttpUrl,
  parseJsonBody,
  requireSession,
  unauthorized,
  withErrorHandling,
} from "@/lib/api-helpers";
import { sanitizeText } from "@/lib/sanitize";

export const GET = withErrorHandling(async () => {
  const session = await requireSession();
  if (!session) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, createdAt: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
});

export const PATCH = withErrorHandling(async (req) => {
  const session = await requireSession();
  if (!session) return unauthorized();

  const { error, data } = await parseJsonBody(req);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const body = data as { name?: string; image?: string | null };
  const { name, image } = body;

  if (name !== undefined && (typeof name !== "string" || name.length < 2)) {
    return NextResponse.json({ error: "Name must be at least 2 characters" }, { status: 400 });
  }

  if (image !== undefined && image !== null && (typeof image !== "string" || !isSafeHttpUrl(image))) {
    return NextResponse.json({ error: "Image must be a valid http or https URL" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name !== undefined && { name: sanitizeText(name) }),
      ...(image !== undefined && { image }),
    },
    select: { id: true, name: true, email: true, image: true },
  });

  return NextResponse.json(updated);
});

export const DELETE = withErrorHandling(async () => {
  const session = await requireSession();
  if (!session) return unauthorized();

  await prisma.user.delete({ where: { id: session.user.id } });
  return NextResponse.json({ success: true });
});
