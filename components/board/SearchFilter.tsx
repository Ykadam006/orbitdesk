"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Filter, X } from "lucide-react";

export interface FilterState {
  query: string;
  priority: string;
  assignee: string;
  dueDateRange: string;
}

interface Props {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  members: { id: string; name: string | null }[];
}

export const defaultFilters: FilterState = {
  query: "",
  priority: "",
  assignee: "",
  dueDateRange: "",
};

export function SearchFilter({ filters, onChange, members }: Props) {
  const [queryInput, setQueryInput] = useState(filters.query);
  const onChangeRef = useRef(onChange);
  const filtersRef = useRef(filters);
  const hasFilters = filters.query || filters.priority || filters.assignee || filters.dueDateRange;

  useEffect(() => {
    onChangeRef.current = onChange;
    filtersRef.current = filters;
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (queryInput !== filtersRef.current.query) {
        onChangeRef.current({ ...filtersRef.current, query: queryInput });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [queryInput]);

  function clearFilters() {
    setQueryInput("");
    onChange(defaultFilters);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          placeholder="Search cards..."
          aria-label="Search cards"
          className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-44"
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-1.5">
        <Filter className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
        <select
          aria-label="Filter by priority"
          className="text-xs border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={filters.priority}
          onChange={(e) => onChange({ ...filters, priority: e.target.value })}
        >
          <option value="">All Priorities</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <select
          aria-label="Filter by assignee"
          className="text-xs border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={filters.assignee}
          onChange={(e) => onChange({ ...filters, assignee: e.target.value })}
        >
          <option value="">All Members</option>
          <option value="unassigned">Unassigned</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name || "Unknown"}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by due date"
          className="text-xs border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={filters.dueDateRange}
          onChange={(e) => onChange({ ...filters, dueDateRange: e.target.value })}
        >
          <option value="">Any Due Date</option>
          <option value="overdue">Overdue</option>
          <option value="today">Due Today</option>
          <option value="week">Due This Week</option>
          <option value="none">No Due Date</option>
        </select>
      </div>

      {hasFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="h-3 w-3" aria-hidden="true" /> Clear
        </button>
      )}
    </div>
  );
}
