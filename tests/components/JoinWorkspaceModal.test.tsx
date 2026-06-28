import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { JoinWorkspaceModal } from "@/components/dashboard/JoinWorkspaceModal";
import { renderWithProviders } from "@/tests/test-utils";
import { apiFetch } from "@/lib/fetch-client";

jest.mock("@/lib/fetch-client", () => ({
  apiFetch: jest.fn(),
  ApiError: class extends Error {},
}));

const mockPush = jest.fn();
const mockRefresh = jest.fn();

describe("JoinWorkspaceModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush, refresh: mockRefresh });
  });

  it("renders join dialog when open", () => {
    renderWithProviders(<JoinWorkspaceModal open onClose={jest.fn()} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Invite Code")).toBeInTheDocument();
  });

  it("joins workspace on submit", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    (apiFetch as jest.Mock).mockResolvedValue({ workspaceId: "ws-joined" });

    renderWithProviders(<JoinWorkspaceModal open onClose={onClose} />);
    await user.type(screen.getByLabelText("Invite Code"), "ABC123");
    await user.click(screen.getByRole("button", { name: "Join" }));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith(
        "/api/workspaces/join",
        expect.objectContaining({ method: "POST" })
      );
    });
    expect(onClose).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/workspace/ws-joined");
    expect(screen.getByText("Joined workspace")).toBeInTheDocument();
  });

  it("shows error on failed join", async () => {
    const user = userEvent.setup();
    (apiFetch as jest.Mock).mockRejectedValue(new Error("Invalid invite code"));

    renderWithProviders(<JoinWorkspaceModal open onClose={jest.fn()} />);
    await user.type(screen.getByLabelText("Invite Code"), "BAD");
    await user.click(screen.getByRole("button", { name: "Join" }));

    await waitFor(() => {
      expect(screen.getByText("Invalid invite code")).toBeInTheDocument();
    });
    expect(screen.getByText("Failed to join workspace")).toBeInTheDocument();
  });
});
