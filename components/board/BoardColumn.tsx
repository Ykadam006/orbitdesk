"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Card } from "@/store/boardStore";
import { CardItem } from "./CardItem";
import { getStatusColor } from "@/lib/utils";

interface Props {
  id: string;
  title: string;
  cards: Card[];
  onCreateCard: () => void;
  onCardClick: (card: Card) => void;
}

export function BoardColumn({ id, title, cards, onCreateCard, onCardClick }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-[72vw] sm:w-72 min-w-[72vw] sm:min-w-[18rem] rounded-xl bg-gray-50 dark:bg-gray-800/50 shrink-0 ${
        isOver ? "ring-2 ring-indigo-400 bg-indigo-50/30 dark:bg-indigo-900/20" : ""
      }`}
    >
      <div className="flex items-center justify-between px-3 py-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor(id)}`} />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
          <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-gray-700 rounded-full px-2 py-0.5">
            {cards.length}
          </span>
        </div>
        <button
          onClick={onCreateCard}
          aria-label={`Add card to ${title}`}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 px-2 pb-2 space-y-2 overflow-y-auto min-h-[4rem]">
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <CardItem key={card.id} card={card} onClick={() => onCardClick(card)} />
          ))}
        </SortableContext>
        {cards.length === 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-6 px-2">
            No cards in this column
          </p>
        )}
      </div>
    </div>
  );
}
