"use client";

import { useEffect, useState } from "react";
import { timeAgo } from "@/lib/utils";
import { apiFetch } from "@/lib/fetch-client";

interface Activity {
  id: string;
  action: string;
  createdAt: string;
  user: { id: string; name: string | null; image: string | null };
}

interface Props {
  workspaceId: string;
}

export function ActivityFeed({ workspaceId }: Props) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchActivity() {
      try {
        const data = await apiFetch<Activity[]>(`/api/workspaces/${workspaceId}/activity`, {
          signal: controller.signal,
        });
        setActivities(data);
        setError(false);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (err instanceof Error && err.name === "AbortError") return;
        setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    fetchActivity();

    return () => controller.abort();
  }, [workspaceId]);

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Activity</h3>
      {loading ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">Loading...</p>
      ) : error ? (
        <p className="text-sm text-red-500 dark:text-red-400">Failed to load activity</p>
      ) : activities.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">No activity yet</p>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-3">
              <div className="w-7 h-7 shrink-0 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  {activity.user.name?.charAt(0)?.toUpperCase() || "?"}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">{activity.user.name}</span>{" "}
                  {activity.action}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(activity.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
