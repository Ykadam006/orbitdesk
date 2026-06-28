import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AISummaryPanel } from "@/components/board/AISummaryPanel";

describe("AISummaryPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it("renders generate prompt initially", () => {
    render(<AISummaryPanel boardId="board-1" onClose={jest.fn()} />);
    expect(screen.getByText("AI Summary")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Generate Summary/i })).toBeInTheDocument();
  });

  it("generates and displays summary", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ summary: "Board is on track." }),
    });

    render(<AISummaryPanel boardId="board-1" onClose={jest.fn()} />);
    await user.click(screen.getByRole("button", { name: /Generate Summary/i }));

    await waitFor(() => {
      expect(screen.getByText("Board is on track.")).toBeInTheDocument();
    });
    expect(global.fetch).toHaveBeenCalledWith("/api/boards/board-1/summary", { method: "POST" });
  });

  it("shows error on failure", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

    render(<AISummaryPanel boardId="board-1" onClose={jest.fn()} />);
    await user.click(screen.getByRole("button", { name: /Generate Summary/i }));

    await waitFor(() => {
      expect(screen.getByText("Failed to generate summary")).toBeInTheDocument();
    });
  });

  it("calls onClose when close button clicked", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(<AISummaryPanel boardId="board-1" onClose={onClose} />);

    await user.click(screen.getByLabelText("Close AI summary panel"));
    expect(onClose).toHaveBeenCalled();
  });
});
