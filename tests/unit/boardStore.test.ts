import { useBoardStore, Card } from "@/store/boardStore";

const mockCard: Card = {
  id: "card-1",
  title: "Test Card",
  description: "A test card",
  status: "TODO",
  priority: "MEDIUM",
  dueDate: null,
  position: 0,
  boardId: "board-1",
  assignedToId: null,
  assignedTo: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("boardStore", () => {
  beforeEach(() => {
    useBoardStore.setState({ cards: [], isLoading: false });
  });

  it("sets cards", () => {
    useBoardStore.getState().setCards([mockCard]);
    expect(useBoardStore.getState().cards).toHaveLength(1);
    expect(useBoardStore.getState().cards[0].id).toBe("card-1");
  });

  it("adds a card", () => {
    useBoardStore.getState().addCard(mockCard);
    expect(useBoardStore.getState().cards).toHaveLength(1);
  });

  it("updates a card", () => {
    useBoardStore.getState().setCards([mockCard]);
    useBoardStore.getState().updateCard("card-1", { title: "Updated Title" });
    expect(useBoardStore.getState().cards[0].title).toBe("Updated Title");
  });

  it("moves a card to a new status", () => {
    useBoardStore.getState().setCards([mockCard]);
    useBoardStore.getState().moveCard("card-1", "IN_PROGRESS", 0);
    expect(useBoardStore.getState().cards[0].status).toBe("IN_PROGRESS");
  });

  it("removes a card", () => {
    useBoardStore.getState().setCards([mockCard]);
    useBoardStore.getState().removeCard("card-1");
    expect(useBoardStore.getState().cards).toHaveLength(0);
  });

  it("gets cards by status", () => {
    const cards: Card[] = [
      { ...mockCard, id: "1", status: "TODO" },
      { ...mockCard, id: "2", status: "TODO" },
      { ...mockCard, id: "3", status: "DONE" },
    ];
    useBoardStore.getState().setCards(cards);

    const todoCards = useBoardStore.getState().getCardsByStatus("TODO");
    expect(todoCards).toHaveLength(2);

    const doneCards = useBoardStore.getState().getCardsByStatus("DONE");
    expect(doneCards).toHaveLength(1);
  });

  it("sets loading state", () => {
    useBoardStore.getState().setLoading(true);
    expect(useBoardStore.getState().isLoading).toBe(true);

    useBoardStore.getState().setLoading(false);
    expect(useBoardStore.getState().isLoading).toBe(false);
  });
});
