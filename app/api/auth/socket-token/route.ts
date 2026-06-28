import { NextResponse } from "next/server";
import { requireSession, unauthorized, withErrorHandling } from "@/lib/api-helpers";
import { createSocketToken } from "@/lib/socket-token";

export const GET = withErrorHandling(async () => {
  const session = await requireSession();
  if (!session?.user?.id) return unauthorized();

  const token = await createSocketToken(
    session.user.id,
    session.user.name || session.user.email || "User"
  );

  return NextResponse.json({ token });
});
