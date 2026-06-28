import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { parseJsonBody, withErrorHandling } from "@/lib/api-helpers";
import { sendPasswordResetEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

export const POST = withErrorHandling(async (req) => {
  const { error, data } = await parseJsonBody(req);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const { email } = data as { email?: string };

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return NextResponse.json({ message: "If an account exists, a reset link has been generated." });
  }

  await prisma.passwordReset.deleteMany({ where: { userId: user.id } });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordReset.create({
    data: { token, userId: user.id, expiresAt },
  });

  const resetUrl = `${process.env.AUTH_URL || "http://localhost:3000"}/reset-password?token=${token}`;
  await sendPasswordResetEmail(user.email, resetUrl);
  logger.info("Password reset requested", { email: user.email });

  return NextResponse.json({
    message: "If an account exists, a reset link has been generated.",
    ...(process.env.NODE_ENV !== "production" && { resetToken: token }),
  });
});
