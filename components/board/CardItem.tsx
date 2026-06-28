"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, User } from "lucide-react";
import { Card } from "@/store/boardStore";
import { getPriorityColor, formatDate } from "@/lib/utils";

interface Props {
  card: Card;
  isOverlay?: boolean;
  onClick?: () => void;
}

export function CardItem({ card, isOverlay, onClick }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={`Open card: ${card.title}`}
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow ${
        isOverlay ? "shadow-lg rotate-2" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">{card.title}</h4>
        <span
          className={`shrink-0 text-xs font-medium px-1.5 py-0.5 rounded ${getPriorityColor(card.priority)}`}
        >
          {card.priority}
        </span>
      </div>

      {card.labels && card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {card.labels.map((label) => (
            <span
              key={label.id}
              className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
              style={{ backgroundColor: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {card.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{card.description}</p>
      )}

      <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
        {card.dueDate && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(card.dueDate)}</span>
          </div>
        )}
        {card.assignedTo && (
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{card.assignedTo.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}
