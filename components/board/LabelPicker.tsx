"use client";

import { useState, useEffect } from "react";
import { Plus, X, Tag } from "lucide-react";
import { apiFetch } from "@/lib/fetch-client";

interface Label {
  id: string;
  name: string;
  color: string;
}

interface Props {
  workspaceId: string;
  cardLabels: Label[];
  onToggleLabel: (label: Label) => void;
}

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280",
];

export function LabelPicker({ workspaceId, cardLabels, onToggleLabel }: Props) {
  const [allLabels, setAllLabels] = useState<Label[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchLabels() {
      try {
        const res = await apiFetch<{ data?: Label[] } | Label[]>(
          `/api/workspaces/${workspaceId}/labels?limit=100`,
          { signal: controller.signal }
        );
        const labels = Array.isArray(res) ? res : (res.data || []);
        setAllLabels(labels);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }
    fetchLabels();

    return () => controller.abort();
  }, [workspaceId]);

  async function createLabel() {
    if (!newName.trim()) return;
    try {
      const label = await apiFetch<Label>(`/api/workspaces/${workspaceId}/labels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      });
      setAllLabels((prev) => [...prev, label]);
      setNewName("");
      setShowCreate(false);
    } catch {
      // silently fail — parent toast not required for label picker
    }
  }

  const cardLabelIds = new Set(cardLabels.map((l) => l.id));

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Tag className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Labels</span>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2">
        {cardLabels.map((label) => (
          <button
            key={label.id}
            onClick={() => onToggleLabel(label)}
            aria-label={`Remove label ${label.name}`}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: label.color }}
          >
            {label.name}
            <X className="h-3 w-3" />
          </button>
        ))}
      </div>

      <div className="space-y-1">
        {allLabels
          .filter((l) => !cardLabelIds.has(l.id))
          .map((label) => (
            <button
              key={label.id}
              onClick={() => onToggleLabel(label)}
              className="flex items-center gap-2 w-full px-2 py-1 rounded text-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: label.color }}
              />
              <span className="text-gray-700 dark:text-gray-300">{label.name}</span>
            </button>
          ))}
      </div>

      {showCreate ? (
        <div className="mt-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg space-y-2">
          <input
            type="text"
            placeholder="Label name"
            aria-label="New label name"
            className="w-full rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
          />
          <div className="flex gap-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewColor(c)}
                aria-label={`Select color ${c}`}
                className={`w-5 h-5 rounded-full ${newColor === c ? "ring-2 ring-offset-1 ring-indigo-500 dark:ring-offset-gray-900" : ""}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={createLabel}
              className="px-2 py-1 text-xs font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1 mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
        >
          <Plus className="h-3 w-3" /> New Label
        </button>
      )}
    </div>
  );
}
