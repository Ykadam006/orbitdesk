import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandling } from "@/lib/api-helpers";

export const GET = withErrorHandling(async (req) => {
  const token = new URL(req.url).searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  const verification = await prisma.emailVerification.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!verification || verification.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invalid or expired verification token" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    const deleted = await tx.emailVerification.deleteMany({
      where: { id: verification.id, token, expiresAt: { gt: new Date() } },
    });
    if (deleted.count === 0) {
      throw new Error("Invalid or expired verification token");
    }
    await tx.user.update({
      where: { id: verification.userId },
      data: { emailVerified: new Date() },
    });
  });

  const baseUrl = process.env.AUTH_URL || "http://localhost:3000";
  return NextResponse.redirect(`${baseUrl}/login?verified=1`);
});
