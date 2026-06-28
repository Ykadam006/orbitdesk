"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Kanban,
  Plus,
  Users,
  Settings,
  BarChart3,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActivityFeed } from "@/components/board/ActivityFeed";
import { AnalyticsDashboard } from "@/components/workspace/AnalyticsDashboard";
import { CreateBoardWithTemplate } from "@/components/workspace/CreateBoardWithTemplate";
import { timeAgo } from "@/lib/utils";

interface Props {
  workspace: {
    id: string;
    name: string;
    inviteCode: string;
    boards: {
      id: string;
      title: string;
      createdAt: Date;
      _count: { cards: number };
    }[];
    members: {
      id: string;
      role: string;
      user: { id: string; name: string | null; email: string | null; image: string | null };
    }[];
    activities: {
      id: string;
      action: string;
      createdAt: Date;
      user: { id: string; name: string | null; image: string | null };
    }[];
  };
  userRole: string;
  userId: string;
}

export function WorkspaceClient({ workspace, userRole }: Props) {
  const [activeTab, setActiveTab] = useState<"boards" | "members" | "activity" | "analytics">("boards");
  const [showCreateBoard, setShowCreateBoard] = useState(false);

  const canManage = userRole === "OWNER" || userRole === "ADMIN";

  const tabs = [
    { id: "boards" as const, label: "Boards", icon: Kanban },
    { id: "members" as const, label: "Members", icon: Users },
    { id: "activity" as const, label: "Activity", icon: Activity },
    { id: "analytics" as const, label: "Analytics", icon: BarChart3 },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{workspace.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {workspace.members.length} member{workspace.members.length !== 1 ? "s" : ""} &middot;{" "}
            {workspace.boards.length} board{workspace.boards.length !== 1 ? "s" : ""}
          </p>
        </div>
        {canManage && (
          <Link href={`/workspace/${workspace.id}/settings`}>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-1" /> Settings
            </Button>
          </Link>
        )}
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "boards" && (
        <>
          {!canManage && workspace.boards.length === 0 ? (
            <EmptyState
              icon={Kanban}
              title="No boards yet"
              description="There are no boards in this workspace. Ask an admin to create one."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {canManage && (
                <button
                  onClick={() => setShowCreateBoard(true)}
                  className="w-full group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-8 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-colors"
                >
                  <Plus className="h-8 w-8 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 mb-2" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    Create Board
                  </span>
                </button>
              )}

              {workspace.boards.map((board) => (
                <Link
                  key={board.id}
                  href={`/workspace/${workspace.id}/board/${board.id}`}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition-all bg-white dark:bg-gray-900"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Kanban className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{board.title}</h3>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {board._count.cards} card{board._count.cards !== 1 ? "s" : ""} &middot;{" "}
                    Created {timeAgo(board.createdAt)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "members" && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
          {workspace.members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                  <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                    {member.user.name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{member.user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{member.user.email}</p>
                </div>
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                {member.role}
              </span>
            </div>
          ))}
        </div>
      )}

      {activeTab === "activity" && <ActivityFeed workspaceId={workspace.id} />}

      {activeTab === "analytics" && <AnalyticsDashboard workspaceId={workspace.id} />}

      <CreateBoardWithTemplate
        workspaceId={workspace.id}
        open={showCreateBoard}
        onClose={() => setShowCreateBoard(false)}
      />
    </div>
  );
}
