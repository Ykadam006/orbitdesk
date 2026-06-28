import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { captureException } from "@/lib/monitoring";

export async function parseJsonBody(req: Request): Promise<{ error?: string; data?: unknown }> {
  try {
    const data = await req.json();
    return { data };
  } catch {
    return { error: "Invalid JSON body" };
  }
}

export function validateCsrf(req: Request): NextResponse | null {
  if (!["POST", "PATCH", "DELETE"].includes(req.method)) return null;

  const authUrl = process.env.AUTH_URL || "http://localhost:3000";
  let allowedOrigin: string;
  try {
    allowedOrigin = new URL(authUrl).origin;
  } catch {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  if (origin) {
    return origin === allowedOrigin ? null : NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (referer) {
    try {
      return new URL(referer).origin === allowedOrigin
        ? null
        : NextResponse.json({ error: "Forbidden" }, { status: 403 });
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  if (process.env.NODE_ENV === "test") return null;

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

type RouteHandler<T = unknown> = (req: NextRequest, context: T) => Promise<NextResponse>;

export function withErrorHandling<T>(handler: RouteHandler<T>): RouteHandler<T> {
  return async (req, context) => {
    try {
      const csrfError = validateCsrf(req);
      if (csrfError) return csrfError;

      return await handler(req, context);
    } catch (error) {
      logger.error("API error", { error: String(error) });
      captureException(error, { path: req.url, method: req.method });
      const message = error instanceof Error ? error.message : "Internal server error";

      if (message === "Not a member of this workspace") {
        return NextResponse.json({ error: "Not a member" }, { status: 403 });
      }
      if (message === "Insufficient permissions") {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
      }
      if (message === "Assignee is not a workspace member") {
        return NextResponse.json({ error: message }, { status: 400 });
      }
      if (message === "One or more labels are invalid for this workspace") {
        return NextResponse.json({ error: message }, { status: 400 });
      }
      if (message === "Invalid or expired reset token") {
        return NextResponse.json({ error: message }, { status: 400 });
      }
      if (message === "Invalid or expired verification token") {
        return NextResponse.json({ error: message }, { status: 400 });
      }

      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
  };
}

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session;
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function parsePagination(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function paginatedResponse<T>(data: T[], total: number, page: number, limit: number) {
  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
}

export function isSafeHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function validateAssignee(workspaceId: string, assignedToId: string | null | undefined) {
  if (!assignedToId) return null;

  const membership = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId: assignedToId, workspaceId } },
  });

  if (!membership) throw new Error("Assignee is not a workspace member");
  return assignedToId;
}

export async function validateLabelIds(workspaceId: string, labelIds: string[]) {
  if (labelIds.length === 0) return;

  const labels = await prisma.label.findMany({
    where: { id: { in: labelIds }, workspaceId },
    select: { id: true },
  });

  if (labels.length !== labelIds.length) {
    throw new Error("One or more labels are invalid for this workspace");
  }
}
