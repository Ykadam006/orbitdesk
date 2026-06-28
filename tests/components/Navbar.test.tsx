import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSession, signOut } from "next-auth/react";
import { Navbar } from "@/components/layout/Navbar";
import { renderWithProviders } from "@/tests/test-utils";

describe("Navbar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows sign in links when unauthenticated", () => {
    (useSession as jest.Mock).mockReturnValue({ data: null, status: "unauthenticated" });
    renderWithProviders(<Navbar />);

    expect(screen.getByRole("link", { name: /OrbitDesk/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign In" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Get Started" })).toHaveAttribute("href", "/register");
  });

  it("shows dashboard and user menu when authenticated", async () => {
    const user = userEvent.setup();
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { name: "Alex", email: "alex@example.com" } },
      status: "authenticated",
    });
    renderWithProviders(<Navbar />);

    expect(screen.getByRole("link", { name: /Dashboard/i })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByText("Alex")).toBeInTheDocument();

    await user.click(screen.getByLabelText("User menu"));
    expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute("href", "/profile");

    await user.click(screen.getByRole("button", { name: "Sign Out" }));
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/" });
  });

  it("has theme toggle with accessible label", async () => {
    const user = userEvent.setup();
    (useSession as jest.Mock).mockReturnValue({ data: null, status: "unauthenticated" });
    renderWithProviders(<Navbar />);

    const themeToggle = screen.getByLabelText("Toggle theme");
    expect(themeToggle).toBeInTheDocument();
    await user.click(themeToggle);
  });
});
