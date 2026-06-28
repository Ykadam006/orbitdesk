import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmProvider, useConfirm } from "@/components/providers/ConfirmProvider";

function ConfirmTester({ onResult }: { onResult: (value: boolean) => void }) {
  const { confirm } = useConfirm();

  return (
    <button
      type="button"
      onClick={async () => {
        const result = await confirm({
          title: "Delete item",
          message: "Are you sure?",
          confirmLabel: "Delete",
          variant: "danger",
        });
        onResult(result);
      }}
    >
      Open confirm
    </button>
  );
}

describe("ConfirmProvider", () => {
  it("resolves true when confirmed", async () => {
    const user = userEvent.setup();
    const onResult = jest.fn();
    render(
      <ConfirmProvider>
        <ConfirmTester onResult={onResult} />
      </ConfirmProvider>
    );

    await user.click(screen.getByRole("button", { name: "Open confirm" }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText("Delete item")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onResult).toHaveBeenCalledWith(true);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("resolves false when cancelled", async () => {
    const user = userEvent.setup();
    const onResult = jest.fn();
    render(
      <ConfirmProvider>
        <ConfirmTester onResult={onResult} />
      </ConfirmProvider>
    );

    await user.click(screen.getByRole("button", { name: "Open confirm" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onResult).toHaveBeenCalledWith(false);
  });
});
