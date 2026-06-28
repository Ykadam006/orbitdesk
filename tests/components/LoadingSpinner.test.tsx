import { render, screen } from "@testing-library/react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

describe("LoadingSpinner", () => {
  it("renders default message", () => {
    render(<LoadingSpinner />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders custom message", () => {
    render(<LoadingSpinner message="Fetching boards..." />);
    expect(screen.getByText("Fetching boards...")).toBeInTheDocument();
  });

  it("applies size classes", () => {
    const { container } = render(<LoadingSpinner size="lg" />);
    const icon = container.querySelector("svg");
    expect(icon).toHaveClass("h-12", "w-12");
  });
});
