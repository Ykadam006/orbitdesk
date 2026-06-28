import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { CreateBoardWithTemplate } from "@/components/workspace/CreateBoardWithTemplate";
import { renderWithProviders } from "@/tests/test-utils";
import { apiFetch } from "@/lib/fetch-client";

jest.mock("@/lib/fetch-client", () => ({
  apiFetch: jest.fn(),
  ApiError: class extends Error {},
}));

const mockPush = jest.fn();

describe("CreateBoardWithTemplate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush, refresh: jest.fn() });
  });

  it("does not render when closed", () => {
    renderWithProviders(
      <CreateBoardWithTemplate workspaceId="ws-1" open={false} onClose={jest.fn()} />
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows template selection step", () => {
    renderWithProviders(
      <CreateBoardWithTemplate workspaceId="ws-1" open onClose={jest.fn()} />
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Choose a Template")).toBeInTheDocument();
    expect(screen.getByText("Blank Board")).toBeInTheDocument();
    expect(screen.getByText("Sprint Board")).toBeInTheDocument();
  });

  it("creates board after selecting template and naming", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    (apiFetch as jest.Mock).mockResolvedValue({ id: "board-new" });

    renderWithProviders(
      <CreateBoardWithTemplate workspaceId="ws-1" open onClose={onClose} />
    );

    await user.click(screen.getByText("Blank Board"));
    expect(screen.getByText("Name Your Board")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Board Title"));
    await user.type(screen.getByLabelText("Board Title"), "My Board");
    await user.click(screen.getByRole("button", { name: "Create Board" }));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith(
        "/api/workspaces/ws-1/boards",
        expect.objectContaining({ method: "POST" })
      );
    });
    expect(mockPush).toHaveBeenCalledWith("/workspace/ws-1/board/board-new");
    expect(screen.getByText("Board created")).toBeInTheDocument();
  });
});
