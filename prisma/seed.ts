import { PrismaClient } from "../app/generated/prisma/client";
import bcrypt from "bcryptjs";
import { generateInviteCode } from "../lib/utils";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 12);

  const user = await prisma.user.upsert({
    where: { email: "yogesh@orbitdesk.dev" },
    update: {},
    create: {
      name: "Yogesh Kadam",
      email: "yogesh@orbitdesk.dev",
      password: hashedPassword,
      emailVerified: new Date(),
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "alex@orbitdesk.dev" },
    update: {},
    create: {
      name: "Alex Johnson",
      email: "alex@orbitdesk.dev",
      password: hashedPassword,
      emailVerified: new Date(),
    },
  });

  const workspace = await prisma.workspace.findFirst({ where: { name: "OrbitDesk Demo" } });
  const ws =
    workspace ??
    (await prisma.workspace.create({
      data: { name: "OrbitDesk Demo", inviteCode: generateInviteCode() },
    }));

  await prisma.membership.upsert({
    where: { userId_workspaceId: { userId: user.id, workspaceId: ws.id } },
    update: {},
    create: { userId: user.id, workspaceId: ws.id, role: "OWNER" },
  });

  await prisma.membership.upsert({
    where: { userId_workspaceId: { userId: user2.id, workspaceId: ws.id } },
    update: {},
    create: { userId: user2.id, workspaceId: ws.id, role: "MEMBER" },
  });

  let board = await prisma.board.findFirst({
    where: { workspaceId: ws.id, title: "Sprint 1" },
  });
  if (!board) {
    board = await prisma.board.create({
      data: { title: "Sprint 1", workspaceId: ws.id },
    });
  }

  const labels = await Promise.all(
    [
      { name: "Bug", color: "#ef4444" },
      { name: "Feature", color: "#3b82f6" },
      { name: "Urgent", color: "#f97316" },
    ].map((l) =>
      prisma.label.upsert({
        where: { workspaceId_name: { workspaceId: ws.id, name: l.name } },
        update: {},
        create: { ...l, workspaceId: ws.id },
      })
    )
  );

  const existingCards = await prisma.card.count({ where: { boardId: board.id } });
  if (existingCards === 0) {
    await prisma.card.createMany({
      data: [
        {
          title: "Set up CI pipeline",
          status: "DONE",
          priority: "HIGH",
          position: 0,
          boardId: board.id,
          assignedToId: user.id,
        },
        {
          title: "Fix login bug",
          status: "IN_PROGRESS",
          priority: "URGENT",
          position: 0,
          boardId: board.id,
          assignedToId: user2.id,
        },
        {
          title: "Add dark mode",
          status: "TODO",
          priority: "MEDIUM",
          position: 1,
          boardId: board.id,
        },
        {
          title: "Write API tests",
          status: "REVIEW",
          priority: "LOW",
          position: 0,
          boardId: board.id,
          assignedToId: user.id,
        },
      ],
    });

    const bugCard = await prisma.card.findFirst({
      where: { boardId: board.id, title: "Fix login bug" },
    });
    if (bugCard) {
      await prisma.card.update({
        where: { id: bugCard.id },
        data: { labels: { connect: [{ id: labels[0].id }, { id: labels[2].id }] } },
      });
    }
  }

  console.log("Seeded:", user.email, user2.email, ws.name, board.title);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
