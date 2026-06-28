"use client";

import { useState, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import { useToast } from "@/components/providers/ToastProvider";
import { apiFetch } from "@/lib/fetch-client";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string | null; image: string | null };
}

interface Props {
  cardId: string;
}

export function CommentSection({ cardId }: Props) {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchComments() {
      try {
        const data = await apiFetch<Comment[]>(`/api/cards/${cardId}/comments`, {
          signal: controller.signal,
        });
        setComments(data);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (error instanceof Error && error.name === "AbortError") return;
        toast("Failed to load comments", "error");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    fetchComments();

    return () => controller.abort();
  }, [cardId, toast]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);

    try {
      const comment = await apiFetch<Comment>(`/api/cards/${cardId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      setComments((prev) => [...prev, comment]);
      setContent("");
      toast("Comment added", "success");
    } catch {
      toast("Failed to add comment", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        Comments {comments.length > 0 && `(${comments.length})`}
      </h3>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
          {comments.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">No comments yet</p>
          )}
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                  {comment.user.name?.charAt(0)?.toUpperCase() || "?"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                    {comment.user.name || "Unknown"}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(comment.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 break-words">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          aria-label="Add a comment"
          className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Add a comment..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          aria-label="Send comment"
          className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>
    </div>
  );
}
