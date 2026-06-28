"use client";

import { useState, useRef, useId, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Kanban, Bug, Lightbulb, Rocket } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useModalA11y } from "@/hooks/useModalA11y";
import { useToast } from "@/components/providers/ToastProvider";
import { apiFetch } from "@/lib/fetch-client";

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  cards: { title: string; status: string; priority: string }[];
}

const TEMPLATES: Template[] = [
  {
    id: "blank",
    name: "Blank Board",
    description: "Start from scratch",
    icon: Kanban,
    cards: [],
  },
  {
    id: "sprint",
    name: "Sprint Board",
    description: "Pre-built for agile sprints",
    icon: Rocket,
    cards: [
      { title: "Sprint planning", status: "DONE", priority: "HIGH" },
      { title: "Design mockups", status: "IN_PROGRESS", priority: "HIGH" },
      { title: "API integration", status: "TODO", priority: "MEDIUM" },
      { title: "Write unit tests", status: "TODO", priority: "MEDIUM" },
      { title: "Code review", status: "TODO", priority: "LOW" },
      { title: "Deploy to staging", status: "TODO", priority: "HIGH" },
    ],
  },
  {
    id: "bugs",
    name: "Bug Tracker",
    description: "Track and resolve bugs",
    icon: Bug,
    cards: [
      { title: "Login page crash on Safari", status: "TODO", priority: "URGENT" },
      { title: "Fix pagination offset", status: "IN_PROGRESS", priority: "HIGH" },
      { title: "Email validation regex", status: "REVIEW", priority: "MEDIUM" },
      { title: "Dark mode toggle flicker", status: "TODO", priority: "LOW" },
    ],
  },
  {
    id: "features",
    name: "Feature Requests",
    description: "Plan and prioritize features",
    icon: Lightbulb,
    cards: [
      { title: "User profile customization", status: "TODO", priority: "MEDIUM" },
      { title: "Export to CSV", status: "TODO", priority: "LOW" },
      { title: "Notification preferences", status: "IN_PROGRESS", priority: "HIGH" },
      { title: "Mobile app support", status: "TODO", priority: "MEDIUM" },
    ],
  },
];

interface Props {
  workspaceId: string;
  open: boolean;
  onClose: () => void;
}

export function CreateBoardWithTemplate({ workspaceId, open, onClose }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<"template" | "name">("template");
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(TEMPLATES[0]);
  const [boardTitle, setBoardTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const handleClose = useCallback(() => {
    setStep("template");
    setSelectedTemplate(TEMPLATES[0]);
    setBoardTitle("");
    onClose();
  }, [onClose]);

  useModalA11y(open, handleClose, dialogRef);

  if (!open) return null;

  function selectTemplate(template: Template) {
    setSelectedTemplate(template);
    setBoardTitle(template.id === "blank" ? "" : template.name);
    setStep("name");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!boardTitle.trim()) return;
    setCreating(true);

    try {
      const board = await apiFetch<{ id: string }>(`/api/workspaces/${workspaceId}/boards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: boardTitle.trim(),
          templateCards: selectedTemplate.cards,
        }),
      });
      toast("Board created", "success");
      onClose();
      router.push(`/workspace/${workspaceId}/board/${board.id}`);
    } catch {
      toast("Failed to create board", "error");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id={titleId} className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {step === "template" ? "Choose a Template" : "Name Your Board"}
          </h2>
          <button
            onClick={handleClose}
            aria-label="Close dialog"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === "template" ? (
          <div className="grid grid-cols-2 gap-3">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => selectTemplate(template)}
                className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all text-center"
              >
                <template.icon className="h-8 w-8 text-indigo-600" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{template.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{template.description}</span>
                {template.cards.length > 0 && (
                  <span className="text-xs text-gray-400">{template.cards.length} cards</span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400">
              <selectedTemplate.icon className="h-4 w-4 text-indigo-600" />
              Template: {selectedTemplate.name}
              {selectedTemplate.cards.length > 0 && ` (${selectedTemplate.cards.length} cards)`}
            </div>
            <Input
              id="board-title"
              label="Board Title"
              placeholder="My Board"
              value={boardTitle}
              onChange={(e) => setBoardTitle(e.target.value)}
              required
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <Button variant="outline" type="button" onClick={() => setStep("template")}>
                Back
              </Button>
              <Button type="submit" isLoading={creating}>
                Create Board
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
