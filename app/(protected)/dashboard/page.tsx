import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "./DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard | OrbitDesk",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const workspaces = await prisma.workspace.findMany({
    where: { members: { some: { userId: session.user.id } } },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
      _count: { select: { boards: true, members: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const workspaceData = workspaces.map((w) => ({
    id: w.id,
    name: w.name,
    boardCount: w._count.boards,
    memberCount: w._count.members,
    role: w.members.find((m) => m.userId === session.user.id)?.role || "MEMBER",
  }));

  return (
    <DashboardClient
      userName={session.user.name || "there"}
      workspaces={workspaceData}
    />
  );
}
