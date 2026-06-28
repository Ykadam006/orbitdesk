import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CardItem } from "@/components/board/CardItem";
import { mockCard } from "@/tests/test-utils";

describe("CardItem", () => {
  it("renders card title and priority", () => {
    render(<CardItem card={mockCard} />);
    expect(screen.getByText("Fix login bug")).toBeInTheDocument();
    expect(screen.getByText("HIGH")).toBeInTheDocument();
  });

  it("renders labels and assignee", () => {
    render(<CardItem card={mockCard} />);
    expect(screen.getByText("Bug")).toBeInTheDocument();
    expect(screen.getByText("Alex")).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(<CardItem card={mockCard} onClick={onClick} />);

    await user.click(screen.getByRole("button", { name: "Open card: Fix login bug" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("calls onClick on Enter key", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(<CardItem card={mockCard} onClick={onClick} />);

    const card = screen.getByRole("button", { name: "Open card: Fix login bug" });
    card.focus();
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("has accessible button role and label", () => {
    render(<CardItem card={mockCard} />);
    const card = screen.getByRole("button", { name: "Open card: Fix login bug" });
    expect(card).toHaveAttribute("tabindex", "0");
  });
});
