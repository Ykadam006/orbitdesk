import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CardModal } from "@/components/board/CardModal";
import { renderWithProviders, mockCard } from "@/tests/test-utils";
import { apiFetch } from "@/lib/fetch-client";

jest.mock("@/lib/fetch-client", () => ({
  apiFetch: jest.fn(),
  ApiError: class extends Error {},
}));

const members = [{ id: "user-1", name: "Alex", image: null }];

describe("CardModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiFetch as jest.Mock).mockResolvedValue([]);
  });

  it("renders edit card dialog", async () => {
    renderWithProviders(
      <CardModal
        card={mockCard}
        workspaceId="ws-1"
        members={members}
        onClose={jest.fn()}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Edit Card")).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toHaveValue("Fix login bug");

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalled();
    });
  });

  it("calls onUpdate when saving changes", async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn().mockResolvedValue(undefined);

    renderWithProviders(
      <CardModal
        card={mockCard}
        workspaceId="ws-1"
        members={members}
        onClose={jest.fn()}
        onUpdate={onUpdate}
        onDelete={jest.fn()}
      />
    );

    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "Updated title");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        "card-1",
        expect.objectContaining({ title: "Updated title" })
      );
    });
  });

  it("calls onDelete when delete is confirmed", async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn();

    renderWithProviders(
      <CardModal
        card={mockCard}
        workspaceId="ws-1"
        members={members}
        onClose={jest.fn()}
        onUpdate={jest.fn()}
        onDelete={onDelete}
      />
    );

    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    await user.click(deleteButtons[0]);
    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByText("Delete Card")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledWith("card-1");
  });

  it("does not delete when confirm is cancelled", async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn();

    renderWithProviders(
      <CardModal
        card={mockCard}
        workspaceId="ws-1"
        members={members}
        onClose={jest.fn()}
        onUpdate={jest.fn()}
        onDelete={onDelete}
      />
    );

    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    await user.click(deleteButtons[0]);
    const dialog = screen.getByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(onDelete).not.toHaveBeenCalled();
  });
});
