"use client";

import Link from "next/link";
import { Users, Kanban } from "lucide-react";

interface WorkspaceCardProps {
  id: string;
  name: string;
  boardCount: number;
  memberCount: number;
  role: string;
}

export function WorkspaceCard({ id, name, boardCount, memberCount, role }: WorkspaceCardProps) {
  return (
    <Link
      href={`/workspace/${id}`}
      className="block rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition-all bg-white dark:bg-gray-900"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{name}</h3>
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
          {role}
        </span>
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <Kanban className="h-4 w-4" />
          <span>{boardCount} board{boardCount !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          <span>{memberCount} member{memberCount !== 1 ? "s" : ""}</span>
        </div>
      </div>
    </Link>
  );
}
