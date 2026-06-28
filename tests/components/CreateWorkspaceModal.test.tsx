import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { CreateWorkspaceModal } from "@/components/dashboard/CreateWorkspaceModal";
import { renderWithProviders } from "@/tests/test-utils";
import { apiFetch } from "@/lib/fetch-client";

jest.mock("@/lib/fetch-client", () => ({
  apiFetch: jest.fn(),
  ApiError: class extends Error {},
}));

const mockRefresh = jest.fn();

describe("CreateWorkspaceModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ refresh: mockRefresh, push: jest.fn() });
  });

  it("does not render when closed", () => {
    renderWithProviders(<CreateWorkspaceModal open={false} onClose={jest.fn()} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders dialog when open", () => {
    renderWithProviders(<CreateWorkspaceModal open onClose={jest.fn()} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Create Workspace")).toBeInTheDocument();
  });

  it("creates workspace on submit", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    (apiFetch as jest.Mock).mockResolvedValue({ id: "ws-new" });

    renderWithProviders(<CreateWorkspaceModal open onClose={onClose} />);
    await user.type(screen.getByLabelText("Workspace Name"), "My Team");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith(
        "/api/workspaces",
        expect.objectContaining({ method: "POST" })
      );
    });
    expect(onClose).toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
    expect(screen.getByText("Workspace created")).toBeInTheDocument();
  });
});
