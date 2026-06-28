"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Copy, Check, Trash2 } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { apiFetch } from "@/lib/fetch-client";

interface Props {
  workspace: {
    id: string;
    name: string;
    inviteCode: string;
    members: {
      id: string;
      role: string;
      user: { id: string; name: string | null; email: string | null; image: string | null };
    }[];
  };
  userRole: string;
  userId: string;
}

export function SettingsClient({ workspace, userRole, userId }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [name, setName] = useState(workspace.name);
  const [nameError, setNameError] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = userRole === "OWNER";

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setNameError("Workspace name is required");
      return;
    }
    setNameError("");
    setSaving(true);
    try {
      await apiFetch(`/api/workspaces/${workspace.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      toast("Workspace name updated", "success");
      router.refresh();
    } catch {
      toast("Failed to update workspace name", "error");
    } finally {
      setSaving(false);
    }
  }

  function copyInviteCode() {
    navigator.clipboard.writeText(workspace.inviteCode);
    setCopied(true);
    toast("Invite code copied", "success");
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleChangeRole(memberId: string, role: string) {
    try {
      await apiFetch(`/api/workspaces/${workspace.id}/members/${memberId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      toast("Member role updated", "success");
      router.refresh();
    } catch {
      toast("Failed to update member role", "error");
    }
  }

  async function handleRemoveMember(memberId: string) {
    const confirmed = await confirm({
      title: "Remove Member",
      message: "Remove this member from the workspace?",
      confirmLabel: "Remove",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      await apiFetch(`/api/workspaces/${workspace.id}/members/${memberId}`, {
        method: "DELETE",
      });
      toast("Member removed", "success");
      router.refresh();
    } catch {
      toast("Failed to remove member", "error");
    }
  }

  async function handleDeleteWorkspace() {
    const confirmed = await confirm({
      title: "Delete Workspace",
      message: "Delete this workspace? This action cannot be undone.",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!confirmed) return;

    setDeleting(true);
    try {
      await apiFetch(`/api/workspaces/${workspace.id}`, { method: "DELETE" });
      toast("Workspace deleted", "success");
      router.push("/dashboard");
    } catch {
      toast("Failed to delete workspace", "error");
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">Workspace Settings</h1>

      <div className="space-y-8">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-900">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">General</h2>
          <form onSubmit={handleSaveName} className="flex gap-3 items-end">
            <div className="flex-1">
              <Input
                id="ws-name"
                label="Workspace Name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError("");
                }}
                error={nameError}
              />
            </div>
            <Button type="submit" isLoading={saving}>Save</Button>
          </form>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-900">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Invite Code</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Share this code with teammates to invite them.</p>
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm font-mono text-gray-800 dark:text-gray-200">
              {workspace.inviteCode}
            </code>
            <Button variant="outline" onClick={copyInviteCode} aria-label={copied ? "Copied" : "Copy invite code"}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-900">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Members ({workspace.members.length})
          </h2>
          <div className="divide-y divide-gray-100 dark:divide-gray-800 overflow-x-auto">
            {workspace.members.map((member) => (
              <div key={member.id} className="flex items-center justify-between py-3 min-w-[20rem]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                      {member.user.name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {member.user.name}
                      {member.user.id === userId && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">(you)</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{member.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isOwner && member.role !== "OWNER" ? (
                    <>
                      <select
                        aria-label={`Change role for ${member.user.name}`}
                        className="text-xs border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={member.role}
                        onChange={(e) => handleChangeRole(member.id, e.target.value)}
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="MEMBER">Member</option>
                      </select>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        aria-label={`Remove ${member.user.name}`}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                      {member.role}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {isOwner && (
          <div className="rounded-xl border border-red-200 dark:border-red-800 p-6 bg-white dark:bg-gray-900">
            <h2 className="text-base font-semibold text-red-600 dark:text-red-400 mb-2">Danger Zone</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Deleting a workspace will remove all boards, cards, and activity permanently.
            </p>
            <Button variant="danger" onClick={handleDeleteWorkspace} isLoading={deleting}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Workspace
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
