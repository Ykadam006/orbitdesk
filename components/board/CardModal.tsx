"use client";

import { useState, useRef, useId } from "react";
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CommentSection } from "./CommentSection";
import { LabelPicker } from "./LabelPicker";
import { Card, Label } from "@/store/boardStore";
import { useModalA11y } from "@/hooks/useModalA11y";
import { useConfirm } from "@/components/providers/ConfirmProvider";

interface Props {
  card: Card;
  workspaceId: string;
  members: { id: string; name: string | null; image: string | null }[];
  onClose: () => void;
  onUpdate: (cardId: string, data: Partial<Card> & { labelIds?: string[] }) => Promise<void>;
  onDelete: (cardId: string) => void;
}

export function CardModal({ card, workspaceId, members, onClose, onUpdate, onDelete }: Props) {
  const { confirm } = useConfirm();
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [priority, setPriority] = useState(card.priority);
  const [status, setStatus] = useState(card.status);
  const [assignedToId, setAssignedToId] = useState(card.assignedToId || "");
  const [dueDate, setDueDate] = useState(card.dueDate ? card.dueDate.split("T")[0] : "");
  const [cardLabels, setCardLabels] = useState<Label[]>(card.labels || []);
  const [saving, setSaving] = useState(false);
  const [titleError, setTitleError] = useState("");

  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useModalA11y(true, onClose, dialogRef);

  async function handleSave() {
    if (!title.trim()) {
      setTitleError("Title is required");
      return;
    }
    setTitleError("");
    setSaving(true);
    try {
      await onUpdate(card.id, {
        title: title.trim(),
        description: description || null,
        priority,
        status,
        assignedToId: assignedToId || null,
        dueDate: dueDate || null,
        labelIds: cardLabels.map((l) => l.id),
      } as Partial<Card> & { labelIds?: string[] });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = await confirm({
      title: "Delete Card",
      message: "Delete this card? This action cannot be undone.",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (confirmed) onDelete(card.id);
  }

  function handleToggleLabel(label: Label) {
    setCardLabels((prev) => {
      const exists = prev.some((l) => l.id === label.id);
      return exists ? prev.filter((l) => l.id !== label.id) : [...prev, label];
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id={titleId} className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Card</h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <Input
            id="card-title"
            label="Title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (titleError) setTitleError("");
            }}
            error={titleError}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={status}
                onChange={(e) => setStatus(e.target.value as Card["status"])}
              >
                <option value="TODO">Todo</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
              <select
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Card["priority"])}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned To</label>
              <select
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name || "Unknown"}
                  </option>
                ))}
              </select>
            </div>
            <Input
              id="card-due-date"
              type="date"
              label="Due Date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <LabelPicker workspaceId={workspaceId} cardLabels={cardLabels} onToggleLabel={handleToggleLabel} />
          </div>

          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <CommentSection cardId={card.id} />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="danger" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSave} isLoading={saving}>Save Changes</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
