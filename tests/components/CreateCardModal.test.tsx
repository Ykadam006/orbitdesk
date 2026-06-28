import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateCardModal } from "@/components/board/CreateCardModal";

describe("CreateCardModal", () => {
  it("does not render when closed", () => {
    render(
      <CreateCardModal status="TODO" open={false} onClose={jest.fn()} onCreate={jest.fn()} />
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders dialog with status label", () => {
    render(
      <CreateCardModal status="TODO" open onClose={jest.fn()} onCreate={jest.fn()} />
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("New Card — Todo")).toBeInTheDocument();
  });

  it("submits card data on create", async () => {
    const user = userEvent.setup();
    const onCreate = jest.fn();
    const onClose = jest.fn();
    render(
      <CreateCardModal status="TODO" open onClose={onClose} onCreate={onCreate} />
    );

    await user.type(screen.getByLabelText("Title"), "New task");
    await user.click(screen.getByRole("button", { name: "Create Card" }));

    expect(onCreate).toHaveBeenCalledWith({
      title: "New task",
      description: "",
      priority: "MEDIUM",
    });
    expect(onClose).toHaveBeenCalled();
  });
});
