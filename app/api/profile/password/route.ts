import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  parseJsonBody,
  requireSession,
  unauthorized,
  withErrorHandling,
} from "@/lib/api-helpers";
import { passwordChangeSchema } from "@/lib/validations";

export const PATCH = withErrorHandling(async (req) => {
  const session = await requireSession();
  if (!session) return unauthorized();

  const { error, data } = await parseJsonBody(req);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const parsed = passwordChangeSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.password) {
    return NextResponse.json({ error: "Account has no password set" }, { status: 400 });
  }

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashedPassword, passwordChangedAt: new Date() },
  });

  return NextResponse.json({ success: true });
});
