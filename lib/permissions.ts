import { prisma } from "@/lib/prisma";
import { Role } from "@/app/generated/prisma/client";

export async function getMembership(userId: string, workspaceId: string) {
  return prisma.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
}

export async function requireMembership(userId: string, workspaceId: string) {
  const membership = await getMembership(userId, workspaceId);
  if (!membership) throw new Error("Not a member of this workspace");
  return membership;
}

export async function requireRole(userId: string, workspaceId: string, roles: Role[]) {
  const membership = await requireMembership(userId, workspaceId);
  if (!roles.includes(membership.role)) throw new Error("Insufficient permissions");
  return membership;
}

export function canManageMembers(role: Role) {
  return role === "OWNER" || role === "ADMIN";
}

export function canDeleteWorkspace(role: Role) {
  return role === "OWNER";
}

export function canManageBoard(role: Role) {
  return role === "OWNER" || role === "ADMIN";
}

export function canManageCards(role: Role) {
  return role === "OWNER" || role === "ADMIN" || role === "MEMBER";
}

export function canDeleteCard(
  role: Role,
  userId: string,
  card: { assignedToId: string | null }
) {
  if (role === "OWNER" || role === "ADMIN") return true;
  return card.assignedToId === userId;
}

export function canChangeRoles(role: Role) {
  return role === "OWNER";
}
