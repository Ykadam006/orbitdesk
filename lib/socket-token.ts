import { SignJWT, jwtVerify } from "jose";

const ALG = "HS256";

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required");
  return new TextEncoder().encode(secret);
}

export async function createSocketToken(userId: string, userName: string): Promise<string> {
  return new SignJWT({ userId, userName })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(getSecret());
}

export async function verifySocketToken(
  token: string
): Promise<{ userId: string; userName: string }> {
  const { payload } = await jwtVerify(token, getSecret());
  const userId = payload.userId as string | undefined;
  const userName = payload.userName as string | undefined;

  if (!userId) throw new Error("Invalid token payload");

  return { userId, userName: userName || "User" };
}
