"use client";

import { useState } from "react";
import { Orbit, Plus, LogIn } from "lucide-react";
import { WorkspaceCard } from "@/components/dashboard/WorkspaceCard";
import { CreateWorkspaceModal } from "@/components/dashboard/CreateWorkspaceModal";
import { JoinWorkspaceModal } from "@/components/dashboard/JoinWorkspaceModal";

interface Workspace {
  id: string;
  name: string;
  boardCount: number;
  memberCount: number;
  role: string;
}

interface Props {
  userName: string;
  workspaces: Workspace[];
}

export function DashboardClient({ userName, workspaces }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Welcome back, {userName}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your workspaces and boards</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <button
          onClick={() => setShowCreate(true)}
          className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-8 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-colors"
        >
          <Plus className="h-10 w-10 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 mb-3" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
            Create Workspace
          </span>
        </button>

        <button
          onClick={() => setShowJoin(true)}
          className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-8 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-colors"
        >
          <LogIn className="h-10 w-10 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 mb-3" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
            Join Workspace
          </span>
        </button>

        {workspaces.map((ws) => (
          <WorkspaceCard key={ws.id} {...ws} />
        ))}
      </div>

      {workspaces.length === 0 && (
        <div className="mt-16 text-center">
          <Orbit className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">No workspaces yet</h3>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Create your first workspace or join one with an invite code to get started.
          </p>
        </div>
      )}

      <CreateWorkspaceModal open={showCreate} onClose={() => setShowCreate(false)} />
      <JoinWorkspaceModal open={showJoin} onClose={() => setShowJoin(false)} />
    </div>
  );
}
