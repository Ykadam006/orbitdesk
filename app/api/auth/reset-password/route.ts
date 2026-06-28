import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { parseJsonBody, withErrorHandling } from "@/lib/api-helpers";
import { resetPasswordSchema } from "@/lib/validations";

export const POST = withErrorHandling(async (req) => {
  const { error, data } = await parseJsonBody(req);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const parsed = resetPasswordSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { token, password } = parsed.data;

  const resetRecord = await prisma.passwordReset.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetRecord || resetRecord.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.$transaction(async (tx) => {
    const deleted = await tx.passwordReset.deleteMany({
      where: { id: resetRecord.id, token, expiresAt: { gt: new Date() } },
    });
    if (deleted.count === 0) {
      throw new Error("Invalid or expired reset token");
    }
    await tx.user.update({
      where: { id: resetRecord.userId },
      data: { password: hashedPassword, passwordChangedAt: new Date() },
    });
  });

  return NextResponse.json({ message: "Password reset successfully" });
});
