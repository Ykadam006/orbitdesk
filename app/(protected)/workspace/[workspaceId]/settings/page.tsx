import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "./SettingsClient";

export const metadata: Metadata = {
  title: "Workspace Settings | OrbitDesk",
};

export default async function WorkspaceSettingsPage({
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
    },
  });

  if (!workspace) notFound();

  const membership = workspace.members.find((m) => m.userId === session.user.id);
  if (!membership || membership.role === "MEMBER") redirect(`/workspace/${workspaceId}`);

  return (
    <SettingsClient
      workspace={workspace}
      userRole={membership.role}
      userId={session.user.id}
    />
  );
}
