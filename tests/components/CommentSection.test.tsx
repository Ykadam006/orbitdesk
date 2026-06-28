import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommentSection } from "@/components/board/CommentSection";
import { renderWithProviders } from "@/tests/test-utils";
import { apiFetch } from "@/lib/fetch-client";

jest.mock("@/lib/fetch-client", () => ({
  apiFetch: jest.fn(),
  ApiError: class extends Error {},
}));

describe("CommentSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads and displays comments", async () => {
    (apiFetch as jest.Mock).mockResolvedValue([
      {
        id: "c1",
        content: "Looks good",
        createdAt: new Date().toISOString(),
        user: { id: "u1", name: "Alex", image: null },
      },
    ]);
    renderWithProviders(<CommentSection cardId="card-1" />);

    await waitFor(() => {
      expect(screen.getByText("Looks good")).toBeInTheDocument();
    });
    expect(screen.getByText("Alex")).toBeInTheDocument();
  });

  it("submits a new comment", async () => {
    const user = userEvent.setup();
    (apiFetch as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({
        id: "c2",
        content: "New comment",
        createdAt: new Date().toISOString(),
        user: { id: "u1", name: "Alex", image: null },
      });

    renderWithProviders(<CommentSection cardId="card-1" />);

    await waitFor(() => {
      expect(screen.getByText("No comments yet")).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText("Add a comment"), "New comment");
    await user.click(screen.getByLabelText("Send comment"));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith(
        "/api/cards/card-1/comments",
        expect.objectContaining({ method: "POST" })
      );
    });
    expect(screen.getByText("Comment added")).toBeInTheDocument();
  });
});
