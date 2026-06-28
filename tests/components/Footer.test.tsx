import { render, screen } from "@testing-library/react";
import { Footer } from "@/components/layout/Footer";

describe("Footer", () => {
  it("renders branding and tech stack", () => {
    render(<Footer />);
    expect(screen.getByText("OrbitDesk")).toBeInTheDocument();
    expect(screen.getByText(/Built with Next.js/)).toBeInTheDocument();
  });

  it("uses footer landmark", () => {
    render(<Footer />);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });
});
