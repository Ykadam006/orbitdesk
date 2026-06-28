import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE },
  jwt: { maxAge: SESSION_MAX_AGE },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !user.password) return null;

        if (user.lockedUntil && user.lockedUntil > new Date()) {
          return null;
        }

        if (!user.emailVerified) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!passwordMatch) {
          const attempts = user.failedLoginAttempts + 1;
          const lockedUntil =
            attempts >= MAX_FAILED_ATTEMPTS
              ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
              : null;

          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: attempts,
              lockedUntil,
            },
          });
          return null;
        }

        if (user.failedLoginAttempts > 0 || user.lockedUntil) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null },
          });
        }

        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { passwordChangedAt: true, emailVerified: true },
        });
        if (!dbUser?.emailVerified) {
          return { ...token, id: undefined };
        }
        token.passwordChangedAt = dbUser.passwordChangedAt?.getTime() ?? 0;
        return token;
      }

      if (!token.id) return token;

      const dbUser = await prisma.user.findUnique({
        where: { id: token.id as string },
        select: { passwordChangedAt: true, emailVerified: true },
      });

      if (!dbUser?.emailVerified) {
        return { ...token, id: undefined };
      }

      const currentChangedAt = dbUser.passwordChangedAt?.getTime() ?? 0;
      const tokenChangedAt = (token.passwordChangedAt as number | undefined) ?? 0;
      if (currentChangedAt > tokenChangedAt) {
        return { ...token, id: undefined };
      }

      return token;
    },
    async session({ session, token }) {
      if (!token?.id) {
        if (session.user) {
          const { id: _removed, ...userWithoutId } = session.user as { id?: string; name?: string | null; email?: string | null; image?: string | null };
          void _removed;
          session.user = userWithoutId as typeof session.user;
        }
        return session;
      }
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
