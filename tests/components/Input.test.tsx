import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "@/components/ui/Input";

describe("Input", () => {
  it("renders with label", () => {
    render(<Input id="email" label="Email" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("renders without label", () => {
    render(<Input id="test" placeholder="Type here" />);
    expect(screen.getByPlaceholderText("Type here")).toBeInTheDocument();
  });

  it("displays error message", () => {
    render(<Input id="name" label="Name" error="Name is required" />);
    expect(screen.getByText("Name is required")).toBeInTheDocument();
  });

  it("applies error border class when error is present", () => {
    render(<Input id="name" error="Error" />);
    const input = screen.getByRole("textbox");
    expect(input.className).toContain("border-red-500");
  });

  it("accepts user input", async () => {
    const user = userEvent.setup();
    render(<Input id="name" label="Name" />);
    const input = screen.getByLabelText("Name");
    await user.type(input, "Yogesh");
    expect(input).toHaveValue("Yogesh");
  });
});
