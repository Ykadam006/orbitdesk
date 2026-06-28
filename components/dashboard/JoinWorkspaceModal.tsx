"use client";

import { useState, useRef, useId } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { X } from "lucide-react";
import { useModalA11y } from "@/hooks/useModalA11y";
import { useToast } from "@/components/providers/ToastProvider";
import { apiFetch } from "@/lib/fetch-client";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function JoinWorkspaceModal({ open, onClose }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useModalA11y(open, onClose, dialogRef);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiFetch<{ workspaceId: string }>("/api/workspaces/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode }),
      });
      setInviteCode("");
      onClose();
      toast("Joined workspace", "success");
      router.push(`/workspace/${data.workspaceId}`);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to join workspace";
      setError(message);
      toast("Failed to join workspace", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id={titleId} className="text-lg font-semibold text-gray-900 dark:text-gray-100">Join Workspace</h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="invite-code"
            label="Invite Code"
            placeholder="Enter invite code"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            required
          />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={loading}>
              Join
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
