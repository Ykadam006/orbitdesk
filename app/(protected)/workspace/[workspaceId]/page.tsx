import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WorkspaceClient } from "./WorkspaceClient";

export const metadata: Metadata = {
  title: "Workspace | OrbitDesk",
};

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { workspaceId } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
        orderBy: { createdAt: "asc" },
      },
      boards: {
        include: { _count: { select: { cards: true } } },
        orderBy: { createdAt: "desc" },
      },
      activities: {
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!workspace) notFound();

  const membership = workspace.members.find((m) => m.userId === session.user.id);
  if (!membership) redirect("/dashboard");

  return (
    <WorkspaceClient
      workspace={workspace}
      userRole={membership.role}
      userId={session.user.id}
    />
  );
}
