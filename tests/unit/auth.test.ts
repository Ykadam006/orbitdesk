type AuthConfig = {
  session: { strategy: string; maxAge?: number };
  jwt?: { maxAge?: number };
  pages: { signIn: string };
  providers: unknown[];
  callbacks: {
    jwt: (args: { token: Record<string, unknown>; user?: { id: string } }) => Promise<Record<string, unknown>>;
    session: (args: {
      session: { user: Record<string, unknown> };
      token: Record<string, unknown>;
    }) => Promise<{ user: Record<string, unknown> }>;
  };
};

let capturedConfig: AuthConfig | undefined;

jest.mock("next-auth", () => ({
  __esModule: true,
  default: jest.fn((config: AuthConfig) => {
    capturedConfig = config;
    return {
      handlers: {},
      signIn: jest.fn(),
      signOut: jest.fn(),
      auth: jest.fn(),
    };
  }),
}));

jest.mock("next-auth/providers/credentials", () => ({
  __esModule: true,
  default: jest.fn((config: unknown) => ({ id: "credentials", ...config as object })),
}));

jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: jest.fn() } },
}));

// Relative import bypasses jest moduleNameMapper auth mock
// eslint-disable-next-line import/first
import { prisma } from "@/lib/prisma";
// eslint-disable-next-line import/first
import "../../lib/auth";

const mockFindUnique = prisma.user.findUnique as jest.Mock;

describe("auth JWT configuration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindUnique.mockResolvedValue({
      emailVerified: new Date("2025-01-01"),
      passwordChangedAt: new Date("2025-01-01"),
    });
  });

  it("uses JWT session strategy with maxAge", () => {
    expect(capturedConfig?.session).toEqual({
      strategy: "jwt",
      maxAge: 30 * 24 * 60 * 60,
    });
    expect(capturedConfig?.jwt).toEqual({ maxAge: 30 * 24 * 60 * 60 });
  });

  it("redirects sign-in to /login", () => {
    expect(capturedConfig?.pages).toEqual({ signIn: "/login" });
  });

  it("registers credentials provider", () => {
    expect(capturedConfig?.providers).toHaveLength(1);
  });

  it("jwt callback stores user id and passwordChangedAt on token", async () => {
    const changedAt = new Date("2025-06-01");
    mockFindUnique.mockResolvedValue({
      emailVerified: new Date("2025-01-01"),
      passwordChangedAt: changedAt,
    });

    const token = { sub: "existing" };
    const result = await capturedConfig!.callbacks.jwt({
      token,
      user: { id: "user-123" },
    });
    expect(result.id).toBe("user-123");
    expect(result.sub).toBe("existing");
    expect(result.passwordChangedAt).toBe(changedAt.getTime());
  });

  it("jwt callback invalidates token when email is unverified", async () => {
    mockFindUnique.mockResolvedValue({ emailVerified: null, passwordChangedAt: null });

    const token = { id: "user-123", sub: "existing" };
    const result = await capturedConfig!.callbacks.jwt({ token });
    expect(result.id).toBeUndefined();
  });

  it("jwt callback invalidates token after password change", async () => {
    mockFindUnique.mockResolvedValue({
      emailVerified: new Date("2025-01-01"),
      passwordChangedAt: new Date("2025-06-02"),
    });

    const token = { id: "user-123", passwordChangedAt: new Date("2025-06-01").getTime() };
    const result = await capturedConfig!.callbacks.jwt({ token });
    expect(result.id).toBeUndefined();
  });

  it("jwt callback preserves valid token when no user", async () => {
    const token = { id: "user-123", passwordChangedAt: new Date("2025-06-01").getTime() };
    const result = await capturedConfig!.callbacks.jwt({ token });
    expect(result).toEqual(token);
  });

  it("session callback maps token id to session user", async () => {
    const session = { user: { name: "Test", email: "test@test.com" } };
    const result = await capturedConfig!.callbacks.session({
      session,
      token: { id: "user-123" },
    });
    expect(result.user.id).toBe("user-123");
    expect(result.user.name).toBe("Test");
  });

  it("session callback clears user id when token is invalid", async () => {
    const session = { user: { name: "Test", email: "test@test.com", id: "old" } };
    const result = await capturedConfig!.callbacks.session({
      session,
      token: {},
    });
    expect(result.user?.id).toBeUndefined();
  });
});
