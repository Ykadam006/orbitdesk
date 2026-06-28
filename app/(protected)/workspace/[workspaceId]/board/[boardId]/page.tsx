import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BoardView } from "@/components/board/BoardView";

export const metadata: Metadata = {
  title: "Board | OrbitDesk",
};

export default async function BoardPage({
  params,
}: {
  params: Promise<{ workspaceId: string; boardId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { workspaceId, boardId } = await params;

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: { workspace: { select: { id: true, name: true } } },
  });

  if (!board || board.workspaceId !== workspaceId) notFound();

  const membership = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId: session.user.id, workspaceId } },
  });

  if (!membership) redirect("/dashboard");

  const members = await prisma.membership.findMany({
    where: { workspaceId },
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)]">
      <BoardView
        boardId={boardId}
        workspaceId={workspaceId}
        boardTitle={board.title}
        userId={session.user.id}
        userName={session.user.name || "Unknown"}
        members={members.map((m) => m.user)}
      />
    </div>
  );
}
