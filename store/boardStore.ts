import { create } from "zustand";

interface User {
  id: string;
  name: string | null;
  image: string | null;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Card {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string | null;
  position: number;
  boardId: string;
  assignedToId: string | null;
  assignedTo: User | null;
  labels?: Label[];
  createdAt: string;
  updatedAt: string;
}

interface BoardState {
  cards: Card[];
  isLoading: boolean;
  setCards: (cards: Card[]) => void;
  clearCards: () => void;
  setLoading: (loading: boolean) => void;
  addCard: (card: Card) => void;
  updateCard: (id: string, data: Partial<Card>) => void;
  moveCard: (id: string, status: Card["status"], position: number) => void;
  removeCard: (id: string) => void;
  getCardsByStatus: (status: Card["status"]) => Card[];
}

export const useBoardStore = create<BoardState>((set, get) => ({
  cards: [],
  isLoading: true,

  setCards: (cards) => set({ cards }),
  clearCards: () => set({ cards: [] }),
  setLoading: (isLoading) => set({ isLoading }),

  addCard: (card) => set((state) => ({ cards: [...state.cards, card] })),

  updateCard: (id, data) =>
    set((state) => ({
      cards: state.cards.map((c) => (c.id === id ? { ...c, ...data } : c)),
    })),

  moveCard: (id, status, position) =>
    set((state) => ({
      cards: state.cards.map((c) =>
        c.id === id ? { ...c, status, position } : c
      ),
    })),

  removeCard: (id) =>
    set((state) => ({ cards: state.cards.filter((c) => c.id !== id) })),

  getCardsByStatus: (status) => get().cards.filter((c) => c.status === status),
}));
