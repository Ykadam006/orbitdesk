import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BoardColumn } from "@/components/board/BoardColumn";
import { mockCard } from "@/tests/test-utils";

describe("BoardColumn", () => {
  it("renders column title and card count", () => {
    render(
      <BoardColumn
        id="TODO"
        title="Todo"
        cards={[mockCard]}
        onCreateCard={jest.fn()}
        onCardClick={jest.fn()}
      />
    );
    expect(screen.getByRole("heading", { name: "Todo" })).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Fix login bug")).toBeInTheDocument();
  });

  it("shows empty state when no cards", () => {
    render(
      <BoardColumn
        id="TODO"
        title="Todo"
        cards={[]}
        onCreateCard={jest.fn()}
        onCardClick={jest.fn()}
      />
    );
    expect(screen.getByText("No cards in this column")).toBeInTheDocument();
  });

  it("calls onCreateCard when add button clicked", async () => {
    const user = userEvent.setup();
    const onCreateCard = jest.fn();
    render(
      <BoardColumn
        id="TODO"
        title="Todo"
        cards={[]}
        onCreateCard={onCreateCard}
        onCardClick={jest.fn()}
      />
    );

    await user.click(screen.getByLabelText("Add card to Todo"));
    expect(onCreateCard).toHaveBeenCalledTimes(1);
  });
});
