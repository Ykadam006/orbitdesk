import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LabelPicker } from "@/components/board/LabelPicker";
import { apiFetch } from "@/lib/fetch-client";

jest.mock("@/lib/fetch-client", () => ({
  apiFetch: jest.fn(),
  ApiError: class extends Error {},
}));

describe("LabelPicker", () => {
  const cardLabels = [{ id: "l1", name: "Bug", color: "#ef4444" }];

  beforeEach(() => {
    jest.clearAllMocks();
    (apiFetch as jest.Mock).mockResolvedValue([
      { id: "l2", name: "Feature", color: "#3b82f6" },
    ]);
  });

  it("renders card labels and fetches workspace labels", async () => {
    const onToggleLabel = jest.fn();
    render(
      <LabelPicker workspaceId="ws-1" cardLabels={cardLabels} onToggleLabel={onToggleLabel} />
    );

    expect(screen.getByText("Labels")).toBeInTheDocument();
    expect(screen.getByLabelText("Remove label Bug")).toBeInTheDocument();

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith(
        "/api/workspaces/ws-1/labels?limit=100",
        expect.any(Object)
      );
      expect(screen.getByText("Feature")).toBeInTheDocument();
    });
  });

  it("calls onToggleLabel when label clicked", async () => {
    const user = userEvent.setup();
    const onToggleLabel = jest.fn();
    render(
      <LabelPicker workspaceId="ws-1" cardLabels={cardLabels} onToggleLabel={onToggleLabel} />
    );

    await waitFor(() => {
      expect(screen.getByText("Feature")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Feature"));
    expect(onToggleLabel).toHaveBeenCalledWith({ id: "l2", name: "Feature", color: "#3b82f6" });
  });

  it("creates a new label", async () => {
    const user = userEvent.setup();
    (apiFetch as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({ id: "l3", name: "Urgent", color: "#ef4444" });

    render(
      <LabelPicker workspaceId="ws-1" cardLabels={[]} onToggleLabel={jest.fn()} />
    );

    await user.click(screen.getByText("New Label"));
    await user.type(screen.getByLabelText("New label name"), "Urgent");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith(
        "/api/workspaces/ws-1/labels",
        expect.objectContaining({ method: "POST" })
      );
    });
  });
});
