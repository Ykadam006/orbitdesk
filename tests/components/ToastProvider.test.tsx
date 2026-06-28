import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider, useToast } from "@/components/providers/ToastProvider";

function ToastTester() {
  const { toast } = useToast();
  return (
    <button type="button" onClick={() => toast("Saved successfully", "success")}>
      Show toast
    </button>
  );
}

describe("ToastProvider", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows toast when triggered", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <ToastProvider>
        <ToastTester />
      </ToastProvider>
    );

    await user.click(screen.getByRole("button", { name: "Show toast" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Saved successfully");
    expect(screen.getByLabelText("Notifications")).toBeInTheDocument();
  });

  it("dismisses toast on button click", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <ToastProvider>
        <ToastTester />
      </ToastProvider>
    );

    await user.click(screen.getByRole("button", { name: "Show toast" }));
    expect(screen.getByRole("alert")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Dismiss notification"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("auto-dismisses toast after timeout", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <ToastProvider>
        <ToastTester />
      </ToastProvider>
    );

    await user.click(screen.getByRole("button", { name: "Show toast" }));
    expect(screen.getByRole("alert")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(4000);
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
