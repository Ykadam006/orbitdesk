"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { apiFetch } from "@/lib/fetch-client";

interface AnalyticsData {
  totalCards: number;
  completedThisWeek: number;
  byStatus: { name: string; value: number }[];
  byPriority: { name: string; value: number }[];
  byMember: { name: string; count: number }[];
}

const STATUS_COLORS = ["#6b7280", "#3b82f6", "#eab308", "#22c55e"];
const PRIORITY_COLORS = ["#d1d5db", "#60a5fa", "#f97316", "#ef4444"];

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[180px] sm:h-[250px] text-center px-4">
      <BarChart3 className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
      <p className="text-sm text-gray-400 dark:text-gray-500">{message}</p>
    </div>
  );
}

function hasChartData(items: { value?: number; count?: number }[]): boolean {
  return items.some((item) => (item.value ?? item.count ?? 0) > 0);
}

export function AnalyticsDashboard({ workspaceId }: { workspaceId: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchAnalytics() {
      try {
        const result = await apiFetch<AnalyticsData>(`/api/workspaces/${workspaceId}/analytics`, {
          signal: controller.signal,
        });
        setData(result);
        setError(false);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (err instanceof Error && err.name === "AbortError") return;
        setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    fetchAnalytics();

    return () => controller.abort();
  }, [workspaceId]);

  if (loading) return <p className="text-sm text-gray-400 dark:text-gray-500 p-6">Loading analytics...</p>;
  if (error || !data) return <p className="text-sm text-gray-400 dark:text-gray-500 p-6">Failed to load analytics.</p>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 bg-white dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Cards</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{data.totalCards}</p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 bg-white dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Completed This Week</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{data.completedThisWeek}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 bg-white dark:bg-gray-900">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Cards by Status</h3>
          {hasChartData(data.byStatus) ? (
            <div className="h-[180px] sm:h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {data.byStatus.map((_, i) => (
                      <Cell key={i} fill={STATUS_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartEmpty message="No cards by status yet" />
          )}
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 bg-white dark:bg-gray-900">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Cards by Priority</h3>
          {hasChartData(data.byPriority) ? (
            <div className="h-[180px] sm:h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byPriority}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "currentColor" }} className="text-gray-600 dark:text-gray-400" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "currentColor" }} className="text-gray-600 dark:text-gray-400" />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {data.byPriority.map((_, i) => (
                      <Cell key={i} fill={PRIORITY_COLORS[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartEmpty message="No cards by priority yet" />
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 bg-white dark:bg-gray-900">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Member Workload</h3>
        {data.byMember.length > 0 && hasChartData(data.byMember) ? (
          <div className="h-[160px] sm:h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byMember} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "currentColor" }} className="text-gray-600 dark:text-gray-400" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "currentColor" }} width={80} className="text-gray-600 dark:text-gray-400" />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <ChartEmpty message="No member workload data yet" />
        )}
      </div>
    </div>
  );
}
