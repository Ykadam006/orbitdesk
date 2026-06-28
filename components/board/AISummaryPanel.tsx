"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Props {
  boardId: string;
  onClose: () => void;
}

export function AISummaryPanel({ boardId, onClose }: Props) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateSummary() {
    setLoading(true);
    setError("");

    const res = await fetch(`/api/boards/${boardId}/summary`, { method: "POST" });

    if (!res.ok) {
      setError("Failed to generate summary");
      setLoading(false);
      return;
    }

    const data = await res.json();
    setSummary(data.summary);
    setLoading(false);
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">AI Summary</h3>
        </div>
        <button
          onClick={onClose}
          aria-label="Close AI summary panel"
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {!summary && !loading && (
        <div className="text-center py-8">
          <Sparkles className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Generate an AI-powered summary of this board&apos;s progress, blockers, and next steps.
          </p>
          <Button onClick={generateSummary} size="sm">
            <Sparkles className="h-4 w-4 mr-1" />
            Generate Summary
          </Button>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Analyzing board...</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400 mb-4">
          {error}
        </div>
      )}

      {summary && (
        <div>
          <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            {summary}
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" onClick={generateSummary}>
              Regenerate
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
