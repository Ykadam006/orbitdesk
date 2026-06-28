"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { useBoardStore, Card } from "@/store/boardStore";
import { useSocket } from "@/hooks/useSocket";
import { BoardColumn } from "./BoardColumn";
import { CardItem } from "./CardItem";
import { CardModal } from "./CardModal";
import { CreateCardModal } from "./CreateCardModal";
import { PresenceBar } from "./PresenceBar";
import { ActivityFeed } from "./ActivityFeed";
import { AISummaryPanel } from "./AISummaryPanel";
import { SearchFilter, FilterState, defaultFilters } from "./SearchFilter";
import { useToast } from "@/components/providers/ToastProvider";
import { apiFetch } from "@/lib/fetch-client";
import { ArrowLeft, Loader2, Activity, Sparkles } from "lucide-react";

const COLUMNS: { id: Card["status"]; label: string }[] = [
  { id: "TODO", label: "Todo" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "REVIEW", label: "Review" },
  { id: "DONE", label: "Done" },
];

interface Props {
  boardId: string;
  workspaceId: string;
  boardTitle: string;
  userId: string;
  userName: string;
  members: { id: string; name: string | null; image: string | null }[];
}

function matchesFilters(card: Card, filters: FilterState): boolean {
  if (filters.query) {
    const q = filters.query.toLowerCase();
    const titleMatch = card.title.toLowerCase().includes(q);
    const descMatch = card.description?.toLowerCase().includes(q);
    if (!titleMatch && !descMatch) return false;
  }

  if (filters.priority && card.priority !== filters.priority) return false;

  if (filters.assignee) {
    if (filters.assignee === "unassigned" && card.assignedToId) return false;
    if (filters.assignee !== "unassigned" && card.assignedToId !== filters.assignee) return false;
  }

  if (filters.dueDateRange) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    if (filters.dueDateRange === "none" && card.dueDate) return false;
    if (filters.dueDateRange === "overdue" && (!card.dueDate || new Date(card.dueDate) >= today)) return false;
    if (filters.dueDateRange === "today") {
      if (!card.dueDate) return false;
      const due = new Date(card.dueDate);
      const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
      if (dueDay.getTime() !== today.getTime()) return false;
    }
    if (filters.dueDateRange === "week") {
      if (!card.dueDate) return false;
      const due = new Date(card.dueDate);
      if (due < today || due > weekEnd) return false;
    }
  }

  return true;
}

export function BoardView({ boardId, workspaceId, boardTitle, userId, userName, members }: Props) {
  const { toast } = useToast();
  const { cards, isLoading, setCards, clearCards, setLoading, addCard, updateCard, moveCard, removeCard } =
    useBoardStore();
  const { onlineUsers, emitCardCreated, emitCardUpdated, emitCardMoved, emitCardDeleted, emitActivity } =
    useSocket(boardId, userId, userName);

  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [createCardStatus, setCreateCardStatus] = useState<Card["status"] | null>(null);
  const [showActivity, setShowActivity] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const dragSnapshot = useRef<Card[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const filteredCards = useMemo(() => {
    const hasFilters = filters.query || filters.priority || filters.assignee || filters.dueDateRange;
    if (!hasFilters) return cards;
    return cards.filter((card) => matchesFilters(card, filters));
  }, [cards, filters]);

  useEffect(() => {
    clearCards();
    setLoading(true);

    async function fetchCards() {
      try {
        const data = await apiFetch<Card[]>(`/api/boards/${boardId}/cards`);
        setCards(data);
      } catch {
        toast("Failed to load cards", "error");
      } finally {
        setLoading(false);
      }
    }
    fetchCards();
  }, [boardId, setCards, clearCards, setLoading, toast]);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const card = cards.find((c) => c.id === event.active.id);
      if (card) {
        setActiveCard(card);
        dragSnapshot.current = [...cards];
      }
    },
    [cards]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;
      const activeCardData = cards.find((c) => c.id === activeId);
      if (!activeCardData) return;

      const overColumn = COLUMNS.find((col) => col.id === overId);
      if (overColumn && activeCardData.status !== overColumn.id) {
        moveCard(activeId, overColumn.id, activeCardData.position);
        return;
      }

      const overCard = cards.find((c) => c.id === overId);
      if (overCard && activeCardData.status !== overCard.status) {
        moveCard(activeId, overCard.status, overCard.position);
      }
    },
    [cards, moveCard]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveCard(null);
      const { active, over } = event;
      if (!over) {
        setCards(dragSnapshot.current);
        return;
      }

      const activeId = active.id as string;
      const card = cards.find((c) => c.id === activeId);
      if (!card) return;

      try {
        const updated = await apiFetch<Card>(`/api/cards/${activeId}/move`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: card.status, position: card.position }),
        });
        emitCardMoved(updated);
        emitActivity({ type: "card:moved" });
      } catch {
        setCards(dragSnapshot.current);
        toast("Failed to move card", "error");
      }
    },
    [cards, emitCardMoved, emitActivity, setCards, toast]
  );

  const handleCreateCard = useCallback(
    async (status: Card["status"], data: { title: string; description: string; priority: string }) => {
      const tempId = `temp-${Date.now()}`;
      const optimisticCard: Card = {
        id: tempId,
        title: data.title,
        description: data.description || null,
        status,
        priority: data.priority as Card["priority"],
        dueDate: null,
        position: cards.filter((c) => c.status === status).length,
        boardId,
        assignedToId: null,
        assignedTo: null,
        labels: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addCard(optimisticCard);

      try {
        const card = await apiFetch<Card>(`/api/boards/${boardId}/cards`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: data.title, description: data.description, priority: data.priority, status }),
        });
        removeCard(tempId);
        addCard(card);
        emitCardCreated(card);
        emitActivity({ type: "card:created" });
        toast("Card created", "success");
      } catch {
        removeCard(tempId);
        toast("Failed to create card", "error");
      }
    },
    [boardId, cards, addCard, removeCard, emitCardCreated, emitActivity, toast]
  );

  const handleUpdateCard = useCallback(
    async (cardId: string, data: Partial<Card> & { labelIds?: string[] }) => {
      const prev = cards.find((c) => c.id === cardId);
      if (prev) updateCard(cardId, data);

      try {
        const updated = await apiFetch<Card>(`/api/cards/${cardId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        updateCard(cardId, updated);
        emitCardUpdated(updated);
        emitActivity({ type: "card:updated" });
        setSelectedCard(updated);
        toast("Card updated", "success");
      } catch {
        if (prev) updateCard(cardId, prev);
        toast("Failed to update card", "error");
        throw new Error("Failed to update card");
      }
    },
    [cards, updateCard, emitCardUpdated, emitActivity, toast]
  );

  const handleDeleteCard = useCallback(
    async (cardId: string) => {
      const prev = cards.find((c) => c.id === cardId);
      removeCard(cardId);
      setSelectedCard(null);

      try {
        await apiFetch(`/api/cards/${cardId}`, { method: "DELETE" });
        emitCardDeleted(cardId);
        emitActivity({ type: "card:deleted" });
        toast("Card deleted", "success");
      } catch {
        if (prev) addCard(prev);
        toast("Failed to delete card", "error");
      }
    },
    [cards, removeCard, addCard, emitCardDeleted, emitActivity, toast]
  );

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading board...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/workspace/${workspaceId}`}
            aria-label="Back to workspace"
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">{boardTitle}</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <PresenceBar onlineUsers={onlineUsers} />
          {/* Mobile icon buttons */}
          <button
            onClick={() => { setShowActivity(!showActivity); setShowSummary(false); }}
            aria-label="Toggle activity feed"
            className={`sm:hidden p-2 rounded-lg transition-colors ${
              showActivity ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            <Activity className="h-4 w-4" />
          </button>
          <button
            onClick={() => { setShowSummary(!showSummary); setShowActivity(false); }}
            aria-label="Toggle AI summary"
            className={`sm:hidden p-2 rounded-lg transition-colors ${
              showSummary ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700" : "text-indigo-600 dark:text-indigo-400"
            }`}
          >
            <Sparkles className="h-4 w-4" />
          </button>
          {/* Desktop text buttons */}
          <button
            onClick={() => { setShowActivity(!showActivity); setShowSummary(false); }}
            className={`hidden sm:block px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              showActivity ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            Activity
          </button>
          <button
            onClick={() => { setShowSummary(!showSummary); setShowActivity(false); }}
            className={`hidden sm:block px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              showSummary ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300" : "text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50"
            }`}
          >
            AI Summary
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="px-4 sm:px-6 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-x-auto">
        <SearchFilter filters={filters} onChange={setFilters} members={members} />
      </div>

      {/* Board content */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex gap-3 sm:gap-4 p-4 sm:p-6 overflow-x-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            {COLUMNS.map((col) => (
              <BoardColumn
                key={col.id}
                id={col.id}
                title={col.label}
                cards={filteredCards.filter((c) => c.status === col.id).sort((a, b) => a.position - b.position)}
                onCreateCard={() => setCreateCardStatus(col.id)}
                onCardClick={(card) => setSelectedCard(card)}
              />
            ))}
            <DragOverlay>
              {activeCard && <CardItem card={activeCard} isOverlay />}
            </DragOverlay>
          </DndContext>
        </div>

        {showActivity && (
          <>
            <div className="sm:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setShowActivity(false)} />
            <div className="fixed right-0 top-0 bottom-0 z-40 w-80 sm:static sm:z-auto border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-y-auto">
              <ActivityFeed workspaceId={workspaceId} />
            </div>
          </>
        )}

        {showSummary && (
          <>
            <div className="sm:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setShowSummary(false)} />
            <div className="fixed right-0 top-0 bottom-0 z-40 w-80 sm:w-96 sm:static sm:z-auto border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-y-auto">
              <AISummaryPanel boardId={boardId} onClose={() => setShowSummary(false)} />
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {createCardStatus && (
        <CreateCardModal
          status={createCardStatus}
          open={!!createCardStatus}
          onClose={() => setCreateCardStatus(null)}
          onCreate={(data) => handleCreateCard(createCardStatus, data)}
        />
      )}

      {selectedCard && (
        <CardModal
          card={selectedCard}
          workspaceId={workspaceId}
          members={members}
          onClose={() => setSelectedCard(null)}
          onUpdate={handleUpdateCard}
          onDelete={handleDeleteCard}
        />
      )}
    </div>
  );
}
