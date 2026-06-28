import { render, screen, waitFor } from "@testing-library/react";
import { ActivityFeed } from "@/components/board/ActivityFeed";
import { apiFetch } from "@/lib/fetch-client";

jest.mock("@/lib/fetch-client", () => ({
  apiFetch: jest.fn(),
  ApiError: class extends Error {},
}));

describe("ActivityFeed", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading state initially", () => {
    (apiFetch as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<ActivityFeed workspaceId="ws-1" />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders activities on success", async () => {
    (apiFetch as jest.Mock).mockResolvedValue([
      {
        id: "a1",
        action: "created a card",
        createdAt: new Date().toISOString(),
        user: { id: "u1", name: "Alex", image: null },
      },
    ]);
    render(<ActivityFeed workspaceId="ws-1" />);

    await waitFor(() => {
      expect(screen.getByText(/Alex/)).toBeInTheDocument();
    });
    expect(screen.getByText(/created a card/)).toBeInTheDocument();
  });

  it("shows error state on failure", async () => {
    (apiFetch as jest.Mock).mockRejectedValue(new Error("Network error"));
    render(<ActivityFeed workspaceId="ws-1" />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load activity")).toBeInTheDocument();
    });
  });

  it("shows empty state when no activities", async () => {
    (apiFetch as jest.Mock).mockResolvedValue([]);
    render(<ActivityFeed workspaceId="ws-1" />);

    await waitFor(() => {
      expect(screen.getByText("No activity yet")).toBeInTheDocument();
    });
  });
});
