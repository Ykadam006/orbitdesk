import { renderWithProviders } from "../test-utils";
import { screen, waitFor } from "@testing-library/react";
import { BoardView } from "@/components/board/BoardView";
import { apiFetch } from "@/lib/fetch-client";

jest.mock("@/hooks/useSocket", () => ({
  useSocket: () => ({
    onlineUsers: [{ userId: "user-1", userName: "Alex", socketId: "s1" }],
    emitCardCreated: jest.fn(),
    emitCardUpdated: jest.fn(),
    emitCardMoved: jest.fn(),
    emitCardDeleted: jest.fn(),
    emitActivity: jest.fn(),
  }),
}));

jest.mock("@/lib/fetch-client", () => ({
  apiFetch: jest.fn(),
  ApiError: class extends Error {},
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const mockCards = [
  {
    id: "c1",
    title: "Fix login bug",
    description: null,
    status: "TODO" as const,
    priority: "HIGH" as const,
    dueDate: null,
    position: 0,
    boardId: "board-1",
    assignedToId: null,
    assignedTo: null,
    labels: [],
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
];

const defaultProps = {
  boardId: "board-1",
  workspaceId: "ws-1",
  boardTitle: "Sprint 1",
  userId: "user-1",
  userName: "Alex",
  members: [{ id: "user-1", name: "Alex", image: null }],
};

describe("BoardView", () => {
  beforeEach(() => {
    mockApiFetch.mockResolvedValue(mockCards);
  });

  it("renders board title and kanban columns", async () => {
    renderWithProviders(<BoardView {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Sprint 1")).toBeInTheDocument();
    });

    expect(screen.getByText("Todo")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Review")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("loads and renders cards from API", async () => {
    renderWithProviders(<BoardView {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Fix login bug")).toBeInTheDocument();
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/api/boards/board-1/cards");
  });

  it("shows presence bar when users are online", async () => {
    renderWithProviders(<BoardView {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Online:")).toBeInTheDocument();
    });
  });
});
